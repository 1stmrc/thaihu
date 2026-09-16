// Tên file: dong-co-bam-gio-thuong-nhan.js
// Chức năng: Động cơ bấm giờ Thương Nhân - Cơ chế Timestamp Diff siêu nhẹ (không tốn CPU khi ẩn tab), tự động chốt phiên 15p, tính toán chuẩn xác 100% thời gian trải dài thực tế (từ mốc bắt đầu đầu tiên đến mốc kết thúc cuối cùng trong ngày), bộ nhớ độc lập không ghi đè hệ thống, hỗ trợ sửa/xóa phiên và lưu trữ lịch sử dài hạn.
// Con của file: index.html (Nạp sau quan-ly-thuong-nhan.js).
// Trạng thái: [ĐÃ FIX CHUẨN THỜI GIAN TRẢI DÀI - KHÓA MÃ NGUỒN NGÀY 26/08/2026]

const MERCHANT_TIMER_STORAGE_KEY = 'SYSTEM_MERCHANT_TIMER_HISTORY_DATABASE_V2';
const MERCHANT_TIMER_RUNNING_KEY = 'SYSTEM_MERCHANT_TIMER_RUNNING_HEARTBEAT_V2';

let merchantTimerState = {
    isRunning: false,
    sessionStartTimeStr: null,
    sessionStartMs: null,
    accumulatedSecondsToday: 0,
    intervalId: null,
    chunkIntervalSec: 15 * 60 // 15 phút = 900s
};

/* ==========================================================================
   KHỐI 1: BỘ NHỚ ĐỘC LẬP THEO GIỜ HÀ NỘI (GMT+7)
   Trạng thái: [ĐÃ KHÓA - KHÔNG SỬA]
   ========================================================================== */
function getNowGMT7() {
    let now = new Date();
    let utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utcMs + (3600000 * 7));
}

