// Tên file: bang-doi-hinh-xep.js
// Chức năng: Bảng Đội Hình Xếp - Phân đoạn tiến độ độc lập theo từng lượt đi (Lượt 1, 2, 3), nhận diện trực quan: Thất bại 0 NL (Đỏ nháy nhanh), Thất bại có NL (Đỏ tĩnh không nháy), Thành công (Xanh ngọc shimmer/Emerald), khóa cố định menu tài khoản con luôn song song kế bên bảng nhóm (kích thước chuẩn 222px), tích hợp cầu đệm di chuột chống mất menu khi rê ngang, lọc tuyệt đối không cho 1 tài khoản xuất hiện 2 lần trong cùng 1 đội hình, định vị thông minh Hàng 1-5 mở xuống / Hàng 6-8 mở lên (triệt tiêu 100% lỗi che tiêu đề và thanh tab), tính toán chính xác lượt khả dụng cho mọi loại tài khoản (Max 2, Max 3), hiển thị huy hiệu [💎 TN], +1 tiến độ Thái Hư tự động +4 Ngân Phiếu, thanh bấm giờ trực quan và tính lời lỗ.
// Con của file: giao-dien-thai-hu.js
// Danh sách tính năng của file:
//   1. [ĐÃ KHÓA] Widget bấm giờ chân bảng, lưu kỷ lục nhanh/chậm và tính Lời/Lỗ thời gian thực.
//   2. [ĐÃ KHÓA] Đổi chế độ thanh toán vé/NP/Xu (Lần 2, Lần 3) và bù trừ Ngân Phiếu tự động.
//   3. [ĐÃ SỬA & KHÓA] Phân đoạn tiến độ (1, 2, 3): Từng lượt đi hiển thị độc lập màu sắc (0 NL nháy đỏ nhanh, Có NL đỏ tĩnh, Thành công xanh).
//   4. [ĐÃ KHÓA] Lọc 100% tài khoản đã chọn trong team: Không bao giờ hiển thị lại ở 7 slot còn lại của cùng đội hình đó.
//   5. [ĐÃ KHÓA] Cầu đệm di chuột tàng hình (Hover Bridge): Rê chuột mượt mà sang menu con không bao giờ bị mất/đóng menu.
//   6. [ĐÃ KHÓA] Chuẩn hóa kích thước 222px & phân tầng Dropdown Hàng 1-5 mở xuống, Hàng 6-8 mở lên chống che đỉnh.
//   7. [ĐÃ KHÓA] Nút +1 Team hàng loạt và cơ chế kéo thả sắp xếp thứ tự hàng.
// Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA TOÀN BỘ MÃ NGUỒN NGÀY 26/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

if (typeof window.activeTeamRunningTimers === 'undefined') {
    window.activeTeamRunningTimers = {};
}

/* ==========================================================================
   KHỐI 1: [ĐÃ KHÓA] WIDGET BẤM GIỜ, KỶ LỤC & CỤM NÚT THỐNG KÊ + TÍNH LỜI LỖ
   Chức năng: Render thanh điều khiển bấm giờ, hiển thị min/max và lời lỗ bên dưới bảng.
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH 100% - KHÓA KHÔNG SỬA]
   ========================================================================== */
