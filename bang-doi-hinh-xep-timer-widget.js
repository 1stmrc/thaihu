// Tên file: bang-doi-hinh-xep-timer-widget.js
// Chức năng: Module tạo HTML Widget bấm giờ dưới đáy bảng đội hình xếp (kèm hiển thị lời/lỗ vàng/VNĐ thực tế của team và cụm nút Thống Kê + Tính Lời Lỗ).
// Con của file: bang-doi-hinh-xep.js
// Danh sách tính năng của file:
//   1. Khởi tạo nút Bắt Đầu / Dừng Bấm Giờ cho từng đội hình xếp.
//   2. Hiển thị thông số kỷ lục thời gian (Nhanh nhất, Chậm nhất, Kỷ Lục Nhanh Nhất toàn đội, Vừa đi).
//   3. Tính toán và hiển thị trực tiếp con số Lời/Lỗ (Vàng & VNĐ) theo tiến độ thực tế của team.
//   4. Cụm nút kép bên phải gồm nút [Thống Kê] và nút [Tính Lời Lỗ] ở dưới.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: TẠO KHUNG HTML WIDGET BẤM GIỜ & LỜI LỖ DƯỚI ĐÁY BẢNG ĐỘI HÌNH
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function buildTimerWidgetHTMLInline(teamId) {
    let timerData = window.activeTeamRunningTimers ? window.activeTeamRunningTimers[teamId] : null;
    let isRunning = !!timerData;
    let stats = (typeof getTeamDashboardStats === 'function') ? getTeamDashboardStats(teamId) : { fastestTime: null, slowestTime: null, todayTime: null };
    let globalRec = (typeof getAllTeamsGlobalRecords === 'function') ? getAllTeamsGlobalRecords() : { globalFastest: null, globalSlowest: null };

    let formatSecs = (sec) => {
        if (sec === null || sec === undefined || sec < 630) return "--:--";
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let playBtnHtml = isRunning ? `
        <button type="button" onclick="toggleTeamTimer('${teamId}')" class="bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2.5 rounded-xl transition shadow text-xs flex items-center gap-1.5 cursor-pointer animate-pulse shrink-0">
            <i class="fa-solid fa-stop"></i> Dừng: <span id="timer-display-label-${teamId}" class="ml-1 font-mono text-amber-300">00:00</span>
        </button>
    ` : `
        <button type="button" onclick="toggleTeamTimer('${teamId}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-xl transition shadow text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
            <i class="fa-solid fa-play"></i> Bắt Đầu Bấm Giờ
        </button>
    `;

    let compareText = "";
    if (stats.todayTime && stats.fastestTime && stats.todayTime >= 630) {
        if (stats.todayTime <= stats.fastestTime) {
            compareText = `<span class="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black px-1.5 py-0.5 rounded font-mono">⚡ Kỷ lục mới!</span>`;
        } else {
            let diff = stats.todayTime - stats.fastestTime;
            compareText = `<span class="bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded font-mono">+${diff}s so với Min</span>`;
        }
    }

    // TÍNH TOÁN LỜI LỖ NHANH CHO TEAM NÀY DỰA TRÊN TIẾN ĐỘ THỰC TẾ
    let quickProfitGold = 0;
    let quickProfitVND = 0;
    if (typeof calculateTeamRealtimeProfitLossData === 'function') {
        let pData = calculateTeamRealtimeProfitLossData(teamId);
        quickProfitGold = pData.profitGold;
        quickProfitVND = pData.profitVND;
    }

    let profitColor = quickProfitGold >= 0 ? "text-emerald-400" : "text-rose-400";
    let profitSign = quickProfitGold >= 0 ? "+" : "";

    return `
        <div class="w-full bg-gray-955/95 border border-purple-500/50 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-2xl select-none">
            <!-- CỘT 1: NÚT BẤM GIỜ -->
            <div class="shrink-0">
                ${playBtnHtml}
            </div>

            <!-- CỘT 2: KHỐI KỶ LỤC THỜI GIAN & CHỈ SỐ LỜI LỖ TEAM -->
            <div class="flex-1 flex flex-col justify-center gap-1.5 text-xs text-gray-300 font-mono px-2 overflow-hidden">
                <div class="flex items-center gap-3 flex-wrap">
                    <span class="flex items-center gap-1">
                        <i class="fa-solid fa-users text-purple-400"></i> Nhanh nhất: 
                        <strong class="text-emerald-400 font-bold">${formatSecs(stats.fastestTime)}</strong>
                        <button onclick="resetTeamRecordStats('${teamId}', 'min')" class="text-gray-500 hover:text-rose-400 text-[10px] ml-0.5" title="Xóa kỷ lục Min">&times;</button>
                    </span>
                    <span class="text-gray-600">|</span>
                    <span class="flex items-center gap-1">
                        Chậm nhất: 
                        <strong class="text-rose-400 font-bold">${formatSecs(stats.slowestTime)}</strong>
                        <button onclick="resetTeamRecordStats('${teamId}', 'max')" class="text-gray-500 hover:text-rose-400 text-[10px] ml-0.5" title="Xóa kỷ lục Max">&times;</button>
                    </span>
                    <span class="text-gray-600">|</span>
                    <span class="flex items-center gap-1 text-gray-200">
                        Lời/Lỗ Team: 
                        <strong class="${profitColor} font-black">${profitSign}${quickProfitGold.toFixed(1)}v</strong>
                        <span class="text-[11px] text-gray-400 font-normal">(${profitSign}${quickProfitVND.toLocaleString('vi-VN')} đ)</span>
                    </span>
                </div>

                <div class="flex items-center gap-2 flex-wrap text-[11px]">
                    <span class="text-amber-400 font-bold flex items-center gap-1">
                        <i class="fa-solid fa-trophy text-amber-400"></i> Kỷ Lục Nhanh Nhất: <strong>${formatSecs(globalRec.globalFastest)}</strong>
                    </span>
                    <span class="text-gray-400 ml-2">Vừa đi: <strong class="text-cyan-400 font-bold">${formatSecs(stats.todayTime)}</strong></span>
                    ${compareText}
                </div>
            </div>

            <!-- CỘT 3: CỤM NÚT KÉP [THỐNG KÊ] & [TÍNH LỜI LỖ] -->
            <div class="flex flex-col gap-1.5 shrink-0">
                <button type="button" onclick="openTeamDashboardModal('${teamId}')" class="bg-purple-900/90 hover:bg-purple-700 text-purple-200 font-black px-3.5 py-1.5 rounded-lg border border-purple-500/40 text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow">
                    <i class="fa-solid fa-chart-line"></i> Thống Kê
                </button>
                <button type="button" onclick="if(typeof openThaihuProfitLossModal==='function') openThaihuProfitLossModal('${teamId}')" class="bg-cyan-800 hover:bg-cyan-600 text-cyan-200 font-black px-3.5 py-1 rounded-lg border border-cyan-500/40 text-[11px] transition cursor-pointer flex items-center justify-center gap-1 shadow">
                    <i class="fa-solid fa-calculator text-amber-400"></i> Tính Lời Lỗ
                </button>
            </div>
        </div>
    `;
}

window.buildTimerWidgetHTMLInline = buildTimerWidgetHTMLInline;

// Tổng số dòng code trong file này: 104 dòng.