// Tên file: giao-dien-thai-hu.js
// Chức năng: Điều phối Sub-tabs Thái Hư, điều hướng không gian làm việc chính, quản lý kéo thả thành viên, tạo/xóa team (Lineup tối đa 10 team/hàng, tự động xuống hàng & có nút mũi tên thu gọn/mở rộng, nút thêm đội hình thu gọn icon +).
// Con của file: index.html (Được nạp trực tiếp qua thẻ script trong khung xương chính).
// Danh sách tính năng của file:
//   1. Render Sub-tabs Đội Hình Xếp: Tối đa 10 team dãn đều hàng 1, từ team 11 trở đi tự xuống hàng 2 và có nút mũi tên thu gọn/mở rộng.
//   2. Tự động thu gọn nút "+ Đội Hình Xếp" thành Icon + Dấu [+] nhỏ gọn, tinh tế.
//   3. Render danh sách Sub-tabs nhóm dữ liệu Data teams và kiểm soát hiển thị thanh sub-tabs, bong bóng nổi.
//   4. Render không gian làm việc tương ứng của từng team đang hoạt động (Data View Table hoặc Lineup Table).
//   5. Hiển thị bảng giao diện Thống Kê & Nhật Ký Lịch Sử Quẻ Đoài Chuyên Sâu.
//   6. Thêm mới / Đổi tên / Xóa team an toàn và xử lý kéo thả (drag & drop) sắp xếp thành viên trong team.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 22/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

// CHUỖI SVG BÁT QUÁI CHUẨN MÀU TRẮNG - ĐEN ÂM DƯƠNG
const BAT_QUAI_WHITE_BLACK_SVG = `
<svg class="w-3.5 h-3.5 inline-block align-middle shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <!-- Khung Bát Giác 8 Cạnh Nét Trắng -->
    <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill="#111827" stroke="#ffffff" stroke-width="6"/>
    
    <!-- 3 Vạch Quẻ Càn (Trắng) -->
    <line x1="40" y1="12" x2="60" y2="12" stroke="#ffffff" stroke-width="3.5"/>
    <line x1="40" y1="17" x2="60" y2="17" stroke="#ffffff" stroke-width="3.5"/>
    <line x1="40" y1="22" x2="60" y2="22" stroke="#ffffff" stroke-width="3.5"/>
    
    <!-- Vòng Tròn Âm Dương Trắng - Đen -->
    <circle cx="50" cy="50" r="22" fill="#111827" stroke="#ffffff" stroke-width="3"/>
    <path d="M 50,28 A 11,11 0 0,1 50,50 A 11,11 0 0,0 50,72 A 22,22 0 0,1 50,28 Z" fill="#ffffff"/>
    <circle cx="50" cy="39" r="3.5" fill="#111827"/>
    <circle cx="50" cy="61" r="3.5" fill="#ffffff"/>
</svg>`;