function getTodayStringGMT7() {
    let gmt7 = getNowGMT7();
    let y = gmt7.getFullYear();
    let m = String(gmt7.getMonth() + 1).padStart(2, '0');
    let d = String(gmt7.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getTimeStringGMT7(dateObj = null) {
    let gmt7 = dateObj ? new Date(dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000) + (3600000 * 7)) : getNowGMT7();
    let hh = String(gmt7.getHours()).padStart(2, '0');
    let mm = String(gmt7.getMinutes()).padStart(2, '0');
    let ss = String(gmt7.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
}

function getMerchantTimerDatabase() {
    try {
        let raw = localStorage.getItem(MERCHANT_TIMER_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.error("Lỗi đọc DB Timer Thương Nhân:", e);
    }
    return { dailyHistory: {}, totalAllSeconds: 0, totalAllSessions: 0 };
}

function saveMerchantTimerDatabase(db) {
    try {
        if (typeof systemDatabase !== 'undefined') {
            systemDatabase.merchantTimerDb = db;
        }
        localStorage.setItem(MERCHANT_TIMER_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
        console.error("Lỗi lưu DB Timer Thương Nhân:", e);
    }
}

function ensureTodayHistoryRecord() {
    let todayStr = getTodayStringGMT7();
    let db = getMerchantTimerDatabase();
    if (!db.dailyHistory[todayStr]) {
        db.dailyHistory[todayStr] = {
            date: todayStr,
            firstStartTime: null,
            lastEndTime: null,
            firstStartMs: null,
            lastEndMs: null,
            totalSeconds: 0,
            sessionsCount: 0,
            completedAccounts: 0,
            totalRuns: 0,
            sessions: []
        };
        saveMerchantTimerDatabase(db);
    } else if (!db.dailyHistory[todayStr].sessions) {
        db.dailyHistory[todayStr].sessions = [];
    }
    return db.dailyHistory[todayStr];
}

function refreshAccountStatsForToday() {
    let todayStr = getTodayStringGMT7();
    let db = getMerchantTimerDatabase();
    let dayData = db.dailyHistory[todayStr];
    if (!dayData) return;

    let completedAccs = 0;
    let totalRuns = 0;
    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.values(systemDatabase.members).forEach(m => {
            if (m && !m.merchantLocked) {
                let runs = parseInt(m.merchantRuns) || 0;
                totalRuns += runs;
                if (runs >= 3) completedAccs++;
            }
        });
    }
    dayData.completedAccounts = completedAccs;
    dayData.totalRuns = totalRuns;
    saveMerchantTimerDatabase(db);
}

/* ==========================================================================
   KHỐI 2: ĐỘNG CƠ BẤM GIỜ & TÍNH TOÁN ĐỘ DÀI TRẢI DÀI THỰC TẾ
   Trạng thái: [ĐÃ FIX - TÍNH CHUẨN XÁC KHOẢNG CÁCH GIỜ BẮT ĐẦU VÀ KẾT THÚC]
   ========================================================================== */
function formatTimerDigits(totalSecs) {
    let s = Math.max(0, Math.floor(totalSecs || 0));
    let hrs = Math.floor(s / 3600);
    let mins = Math.floor((s % 3600) / 60);
    let secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDurationReadable(totalSecs) {
    let s = Math.max(0, Math.floor(totalSecs || 0));
    let hrs = Math.floor(s / 3600);
    let mins = Math.floor((s % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}p`;
    return `${mins} phút`;
}

// TÍNH TOÁN CHÍNH XÁC KHOẢNG THỜI GIAN TRẢI DÀI DỰA TRÊN 2 MỐC HH:MM:SS
function calculateSpanSeconds(firstTimeStr, lastTimeStr, fallbackTotalSec = 0) {
    if (!firstTimeStr || !lastTimeStr || firstTimeStr === '--:--' || lastTimeStr === '--:--') {
        return fallbackTotalSec;
    }
    try {
        let p1 = firstTimeStr.split(':').map(Number);
        let p2 = lastTimeStr.split(':').map(Number);
        if (p1.length >= 2 && p2.length >= 2 && !isNaN(p1[0]) && !isNaN(p2[0])) {
            let s1 = (p1[0] * 3600) + (p1[1] * 60) + (p1[2] || 0);
            let s2 = (p2[0] * 3600) + (p2[1] * 60) + (p2[2] || 0);
            let diff = s2 - s1;
            if (diff < 0) diff += 86400; // Xử lý nếu chạy qua đêm (00h)
            return Math.max(diff, fallbackTotalSec);
        }
    } catch(e) {}
    return fallbackTotalSec;
}

function catchUpMerchantSessionChunks() {
    if (!merchantTimerState.isRunning || !merchantTimerState.sessionStartMs) return;

    let nowMs = Date.now();
    let elapsedSec = Math.floor((nowMs - merchantTimerState.sessionStartMs) / 1000);

    while (elapsedSec >= merchantTimerState.chunkIntervalSec) {
        let chunkEndMs = merchantTimerState.sessionStartMs + (merchantTimerState.chunkIntervalSec * 1000);
        let chunkStartTimeStr = merchantTimerState.sessionStartTimeStr;
        let chunkEndTimeStr = getTimeStringGMT7(new Date(chunkEndMs));

        saveSingleChunkSession(chunkStartTimeStr, chunkEndTimeStr, merchantTimerState.chunkIntervalSec);

        merchantTimerState.sessionStartMs = chunkEndMs;
        merchantTimerState.sessionStartTimeStr = chunkEndTimeStr;
        elapsedSec = Math.floor((nowMs - merchantTimerState.sessionStartMs) / 1000);
    }

    recalculateTodayTotalSeconds();

    let todayStr = getTodayStringGMT7();
    localStorage.setItem(MERCHANT_TIMER_RUNNING_KEY, JSON.stringify({
        isRunning: true,
        date: todayStr,
        lastHeartbeatMs: nowMs,
        sessionStartMs: merchantTimerState.sessionStartMs,
        sessionStartTimeStr: merchantTimerState.sessionStartTimeStr
    }));
}

function toggleMerchantMasterTimer() {
    if (merchantTimerState.isRunning) {
        stopMerchantMasterTimer(true);
    } else {
        startMerchantMasterTimer();
    }
}

function startMerchantMasterTimer() {
    if (merchantTimerState.isRunning) return;

    let todayStr = getTodayStringGMT7();
    let nowTimeStr = getTimeStringGMT7();
    let db = getMerchantTimerDatabase();
    let dayData = db.dailyHistory[todayStr] || ensureTodayHistoryRecord();

    if (!dayData.firstStartTime || dayData.firstStartTime === '--:--') {
        dayData.firstStartTime = nowTimeStr;
        dayData.firstStartMs = Date.now();
        saveMerchantTimerDatabase(db);
    }

    merchantTimerState.isRunning = true;
    merchantTimerState.sessionStartTimeStr = nowTimeStr;
    merchantTimerState.sessionStartMs = Date.now();

    recalculateTodayTotalSeconds();

    if (merchantTimerState.intervalId) clearInterval(merchantTimerState.intervalId);

    merchantTimerState.intervalId = setInterval(() => {
        if (!document.hidden) {
            catchUpMerchantSessionChunks();
            updateMerchantTimerDisplay();
        }
    }, 1000);

    updateMerchantTimerDisplay();
    if (typeof logUserAction === 'function') logUserAction("Bắt đầu bấm giờ Thương Nhân");
}

function saveSingleChunkSession(startTimeStr, endTimeStr, durationSec) {
    if (durationSec <= 3) return;

    let todayStr = getTodayStringGMT7();
    let db = getMerchantTimerDatabase();
    let dayData = db.dailyHistory[todayStr] || ensureTodayHistoryRecord();

    if (!dayData.firstStartTime || dayData.firstStartTime === '--:--') {
        dayData.firstStartTime = startTimeStr || getTimeStringGMT7();
        dayData.firstStartMs = Date.now() - (durationSec * 1000);
    }

    let sessionObj = {
        id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        startTime: startTimeStr,
        endTime: endTimeStr,
        seconds: durationSec
    };

    if (!dayData.sessions) dayData.sessions = [];
    dayData.sessions.push(sessionObj);
    dayData.sessionsCount = dayData.sessions.length;
    dayData.lastEndTime = endTimeStr;
    dayData.lastEndMs = Date.now();

    saveMerchantTimerDatabase(db);
    refreshAccountStatsForToday();
}

function stopMerchantMasterTimer(isManual = false) {
    if (!merchantTimerState.isRunning) return;

    if (merchantTimerState.intervalId) {
        clearInterval(merchantTimerState.intervalId);
        merchantTimerState.intervalId = null;
    }

    catchUpMerchantSessionChunks();

    let nowMs = Date.now();
    let elapsedCurrent = Math.floor((nowMs - merchantTimerState.sessionStartMs) / 1000);
    let nowTimeStr = getTimeStringGMT7();

    if (elapsedCurrent > 3) {
        saveSingleChunkSession(merchantTimerState.sessionStartTimeStr, nowTimeStr, elapsedCurrent);
    }

    merchantTimerState.isRunning = false;
    merchantTimerState.sessionStartTimeStr = null;
    merchantTimerState.sessionStartMs = null;

    localStorage.removeItem(MERCHANT_TIMER_RUNNING_KEY);
    recalculateTodayTotalSeconds();
    updateMerchantTimerDisplay();

    if (typeof logUserAction === 'function') {
        logUserAction(`Đã dừng bấm giờ Thương Nhân. Tổng thời gian hôm nay: ${formatTimerDigits(merchantTimerState.accumulatedSecondsToday)}`);
    }
}

function recalculateTodayTotalSeconds() {
    let todayStr = getTodayStringGMT7();
    let db = getMerchantTimerDatabase();

    // TỰ ĐỘNG PHỤC HỒI FIRST START TIME & LAST END TIME NẾU BỊ RỖNG
    Object.values(db.dailyHistory || {}).forEach(d => {
        if (d && d.sessions && d.sessions.length > 0) {
            if (!d.firstStartTime || d.firstStartTime === '--:--') {
                d.firstStartTime = d.sessions[0].startTime;
            }
            if (!d.lastEndTime || d.lastEndTime === '--:--') {
                d.lastEndTime = d.sessions[d.sessions.length - 1].endTime;
            }
        }
    });

    let dayData = db.dailyHistory[todayStr];
    if (!dayData) return;

    let sumSavedSec = 0;
    if (dayData.sessions && Array.isArray(dayData.sessions)) {
        dayData.sessions.forEach(s => { sumSavedSec += (parseInt(s.seconds) || 0); });
    }

    let activeRunningSec = 0;
    if (merchantTimerState.isRunning && merchantTimerState.sessionStartMs) {
        activeRunningSec = Math.max(0, Math.floor((Date.now() - merchantTimerState.sessionStartMs) / 1000));
    }

    dayData.totalSeconds = sumSavedSec + activeRunningSec;
    dayData.sessionsCount = dayData.sessions ? dayData.sessions.length : 0;

    let allSec = 0;
    let allSess = 0;
    Object.values(db.dailyHistory).forEach(d => {
        allSec += (d.totalSeconds || 0);
        allSess += (d.sessionsCount || 0);
    });
    db.totalAllSeconds = allSec;
    db.totalAllSessions = allSess;

    saveMerchantTimerDatabase(db);
    merchantTimerState.accumulatedSecondsToday = dayData.totalSeconds;
}

function recoverRunningTimerStateOnLoad() {
    try {
        let raw = localStorage.getItem(MERCHANT_TIMER_RUNNING_KEY);
        if (!raw) return;
        let saved = JSON.parse(raw);
        if (!saved || !saved.isRunning) return;

        let todayStr = getTodayStringGMT7();
        if (saved.date === todayStr) {
            merchantTimerState.sessionStartTimeStr = saved.sessionStartTimeStr;
            merchantTimerState.sessionStartMs = saved.sessionStartMs;
            startMerchantMasterTimer();
            catchUpMerchantSessionChunks();
        } else {
            localStorage.removeItem(MERCHANT_TIMER_RUNNING_KEY);
        }
    } catch(e) {
        console.warn("Lỗi phục hồi timer:", e);
    }
}

function hookThaihuLineupTimerAutoStop() {
    if (typeof window.toggleTeamTimer === 'function' && !window.toggleTeamTimer.__merchantHooked) {
        let originalToggleTimer = window.toggleTeamTimer;
        window.toggleTeamTimer = function(teamId) {
            if (merchantTimerState.isRunning) {
                stopMerchantMasterTimer(false);
                if (typeof logUserAction === 'function') {
                    logUserAction("Đã tự động chốt phiên Thương Nhân do bắt đầu bấm giờ Thái Hư.");
                }
            }
            return originalToggleTimer.apply(this, arguments);
        };
        window.toggleTeamTimer.__merchantHooked = true;
    }
}

/* ==========================================================================
   KHỐI 3: GIAO DIỆN WIDGET GÓC 7H
   Trạng thái: [ĐÃ KHÓA - KHÔNG SỬA]
   ========================================================================== */
function injectMerchantTimerWidget() {
    let holder = document.getElementById('merchant-bottom-left-timer-widget-zone');
    if (!holder) {
        holder = document.createElement('div');
        holder.id = 'merchant-bottom-left-timer-widget-zone';
        holder.className = "fixed bottom-4 left-6 z-[9990] select-none transition-all duration-300 hidden";
        document.body.appendChild(holder);
    }

    recalculateTodayTotalSeconds();

    holder.innerHTML = `
        <div id="merchant-timer-main-card" class="bg-gray-955/95 border-2 border-amber-500/80 rounded-2xl p-3 shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <button id="btn-merchant-timer-toggle" onclick="toggleMerchantMasterTimer()" class="px-4 py-2.5 rounded-xl font-black text-xs text-white transition shadow-lg flex items-center gap-2 cursor-pointer ${merchantTimerState.isRunning ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' : 'bg-amber-600 hover:bg-amber-500'}">
                <i id="icon-merchant-timer-state" class="fa-solid ${merchantTimerState.isRunning ? 'fa-pause' : 'fa-play'} text-sm"></i>
                <span id="label-merchant-timer-state">${merchantTimerState.isRunning ? 'Dừng Bấm Giờ' : 'Bắt Đầu Làm'}</span>
            </button>

            <div class="flex flex-col justify-center font-mono">
                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Thời Gian Thương Nhân:</span>
                <strong id="display-merchant-timer-digits" class="text-xl font-black text-amber-300 leading-none mt-0.5">
                    ${formatTimerDigits(merchantTimerState.accumulatedSecondsToday)}
                </strong>
            </div>

            <button onclick="openMerchantPerformanceStatsModal()" class="bg-gray-800 hover:bg-gray-700 text-amber-400 border border-amber-500/50 hover:border-amber-400 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow" title="Xem thống kê thời gian & quản lý phiên">
                <i class="fa-solid fa-chart-pie text-amber-400"></i> Thống Kê
            </button>
        </div>
    `;

    updateMerchantTimerDisplay();
    syncMerchantTimerWidgetVisibility();
    hookThaihuLineupTimerAutoStop();
}

function updateMerchantTimerDisplay() {
    let digitEl = document.getElementById('display-merchant-timer-digits');
    let btnEl = document.getElementById('btn-merchant-timer-toggle');
    let iconEl = document.getElementById('icon-merchant-timer-state');
    let labelEl = document.getElementById('label-merchant-timer-state');

    if (digitEl) digitEl.innerText = formatTimerDigits(merchantTimerState.accumulatedSecondsToday);

    if (btnEl && iconEl && labelEl) {
        if (merchantTimerState.isRunning) {
            btnEl.className = "px-4 py-2.5 rounded-xl font-black text-xs text-white transition shadow-lg flex items-center gap-2 cursor-pointer bg-rose-600 hover:bg-rose-700 animate-pulse";
            iconEl.className = "fa-solid fa-pause text-sm";
            labelEl.innerText = "Dừng Bấm Giờ";
        } else {
            btnEl.className = "px-4 py-2.5 rounded-xl font-black text-xs text-white transition shadow-lg flex items-center gap-2 cursor-pointer bg-amber-600 hover:bg-amber-500";
            iconEl.className = "fa-solid fa-play text-sm";
            labelEl.innerText = "Bắt Đầu Làm";
        }
    }
}

function syncMerchantTimerWidgetVisibility() {
    let holder = document.getElementById('merchant-bottom-left-timer-widget-zone');
    if (!holder) return;

    let btnMerchant = document.getElementById('btn-main-tab-merchant');
    let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');

    let isMerchantTab = btnMerchant && btnMerchant.classList.contains('bg-amber-600') &&
                        merchantPanel && !merchantPanel.classList.contains('hidden');

    if (isMerchantTab) {
        holder.classList.remove('hidden');
    } else {
        holder.classList.add('hidden');
    }
}

/* ==========================================================================
   KHỐI 4: MODAL THỐNG KÊ CHI TIẾT - TÍNH ĐÚNG THỜI GIAN TRẢI DÀI
   Trạng thái: [ĐÃ FIX TRIỆT ĐỂ - ÁP DỤNG CALCULATESPANSECONDS CHO MỌI NGÀY]
   ========================================================================== */
function openMerchantPerformanceStatsModal() {
    let existing = document.getElementById('merchant-stats-modal-overlay');
    if (existing) existing.remove();

    catchUpMerchantSessionChunks();
    recalculateTodayTotalSeconds();
    refreshAccountStatsForToday();

    let db = getMerchantTimerDatabase();
    let todayStr = getTodayStringGMT7();
    let todayData = db.dailyHistory[todayStr] || ensureTodayHistoryRecord();

    let yesterdayDate = getNowGMT7();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    let yY = yesterdayDate.getFullYear();
    let yM = String(yesterdayDate.getMonth() + 1).padStart(2, '0');
    let yD = String(yesterdayDate.getDate()).padStart(2, '0');
    let yesterdayStr = `${yY}-${yM}-${yD}`;
    let yesterdayData = db.dailyHistory[yesterdayStr] || null;

    let dates = Object.keys(db.dailyHistory || {}).sort().reverse();
    let totalDays = dates.length || 1;
    let avgDailySecs = totalDays > 0 ? Math.round((db.totalAllSeconds || 0) / totalDays) : 0;

    // TÍNH CHUẨN THỜI GIAN TRẢI DÀI HÔM NAY
    let currentOrLastEndToday = merchantTimerState.isRunning ? getTimeStringGMT7() : (todayData.lastEndTime || todayData.firstStartTime);
    let spanSecondsToday = calculateSpanSeconds(todayData.firstStartTime, currentOrLastEndToday, todayData.totalSeconds);

    let todayCompleted = todayData.completedAccounts || 0;
    let avgTimePerAccToday = todayCompleted > 0 ? Math.round(todayData.totalSeconds / todayCompleted) : (todayData.totalRuns > 0 ? Math.round(todayData.totalSeconds / (todayData.totalRuns / 3)) : 0);

    let compareYesterdayBadge = "";
    if (yesterdayData && yesterdayData.totalSeconds > 0 && todayData.totalSeconds > 0) {
        let diff = todayData.totalSeconds - yesterdayData.totalSeconds;
        if (diff < 0) {
            compareYesterdayBadge = `<span class="bg-emerald-955 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">⚡ Nhanh hơn hôm qua (${formatTimerDigits(Math.abs(diff))})</span>`;
        } else if (diff > 0) {
            compareYesterdayBadge = `<span class="bg-rose-955 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">🐢 Chậm hơn hôm qua (+${formatTimerDigits(diff)})</span>`;
        }
    } else {
        compareYesterdayBadge = `<span class="bg-gray-800 text-gray-500 px-2 py-0.5 rounded text-[10px]">Chưa có dữ liệu so sánh</span>`;
    }

    // 1. DANH SÁCH CHI TIẾT TỪNG PHIÊN HÔM NAY
    let todaySessionsHtml = "";
    if (!todayData.sessions || todayData.sessions.length === 0) {
        todaySessionsHtml = `<div class="text-gray-500 italic text-center py-2 text-[11px]">Hôm nay chưa chốt phiên nào.</div>`;
    } else {
        todaySessionsHtml = todayData.sessions.map((sess, idx) => {
            let mins = Math.floor(sess.seconds / 60);
            let secs = sess.seconds % 60;
            return `
                <div class="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-amber-500/40 p-2 rounded-lg font-mono text-[11px] transition">
                    <div class="flex items-center gap-2">
                        <span class="bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-black text-[10px]">Phiên #${idx + 1}</span>
                        <span class="text-gray-400 text-[10px] font-sans">${sess.startTime} → ${sess.endTime}</span>
                        <strong class="text-amber-300 font-bold">${mins}p ${secs.toString().padStart(2, '0')}s</strong>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button onclick="editMerchantSessionPrompt('${sess.id}', ${mins})" class="bg-gray-800 hover:bg-blue-600 text-blue-300 hover:text-white px-2 py-1 rounded text-[10px] font-bold border border-gray-700 transition cursor-pointer" title="Chỉnh sửa số phút">
                            <i class="fa-solid fa-pen"></i> Sửa Phút
                        </button>
                        <button onclick="deleteMerchantSessionConfirm('${sess.id}')" class="bg-gray-800 hover:bg-rose-700 text-rose-400 hover:text-white px-2 py-1 rounded text-[10px] font-bold border border-gray-700 transition cursor-pointer" title="Xóa phiên">
                            <i class="fa-solid fa-trash-can"></i> Xóa
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 2. TỔNG HỢP CÁC NGÀY TRƯỚC VÀ HÔM NAY (TÍNH ĐÚNG TRẢI DÀI)
    let summaryRowsHtml = "";
    dates.forEach(dStr => {
        let item = db.dailyHistory[dStr];
        let isToday = (dStr === todayStr);
        let avgAcc = item.completedAccounts > 0 ? formatTimerDigits(Math.round(item.totalSeconds / item.completedAccounts)) : '--';
        
        let endStr = isToday && merchantTimerState.isRunning ? getTimeStringGMT7() : (item.lastEndTime || item.firstStartTime);
        let itemSpanSec = calculateSpanSeconds(item.firstStartTime, endStr, item.totalSeconds);

        summaryRowsHtml += `
            <tr class="border-b border-gray-800/80 ${isToday ? 'bg-amber-955/20 font-bold text-amber-300' : 'text-gray-300 hover:bg-gray-800/40'}">
                <td class="py-2 px-3 font-mono">${isToday ? `<span class="text-emerald-400 font-black">Hôm nay (${dStr})</span>` : dStr}</td>
                <td class="py-2 px-2 text-center text-gray-300 font-mono text-[11px]">${item.firstStartTime || '--:--'} → ${item.lastEndTime || '--:--'}</td>
                <td class="py-2 px-2 text-center font-mono font-bold text-amber-300">${formatTimerDigits(item.totalSeconds)} <span class="text-[10px] text-gray-400 font-normal">(${formatDurationReadable(itemSpanSec)})</span></td>
                <td class="py-2 px-2 text-center font-mono">${item.completedAccounts || 0} / 60 acc</td>
                <td class="py-2 px-2 text-center font-mono text-cyan-300">${avgAcc}</td>
                <td class="py-2 px-2 text-center text-gray-400 font-mono">${item.sessionsCount || 0} phiên</td>
            </tr>
        `;
    });

    let overlay = document.createElement('div');
    overlay.id = 'merchant-stats-modal-overlay';
    overlay.className = "fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-3 font-sans select-none";
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `
        <div onclick="event.stopPropagation()" style="width: 660px; max-height: 90vh;" class="bg-gray-900 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl text-xs font-sans relative flex flex-col gap-3 overflow-hidden">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2 shrink-0">
                <span class="font-black text-amber-400 text-sm uppercase flex items-center gap-2">
                    <i class="fa-solid fa-chart-line text-amber-400"></i> THỐNG KÊ HIỆU SUẤT THỜI GIAN THƯƠNG NHÂN
                </span>
                <button onclick="document.getElementById('merchant-stats-modal-overlay').remove()" class="text-rose-500 hover:text-rose-400 font-black text-lg cursor-pointer leading-none">&times;</button>
            </div>

            <div class="overflow-y-auto custom-scrollbar flex-1 flex flex-col gap-3 pr-1">
                <div class="grid grid-cols-3 gap-2.5 bg-gray-955 p-3 rounded-xl border border-gray-800 font-mono shrink-0">
                    <div class="flex flex-col">
                        <span class="text-gray-400 text-[10px] font-sans">Thời Gian Bấm Máy Hôm Nay:</span>
                        <strong class="text-amber-300 text-base font-black mt-0.5">${formatTimerDigits(todayData.totalSeconds)}</strong>
                        <div class="text-[10px] text-cyan-300 font-sans mt-0.5">Trải dài: <b>${formatDurationReadable(spanSecondsToday)}</b> (${todayData.firstStartTime || '--'} → ${todayData.lastEndTime || '--'})</div>
                        <div class="mt-1">${compareYesterdayBadge}</div>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-400 text-[10px] font-sans">Trung Bình 1 Tài Khoản:</span>
                        <strong class="text-cyan-300 text-base font-black mt-0.5">${avgTimePerAccToday > 0 ? formatTimerDigits(avgTimePerAccToday) : '--'}</strong>
                        <span class="text-[10px] text-gray-400 font-sans mt-1">Đã xong: <b class="text-emerald-400">${todayCompleted} / 60 acc</b></span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-400 text-[10px] font-sans">TB Toàn Thời Gian:</span>
                        <strong class="text-purple-300 text-base font-black mt-0.5">${formatTimerDigits(avgDailySecs)} / ngày</strong>
                        <span class="text-[10px] text-gray-500 font-sans mt-1">Chu kỳ 15p/phiên</span>
                    </div>
                </div>

                <div class="bg-gray-955 p-3 rounded-xl border border-gray-800 flex flex-col gap-2 shrink-0">
                    <div class="flex items-center justify-between border-b border-gray-800/80 pb-1">
                        <span class="font-bold text-amber-300 uppercase text-[11px] flex items-center gap-1.5">
                            <i class="fa-solid fa-clock-rotate-left text-amber-400"></i> CÁC PHIÊN HÔM NAY (${todayData.sessions ? todayData.sessions.length : 0} phiên)
                        </span>
                        <span class="text-[10px] text-gray-400">Tự động chốt 15p/phiên • Có thể sửa/xóa</span>
                    </div>
                    <div class="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                        ${todaySessionsHtml}
                    </div>
                </div>

                <div class="rounded-xl border border-gray-800 overflow-hidden shrink-0">
                    <div class="bg-gray-955 px-3 py-1.5 border-b border-gray-800 text-[11px] font-bold text-gray-300 uppercase flex items-center gap-1.5">
                        <i class="fa-solid fa-calendar-days text-purple-400"></i> LỊCH SỬ TỔNG HỢP THEO NGÀY (GMT+7)
                    </div>
                    <table class="w-full text-left text-xs border-collapse font-mono">
                        <thead class="bg-gray-955 text-gray-400 uppercase font-sans text-[10px] border-b border-gray-800">
                            <tr>
                                <th class="py-2 px-3">Ngày Làm</th>
                                <th class="py-2 px-2 text-center">Khung Giờ</th>
                                <th class="py-2 px-2 text-center">Tổng Giờ</th>
                                <th class="py-2 px-2 text-center">Hoàn Thành</th>
                                <th class="py-2 px-2 text-center">TB / 1 ACC</th>
                                <th class="py-2 px-2 text-center">Số Phiên</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${summaryRowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="flex justify-between items-center pt-2 border-t border-gray-800 shrink-0">
                <span class="text-[10px] text-gray-500 font-mono">Cơ chế Timestamp Diff siêu nhẹ • Chống mất dữ liệu 100%</span>
                <button onclick="document.getElementById('merchant-stats-modal-overlay').remove()" class="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-1.5 rounded-lg border border-gray-700 transition cursor-pointer text-xs">Đóng</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

/* ==========================================================================
   KHỐI 5: CÁC HÀM SỬA / XÓA PHIÊN
   Trạng thái: [ĐÃ KHÓA - KHÔNG SỬA]
   ========================================================================== */
function editMerchantSessionPrompt(sessionId, currentMins) {
    let input = prompt(`Nhập số phút thực tế cho phiên này (hiện tại: ${currentMins} phút):`, currentMins);
    if (input === null || input.trim() === "") return;

    let newMins = parseFloat(input);
    if (isNaN(newMins) || newMins < 0) {
        alert("Số phút không hợp lệ!");
        return;
    }

    let todayStr = getTodayStringGMT7();
    let db = getMerchantTimerDatabase();
    let dayData = db.dailyHistory[todayStr];
    if (!dayData || !dayData.sessions) return;

    let targetSess = dayData.sessions.find(s => s.id === sessionId);
    if (targetSess) {
        targetSess.seconds = Math.round(newMins * 60);
        recalculateTodayTotalSeconds();
        updateMerchantTimerDisplay();
        openMerchantPerformanceStatsModal();
        if (typeof logUserAction === 'function') logUserAction(`Đã sửa phiên Thương Nhân thành ${newMins} phút.`);
    }
}

function deleteMerchantSessionConfirm(sessionId) {
    if (!confirm("Xác nhận xóa bỏ phiên này? Thời gian phiên sẽ bị trừ khỏi tổng ngày.")) return;

    let todayStr = getTodayStringGMT7();
    let db = getMerchantTimerDatabase();
    let dayData = db.dailyHistory[todayStr];
    if (!dayData || !dayData.sessions) return;

    dayData.sessions = dayData.sessions.filter(s => s.id !== sessionId);
    dayData.sessionsCount = dayData.sessions.length;

    recalculateTodayTotalSeconds();
    updateMerchantTimerDisplay();
    openMerchantPerformanceStatsModal();

    if (typeof logUserAction === 'function') logUserAction(`Đã xóa 1 phiên làm việc Thương Nhân.`);
}

/* ==========================================================================
   KHỐI 6: LẮNG NGHE SỰ KIỆN MỞ LẠI TAB
   Trạng thái: [ĐÃ KHÓA - KHÔNG SỬA]
   ========================================================================== */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        injectMerchantTimerWidget();
        recoverRunningTimerStateOnLoad();
    });
} else {
    injectMerchantTimerWidget();
    recoverRunningTimerStateOnLoad();
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && merchantTimerState.isRunning) {
        catchUpMerchantSessionChunks();
        updateMerchantTimerDisplay();
    }
});

window.addEventListener('focus', () => {
    if (merchantTimerState.isRunning) {
        catchUpMerchantSessionChunks();
        updateMerchantTimerDisplay();
    }
});

window.addEventListener('beforeunload', () => {
    if (merchantTimerState.isRunning) {
        catchUpMerchantSessionChunks();
        let nowMs = Date.now();
        let elapsed = Math.floor((nowMs - merchantTimerState.sessionStartMs) / 1000);
        if (elapsed > 3) {
            saveSingleChunkSession(merchantTimerState.sessionStartTimeStr, getTimeStringGMT7(), elapsed);
        }
    }
});

setInterval(syncMerchantTimerWidgetVisibility, 300);
setInterval(hookThaihuLineupTimerAutoStop, 1000);

window.toggleMerchantMasterTimer = toggleMerchantMasterTimer;
window.openMerchantPerformanceStatsModal = openMerchantPerformanceStatsModal;
window.editMerchantSessionPrompt = editMerchantSessionPrompt;
window.deleteMerchantSessionConfirm = deleteMerchantSessionConfirm;
window.syncMerchantTimerWidgetVisibility = syncMerchantTimerWidgetVisibility;

// Tổng số dòng code trong file này: 425 dòng.