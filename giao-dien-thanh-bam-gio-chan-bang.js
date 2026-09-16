// Tên file: giao-dien-thanh-bam-gio-chan-bang.js
// Chức năng: Điều phối giao diện thanh bấm giờ ở chân bảng Đội hình xếp, hiển thị kỷ lục thời gian, con số lời/lỗ vàng/VNĐ thực tế của team và cụm nút Thống Kê + Tính Lời Lỗ.
// Con của file: index.html (Nạp cùng phân hệ Quản lý Đội hình Thái Hư).
// Danh sách tính năng của file:
//   1. Render nút Bắt Đầu / Dừng Bấm Giờ cho từng team.
//   2. Hiển thị kỷ lục thời gian (Nhanh nhất, Chậm nhất, Toàn đội Min, Vừa đi).
//   3. Tính toán và hiển thị nhanh số Vàng/VNĐ lời lỗ của chính team đó ngay trên thanh chân bảng.
//   4. Cụm nút kép gồm nút [Thống Kê] và nút [Tính Lời Lỗ] bên dưới.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: RENDER THANH BẤM GIỜ & THỐNG KÊ LỜI LỖ CHÂN BẢNG
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

    // TÍNH TOÁN LỜI LỖ NHANH CHO TEAM NÀY THEO TIẾN ĐỘ THỰC TẾ
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
        <div class="w-full bg-gray-955/90 border border-purple-500/40 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-xl select-none">
            <!-- CỘT 1: NÚT BẤM GIỜ -->
            <button onclick="toggleTeamTimer('${teamId}')" class="${isRunning ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-black px-4 py-2.5 rounded-xl transition shadow text-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                <i class="fa-solid ${isRunning ? 'fa-stop' : 'fa-play'}"></i> 
                <span>${isRunning ? 'Dừng Bấm Giờ' : 'Bắt Đầu Bấm Giờ'}</span>
                <span id="timer-display-label-${teamId}" class="ml-1 font-mono font-black text-amber-300">${isRunning ? '00:00' : ''}</span>
            </button>

            <!-- CỘT 2: KHỐI THÔNG SỐ KỶ LỤC THỜI GIAN & LỜI LỖ TEAM -->
            <div class="flex-1 flex flex-col justify-center gap-1 text-[11px] font-mono px-2 overflow-hidden">
                <div class="flex items-center gap-3 flex-wrap">
                    <span class="text-gray-300 flex items-center gap-1">
                        <i class="fa-solid fa-users text-purple-400"></i> Nhanh nhất: <strong class="text-emerald-400 font-bold">${formatSecsShort(stats.fastestTime)}</strong>
                    </span>
                    <span class="text-gray-500">|</span>
                    <span class="text-gray-300">Chậm nhất: <strong class="text-rose-400 font-bold">${formatSecsShort(stats.slowestTime)}</strong></span>
                    <span class="text-gray-500">|</span>
                    <span class="text-gray-300 flex items-center gap-1">
                        Lời/Lỗ Team: <strong class="${profitColor} font-black">${profitSign}${quickProfitGold.toFixed(1)}v</strong>
                        <span class="text-[10px] text-gray-400 font-normal">(${profitSign}${quickProfitVND.toLocaleString('vi-VN')} đ)</span>
                    </span>
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
                <button onclick="if(typeof openTeamDashboardModal==='function') openTeamDashboardModal('${teamId}')" class="bg-purple-800 hover:bg-purple-700 text-white font-black px-3.5 py-1.5 rounded-lg transition shadow text-xs cursor-pointer flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-chart-line"></i> Thống Kê
                </button>
                <button onclick="if(typeof openThaihuProfitLossModal==='function') openThaihuProfitLossModal('${teamId}')" class="bg-cyan-700 hover:bg-cyan-600 text-white font-black px-3.5 py-1 rounded-lg transition shadow text-[11px] cursor-pointer flex items-center justify-center gap-1">
                    <i class="fa-solid fa-calculator text-amber-300"></i> Tính Lời Lỗ
                </button>
            </div>
        </div>
    `;
}

function renderTeamTimerWidgetUI(teamId) {
    let holder = document.getElementById(`team-timer-slot-holder-${teamId}`) || 
                 document.getElementById('lineup-bottom-timer-bar-container') ||
                 document.querySelector('.lineup-timer-widget-container');
    if (holder) {
        holder.innerHTML = buildTimerBottomBarHTML(teamId);
    }
}

window.buildTimerBottomBarHTML = buildTimerBottomBarHTML;
window.renderTeamTimerWidgetUI = renderTeamTimerWidgetUI;

// Tổng số dòng code trong file này: 96 dòng.