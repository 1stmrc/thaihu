// Tên file: dong-co-bam-gio-va-ky-luc.js
// Chức năng: Động cơ cốt lõi - Quản lý bộ bấm giờ chạy ải thời gian thực, lưu trữ, truy xuất và xóa kỷ lục thời gian Min/Max/Vừa đi của từng team trong hệ thống.
// Con của file: index.html (Nạp trước các file giao diện dashboard và biểu đồ).
// Danh sách tính năng của file:
//   1. Kiểm tra sự kiện đang diễn ra theo khung giờ chuẩn GMT+7.
//   2. Đọc, ghi và đồng bộ kỷ lục chạy ải của từng team (lọc bỏ mốc lỗi < 10 phút 30 giây).
//   3. Bắt đầu / Dừng bộ đếm giờ trận đấu (toggleTeamTimer) và cập nhật nhãn thời gian real-time.
//   4. Tổng hợp kỷ lục nhanh nhất và chậm nhất toàn hệ thống (getAllTeamsGlobalRecords).
//   5. Xóa kỷ lục cục bộ theo từng loại hoặc xóa trắng toàn bộ kỷ lục Database.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

let activeTeamRunningTimers = {};
const MIN_ALLOWED_FASTEST_SECONDS = 630; // 10 phút 30 giây

