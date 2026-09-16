// Tên file: bang-doi-hinh-xep-dashboard.js
// Chức năng: Quản lý Modal Dashboard Phân Tích & Biểu Đồ Đường Sóng Line Chart - Khóa kích thước cố định.
// Con của file: bang-doi-hinh-xep.js

let isDashboardChartViewMode = false;

// 1. HÀM VẼ ĐỒ THỊ ĐƯỜNG LINE / SÓNG (LINE CHART)
function generateLineupWaveChartSVG(stats, globalRec) {
    let teamMin = stats.fastestTime || 0;
    let teamMax = stats.slowestTime || 0;
    let globalMin = (globalRec && globalRec.globalFastest) ? globalRec.globalFastest : 0;
    let todayTime = stats.todayTime || 0;

    let formatSecsShort = (sec) => {
        if (!sec || sec < 630) return "--:--";
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let validValues = [teamMin, teamMax, globalMin, todayTime].filter(v => v >= 630);
    let maxVal = validValues.length > 0 ? Math.max(...validValues) * 1.05 : 900;
    let minVal = validValues.length > 0 ? Math.min(...validValues) * 0.95 : 600;

    let getY = (val) => {
        if (!val || val < 630) return 135;
        let ratio = (val - minVal) / (maxVal - minVal || 1);
        return 130 - Math.round(ratio * 90);
    };

    let points = [
        { label: "Toàn Đội Min", x: 50, y: getY(globalMin), val: globalMin, color: "#f59e0b" },
        { label: "Team Min", x: 140, y: getY(teamMin), val: teamMin, color: "#10b981" },
        { label: "Vừa Đi", x: 230, y: getY(todayTime), val: todayTime, color: "#a855f7" },
        { label: "Team Max", x: 320, y: getY(teamMax), val: teamMax, color: "#f43f5e" }
    ];

    let polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    let dotsSVG = points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${p.color}" stroke="#ffffff" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 10}" font-size="10" font-weight="900" fill="${p.color}" text-anchor="middle">${formatSecsShort(p.val)}</text>
        <text x="${p.x}" y="155" font-size="9" font-weight="bold" fill="#9ca3af" text-anchor="middle">${p.label}</text>
    `).join('');

    return `
        <div class="bg-gray-955 p-3 rounded-xl border border-gray-800 flex flex-col justify-between h-[200px] relative">
            <div class="flex items-center justify-between text-[11px] font-bold border-b border-gray-800 pb-1">
                <span class="text-purple-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-chart-line"></i> Biểu Đồ Đường Sóng Kỷ Lục (Line Chart)
                </span>
                <span class="text-[10px] text-gray-500 font-mono">(Đỉnh cao hơn = Chạy nhanh hơn)</span>
            </div>

            <svg class="w-full h-[160px]" viewBox="0 0 370 170" xmlns="http://www.w3.org/2000/svg">
                <!-- Lưới ngang -->
                <line x1="20" y1="30" x2="350" y2="30" stroke="#374151" stroke-width="0.5" stroke-dasharray="3,3"/>
                <line x1="20" y1="65" x2="350" y2="65" stroke="#374151" stroke-width="0.5" stroke-dasharray="3,3"/>
                <line x1="20" y1="100" x2="350" y2="100" stroke="#374151" stroke-width="0.5" stroke-dasharray="3,3"/>
                <line x1="20" y1="138" x2="350" y2="138" stroke="#4b5563" stroke-width="1"/>

                <!-- Đường line sóng liên kết -->
                <polyline fill="none" stroke="#6366f1" stroke-width="3" points="${polylinePoints}" stroke-linecap="round" stroke-linejoin="round" />

                <!-- 4 Điểm chốt mốc -->
                ${dotsSVG}
            </svg>
        </div>
    `;
}

// 2. MODAL DASHBOARD KHÓA CỨNG KÍCH THƯỚC & ĐÓNG KHI CLICK NGOÀI
function openTeamDashboardModal(teamId) {
    let teamObj = (typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.find(t => t.id === teamId) : null;
    let teamName = teamObj ? teamObj.name.toUpperCase() : teamId;
    let stats = (typeof window.getTeamDashboardStats === 'function') ? window.getTeamDashboardStats(teamId) : ((typeof getTeamDashboardStats === 'function') ? getTeamDashboardStats(teamId) : {});
    let globalRec = (typeof window.getAllTeamsGlobalRecords === 'function') ? window.getAllTeamsGlobalRecords() : ((typeof getAllTeamsGlobalRecords === 'function') ? getAllTeamsGlobalRecords() : {});

    let formatSecs = (sec) => {
        if (!sec || sec < 630) return "--";
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        return `${m} phút ${s} giây`;
    };

    let avgTime = (stats.totalRunsCount > 0 && stats.totalTimeSum >= 630) ? Math.round(stats.totalTimeSum / stats.totalRunsCount) : null;
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
    
    // TỰ ĐỘNG TẮT KHI BẤM RA NGOÀI KHUNG (OUTSIDE CLICK)
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
    modal.className = "fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-3 font-sans select-none";

    let mainContentHtml = "";

    if (isDashboardChartViewMode) {
        mainContentHtml = generateLineupWaveChartSVG(stats, globalRec);
    } else {
        mainContentHtml = `
            <div class="flex flex-col justify-between h-[200px]">
                <div class="grid grid-cols-3 gap-2 bg-gray-955 p-2.5 rounded-xl border border-gray-800 text-center">
                    <div>
                        <span class="block text-[10px] text-gray-400 font-bold">Nhanh Nhất (Min)</span>
                        <strong class="text-emerald-400 text-xs font-mono font-black block my-0.5">${formatSecs(stats.fastestTime)}</strong>
                        <span class="text-[9px] text-gray-500 block leading-tight">${stats.fastestDate ? `Lúc: ${stats.fastestDate}` : 'Chưa có'}</span>
                        <button onclick="if(typeof window.resetTeamRecordStats === 'function') window.resetTeamRecordStats('${teamId}', 'min');" class="text-rose-400 hover:text-rose-300 text-[10px] font-bold mt-1 inline-block" title="Xóa kỷ lục Min">&times; Xóa</button>
                    </div>
                    <div>
                        <span class="block text-[10px] text-gray-400 font-bold">Lâu Nhất (Max)</span>
                        <strong class="text-rose-400 text-xs font-mono font-black block my-0.5">${formatSecs(stats.slowestTime)}</strong>
                        <span class="text-[9px] text-gray-500 block leading-tight">${stats.slowestDate ? `Lúc: ${stats.slowestDate}` : 'Chưa có'}</span>
                        <button onclick="if(typeof window.resetTeamRecordStats === 'function') window.resetTeamRecordStats('${teamId}', 'max')" class="text-rose-400 hover:text-rose-300 text-[10px] font-bold mt-1 inline-block" title="Xóa kỷ lục Max">&times; Xóa</button>
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

    // KHÓA CỨNG WIDTH: 520PX VÀ HEIGHT: 560PX CỐ ĐỊNH 100%
    modal.innerHTML = `
        <div onclick="event.stopPropagation()" style="width: 520px; height: 560px; min-height: 560px; max-height: 560px;" class="bg-gray-900 border-2 border-purple-500 rounded-2xl p-4 shadow-2xl text-xs flex flex-col justify-between relative overflow-hidden">
            <div class="flex flex-col gap-2.5">
                <div class="flex items-center justify-between border-b border-gray-800 pb-2 shrink-0">
                    <span class="text-purple-400 font-black text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <i class="fa-solid fa-chart-line text-purple-400"></i> Bảng Phân Tích: ${teamName}
                    </span>
                    
                    <div class="flex items-center gap-2">
                        <button onclick="isDashboardChartViewMode = !isDashboardChartViewMode; window.openTeamDashboardModal('${teamId}');" class="bg-gray-800 hover:bg-gray-700 text-amber-400 border border-amber-500/50 px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer">
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
                <button onclick="if(typeof window.resetAllTeamsDatabaseRecords === 'function') window.resetAllTeamsDatabaseRecords();" class="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-600/60 px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow">
                    <i class="fa-solid fa-triangle-exclamation text-rose-400"></i> Reset Toàn Bộ DB
                </button>
                
                <div class="flex items-center gap-2">
                    <button onclick="if(confirm('Reset kỷ lục riêng team này?') && typeof window.resetTeamRecordStats === 'function') window.resetTeamRecordStats('${teamId}', 'all');" class="text-gray-400 hover:text-rose-400 text-[11px] font-bold transition cursor-pointer">
                        Reset Team Này
                    </button>
                    <button onclick="document.getElementById('team-dashboard-modal').remove()" class="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-1.5 rounded-lg border border-gray-700 transition cursor-pointer">Đóng</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// XUẤT HÀM TOÀN CỤC
window.openTeamDashboardModal = openTeamDashboardModal;
window.generateLineupWaveChartSVG = generateLineupWaveChartSVG;