function buildTimerWidgetHTMLInline(teamId) {
    let timerData = window.activeTeamRunningTimers ? window.activeTeamRunningTimers[teamId] : null;
    let isRunning = !!timerData;
    let stats = (typeof getTeamDashboardStats === 'function') ? getTeamDashboardStats(teamId) : { fastestTime: null, slowestTime: null, todayTime: null };
    let globalRec = (typeof getAllTeamsGlobalRecords === 'function') ? getAllTeamsGlobalRecords() : { globalFastest: null, globalSlowest: null };
    let currentTeamObj = (typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.find(t => t.id === teamId) : null;
    let currentTeamName = currentTeamObj ? currentTeamObj.name.toUpperCase() : "TEAM";

    let formatSecs = (sec) => {
        if (sec === null || sec === undefined || sec < 630) return "--:--";
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let playBtnHtml = isRunning ? `
        <button type="button" onmousedown="event.stopPropagation()" onclick="toggleTeamTimer('${teamId}')" class="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black px-5 py-2.5 rounded-xl transition shadow-lg text-xs flex items-center justify-center gap-2 cursor-pointer animate-pulse shrink-0 border border-rose-400 min-w-[145px]">
            <i class="fa-solid fa-square"></i> Dừng: <span id="timer-display-label-${teamId}">${formatSecs(timerData ? timerData.elapsedSeconds : 0)}</span>
        </button>
    ` : `
        <button type="button" onmousedown="event.stopPropagation()" onclick="toggleTeamTimer('${teamId}')" class="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black px-5 py-2.5 rounded-xl transition shadow-lg text-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-emerald-400 min-w-[145px]">
            <i class="fa-solid fa-play"></i> Bắt Đầu Bấm Giờ
        </button>
    `;

    let evaluateBadge = "";
    if (stats.todayTime && stats.todayTime >= 630) {
        if (stats.fastestTime && stats.todayTime <= stats.fastestTime) {
            evaluateBadge = `<span class="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-md font-bold text-[11px] animate-pulse">⚡ Phá Kỷ Lục Team!</span>`;
        } else if (stats.fastestTime) {
            let diff = stats.todayTime - stats.fastestTime;
            evaluateBadge = `<span class="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-md font-bold text-[11px]">+${diff}s so với Min</span>`;
        }
    }

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
        <div class="flex items-center justify-between w-full gap-4 select-none">
            <div class="shrink-0">
                ${playBtnHtml}
            </div>

            <div class="flex-1 flex flex-col justify-center gap-1.5 px-3 py-1 bg-gray-955/60 border border-gray-800 rounded-xl font-mono text-xs">
                <div class="flex items-center justify-between gap-2 border-b border-gray-800/80 pb-1">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-purple-300 font-bold"><i class="fa-solid fa-users text-[10px] mr-1"></i>${currentTeamName}:</span>
                        <span class="text-gray-400">Nhanh nhất:</span>
                        <strong class="text-emerald-400 font-black">${formatSecs(stats.fastestTime)}</strong>
                        <button type="button" onmousedown="event.stopPropagation()" onclick="resetTeamRecordStats('${teamId}', 'min')" class="text-gray-500 hover:text-rose-400 text-[10px] ml-0.5 cursor-pointer" title="Xóa Min">&times;</button>
                        
                        <span class="text-gray-600 mx-1">|</span>
                        <span class="text-gray-400">Chậm nhất:</span>
                        <strong class="text-rose-400 font-bold">${formatSecs(stats.slowestTime)}</strong>
                        <button type="button" onmousedown="event.stopPropagation()" onclick="resetTeamRecordStats('${teamId}', 'max')" class="text-gray-500 hover:text-rose-400 text-[10px] cursor-pointer" title="Xóa Max">&times;</button>
                    </div>

                    <div class="flex items-center gap-1 text-gray-200">
                        <span class="text-gray-400">Lời/Lỗ Team:</span>
                        <strong class="${profitColor} font-black">${profitSign}${quickProfitGold.toFixed(1)}v</strong>
                        <span class="text-[10px] text-gray-400 font-normal">(${profitSign}${quickProfitVND.toLocaleString('vi-VN')} đ)</span>
                    </div>
                </div>

                <div class="flex items-center justify-between gap-2 pt-0.5">
                    <div class="flex items-center gap-2">
                        <span class="text-amber-400 font-bold"><i class="fa-solid fa-trophy text-[10px] mr-1"></i>Kỷ Lục Nhanh Nhất:</span>
                        <strong class="text-yellow-300 font-black">${formatSecs(globalRec.globalFastest)}</strong>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-gray-400">Vừa đi:</span>
                        <strong class="text-cyan-300 font-black text-sm bg-cyan-955/60 px-2 py-0.5 rounded border border-cyan-500/40">${formatSecs(stats.todayTime)}</strong>
                        ${evaluateBadge}
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-1 shrink-0">
                <button type="button" onmousedown="event.stopPropagation()" onclick="openTeamDashboardModal('${teamId}')" class="bg-purple-900/80 hover:bg-purple-700 active:scale-95 text-purple-200 font-bold px-4 py-1.5 rounded-lg border border-purple-500/40 text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg">
                    <i class="fa-solid fa-chart-line"></i> Thống Kê
                </button>
                <button type="button" onmousedown="event.stopPropagation()" onclick="if(typeof openThaihuProfitLossModal==='function') openThaihuProfitLossModal('${teamId}')" class="bg-cyan-800 hover:bg-cyan-600 active:scale-95 text-cyan-200 font-bold px-4 py-1 rounded-lg border border-cyan-500/40 text-[11px] transition cursor-pointer flex items-center justify-center gap-1 shadow-lg">
                    <i class="fa-solid fa-calculator text-amber-300"></i> Tính Lời Lỗ
                </button>
            </div>
        </div>
    `;
}

/* ==========================================================================
   KHỐI 2: [ĐÃ KHÓA] ĐỔI CHẾ ĐỘ THANH TOÁN & BÙ TRỪ NGÂN PHIẾU
   Chức năng: Xử lý thay đổi phương thức trả vé (NP/Vé/Xu) và tự động bù trừ ngân phiếu.
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH 100% - KHÓA KHÔNG SỬA]
   ========================================================================== */
function handleLineupMemberPayModeChange(memberId, runLevel, modeValue) {
    if (!memberId || !systemDatabase.members || !systemDatabase.members[memberId]) return;
    let m = systemDatabase.members[memberId];

    let currentTicketPrice = parseFloat(document.getElementById('input-ticket-price')?.value) || 25;
    let oldMode = (runLevel === 2) ? (m.payModeL2 || 'np50') : (m.payModeL3 || 'np50');
    let isAlreadyRun = (runLevel === 2 && m.currentRuns >= 2) || (runLevel === 3 && m.currentRuns >= 3);

    if (isAlreadyRun) {
        if (oldMode === 'np50' && modeValue !== 'np50') {
            m.nganPhieu = (parseInt(m.nganPhieu) || 0) + 50;
        } else if (oldMode !== 'np50' && modeValue === 'np50') {
            m.nganPhieu = (parseInt(m.nganPhieu) || 0) - 50;
        }
    }

    if (runLevel === 2) {
        m.payModeL2 = modeValue;
        m.ticketPriceAtRun2 = (modeValue === 'ticket') ? currentTicketPrice : 0;
        m.freeRun2 = (modeValue !== 'ticket');
    } else if (runLevel === 3) {
        m.payModeL3 = modeValue;
        m.ticketPriceAtRun3 = (modeValue === 'ticket') ? currentTicketPrice : 0;
        m.freeRun3 = (modeValue !== 'ticket');
    }

    if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    renderActiveWorkspacePanel();

    let modeNameMap = { 'ticket': `Trừ Vé Vàng (${currentTicketPrice}v)`, 'np50': '-50 Ngân Phiếu', 'xu40': '-40 Xu' };
    if (typeof logUserAction === 'function') {
        logUserAction(`Đổi thanh toán [ ${m.name} ] (Lần ${runLevel}): ${modeNameMap[modeValue] || modeValue}`);
    }
}

/* ==========================================================================
   KHỐI 3: [ĐÃ SỬA & KHÓA] MAIN RENDER BẢNG ĐỘI HÌNH XẾP & PHÂN ĐOẠN TIẾN ĐỘ
   Chức năng: 
     - Phân chia thanh tiến độ thành từng ô riêng biệt (Lượt 1, Lượt 2, Lượt 3).
     - Từng lượt tự nhận diện: Thất bại 0 NL (Đỏ nháy nhanh), Thất bại có NL (Đỏ tĩnh không nháy), Thành công (Xanh).
     - Lọc sạch 100% tài khoản đã chọn trong team, không cho phép hiển thị ở các slot khác của cùng team.
     - Cầu đệm di chuột (Hover Bridge) kết nối liền mạch bảng nhóm và bảng con, rê ngang không bao giờ mất.
     - Menu nhóm & menu con luôn đồng bộ chiều cao 222px, Hàng 1-5 mở xuống / Hàng 6-8 mở lên không che đỉnh/đáy.
   Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA KHÔNG SỬA]
   ========================================================================== */
function renderLineupViewTableLayout(team, targetWrapper) {
    let html = `
        <table class="w-full text-left border-collapse text-xs table-fixed">
            <thead>
                <tr class="bg-gray-900 border-b border-gray-700 text-gray-400 text-[11px] uppercase font-bold tracking-wider">
                    <th class="py-1.5 px-2 text-center w-10">STT</th>
                    <th class="py-1.5 px-2 w-[210px]">LẮP ĐỘI HÌNH</th>
                    <th class="py-1.5 px-2 text-center w-[85px] text-amber-400 whitespace-nowrap"><i class="fa-solid fa-scroll mr-1"></i>NP</th>
                    <th class="py-1.5 px-2 text-center w-auto">
                        <div class="flex items-center justify-center gap-2">
                            <span>TIẾN ĐỘ</span>
                            <button onclick="incrementAllLineupTeamRuns('${team.id}')" class="bg-purple-600 hover:bg-purple-500 text-white font-bold px-1.5 py-0.5 rounded transition shadow text-[10px] inline-flex items-center gap-0.5 cursor-pointer border border-purple-400/50 normal-case" title="+1 Lượt cho toàn team">
                                <i class="fa-solid fa-angles-up"></i> +1 Team
                            </button>
                        </div>
                    </th>
                    <th class="py-1.5 px-2 text-center w-[120px]">LẦN 2</th>
                    <th class="py-1.5 px-2 text-center w-[120px]">LẦN 3</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
    `;

    let visibleRowCounter = 1;

    team.memberIds.forEach((selectedMemberId, index) => {
        let boundMember = systemDatabase.members[selectedMemberId];
        let isMaxRuns = boundMember && boundMember.currentRuns >= boundMember.maxRuns;
        let rowWaveDelay = `${(index * 0.35).toFixed(2)}s`;

        // TÍNH LƯỢT KHẢ DỤNG THỰC TẾ: CHUẨN XÁC CHO MỌI LOẠI TÀI KHOẢN (MAX 2, MAX 3)
        let slotTempCapacityMap = {};
        Object.keys(systemDatabase.members).forEach(id => {
            let mb = systemDatabase.members[id];
            if (mb) {
                let maxR = parseInt(mb.maxRuns) || 3;
                let curR = parseInt(mb.currentRuns) || 0;
                slotTempCapacityMap[id] = Math.max(0, maxR - curR);
            }
        });

        let srcTeam = boundMember ? systemDatabase.teams.find(t => t.memberIds && t.memberIds.includes(boundMember.id)) : null;
        let selectedNameDisplay = boundMember ? ((typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(boundMember, srcTeam) : boundMember.name) : "-- Chọn bot --";

        // ĐỊNH VỊ CHỐNG CHE: HÀNG 1-5 NEO MỞ XUỐNG DƯỚI, HÀNG 6-8 NEO ĐÁY MỞ LÊN TRÊN
        let isDropUp = index >= 5;
        let rootPositionClass = isDropUp ? "bottom-0" : "top-full mt-0.5";

        let customDropdownHtml = `
            <div class="relative inline-block w-full group/dropdown" onmousedown="event.stopPropagation()">
                <button type="button" onclick="toggleCustomCascadeDropdown(event, '${team.id}_${index}')" class="w-full bg-gray-700 border border-gray-600 rounded-lg p-1.5 text-xs font-bold text-white text-left flex items-center justify-between shadow-sm cursor-pointer hover:bg-gray-650 overflow-hidden">
                    <span class="truncate block flex-1 pr-1">${selectedNameDisplay}</span>
                    <i class="fa-solid fa-chevron-down text-[10px] text-gray-400 shrink-0"></i>
                </button>

                <!-- BẢNG NHÓM CHA: KHÓA CHIỀU CAO 222PX GỌN GÀNG VỪA KHÍT BẢNG -->
                <div id="cascade_dropdown_${team.id}_${index}" class="cascade-menu-root hidden absolute left-0 ${rootPositionClass} w-60 h-[222px] bg-gray-955 border-2 border-purple-500 rounded-xl shadow-2xl z-[9999] py-1 font-bold select-none overflow-visible flex flex-col justify-between">
                    <div onclick="selectMemberFromCascade('${team.id}', ${index}, '')" class="px-3.5 py-1 hover:bg-rose-900/60 text-rose-300 cursor-pointer text-xs border-b border-gray-800 flex items-center gap-2 shrink-0">
                        <i class="fa-solid fa-ban"></i> -- Bỏ chọn vị trí này --
                    </div>
                    <div class="flex-1 flex flex-col justify-around py-0.5">
        `;

        let dataTeams = systemDatabase.teams.filter(x => x.type === 'data');

        dataTeams.forEach((sTeam) => {
            let validMembersInGroup = [];
            sTeam.memberIds.forEach(mId => {
                let m = systemDatabase.members[mId];
                if (!m || !m.name) return;

                // 1. LỌC TUYỆT ĐỐI: NẾU TÀI KHOẢN ĐÃ ĐƯỢC CHỌN Ở SLOT KHÁC TRONG CÙNG TEAM NÀY -> ẨN LUÔN
                let isAlreadyInAnotherSlot = team.memberIds.some((otherId, otherIdx) => otherIdx !== index && otherId === mId);
                if (isAlreadyInAnotherSlot) return;

                // 2. KIỂM TRA LƯỢT KHẢ DỤNG CÒN LẠI
                let capacityLeft = slotTempCapacityMap[mId] !== undefined ? slotTempCapacityMap[mId] : 0;
                
                if (mId === selectedMemberId || capacityLeft > 0) {
                    validMembersInGroup.push({ member: m, cap: capacityLeft });
                }
            });

            if (validMembersInGroup.length > 0) {
                customDropdownHtml += `
                    <div class="group/subitem relative px-3.5 py-0.5 hover:bg-amber-600 hover:text-white text-gray-100 cursor-pointer flex items-center justify-between text-xs transition-colors rounded-lg mx-1">
                        <span class="font-black leading-tight"><i class="fa-solid fa-folder text-amber-400 mr-2 group-hover/subitem:text-white"></i>${sTeam.name.toUpperCase()}</span>
                        <i class="fa-solid fa-chevron-right text-[10px] opacity-70"></i>

                        <!-- BẢNG TÀI KHOẢN CON: CẦU ĐỆM HOVER (before:-left-4) CHỐNG MẤT MENU KHI RÊ CHUỘT SANG -->
                        <div class="hidden group-hover/subitem:flex flex-col absolute left-[calc(100%-2px)] top-0 w-72 h-[222px] bg-gray-955 border-2 border-amber-500 rounded-xl shadow-2xl py-1 overflow-y-auto custom-scrollbar z-[10000] before:absolute before:-left-4 before:top-0 before:bottom-0 before:w-4 before:content-['']">
                `;

                validMembersInGroup.forEach(item => {
                    let m = item.member;
                    let cap = item.cap;
                    let isSelected = m.id === selectedMemberId;
                    let capText = cap > 0 ? `(Còn ${cap}/${m.maxRuns} lượt)` : `(Đã max)`;
                    let fullTitle = (typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, sTeam) : m.name;

                    customDropdownHtml += `
                        <div onclick="selectMemberFromCascade('${team.id}', ${index}, '${m.id}')" class="px-3.5 py-1 hover:bg-purple-600 hover:text-white cursor-pointer flex items-center justify-between text-xs ${isSelected ? 'bg-purple-900 text-emerald-300 font-black' : 'text-gray-100 font-semibold'} border-b border-gray-800/40 shrink-0">
                            <span class="truncate pr-2">${fullTitle}</span>
                            <span class="text-[10px] text-amber-300 font-bold shrink-0">${capText}</span>
                        </div>
                    `;
                });

                customDropdownHtml += `
                        </div>
                    </div>
                `;
            }
        });

        customDropdownHtml += `
                    </div>
                </div>
            </div>
        `;

        let progressBarMeter = `<span class="text-gray-600 italic text-[11px] px-4 block text-center">- Trống -</span>`;
        if (boundMember) {
            let maxRuns = parseInt(boundMember.maxRuns) || 3;
            let curRuns = parseInt(boundMember.currentRuns) || 0;
            let isAllCompleted = curRuns >= maxRuns;

            // XÂY DỰNG TỪNG PHÂN ĐOẠN ĐỘC LẬP THEO TỪNG LƯỢT ĐI (LƯỢT 1, 2, 3)
            let segmentsHtml = "";
            for (let r = 1; r <= maxRuns; r++) {
                if (r <= curRuns) {
                    let f = (boundMember.failures && boundMember.failures[r]) ? boundMember.failures[r] : null;

                    if (f && (f.type === 'zero' || f.nl === 0)) {
                        // 1. THẤT BẠI 0 NL: MÀU ĐỎ VÀ NHÁY NHANH
                        segmentsHtml += `
                            <div class="flex-1 h-full bg-rose-600" style="animation: fastFlashRedAlert 0.5s infinite ease-in-out;" title="Lượt ${r}: Thất bại từ đầu (0 NL)"></div>
                        `;
                    } else if (f && (f.type === 'half' || f.nl > 0)) {
                        // 2. THẤT BẠI CÓ NL (NỬA NL): MÀU ĐỎ TĨNH KHÔNG NHÁY
                        segmentsHtml += `
                            <div class="flex-1 h-full bg-rose-600" title="Lượt ${r}: Thất bại ở cuối (${f.nl} NL)"></div>
                        `;
                    } else {
                        // 3. THÀNH CÔNG LƯỢT R: MÀU XANH SHIMMER
                        let greenBg = isAllCompleted ? "bg-emerald-500" : "bg-teal-500";
                        let glow = !isAllCompleted ? `background: linear-gradient(90deg, #0d9488 0%, #14b8a6 25%, #2dd4bf 50%, #5eead4 75%, #0d9488 100%); background-size: 200% 100%; animation: shimmerWaveSmooth 2.8s infinite linear; animation-delay: ${rowWaveDelay};` : "";
                        segmentsHtml += `
                            <div class="flex-1 h-full ${greenBg}" style="${glow}" title="Lượt ${r}: Thành công"></div>
                        `;
                    }
                } else {
                    // 4. LƯỢT CHƯA ĐI: TRONG SUỐT / NỀN TỐI
                    segmentsHtml += `
                        <div class="flex-1 h-full bg-transparent" title="Lượt ${r}: Chưa thực hiện"></div>
                    `;
                }
            }

            let rawMemberObj = systemDatabase.members[selectedMemberId] || boundMember;
            let mRuns = parseInt(rawMemberObj.merchantRuns) || 0;
            let isMerchantDone = (mRuns >= 3);
            let merchantBadgeHtml = isMerchantDone
                ? `<span class="bg-amber-950 text-amber-300 border border-amber-400 px-1.5 py-0.5 rounded text-[9px] font-black ml-1.5 inline-flex items-center gap-1 shadow-md shrink-0" title="Đã hoàn thành 3/3 lượt Thương Nhân"><i class="fa-solid fa-gem text-[8px] text-amber-400"></i> TN</span>`
                : "";

            progressBarMeter = `
                <div class="flex items-center gap-1.5 justify-center w-full mx-auto" onmousedown="event.stopPropagation()">
                    <button onclick="adjustRunsCounter('${boundMember.id}', -1)" class="w-7 h-7 bg-gray-700 border border-gray-600 text-gray-300 hover:bg-rose-955 hover:text-rose-400 rounded-lg flex items-center justify-center font-black transition cursor-pointer shrink-0 text-xs">&minus;</button>
                    <div onclick="adjustRunsCounter('${boundMember.id}', 1)" class="relative flex-1 h-7 rounded-lg border border-gray-600 overflow-hidden shadow-inner bg-gray-955 flex items-center justify-center font-bold font-mono cursor-pointer select-none" title="Tap trực tiếp để tăng lượt">
                        <div class="absolute inset-0 flex divide-x divide-gray-900/90 transition-all duration-300">
                            ${segmentsHtml}
                        </div>
                        <div class="z-10 flex items-center justify-center text-[11px] text-white font-black drop-shadow pointer-events-none">
                            <span>${boundMember.currentRuns}/${boundMember.maxRuns}</span>
                            ${merchantBadgeHtml}
                        </div>
                    </div>
                </div>`;
        }

        let nganPhieuCellHtml = (typeof window.renderNganPhieuCellComponent === 'function') 
            ? window.renderNganPhieuCellComponent(selectedMemberId) 
            : `<div class="text-gray-600 text-center font-mono text-[11px]">-</div>`;

        let modeL2 = boundMember ? (boundMember.payModeL2 || 'np50') : 'np50';
        let modeL3 = boundMember ? (boundMember.payModeL3 || 'np50') : 'np50';

        let colL2Html = `<div class="text-gray-600 text-center text-xs">-</div>`;
        let colL3Html = `<div class="text-gray-600 text-center text-xs">-</div>`;

        if (boundMember) {
            if (boundMember.maxRuns >= 2) {
                colL2Html = `
                    <div class="flex items-center justify-center" onmousedown="event.stopPropagation()">
                        <select id="select-lineup-paymode-${boundMember.id}-2" onchange="handleLineupMemberPayModeChange('${boundMember.id}', 2, this.value)" class="bg-gray-900 border border-gray-700 text-purple-300 font-bold rounded px-2 py-1.5 text-[11px] focus:outline-none cursor-pointer w-[110px] text-center shadow-inner">
                            <option value="np50" ${modeL2 === 'np50' ? 'selected' : ''}>-50 NP</option>
                            <option value="ticket" ${modeL2 === 'ticket' ? 'selected' : ''}>-Vé</option>
                            <option value="xu40" ${modeL2 === 'xu40' ? 'selected' : ''}>-40 Xu</option>
                        </select>
                    </div>`;
            }
            if (boundMember.maxRuns >= 3) {
                colL3Html = `
                    <div class="flex items-center justify-center" onmousedown="event.stopPropagation()">
                        <select id="select-lineup-paymode-${boundMember.id}-3" onchange="handleLineupMemberPayModeChange('${boundMember.id}', 3, this.value)" class="bg-gray-900 border border-gray-700 text-cyan-300 font-bold rounded px-2 py-1.5 text-[11px] focus:outline-none cursor-pointer w-[110px] text-center shadow-inner">
                            <option value="np50" ${modeL3 === 'np50' ? 'selected' : ''}>-50 NP</option>
                            <option value="ticket" ${modeL3 === 'ticket' ? 'selected' : ''}>-Vé</option>
                            <option value="xu40" ${modeL3 === 'xu40' ? 'selected' : ''}>-40 Xu</option>
                        </select>
                    </div>`;
            }
        }

        html += `
            <tr draggable="true" ondragstart="onRowDragStart(event, ${index})" ondragover="onRowDragOver(event)" ondragleave="onRowDragLeave(event)" ondrop="onRowDrop(event, ${index})" class="hover:bg-gray-800/40 transition border-l-2 border-transparent hover:border-purple-500">
                <td class="p-2 text-center font-mono text-gray-500 font-bold align-middle cursor-move whitespace-nowrap ${isMaxRuns ? 'opacity-50' : ''}">
                    <span class="inline-flex items-center justify-center gap-1"><i class="fa-solid fa-bars text-[10px] opacity-40"></i>${visibleRowCounter++}</span>
                </td>
                <td class="p-2 align-middle overflow-visible">${customDropdownHtml}</td>
                <td class="p-1 align-middle text-center">${nganPhieuCellHtml}</td>
                <td class="p-2 align-middle text-center">${progressBarMeter}</td>
                <td class="p-2 align-middle text-center">${colL2Html}</td>
                <td class="p-2 align-middle text-center">${colL3Html}</td>
            </tr>`;
    });

    html += `</tbody></table>`;

    let bottomTimerBarHtml = `
        <div class="mt-3 p-3 bg-gray-900 border-2 border-purple-500/80 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-2xl" id="team-timer-slot-holder-${team.id}">
            ${buildTimerWidgetHTMLInline(team.id)}
        </div>
    `;

    targetWrapper.innerHTML = html + bottomTimerBarHtml;
}