/* ==========================================================================
   KHỐI 1: KIỂM TRA SỰ KIỆN GMT+7 & ĐỌC / GHI STATS DATABASE
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function isEventActiveCurrentlyGMT7() {
    let startDate = localStorage.getItem('EVENT_START_DATE');
    let endDate = localStorage.getItem('EVENT_END_DATE');

    if (typeof systemDatabase !== 'undefined' && systemDatabase) {
        startDate = startDate || systemDatabase.eventStartDate || systemDatabase.eventConfig?.startDate;
        endDate = endDate || systemDatabase.eventEndDate || systemDatabase.eventConfig?.endDate;
    }

    if (startDate && endDate) {
        let now = new Date();
        let utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        let gmt7Ms = utcMs + (3600000 * 7);
        let todayGMT7Ms = new Date(gmt7Ms).setHours(0, 0, 0, 0);

        let startMs = new Date(startDate).setHours(0, 0, 0, 0);
        let endMs = new Date(endDate).setHours(23, 59, 59, 999);

        return (todayGMT7Ms >= startMs && todayGMT7Ms <= endMs);
    }
    return false;
}

function getTeamDashboardStats(teamId) {
    let localData = localStorage.getItem(`APP_TEAM_STATS_${teamId}`);
    let defaultStats = {
        fastestTime: null,
        fastestDate: null,
        slowestTime: null,
        slowestDate: null,
        totalTimeSum: 0,
        totalRunsCount: 0,
        maxGold: 0,
        minGold: null,
        totalGoldSum: 0,
        lastRunDate: "Chưa có dữ liệu",
        todayTime: null,
        historyLogs: []
    };

    let stats = defaultStats;
    if (typeof systemDatabase !== 'undefined' && systemDatabase.teamDashboards && systemDatabase.teamDashboards[teamId]) {
        stats = systemDatabase.teamDashboards[teamId];
    } else if (localData) {
        try { stats = JSON.parse(localData); } catch (e) { stats = defaultStats; }
    }

    if (stats.fastestTime !== null && stats.fastestTime < MIN_ALLOWED_FASTEST_SECONDS) {
        stats.fastestTime = null;
        stats.fastestDate = null;
    }
    if (stats.slowestTime !== null && stats.slowestTime < MIN_ALLOWED_FASTEST_SECONDS) {
        stats.slowestTime = null;
        stats.slowestDate = null;
    }
    if (stats.todayTime !== null && stats.todayTime < MIN_ALLOWED_FASTEST_SECONDS) {
        stats.todayTime = null;
    }

    return stats;
}

function saveTeamDashboardStats(teamId, statsObj) {
    try {
        localStorage.setItem(`APP_TEAM_STATS_${teamId}`, JSON.stringify(statsObj));
        if (typeof systemDatabase !== 'undefined') {
            if (!systemDatabase.teamDashboards) systemDatabase.teamDashboards = {};
            systemDatabase.teamDashboards[teamId] = statsObj;
        }
    } catch (e) {}
}

function getAllTeamsGlobalRecords() {
    let globalFastest = null;
    let globalSlowest = null;

    if (typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
        let lineups = systemDatabase.teams.filter(t => t.type === 'lineup');
        lineups.forEach(l => {
            let st = getTeamDashboardStats(l.id);
            if (st.fastestTime !== null && st.fastestTime >= MIN_ALLOWED_FASTEST_SECONDS) {
                if (globalFastest === null || st.fastestTime < globalFastest) {
                    globalFastest = st.fastestTime;
                }
            }
            if (st.slowestTime !== null && st.slowestTime >= MIN_ALLOWED_FASTEST_SECONDS) {
                if (globalSlowest === null || st.slowestTime > globalSlowest) {
                    globalSlowest = st.slowestTime;
                }
            }
        });
    }
    return { globalFastest, globalSlowest };
}

/* ==========================================================================
   KHỐI 2: ĐẾM GIỜ VÀ TÍNH TOÁN KỶ LỤC TRẬN ĐẤU
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function toggleTeamTimer(teamId) {
    if (!window.activeTeamRunningTimers) window.activeTeamRunningTimers = {};

    if (!window.activeTeamRunningTimers[teamId]) {
        window.activeTeamRunningTimers[teamId] = {
            startTime: Date.now(),
            intervalId: setInterval(() => updateTimerDisplay(teamId), 1000),
            elapsedSeconds: 0
        };
        if (typeof logUserAction === 'function') {
            let teamObj = (typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.find(t => t.id === teamId) : null;
            logUserAction(`Bắt đầu bấm giờ chạy ải cho [ ${(teamObj ? teamObj.name : teamId).toUpperCase()} ]`);
        }
    } else {
        let timerData = window.activeTeamRunningTimers[teamId];
        clearInterval(timerData.intervalId);
        let finalSeconds = Math.max(1, Math.floor((Date.now() - timerData.startTime) / 1000));
        delete window.activeTeamRunningTimers[teamId];

        recordNewRunMatchStats(teamId, finalSeconds);
    }
    if (typeof renderTeamTimerWidgetUI === 'function') renderTeamTimerWidgetUI(teamId);
}

function updateTimerDisplay(teamId) {
    let timerData = window.activeTeamRunningTimers ? window.activeTeamRunningTimers[teamId] : null;
    if (!timerData) return;

    let seconds = Math.floor((Date.now() - timerData.startTime) / 1000);
    timerData.elapsedSeconds = seconds;
    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    let displayStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let labelEl = document.getElementById(`timer-display-label-${teamId}`);
    if (labelEl) labelEl.innerText = displayStr;
}

function recordNewRunMatchStats(teamId, elapsedSeconds) {
    let stats = getTeamDashboardStats(teamId);
    let nowStr = new Date().toLocaleString('vi-VN');

    if (elapsedSeconds >= MIN_ALLOWED_FASTEST_SECONDS) {
        if (stats.fastestTime === null || elapsedSeconds < stats.fastestTime) {
            stats.fastestTime = elapsedSeconds;
            stats.fastestDate = nowStr;
        }
        if (stats.slowestTime === null || elapsedSeconds > stats.slowestTime) {
            stats.slowestTime = elapsedSeconds;
            stats.slowestDate = nowStr;
        }
        stats.todayTime = elapsedSeconds;
        stats.totalTimeSum += elapsedSeconds;
        stats.totalRunsCount += 1;
        stats.lastRunDate = nowStr;
    } else {
        if (typeof logUserAction === 'function') {
            let mins = Math.floor(elapsedSeconds / 60);
            let secs = elapsedSeconds % 60;
            logUserAction(`Thời gian trận (${mins}m ${secs}s) < 10p30s -> Bỏ qua không lưu.`);
        }
    }

    let isEventActive = isEventActiveCurrentlyGMT7();
    let estimatedGold = 0;

    if (isEventActive) {
        let teamObj = (typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.find(t => t.id === teamId) : null;
        let matPrice = (typeof systemDatabase !== 'undefined' && systemDatabase.materialPrice) ? parseFloat(systemDatabase.materialPrice) : 0;

        if (teamObj && teamObj.memberIds) {
            let activeAccCount = teamObj.memberIds.filter(id => id && systemDatabase.members && systemDatabase.members[id]).length;
            let totalNl = activeAccCount * 48;
            estimatedGold = (activeAccCount * 1.3) + (totalNl * matPrice);
        }
    }

    if (estimatedGold > 0) {
        if (stats.maxGold === 0 || estimatedGold > stats.maxGold) stats.maxGold = estimatedGold;
        if (stats.minGold === null || estimatedGold < stats.minGold) stats.minGold = estimatedGold;
        stats.totalGoldSum += estimatedGold;
    }

    saveTeamDashboardStats(teamId, stats);
    if (typeof renderTeamTimerWidgetUI === 'function') renderTeamTimerWidgetUI(teamId);
}

/* ==========================================================================
   KHỐI 3: QUẢN LÝ XÓA KỶ LỤC TEAM & DATABASE HỆ THỐNG
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function resetAllTeamsDatabaseRecords() {
    if (!confirm("⚠️ Bạn có chắc chắn muốn xóa TOÀN BỘ KỶ LỤC CỦA TẤT CẢ CÁC TEAM trong Database?")) return;

    if (typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
        systemDatabase.teams.forEach(t => {
            localStorage.removeItem(`APP_TEAM_STATS_${t.id}`);
        });
        systemDatabase.teamDashboards = {};
    }

    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();

    let modal = document.getElementById('team-dashboard-modal');
    if (modal) modal.remove();

    if (typeof showSystemToastNotification === 'function') {
        showSystemToastNotification("🗑️ Đã xóa sạch toàn bộ kỷ lục Database thành công!", "success");
    }
}

function resetTeamRecordStats(teamId, recordType) {
    let stats = getTeamDashboardStats(teamId);

    if (recordType === 'min') {
        stats.fastestTime = null;
        stats.fastestDate = null;
    } else if (recordType === 'max') {
        stats.slowestTime = null;
        stats.slowestDate = null;
    } else if (recordType === 'all') {
        stats.fastestTime = null;
        stats.fastestDate = null;
        stats.slowestTime = null;
        stats.slowestDate = null;
        stats.todayTime = null;
        stats.totalTimeSum = 0;
        stats.totalRunsCount = 0;
        stats.maxGold = 0;
        stats.minGold = null;
        stats.totalGoldSum = 0;
    }

    saveTeamDashboardStats(teamId, stats);
    if (typeof renderTeamTimerWidgetUI === 'function') renderTeamTimerWidgetUI(teamId);

    if (document.getElementById('team-dashboard-modal') && typeof openTeamDashboardModal === 'function') {
        openTeamDashboardModal(teamId);
    }
}

window.toggleTeamTimer = toggleTeamTimer;
window.resetTeamRecordStats = resetTeamRecordStats;
window.resetAllTeamsDatabaseRecords = resetAllTeamsDatabaseRecords;
window.getTeamDashboardStats = getTeamDashboardStats;
window.getAllTeamsGlobalRecords = getAllTeamsGlobalRecords;

// Tổng số dòng code trong file này: 215 dòng.