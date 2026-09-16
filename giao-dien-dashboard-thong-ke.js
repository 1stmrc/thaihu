// Tên file: giao-dien-dashboard-thong-ke.js
// Chức năng: Điều phối giao diện thanh Widget timer chân bảng và Popup Modal Dashboard Thống Kê phân tích toàn diện từng team.
// Con của file: index.html (Nạp sau bieu-do-duong-song-ky-luc.js).
// Danh sách tính năng của file:
//   1. Render khung Widget chân bảng kèm bộ đếm thời gian, kỷ lục so sánh và cụm nút kép: [Thống Kê] + [Tính Lời Lỗ].
//   2. Render Popup Modal Dashboard phân tích chuyên sâu (danh sách thành viên, thời gian min/max/avg, vàng min/max/avg).
//   3. Hỗ trợ nút chuyển đổi linh hoạt giữa dạng Xem Số Thống Kê và Xem Biểu Đồ Đường Sóng SVG.
//   4. Tự động đóng Modal khi nhấn ra ngoài khu vực nền mờ hoặc bấm nút Đóng.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

let isDashboardChartViewMode = false;

/* ==========================================================================
   KHỐI 1: RENDER WIDGET CHÂN BẢNG (CÓ NÚT THỐNG KÊ & TÍNH LỜI LỖ)
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function buildTimerBottomBarHTML(teamId) {
    let isRunning = window.activeTeamRunningTimers && !!window.activeTeamRunningTimers[teamId];
    let stats = typeof getTeamDashboardStats === 'function' ? getTeamDashboardStats(teamId) : {};
    let globalRec = typeof getAllTeamsGlobalRecords === 'function' ? getAllTeamsGlobalRecords() : {};

    let formatSecsShort = (sec) => {
        if (!sec || sec < MIN_ALLOWED_FASTEST_SECONDS) return "--:--";
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let diffText = "";
    if (stats.todayTime && stats.fastestTime) {
        let diff = stats.todayTime - stats.fastestTime;
        if (diff > 0) diffText = `<span class="bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded font-mono">+${diff}s so với Min</span>`;
        else if (diff === 0) diffText = `<span class="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded font-mono">Bằng Kỷ Lục Min</span>`;
        else diffText = `<span class="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded font-mono animate-pulse">⚡ PHÁ KỶ LỤC (${diff}s)</span>`;
    }

    return `
        <div class="w-full bg-gray-955/90 border border-purple-500/40 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-xl">
            <!-- CỘT 1: NÚT BẤM GIỜ -->
            <button onclick="toggleTeamTimer('${teamId}')" class="${isRunning ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-black px-4 py-2.5 rounded-xl transition shadow text-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                <i class="fa-solid ${isRunning ? 'fa-stop' : 'fa-play'}"></i> 
                <span>${isRunning ? 'Dừng Bấm Giờ' : 'Bắt Đầu Bấm Giờ'}</span>
                <span id="timer-display-label-${teamId}" class="ml-1 font-mono font-black text-amber-300">${isRunning ? '00:00' : ''}</span>
            </button>

            <!-- CỘT 2: KHỐI THÔNG SỐ KỶ LỤC THỜI GIAN -->
            <div class="flex-1 flex flex-col justify-center gap-1 text-[11px] font-mono px-2 overflow-hidden">
                <div class="flex items-center gap-3 flex-wrap">
                    <span class="text-gray-300 flex items-center gap-1">
                        <i class="fa-solid fa-users text-purple-400"></i> Nhanh nhất: <strong class="text-emerald-400 font-bold">${formatSecsShort(stats.fastestTime)}</strong>
                    </span>
                    <span class="text-gray-500">|</span>
                    <span class="text-gray-300">Chậm nhất: <strong class="text-rose-400 font-bold">${formatSecsShort(stats.slowestTime)}</strong></span>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-amber-400 font-bold flex items-center gap-1">
                        <i class="fa-solid fa-trophy text-amber-400"></i> Kỷ Lục Nhanh Nhất: <strong>${formatSecsShort(globalRec.globalFastest)}</strong>
                    </span>
                    <span class="text-gray-400 ml-2">Vừa đi: <strong class="text-cyan-300 font-bold">${formatSecsShort(stats.todayTime)}</strong></span>
                    ${diffText}
                </div>
            </div>

            <!-- CỘT 3: CỤM NÚT THỐNG KÊ & TÍNH LỜI LỖ ĐỘI HÌNH -->
            <div class="flex flex-col gap-1 shrink-0">
                <button onclick="openTeamDashboardModal('${teamId}')" class="bg-purple-800 hover:bg-purple-700 text-white font-black px-3.5 py-1.5 rounded-lg transition shadow text-xs cursor-pointer flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-chart-line"></i> Thống Kê
                </button>
                <button onclick="if(typeof openThaihuProfitLossModal==='function') openThaihuProfitLossModal();" class="bg-cyan-700 hover:bg-cyan-600 text-white font-black px-3.5 py-1 rounded-lg transition shadow text-[11px] cursor-pointer flex items-center justify-center gap-1">
                    <i class="fa-solid fa-calculator text-amber-300"></i> Tính Lời Lỗ
                </button>
            </div>
        </div>
    `;
}

function renderTeamTimerWidgetUI(teamId) {
    let holder = document.getElementById(`team-timer-slot-holder-${teamId}`) || document.getElementById('lineup-bottom-timer-bar-container');
    if (holder) {
        holder.innerHTML = buildTimerBottomBarHTML(teamId);
    }
}

/* ==========================================================================
   KHỐI 2: POPUP MODAL DASHBOARD PHÂN TÍCH TEAM
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function openTeamDashboardModal(teamId) {
    let teamObj = (typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.find(t => t.id === teamId) : null;
    let teamName = teamObj ? teamObj.name.toUpperCase() : teamId;
    let stats = typeof getTeamDashboardStats === 'function' ? getTeamDashboardStats(teamId) : {};
    let globalRec = typeof getAllTeamsGlobalRecords === 'function' ? getAllTeamsGlobalRecords() : {};

    let formatSecs = (sec) => {
        if (sec === null || sec === undefined || sec < MIN_ALLOWED_FASTEST_SECONDS) return "--";
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        return `${m} phút ${s} giây`;
    };

    let avgTime = (stats.totalRunsCount > 0 && stats.totalTimeSum >= MIN_ALLOWED_FASTEST_SECONDS) ? Math.round(stats.totalTimeSum / stats.totalRunsCount) : null;
    let avgGold = stats.totalRunsCount > 0 ? (stats.totalGoldSum / stats.totalRunsCount).toFixed(2) : "0.00";

    let memberNamesHtml = "";
    if (teamObj && teamObj.memberIds) {
        memberNamesHtml = teamObj.memberIds.map((mId, idx) => {
            let m = (typeof systemDatabase !== 'undefined' && systemDatabase.members) ? systemDatabase.members[mId] : null;
            let srcTeam = m ? systemDatabase.teams.find(t => t.memberIds && t.memberIds.includes(m.id)) : null;
            let nameDisp = (m && typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, srcTeam) : (m ? m.name : "");
            return nameDisp ? `<span class="bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-[11px] font-bold text-gray-200">${idx + 1}. ${nameDisp}</span>` : "";
        }).filter(Boolean).join('');
    }

    let existingModal = document.getElementById('team-dashboard-modal');
    if (existingModal) existingModal.remove();

    let modal = document.createElement('div');
    modal.id = 'team-dashboard-modal';
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
    modal.className = "fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 font-sans select-none";

    let mainContentHtml = "";

    if (isDashboardChartViewMode && typeof generateLineupWaveChartSVG === 'function') {
        mainContentHtml = generateLineupWaveChartSVG(stats, globalRec);
    } else {
        mainContentHtml = `
            <div class="flex flex-col justify-between h-[200px]">
                <div class="grid grid-cols-3 gap-2 bg-gray-955 p-2.5 rounded-xl border border-gray-800 text-center">
                    <div>
                        <span class="block text-[10px] text-gray-400 font-bold">Nhanh Nhất (Min)</span>
                        <strong class="text-emerald-400 text-xs font-mono font-black block my-0.5">${formatSecs(stats.fastestTime)}</strong>
                        <span class="text-[9px] text-gray-500 block leading-tight">${stats.fastestDate ? `Lúc: ${stats.fastestDate}` : 'Chưa có'}</span>
                        <button onclick="resetTeamRecordStats('${teamId}', 'min')" class="text-rose-400 hover:text-rose-300 text-[10px] font-bold mt-1 inline-block" title="Xóa kỷ lục Min">&times; Xóa</button>
                    </div>
                    <div>
                        <span class="block text-[10px] text-gray-400 font-bold">Lâu Nhất (Max)</span>
                        <strong class="text-rose-400 text-xs font-mono font-black block my-0.5">${formatSecs(stats.slowestTime)}</strong>
                        <span class="text-[9px] text-gray-500 block leading-tight">${stats.slowestDate ? `Lúc: ${stats.slowestDate}` : 'Chưa có'}</span>
                        <button onclick="resetTeamRecordStats('${teamId}', 'max')" class="text-rose-400 hover:text-rose-300 text-[10px] font-bold mt-1 inline-block" title="Xóa kỷ lục Max">&times; Xóa</button>
                    </div>
                    <div>
                        <span class="block text-[10px] text-gray-400 font-bold">Trung Bình (Avg)</span>
                        <strong class="text-cyan-400 text-xs font-mono font-black block my-0.5">${formatSecs(avgTime)}</strong>
                        <span class="text-[9px] text-gray-500 block leading-tight">Trung bình tổng</span>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2 bg-gray-955 p-2.5 rounded-xl border border-gray-800 text-center">
                    <div>
                        <span class="block text-[10px] text-gray-400 font-bold">Vàng Nhiều Nhất</span>
                        <strong class="text-amber-400 text-xs font-mono font-black">+${(stats.maxGold || 0).toFixed(2)}v</strong>
                    </div>
                    <div>
                        <span class="block text-[10px] text-gray-400 font-bold">Vàng Ít Nhất</span>
                        <strong class="text-amber-400 text-xs font-mono font-black">+${(stats.minGold || 0).toFixed(2)}v</strong>
                    </div>
                    <div>
                        <span class="block text-[10px] text-gray-400 font-bold">Vàng Trung Bình</span>
                        <strong class="text-amber-400 text-xs font-mono font-black">+${avgGold}v</strong>
                    </div>
                </div>
            </div>
        `;
    }

    modal.innerHTML = `
        <div onclick="event.stopPropagation()" style="width: 520px; height: 560px; min-height: 560px; max-height: 560px;" class="bg-gray-900 border-2 border-purple-500 rounded-2xl p-4 shadow-2xl text-xs flex flex-col justify-between relative overflow-hidden">
            <div class="flex flex-col gap-2.5">
                <div class="flex items-center justify-between border-b border-gray-800 pb-2 shrink-0">
                    <span class="text-purple-400 font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-chart-line text-purple-400"></i> Bảng Phân Tích: ${teamName}
                    </span>
                    
                    <div class="flex items-center gap-2">
                        <button onclick="isDashboardChartViewMode = !isDashboardChartViewMode; openTeamDashboardModal('${teamId}');" class="bg-gray-800 hover:bg-gray-700 text-amber-400 border border-amber-500/50 px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer">
                            <i class="fa-solid ${isDashboardChartViewMode ? 'fa-table' : 'fa-chart-line'}"></i> ${isDashboardChartViewMode ? 'Xem Số Thống Kê' : 'Xem Biểu Đồ'}
                        </button>
                        <button onclick="document.getElementById('team-dashboard-modal').remove()" class="text-rose-500 hover:text-rose-400 font-bold text-lg cursor-pointer leading-none">&times;</button>
                    </div>
                </div>

                <div class="flex flex-col gap-1 shrink-0">
                    <span class="text-gray-400 font-bold">Thành viên đội hình (${teamObj ? teamObj.memberIds.filter(Boolean).length : 0} acc):</span>
                    <div class="flex flex-wrap gap-1.5 p-2 bg-gray-955 rounded-xl border border-gray-800 max-h-[85px] overflow-y-auto custom-scrollbar">
                        ${memberNamesHtml || '<span class="text-gray-500 italic">Chưa chọn thành viên</span>'}
                    </div>
                </div>

                <div class="h-[200px] shrink-0">
                    ${mainContentHtml}
                </div>

                <div class="flex flex-col gap-1 p-2 bg-gray-955 rounded-xl border border-gray-800 text-gray-300 font-bold shrink-0">
                    <div class="flex justify-between">
                        <span>Lần đi gần nhất:</span>
                        <strong class="text-purple-300">${stats.lastRunDate || 'Chưa có'}</strong>
                    </div>
                    <div class="flex justify-between">
                        <span>Thời gian vừa đi hôm nay:</span>
                        <strong class="text-emerald-400">${formatSecs(stats.todayTime)}</strong>
                    </div>
                </div>
            </div>

            <div class="flex justify-between items-center pt-2 border-t border-gray-800 shrink-0">
                <button onclick="resetAllTeamsDatabaseRecords()" class="bg-rose-955/80 hover:bg-rose-900 text-rose-300 border border-rose-600/60 px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow">
                    <i class="fa-solid fa-triangle-exclamation text-rose-400"></i> Reset Toàn Bộ DB
                </button>
                
                <div class="flex items-center gap-2">
                    <button onclick="if(confirm('Reset kỷ lục riêng team này?')) resetTeamRecordStats('${teamId}', 'all');" class="text-gray-400 hover:text-rose-400 text-[11px] font-bold transition cursor-pointer">
                        Reset Team Này
                    </button>
                    <button onclick="document.getElementById('team-dashboard-modal').remove()" class="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-1.5 rounded-lg border border-gray-700 transition cursor-pointer">Đóng</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

window.renderTeamTimerWidgetUI = renderTeamTimerWidgetUI;
window.openTeamDashboardModal = openTeamDashboardModal;
window.buildTimerBottomBarHTML = buildTimerBottomBarHTML;

// Tổng số dòng code trong file này: 188 dòng.