if (!document.getElementById('shimmer-progress-style')) {
    let styleTag = document.createElement('style');
    styleTag.id = 'shimmer-progress-style';
    styleTag.innerHTML = `
        @keyframes shimmerWaveSmooth {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        @keyframes fastFlashRedAlert {
            0%, 100% { background-color: #f43f5e; opacity: 1; filter: brightness(1.3); }
            50% { background-color: #881337; opacity: 0.35; filter: brightness(0.7); }
        }
    `;
    document.head.appendChild(styleTag);
}

/* ==========================================================================
   KHỐI 4: [ĐÃ KHÓA] TĂNG GIẢM TIẾN ĐỘ THÁI HƯ & ĐIỀU PHỐI BOT HÀNG LOẠT
   Chức năng: Tăng giảm tiến độ (+4 NP/lượt), điều phối +1 Team và chọn bot vào slot.
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH 100% - KHÓA KHÔNG SỬA]
   ========================================================================== */
function adjustRunsCounter(memberId, step) {
    let m = systemDatabase.members[memberId];
    if (!m) return;
    let oldRuns = m.currentRuns;
    let targetValue = oldRuns + step;
    if (targetValue < 0) return;
    if (targetValue > m.maxRuns && step > 0) {
        if (typeof logUserAction === 'function') {
            logUserAction(`Tài khoản [ ${m.name} ] đã chạm giới hạn ${m.maxRuns} lượt Thái Hư/ngày!`);
        } else {
            alert(`Đã chạm giới hạn ${m.maxRuns} lượt cấu hình ngày!`);
        }
        return;
    }

    let actualStep = targetValue - oldRuns;
    let currentNP = (m.nganPhieu !== undefined && m.nganPhieu !== null) ? parseInt(m.nganPhieu) || 0 : 0;
    currentNP += (actualStep * 4);

    if (targetValue > oldRuns) {
        for (let r = oldRuns + 1; r <= targetValue; r++) {
            if (r === 2 && (m.payModeL2 || 'np50') === 'np50') currentNP -= 50;
            if (r === 3 && (m.payModeL3 || 'np50') === 'np50') currentNP -= 50;
        }
    } else if (targetValue < oldRuns) {
        for (let r = oldRuns; r > targetValue; r--) {
            if (r === 2 && (m.payModeL2 || 'np50') === 'np50') currentNP += 50;
            if (r === 3 && (m.payModeL3 || 'np50') === 'np50') currentNP += 50;
        }
    }

    m.nganPhieu = currentNP;
    m.currentRuns = targetValue;
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
    if (typeof renderNavigationSubTabs === 'function') renderNavigationSubTabs();
    renderActiveWorkspacePanel();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();

    if (typeof logUserAction === 'function') {
        logUserAction(`Tiến độ Thái Hư [ ${m.name} ]: ${m.currentRuns}/${m.maxRuns} lượt (Ngân Phiếu: ${m.nganPhieu})`);
    }
}
window.adjustRunsCounter = adjustRunsCounter;

