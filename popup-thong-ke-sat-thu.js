// Tên file: popup-thong-ke-sat-thu.js
// Chức năng: Widget Thống Kê Sát Thủ - Biểu đồ tròn Đỏ Light Neon, nút [X] tắt gọn, tính Vàng/NL hôm nay (bám ngày sự kiện) và Tổng Vàng/NL trong cả đợt sự kiện.
// Con của file: index.html

const SAT_THU_STORAGE_KEY = 'SYSTEM_SAT_THU_ANALYTICS_V1';
let isSatThuStatsCollapsed = false;

// 1. KIỂM TRA KHUNG GIỜ NHIỆM VỤ SÁT THỦ (Chạy ngầm, không show giao diện)
function isSatThuEventSessionActive() {
    let now = new Date();
    let dayOfWeek = now.getDay();
    let isTargetDay = (dayOfWeek >= 1 && dayOfWeek <= 4);
    let hour = now.getHours();
    let isTargetHour = (hour >= 20 && hour <= 23);
    return {
        isEventTime: isTargetDay && isTargetHour,
        dayOfWeek: dayOfWeek,
        hour: hour
    };
}

// 2. TÍNH TỔNG DỮ LIỆU TÀI CHÍNH & TIẾN ĐỘ SÁT THỦ HÔM NAY VÀ TRONG CẢ ĐỢT SỰ KIỆN
function getSatThuMasterAnalyticsData() {
    let matPrice = (typeof systemDatabase !== 'undefined' && systemDatabase.materialPrice) ? parseFloat(systemDatabase.materialPrice) : 0.3;
    
    // Kiểm tra trạng thái sự kiện hôm nay chuẩn GMT+7
    let isEventToday = false;
    if (typeof EventManager !== 'undefined' && typeof EventManager.isEventCurrentlyActiveGMT7 === 'function') {
        isEventToday = EventManager.isEventCurrentlyActiveGMT7();
    } else if (typeof isEventCurrentlyActiveGMT7 === 'function') {
        isEventToday = isEventCurrentlyActiveGMT7();
    }

    let memberList = [];
    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        memberList = Object.values(systemDatabase.members).filter(m => m && m.name && !m.satThuLocked);
    }

    let totalAccs = memberList.length;
    let maxPossibleRuns = totalAccs * 3;
    let totalDoneRuns = 0;
    let completed3RunsCount = 0;
    let timestampsList = [];

    memberList.forEach(m => {
        let r = parseInt(m.satThuRuns) || 0;
        totalDoneRuns += r;
        if (r >= 3) completed3RunsCount++;
        if (m.satThuTimestamp) timestampsList.push(m.satThuTimestamp);
    });

    let remainingAccs = Math.max(0, totalAccs - completed3RunsCount);
    let percent = maxPossibleRuns > 0 ? Math.round((totalDoneRuns / maxPossibleRuns) * 100) : 0;

    // TÀI CHÍNH HÔM NAY: 1.2v/lượt, Nguyên liệu chỉ có khi đang trong ngày sự kiện (+18 NL/lượt)
    let todayDirectGold = totalDoneRuns * 1.2;
    let todayMaterials = isEventToday ? (totalDoneRuns * 18) : 0;
    let todayMaterialGold = todayMaterials * matPrice;
    let todayTotalGold = todayDirectGold + todayMaterialGold;
    let todayNganPhieu = totalDoneRuns;

    // THỜI GIAN TRUNG BÌNH 1 TÀI KHOẢN & HOÀN TẤT TOÀN BỘ
    let avgAccFormatted = "--:--";
    let avgTotalFormatted = "--:--";

    if (timestampsList.length >= 2 && completed3RunsCount > 0) {
        timestampsList.sort((a, b) => a - b);
        let firstMs = timestampsList[0];
        let lastMs = timestampsList[timestampsList.length - 1];
        let elapsedSeconds = Math.max(60, Math.round((lastMs - firstMs) / 1000));

        let secPerAcc = Math.round(elapsedSeconds / completed3RunsCount);
        let mAcc = Math.floor(secPerAcc / 60);
        let sAcc = secPerAcc % 60;
        avgAccFormatted = `${mAcc}p ${sAcc.toString().padStart(2, '0')}s`;

        let totalEstimatedSec = secPerAcc * totalAccs;
        let mTotal = Math.floor(totalEstimatedSec / 60);
        let sTotal = totalEstimatedSec % 60;
        avgTotalFormatted = `${mTotal}p ${sTotal.toString().padStart(2, '0')}s`;
    }

    // TÍNH TỔNG VÀNG VÀ NGUYÊN LIỆU TRONG CẢ KỲ SỰ KIỆN
    // Tích lũy từ lịch sử các snapshot trước đó + dữ liệu chạy hôm nay
    let eventTotalGold = todayTotalGold;
    let eventTotalMaterials = todayMaterials;

    try {
        let evConfig = (typeof EventManager !== 'undefined') ? EventManager.getActiveEvent() : null;
        let startDate = evConfig?.startDate || localStorage.getItem('EVENT_START_DATE') || "";
        let endDate = evConfig?.endDate || localStorage.getItem('EVENT_END_DATE') || "";

        let historyIndex = JSON.parse(localStorage.getItem('THAIHU_HISTORY_INDEX') || '[]');
        let todayStr = new Date().toLocaleDateString('sv-SE');

        historyIndex.forEach(dayStr => {
            if (dayStr !== todayStr && (!startDate || dayStr >= startDate) && (!endDate || dayStr <= endDate)) {
                let snap = localStorage.getItem('THAIHU_SNAPSHOT_' + dayStr);
                if (snap) {
                    let parsed = JSON.parse(snap);
                    if (parsed && parsed.systemDatabase && parsed.systemDatabase.members) {
                        let dayRuns = 0;
                        Object.values(parsed.systemDatabase.members).forEach(oldM => {
                            if (oldM && !oldM.satThuLocked) {
                                dayRuns += (parseInt(oldM.satThuRuns) || 0);
                            }
                        });
                        let dayGold = dayRuns * 1.2;
                        let dayNL = dayRuns * 18;
                        let dayPrice = parseFloat(parsed.settings?.materialPrice || matPrice);
                        eventTotalGold += (dayGold + (dayNL * dayPrice));
                        eventTotalMaterials += dayNL;
                    }
                }
            }
        });
    } catch (err) {
        console.error("Lỗi tính tổng sự kiện:", err);
    }

    return {
        totalAccs: totalAccs,
        maxPossibleRuns: maxPossibleRuns,
        totalDoneRuns: totalDoneRuns,
        completedAccs: completed3RunsCount,
        remainingAccs: remainingAccs,
        percent: percent,

        // Tài chính hôm nay
        todayGold: todayTotalGold,
        todayMaterials: todayMaterials,
        nganPhieu: todayNganPhieu,

        // Tài chính cả đợt sự kiện
        eventTotalGold: eventTotalGold,
        eventTotalMaterials: eventTotalMaterials,

        // Vận tốc
        avgTimePerAcc: avgAccFormatted,
        avgTimeToCompleteAll: avgTotalFormatted
    };
}