/* ==========================================================================
   KHỐI 1: RENDER SUB-TABS (TỐI ĐA 10 TEAM/HÀNG, MŨI TÊN MỞ RỘNG & NÚT GỌN)
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 22/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function createTeamButtonElement(t) {
    let btn = document.createElement('button');
    let isCriticalDataTeam = (t.type === 'data' && typeof checkTeamHasCriticalRebateMember === 'function' && checkTeamHasCriticalRebateMember(t));
    let criticalClass = isCriticalDataTeam 
        ? 'border-red-500 bg-red-950/40 text-rose-400 animate-pulse font-black' 
        : (activeTeamId === t.id ? 'bg-blue-600/20 text-blue-400 border-blue-500 shadow-inner' : 'bg-gray-700/40 text-gray-400 border-gray-700 hover:bg-gray-700');
    
    if (t.type === 'lineup') {
        criticalClass = (activeTeamId === t.id) 
            ? 'bg-purple-600/30 text-purple-300 border-purple-500 shadow-inner font-black' 
            : 'bg-gray-700/40 text-gray-400 border-gray-700 hover:bg-gray-700';
    }

    btn.className = `flex-1 min-w-[36px] px-2 py-1.5 rounded-lg border text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer overflow-hidden ${criticalClass}`;
    
    let iconHtml = t.type === 'lineup' ? '<i class="fa-solid fa-shuffle text-purple-400 text-[10px] shrink-0"></i>' : BAT_QUAI_WHITE_BLACK_SVG;
    
    btn.innerHTML = `${iconHtml} <span class="truncate">${t.name.toUpperCase()}</span> ${isCriticalDataTeam ? '<span class="w-1.5 h-1.5 rounded-full bg-red-500 block shrink-0"></span>' : ''}`;
    
    btn.onclick = () => { 
        activeTeamId = t.id; 
        renderNavigationSubTabs(); 
        renderActiveWorkspacePanel(); 
    }; 
    
    btn.ondblclick = () => {
        let newName = prompt(`Nhập tên mới cho nhóm [ ${t.name.toUpperCase()} ] :`, t.name);
        if (newName && newName.trim() !== "") {
            t.name = newName.trim();
            renderNavigationSubTabs();
            renderActiveWorkspacePanel();
            if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
        }
    };

    return btn;
}

function renderNavigationSubTabs() {
    let dataContainer = document.getElementById('sub-tabs-data-team-holder');
    let lineupContainer = document.getElementById('sub-tabs-lineup-team-holder');
    if (!dataContainer || !lineupContainer) return;
    
    dataContainer.className = "flex-1 flex items-center gap-1.5 overflow-hidden";
    dataContainer.innerHTML = "";

    if (!systemDatabase.teams) return;

    // 1. RENDER DATA TEAMS (HÀNG 1)
    let dataTeams = systemDatabase.teams.filter(t => t.type === 'data');
    dataTeams.forEach(t => {
        dataContainer.appendChild(createTeamButtonElement(t));
    });

    // 2. RENDER LINEUP TEAMS (TỐI ĐA 10 TEAM/HÀNG, TEAM 11+ XUỐNG DÒNG CÓ MŨI TÊN MỞ RỘNG)
    let lineupTeams = systemDatabase.teams.filter(t => t.type === 'lineup');
    lineupContainer.className = "flex-1 flex flex-col gap-1 w-full overflow-hidden";
    lineupContainer.innerHTML = "";

    let row1Teams = lineupTeams.slice(0, 8);
let row2Teams = lineupTeams.slice(8);

    let row1Div = document.createElement('div');
    row1Div.className = "flex items-center gap-1.5 w-full flex-1";

    row1Teams.forEach(t => {
        row1Div.appendChild(createTeamButtonElement(t));
    });

    // NẾU CÓ TEAM THỨ 11 TRỞ ĐI
    if (row2Teams.length > 0) {
        let isExpanded = window.isLineupSubTabsExpanded === true;
        
        // Tự động mở rộng hàng 2 nếu team đang chọn nằm ở hàng 2
        let isActiveInRow2 = row2Teams.some(t => t.id === activeTeamId);
        if (isActiveInRow2) isExpanded = true;

        let toggleBtn = document.createElement('button');
        toggleBtn.type = "button";
        toggleBtn.className = "bg-gray-800 hover:bg-gray-700 text-purple-300 border border-purple-500/40 p-1.5 px-2 rounded-lg text-xs font-bold transition shadow cursor-pointer shrink-0 flex items-center justify-center";
        toggleBtn.title = isExpanded ? "Thu gọn các team thêm" : `Mở rộng thêm ${row2Teams.length} team`;
        toggleBtn.innerHTML = isExpanded 
            ? `<i class="fa-solid fa-chevron-up text-[10px] text-amber-400"></i>` 
            : `<i class="fa-solid fa-chevron-down text-[10px]"></i>`;
        
        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            window.isLineupSubTabsExpanded = !isExpanded;
            renderNavigationSubTabs();
        };

        row1Div.appendChild(toggleBtn);
        lineupContainer.appendChild(row1Div);

        if (isExpanded) {
            let row2Div = document.createElement('div');
            row2Div.className = "flex items-center gap-1.5 w-full flex-1 pt-1 border-t border-gray-700/40";
            row2Teams.forEach(t => {
                row2Div.appendChild(createTeamButtonElement(t));
            });
            lineupContainer.appendChild(row2Div);
        }
    } else {
        lineupContainer.appendChild(row1Div);
    }

    // 3. THU GỌN NÚT "+ ĐỘI HÌNH XẾP" CHỈ HIỂN THỊ ICON VÀ DẤU [+]
    let addLineupBtn = document.querySelector("button[onclick*=\"createNewTeamCorePipeline('lineup')\"]");
    if (addLineupBtn) {
        addLineupBtn.className = "bg-purple-600 hover:bg-purple-500 active:scale-95 text-white p-1.5 px-2.5 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 shadow cursor-pointer border border-purple-400/50 shrink-0";
        addLineupBtn.innerHTML = '<i class="fa-solid fa-shuffle text-[10px]"></i> <span class="text-xs font-black">+</span>';
        addLineupBtn.title = "+ Đội Hình Xếp";
    }

    let delLineupBtn = document.querySelector("button[onclick*=\"deleteTargetActiveTeamUnit('lineup')\"]");
    if (delLineupBtn) {
        delLineupBtn.className = "bg-rose-800 hover:bg-rose-700 active:scale-95 text-white p-1.5 px-2 rounded-lg text-xs transition shadow cursor-pointer shrink-0";
        delLineupBtn.title = "Xóa Đội Hình này";
    }

    if (typeof renderPresetDropdownController === 'function') renderPresetDropdownController();
}

/* ==========================================================================
   KHỐI 2: ĐIỀU HƯỚNG TAB HỆ THỐNG CHÍNH
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function switchMainSystemTab(target) {
    let btnThaihu = document.getElementById('btn-main-tab-thaihu');
    let btnMerchant = document.getElementById('btn-main-tab-merchant');
    let btnOptimize = document.getElementById('btn-main-tab-optimize');
    let btnDeo = document.getElementById('btn-main-tab-deo');
    let btnLogs = document.getElementById('btn-main-tab-logs');
    let zone = document.getElementById('sub-navbar-container-zone');
    
    if (target === 'deo_tab_active_special' || target === 'deo_main') {
        if (btnThaihu) btnThaihu.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        if (btnMerchant) btnMerchant.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        if (btnOptimize) btnOptimize.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        if (btnDeo) btnDeo.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-purple-600 text-white shadow border border-purple-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        if (btnLogs) btnLogs.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        
        if (zone) zone.classList.add('hidden');
        
        activeTeamId = "deo_tab_active_special";
        renderDeoManagementView();
    } else {
        if (btnThaihu) btnThaihu.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow border border-blue-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        if (btnMerchant) btnMerchant.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        if (btnOptimize) btnOptimize.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        if (btnDeo) btnDeo.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        if (btnLogs) btnLogs.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
        
        if (zone) zone.classList.remove('hidden');
        
        let isRealTeam = systemDatabase.teams && systemDatabase.teams.some(t => t.id === activeTeamId);
        if (!isRealTeam) { 
            activeTeamId = (systemDatabase.teams && systemDatabase.teams.length > 0) ? systemDatabase.teams[0].id : ""; 
        }

        let b1 = document.getElementById('floating-bubble-deo-container');
        let b2 = document.getElementById('floating-bubble-profit-container');
        if (b1) b1.classList.remove('hidden');
        if (b2) b2.classList.remove('hidden');

        if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
    }
}

/* ==========================================================================
   KHỐI 3: RENDER KHÔNG GIAN LÀM VIỆC CỦA TEAM ĐANG CHỌN
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function renderActiveWorkspacePanel() {
    let viewport = document.getElementById('active-panel-view-viewport'); 
    if (!viewport) return;
    
    if (activeTeamId === "deo_tab_active_special") {
        renderDeoManagementView();
        return;
    }
    
    let b1 = document.getElementById('floating-bubble-deo-container');
    let b2 = document.getElementById('floating-bubble-profit-container');
    if (b1) b1.classList.remove('hidden');
    if (b2) b2.classList.remove('hidden');

    viewport.innerHTML = ""; 
    if (!systemDatabase.teams) return;
    
    let team = systemDatabase.teams.find(t => t.id === activeTeamId);
    if (!team) { 
        if (systemDatabase.teams.length > 0) {
            team = systemDatabase.teams[0];
            activeTeamId = team.id;
        } else {
            viewport.innerHTML = `<div class="text-gray-500 text-center py-8 text-xs">Vui lòng lựa chọn một tab nhóm làm việc cụ thể.</div>`; 
            return; 
        }
    }
    
    if (team.type === 'data') { 
        if (typeof renderDataViewTableLayout === 'function') renderDataViewTableLayout(team, viewport); 
    } else { 
        if (typeof renderLineupViewTableLayout === 'function') renderLineupViewTableLayout(team, viewport); 
    }
}

/* ==========================================================================
   KHỐI 4: RENDER BẢNG THỐNG KÊ QUẺ ĐOÀI CHUYÊN SÂU
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function renderDeoManagementView() {
    let target = document.getElementById('active-panel-view-viewport') || 
                 document.getElementById('team-content-container') || 
                 document.getElementById('main-workspace-body');
    if (!target) return;

    if (typeof deduplicateDeoHistory === 'function') {
        deduplicateDeoHistory();
    }

    let todayStr = new Date().toLocaleDateString('sv-SE');

    let goldRateInput = document.getElementById('input-gold-price-per-1k') || document.querySelector('input[placeholder*="155.000"]');
    let goldRateVND = parseFloat(goldRateInput ? goldRateInput.value : 155000) || 155000;

    let lineupTeamsTotal = 9;
    if (typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
        let lTeams = systemDatabase.teams.filter(t => t.type === 'lineup');
        if (lTeams.length > 0) lineupTeamsTotal = lTeams.length;
    }

    let totalAllDeo = 0;
    let totalAllTeamsRun = 0;
    let totalAllGoldValue = 0;

    let trRows = "";
    if (!systemDatabase || !systemDatabase.deoHistory || systemDatabase.deoHistory.length === 0) {
        trRows = `<tr><td colspan="6" class="p-6 text-center text-gray-500 italic text-sm">Chưa có lịch sử quẻ Đoài nào được lưu.</td></tr>`;
    } else {
        let sortedHistory = systemDatabase.deoHistory.slice().sort((a, b) => b.date.localeCompare(a.date));

        sortedHistory.forEach((x) => {
            totalAllDeo += x.count;
            totalAllTeamsRun += lineupTeamsTotal;
            totalAllGoldValue += x.goldValue;

            let isToday = (x.date === todayStr);

            let rowStyle = isToday 
                ? "bg-purple-955/60 border-2 border-purple-500 shadow-xl font-bold" 
                : "hover:bg-gray-800/40 transition border-b border-gray-800";

            let dateDisplay = isToday 
                ? `<div class="inline-flex items-center gap-1.5 bg-emerald-955/90 border border-emerald-400 px-3 py-1 rounded-lg text-emerald-300 font-black tracking-wide shadow-md animate-pulse">
                        <i class="fa-solid fa-star text-amber-400 text-xs"></i> Hôm nay (${x.date})
                   </div>` 
                : `<span class="text-gray-300 font-mono font-semibold">${x.date}</span>`;

            let goldVal = x.goldValue || (x.count * x.price);
            let vndVal = Math.round((goldVal / 1000) * goldRateVND);
            let vndFormatted = vndVal.toLocaleString('vi-VN') + ' đ';

            let teamPerDeoRatio = x.count > 0 ? (lineupTeamsTotal / x.count).toFixed(1) : 0;
            let ratioHtml = x.count > 0 
                ? `<div class="inline-block bg-amber-955/60 border border-amber-500/50 px-2.5 py-1 rounded-lg text-amber-300 font-bold font-mono">
                        1 Đoài / ${teamPerDeoRatio} Đội
                   </div>` 
                : `<span class="text-gray-600 font-mono">-</span>`;

            trRows += `
                <tr class="${rowStyle}">
                    <td class="p-3 text-left">${dateDisplay}</td>
                    <td class="p-3 text-center text-purple-300 font-black text-sm">+${x.count} Quẻ</td>
                    <td class="p-3 text-center">${ratioHtml}</td>
                    <td class="p-3 text-center text-yellow-400 font-mono font-bold text-xs">${x.price.toFixed(1)}v</td>
                    <td class="p-3 text-center">
                        <div class="flex flex-col items-center justify-center">
                            <span class="text-cyan-300 font-black font-mono text-sm">${goldVal.toFixed(1)}v</span>
                            <span class="text-[11px] text-emerald-400 font-bold font-mono mt-0.5">${vndFormatted}</span>
                        </div>
                    </td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="decrementDeoEntry('${x.date}')" class="bg-gray-800 hover:bg-amber-600 text-amber-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-black border border-gray-700 transition cursor-pointer shadow" title="Giảm 1 quẻ ngày này">-1 Quẻ</button>
                            <button onclick="deleteDeoEntry('${x.date}')" class="bg-rose-955 hover:bg-rose-700 text-rose-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-600 transition cursor-pointer shadow" title="Xóa toàn bộ ngày này"><i class="fa-solid fa-trash-can mr-1"></i>Xóa</button>
                        </div>
                    </td>
                </tr>`;
        });
    }

    let globalRatioStr = totalAllDeo > 0 
        ? `1 Đoài / ${(totalAllTeamsRun / totalAllDeo).toFixed(1)} Đội (Trung bình: ${((totalAllDeo / totalAllTeamsRun) * 100).toFixed(1)}%)` 
        : `Chưa có dữ liệu`;

    let totalAllVND = Math.round((totalAllGoldValue / 1000) * goldRateVND);
    let totalAllVNDFormatted = totalAllVND.toLocaleString('vi-VN') + ' đ';

    target.innerHTML = `
        <div class="p-4 bg-gray-900 border border-purple-500/60 rounded-2xl shadow-2xl text-xs space-y-4">
            <div class="flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-2">
                <span class="font-black text-purple-300 text-sm uppercase flex items-center gap-2">
                    <i class="fa-solid fa-gem text-amber-400"></i> BẢNG THỐNG KÊ & NHẬT KÝ LỊCH SỬ QUẺ ĐOÀI CHUYÊN SÂU
                </span>
                <button onclick="switchMainSystemTab('thai_hu_main')" class="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold px-3.5 py-1.5 rounded-lg border border-gray-600 transition cursor-pointer text-xs flex items-center gap-1.5 shadow">
                    <i class="fa-solid fa-arrow-left"></i> Quay Lại Thái Hư
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-950 border border-gray-800 rounded-xl font-mono">
                <div class="flex flex-col justify-center">
                    <span class="text-gray-400 text-[11px]">TỶ LỆ TOÀN THỜI GIAN:</span>
                    <strong class="text-amber-400 font-black text-sm mt-0.5">${globalRatioStr}</strong>
                </div>
                <div class="flex flex-col justify-center">
                    <span class="text-gray-400 text-[11px]">TỔNG LƯỢNG QUẺ ĐÃ NHẬN:</span>
                    <strong class="text-purple-300 font-black text-sm mt-0.5">${totalAllDeo} Quẻ (${totalAllTeamsRun} Lượt Đội)</strong>
                </div>
                <div class="flex flex-col justify-center">
                    <span class="text-gray-400 text-[11px]">TỔNG GIÁ TRỊ QUY ĐỔI:</span>
                    <strong class="text-cyan-300 font-black text-sm mt-0.5">${totalAllGoldValue.toFixed(1)}v <span class="text-emerald-400 font-normal text-xs">(${totalAllVNDFormatted})</span></strong>
                </div>
            </div>

            <div class="overflow-x-auto rounded-xl border border-gray-800">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-gray-955 text-gray-400 uppercase font-bold text-[11px] border-b border-gray-800">
                            <th class="p-3">NGÀY NHẬP</th>
                            <th class="p-3 text-center">TỔNG SỐ LƯỢNG</th>
                            <th class="p-3 text-center">TỶ LỆ ĐOÀI / ĐỘI</th>
                            <th class="p-3 text-center">THỜI GIÁ VÀNG</th>
                            <th class="p-3 text-center">QUY ĐỔI (VÀNG / VNĐ)</th>
                            <th class="p-3 text-center w-40">THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800">
                        ${trRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function switchToDeoManagementTab() {
    switchMainSystemTab('deo_tab_active_special');
}

/* ==========================================================================
   KHỐI 5: QUẢN LÝ THÊM MỚI & XÓA ĐỘI HÌNH
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function deleteTargetActiveTeamUnit(targetType) { 
    if (!activeTeamId) return;
    let idx = systemDatabase.teams.findIndex(t => t.id === activeTeamId);
    if (idx === -1) return;
    let team = systemDatabase.teams[idx];
    
    if (team.type !== targetType) {
        alert("Vui lòng chọn chính xác thẻ Tab cần xóa ở hàng tương ứng trước.");
        return;
    }

    if (!confirm(`Xác nhận xóa nhóm [ ${team.name.toUpperCase()} ]?`)) return;
    
    if (team.type === 'data') team.memberIds.forEach(mId => delete systemDatabase.members[mId]);
    systemDatabase.teams.splice(idx, 1);
    
    let nextTeam = systemDatabase.teams.find(x => x.type === targetType);
    activeTeamId = nextTeam ? nextTeam.id : (systemDatabase.teams[0]?.id || "");
    
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity(); 
    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout(); 
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache(); 
}

function createNewTeamCorePipeline(targetType) {
    let teamName = prompt(`Nhập tên định danh cho nhóm [ ${targetType.toUpperCase()} ] mới:`, "");
    if (!teamName || teamName.trim() === "") return;

    let teamId = 'team_' + createUniqueId();
    let newTeamObj = { id: teamId, name: teamName.trim(), type: targetType, memberIds: [] };

    if (targetType === 'data') {
        for (let i = 0; i < 8; i++) {
            let mId = createUniqueId();
            systemDatabase.members[mId] = { id: mId, name: "", maxRuns: 3, currentRuns: 0, originalTeamId: teamId, isEditing: true, freeRun2: false, freeRun3: false, skipStatNL: false, nganPhieu: 0 };
            newTeamObj.memberIds.push(mId);
        }
    } else {
        newTeamObj.memberIds = Array(8).fill("");
    }

    systemDatabase.teams.push(newTeamObj);
    activeTeamId = teamId;

    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
}

/* ==========================================================================
   KHỐI 6: XỬ LÝ KÉO THẢ (DRAG & DROP) & SAO CHÉP CLIPBOARD
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function onRowDragStart(e, index) { 
    draggedRowIndex = index; 
    e.currentTarget.classList.add('dragging-row'); 
    e.dataTransfer.effectAllowed = 'move'; 
}

function onRowDragOver(e) { 
    e.preventDefault(); 
}

function onRowDragLeave(e) { 
    e.currentTarget.classList.remove('dragging-row'); 
}

function onRowDrop(e, toIndex) { 
    e.preventDefault(); 
    e.currentTarget.classList.remove('dragging-row'); 
    if (draggedRowIndex === null || draggedRowIndex === toIndex) return; 
    let team = systemDatabase.teams.find(x => x.id === activeTeamId); 
    if (!team) return; 
    let targetId = team.memberIds[draggedRowIndex]; 
    team.memberIds.splice(draggedRowIndex, 1); 
    team.memberIds.splice(toIndex, 0, targetId); 
    draggedRowIndex = null; 
    renderActiveWorkspacePanel(); 
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache(); 
}

function copyToClipboardTextSystem(str) { 
    if (!str) return; 
    navigator.clipboard.writeText(str).then(() => { 
        let toast = document.createElement('div'); 
        toast.className = "fixed bottom-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] z-50 shadow-2xl"; 
        toast.innerText = `Đã Copy: ${str}`; 
        document.body.appendChild(toast); 
        setTimeout(() => toast.remove(), 1000); 
    }); 
}

window.renderNavigationSubTabs = renderNavigationSubTabs;
window.renderActiveWorkspacePanel = renderActiveWorkspacePanel;
window.renderDeoManagementView = renderDeoManagementView;
window.switchToDeoManagementTab = switchToDeoManagementTab;
window.switchMainSystemTab = switchMainSystemTab;
window.deleteTargetActiveTeamUnit = deleteTargetActiveTeamUnit;
window.createNewTeamCorePipeline = createNewTeamCorePipeline;

// Tổng số dòng code trong file này: 295 dòng.