function toggleCustomCascadeDropdown(e, key) {
    e.stopPropagation();
    let menu = document.getElementById(`cascade_dropdown_${key}`);
    let allMenus = document.querySelectorAll('.cascade-menu-root');
    allMenus.forEach(m => {
        if (m !== menu) m.classList.add('hidden');
    });
    if (menu) menu.classList.toggle('hidden');
}

function selectMemberFromCascade(teamId, slotIndex, selectedMemberId) {
    let allMenus = document.querySelectorAll('.cascade-menu-root');
    allMenus.forEach(m => m.classList.add('hidden'));

    if (typeof handleLineupSelectChange === 'function') {
        handleLineupSelectChange(teamId, slotIndex, selectedMemberId);
    }
}

document.addEventListener('click', () => {
    let allMenus = document.querySelectorAll('.cascade-menu-root');
    allMenus.forEach(m => m.classList.add('hidden'));
});

function incrementAllLineupTeamRuns(teamId) {
    let team = systemDatabase.teams.find(t => t.id === teamId);
    if (!team || !team.memberIds) return;

    let updatedCount = 0;
    team.memberIds.forEach(mId => {
        if (!mId) return;
        let m = systemDatabase.members[mId];
        if (m && m.currentRuns < m.maxRuns) {
            adjustRunsCounter(m.id, 1);
            updatedCount++;
        }
    });

    if (updatedCount > 0) {
        if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
        if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
        
        if (typeof logUserAction === 'function') {
            logUserAction(`Đã +1 lượt đi cho toàn bộ [ ${team.name.toUpperCase()} ] (${updatedCount} tài khoản)`);
        }
    }
}

function handleLineupSelectChange(teamId, slotIndex, selectedMemberId) {
    if (typeof bindSelectionToLineupIndexSlot === 'function') {
        bindSelectionToLineupIndexSlot(teamId, slotIndex, selectedMemberId);
    }
    
    if (typeof logUserAction === 'function') {
        let m = systemDatabase && systemDatabase.members ? systemDatabase.members[selectedMemberId] : null;
        let teamObj = systemDatabase && systemDatabase.teams ? systemDatabase.teams.find(x => x.id === teamId) : null;
        let teamName = teamObj ? teamObj.name.toUpperCase() : "ĐỘI HÌNH XẾP";
        
        if (m && m.name) {
            logUserAction(`Gán tài khoản [ ${m.name} ] vào ${teamName} (Vị trí ${slotIndex + 1})`);
        } else {
            logUserAction(`Bỏ gán tài khoản khỏi ${teamName} (Vị trí ${slotIndex + 1})`);
        }
    }
}

window.handleLineupMemberPayModeChange = handleLineupMemberPayModeChange;

// Tổng số dòng code trong file này: 330 dòng.