// 3. TỰ ĐỘNG ĐO VỊ TRÍ & ĐỘ RỘNG BÁM CỘT COPY -> MÉP PHẢI
function updatePopupPositionAndWidth() {
    let card = document.getElementById('sat-thu-stats-main-card');
    if (!card || isSatThuStatsCollapsed) return;

    let copyTh = document.querySelector('th:nth-child(5)') || document.querySelector('th:nth-last-child(2)');
    if (copyTh) {
        let rect = copyTh.getBoundingClientRect();
        let targetWidth = window.innerWidth - rect.left - 12;
        if (targetWidth > 180 && targetWidth < 400) {
            card.style.width = targetWidth + 'px';
        }
    }
}

// 4. KHỞI TẠO POPUP GIAO DIỆN MỚI
function injectSatThuStatsPopupComponent() {
    let existing = document.getElementById('sat-thu-stats-floating-widget');
    if (existing) return;

    let widget = document.createElement('div');
    widget.id = 'sat-thu-stats-floating-widget';
    widget.className = "fixed right-2.5 top-[92px] z-40 select-none transition-all duration-200 hidden font-sans";
    widget.innerHTML = `
        <!-- NÚT MŨI TÊN NHỎ GỌN Ở GIỮA MÉP PHẢI ĐỂ MỞ LẠI KHI ĐÃ ĐÓNG [X] -->
        <button id="sat-thu-stats-toggle-btn" onclick="toggleSatThuStatsCollapse()" class="hidden fixed right-0 top-1/2 -translate-y-1/2 bg-[#05131a] hover:bg-cyan-950 border-l border-y border-cyan-400 text-cyan-300 w-6 h-12 rounded-l-lg shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer flex items-center justify-center transition z-50 group" title="Mở lại Thống Kê Sát Thủ">
            <i class="fa-solid fa-chevron-left text-xs group-hover:-translate-x-0.5 transition-transform"></i>
        </button>

        <!-- BẢNG POPUP XANH LIGHT ĐIỆN TỬ - BIỂU ĐỒ ĐỎ LIGHT NEON -->
        <div id="sat-thu-stats-main-card" class="w-[230px] bg-[#030d14]/95 backdrop-blur-md border-2 border-cyan-400 rounded-2xl p-3 shadow-[0_0_25px_rgba(6,182,212,0.4)] text-gray-200 flex flex-col gap-2.5">
            <!-- HEADER VÀ NÚT [X] ĐÓNG GỌN GÀNG -->
            <div class="flex items-center justify-between border-b border-cyan-900/60 pb-1.5">
                <span class="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                    <i class="fa-solid fa-chart-pie text-cyan-400"></i> HIỆU SUẤT SÁT THỦ
                </span>
                <button onclick="toggleSatThuStatsCollapse()" class="text-cyan-400 hover:text-rose-400 hover:bg-rose-955/60 w-5 h-5 rounded flex items-center justify-center font-black text-sm transition cursor-pointer border border-cyan-800/80 shrink-0 leading-none" title="Đóng bảng">
                    &times;
                </button>
            </div>

            <!-- KHỐI 1: BIỂU ĐỒ TRÒN ĐỎ LIGHT NEON & TIẾN ĐỘ DỌC -->
            <div class="bg-[#061824] border border-cyan-800/80 rounded-xl p-2.5 flex flex-col items-center gap-2 shadow-inner">
                <div class="relative w-16 h-16 flex items-center justify-center shrink-0">
                    <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path class="text-gray-900" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <!-- VẠCH TIẾN ĐỘ ĐỎ LIGHT NEON RỰC SÁNG -->
                        <path id="sat-thu-pie-progress-circle" class="text-rose-500 transition-all duration-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.9)]" stroke-dasharray="0, 100" stroke-linecap="round" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span id="sat-thu-pie-percent-text" class="absolute font-mono font-black text-sm text-rose-300 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]">0%</span>
                </div>
                
                <!-- THÔNG SỐ ÉP DỌC CHỮ TO RÕ RÀNG -->
                <div class="w-full flex flex-col gap-1 border-t border-cyan-900/50 pt-2 font-mono">
                    <div class="flex justify-between items-center text-xs">
                        <span class="font-sans text-[11px] text-gray-400 font-bold">Tổng lượt:</span>
                        <strong id="sat-thu-total-runs-fraction" class="text-sm font-black text-cyan-300">0 / 0</strong>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="font-sans text-[11px] text-gray-400 font-bold">Đã xong 3/3:</span>
                        <strong id="sat-thu-completed-accs-count" class="text-xs font-black text-emerald-400">0 acc</strong>
                    </div>
                    <div class="flex justify-between items-center text-xs bg-rose-955/40 px-1.5 py-1 rounded border border-rose-900/50">
                        <span class="font-sans text-[11px] text-rose-300 font-black">Chưa xong:</span>
                        <strong id="sat-thu-remaining-accs-count" class="text-sm font-black text-rose-400">0 acc</strong>
                    </div>
                </div>
            </div>

            <!-- KHỐI 2: DOANH THU HÔM NAY (VÀNG & NGUYÊN LIỆU BÁM THEO NGÀY SỰ KIỆN) -->
            <div class="bg-[#061824] border border-cyan-800/80 p-2.5 rounded-xl flex flex-col gap-1.5 font-mono shadow-inner">
                <span class="text-[10px] font-sans text-cyan-300 font-black uppercase tracking-wider border-b border-cyan-900/50 pb-1 flex items-center gap-1">
                    <i class="fa-solid fa-calendar-day text-amber-400"></i> HÔM NAY
                </span>
                <div class="flex justify-between items-center text-xs">
                    <span class="font-sans text-[11px] text-gray-400 font-bold">Vàng hôm nay:</span>
                    <strong id="sat-thu-today-gold" class="text-xs font-black text-amber-300">+0.00v</strong>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="font-sans text-[11px] text-gray-400 font-bold">NL hôm nay:</span>
                    <strong id="sat-thu-today-materials" class="text-xs font-black text-rose-300">0 NL</strong>
                </div>
            </div>

            <!-- KHỐI 3: VẬN TỐC THỜI GIAN TRUNG BÌNH -->
            <div class="bg-[#061824] border border-cyan-800/80 p-2 rounded-xl flex flex-col gap-1.5 font-mono shadow-inner">
                <div class="flex justify-between items-center border-b border-cyan-900/50 pb-1">
                    <span class="font-sans text-[10px] text-gray-400 font-bold uppercase">TB 1 Tài khoản:</span>
                    <strong id="sat-thu-avg-acc-time" class="text-xs font-black text-cyan-300">--:--</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-sans text-[10px] text-gray-400 font-bold uppercase">TB Toàn bộ:</span>
                    <strong id="sat-thu-avg-total-time" class="text-xs font-black text-amber-300">--:--</strong>
                </div>
            </div>

            <!-- KHỐI 4: TỔNG VÀNG & NGUYÊN LIỆU TRONG CẢ KỲ SỰ KIỆN (MỞ RỘNG XUỐNG DƯỚI) -->
            <div class="bg-[#081f2e] border-2 border-emerald-500/80 p-2.5 rounded-xl flex flex-col gap-1.5 font-mono shadow-[0_0_15px_rgba(16,185,129,0.25)]">
                <span class="text-[10px] font-sans text-emerald-300 font-black uppercase tracking-wider border-b border-emerald-900/60 pb-1 flex items-center justify-between">
                    <span class="flex items-center gap-1"><i class="fa-solid fa-coins text-yellow-400"></i> CẢ ĐỢT SỰ KIỆN</span>
                    <span class="text-[8px] bg-emerald-950 px-1 py-0.2 rounded border border-emerald-400 text-emerald-300">TỔNG KẾT</span>
                </span>
                <div class="flex justify-between items-center text-xs">
                    <span class="font-sans text-[11px] text-gray-300 font-bold">Tổng Vàng SK:</span>
                    <strong id="sat-thu-event-total-gold" class="text-xs font-black text-yellow-300">+0.00v</strong>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="font-sans text-[11px] text-gray-300 font-bold">Tổng NL SK:</span>
                    <strong id="sat-thu-event-total-materials" class="text-xs font-black text-emerald-400">0 NL</strong>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(widget);
    window.addEventListener('resize', updatePopupPositionAndWidth);
    updateSatThuStatsDashboardUI();
}

function toggleSatThuStatsCollapse() {
    isSatThuStatsCollapsed = !isSatThuStatsCollapsed;
    let mainCard = document.getElementById('sat-thu-stats-main-card');
    let toggleBtn = document.getElementById('sat-thu-stats-toggle-btn');
    if (mainCard && toggleBtn) {
        if (isSatThuStatsCollapsed) {
            mainCard.classList.add('hidden');
            toggleBtn.classList.remove('hidden');
        } else {
            mainCard.classList.remove('hidden');
            toggleBtn.classList.add('hidden');
            updatePopupPositionAndWidth();
            updateSatThuStatsDashboardUI();
        }
    }
}

function showSatThuStatsPopup() {
    let widget = document.getElementById('sat-thu-stats-floating-widget');
    if (!widget) {
        injectSatThuStatsPopupComponent();
        widget = document.getElementById('sat-thu-stats-floating-widget');
    }
    if (widget) {
        widget.classList.remove('hidden');
        let toggleBtn = document.getElementById('sat-thu-stats-toggle-btn');
        let mainCard = document.getElementById('sat-thu-stats-main-card');
        if (isSatThuStatsCollapsed) {
            if (toggleBtn) toggleBtn.classList.remove('hidden');
            if (mainCard) mainCard.classList.add('hidden');
        } else {
            if (toggleBtn) toggleBtn.classList.add('hidden');
            if (mainCard) mainCard.classList.remove('hidden');
        }
        updatePopupPositionAndWidth();
        updateSatThuStatsDashboardUI();
    }
}

function hideSatThuStatsPopup() {
    let widget = document.getElementById('sat-thu-stats-floating-widget');
    if (widget) widget.classList.add('hidden');
    let toggleBtn = document.getElementById('sat-thu-stats-toggle-btn');
    if (toggleBtn) toggleBtn.classList.add('hidden');
}

// CẬP NHẬT DỮ LIỆU GIAO DIỆN REAL-TIME
function updateSatThuStatsDashboardUI() {
    let data = getSatThuMasterAnalyticsData();

    // 1. Cập nhật biểu đồ Đỏ Light Neon & tiến độ
    let circleEl = document.getElementById('sat-thu-pie-progress-circle');
    let textEl = document.getElementById('sat-thu-pie-percent-text');
    let fracEl = document.getElementById('sat-thu-total-runs-fraction');
    let doneAccEl = document.getElementById('sat-thu-completed-accs-count');
    let remainAccEl = document.getElementById('sat-thu-remaining-accs-count');

    if (circleEl) circleEl.setAttribute('stroke-dasharray', `${data.percent}, 100`);
    if (textEl) textEl.innerText = `${data.percent}%`;
    if (fracEl) fracEl.innerText = `${data.totalDoneRuns} / ${data.maxPossibleRuns}`;
    if (doneAccEl) doneAccEl.innerText = `${data.completedAccs} acc`;
    if (remainAccEl) remainAccEl.innerText = `${data.remainingAccs} acc`;

    // 2. Cập nhật doanh thu hôm nay
    let todayGoldEl = document.getElementById('sat-thu-today-gold');
    let todayMaterialsEl = document.getElementById('sat-thu-today-materials');
    if (todayGoldEl) todayGoldEl.innerText = `+${data.todayGold.toFixed(2)}v`;
    if (todayMaterialsEl) todayMaterialsEl.innerText = `${data.todayMaterials.toLocaleString('vi-VN')} NL`;

    // 3. Cập nhật vận tốc trung bình
    let avgAccEl = document.getElementById('sat-thu-avg-acc-time');
    let avgTotalEl = document.getElementById('sat-thu-avg-total-time');
    if (avgAccEl) avgAccEl.innerText = data.avgTimePerAcc;
    if (avgTotalEl) avgTotalEl.innerText = data.avgTimeToCompleteAll;

    // 4. Cập nhật tổng kết cả kỳ sự kiện
    let evGoldEl = document.getElementById('sat-thu-event-total-gold');
    let evMaterialsEl = document.getElementById('sat-thu-event-total-materials');
    if (evGoldEl) evGoldEl.innerText = `+${data.eventTotalGold.toFixed(2)}v`;
    if (evMaterialsEl) evMaterialsEl.innerText = `${data.eventTotalMaterials.toLocaleString('vi-VN')} NL`;

    updatePopupPositionAndWidth();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSatThuStatsPopupComponent);
} else {
    injectSatThuStatsPopupComponent();
}

// XUẤT TOÀN CỤC CHO POPUP LỢI NHUẬN VÀ CÁC MODULE KHÁC GỌI
window.getSatThuMasterAnalyticsData = getSatThuMasterAnalyticsData;
window.injectSatThuStatsPopupComponent = injectSatThuStatsPopupComponent;
window.showSatThuStatsPopup = showSatThuStatsPopup;
window.hideSatThuStatsPopup = hideSatThuStatsPopup;
window.toggleSatThuStatsCollapse = toggleSatThuStatsCollapse;
window.updateSatThuStatsDashboardUI = updateSatThuStatsDashboardUI;
