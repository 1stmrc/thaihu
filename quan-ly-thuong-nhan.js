// Tên file: quan-ly-thuong-nhan.js
// Chức năng: Quản lý Tab Thương Nhân - Quét chuẩn xác toàn bộ 64 acc từ 8 Data Team (chỉ trừ đúng 4 acc khóa để ra 60 acc, không lọc bỏ acc trống tên), tính đủ 18 acc xong = 54 lượt, tích hợp nút gạt [Bỏ Hoàn Vàng] auto bật sẵn (1.2v/lượt) và điều phối hiển thị an toàn khi chuyển Tab.
// Con của file: index.html (Nạp qua thẻ script trong khung xương chính).
// Danh sách tính năng của file:
//   1. Quét chính xác toàn bộ 8 Data Team (64 slots), trừ đúng tài khoản khóa để luôn đảm bảo đủ 60 acc hoạt động.
//   2. Hiển thị tách bạch: Số TK đã hoàn thành (3/3), Số TK chưa xong, Tổng lượt thực tế (18 acc x 3 = 54 lượt).
//   3. Tích hợp nút gạt [Bỏ Hoàn Vàng] (Auto bật sẵn), khi bỏ tích tính đúng 1.2v/lượt.
//   4. Đọc đầy đủ định dạng tên tài khoản A.[Phái] [Tên TK], +1 tiến độ tự động +1 Ngân Phiếu cho tài khoản.
//   5. Đồng bộ thanh điều hướng Tab mà không tự ý khóa/đóng popup Thương Nhân & Thất Bại khi ở Thái Hư.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 22/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

let activeMerchantTeamId = null;
let editingMerchantMemberId = null;
let draggedMerchantRowIndex = null;
let isMerchantTabActive = false;
let isMerchantExcludeRefund = true; // Mặc định AUTO BẬT SẴN: Không tính tiền vàng hoàn

// --- HÀM ĐIỀU PHỐI HIỂN THỊ AN TOÀN CHO CÁC TAB ---
function applyMerchantPopupVisibility() {
    let profitContainer = document.getElementById('floating-bubble-profit-container');
    let deoContainer = document.getElementById('floating-bubble-deo-container');

    if (isMerchantTabActive) {
        if (deoContainer) deoContainer.classList.add('hidden');
        if (profitContainer) profitContainer.classList.remove('hidden');
    } else {
        if (deoContainer) deoContainer.classList.remove('hidden');
        if (profitContainer) profitContainer.classList.remove('hidden');
    }
}

// --- RENDER POPUP THƯƠNG NHÂN (QUÉT CHUẨN XÁC 64 ACC TỪ 8 DATA TEAM) ---
function renderMerchantCardModal() {
    let holder = document.getElementById('injection-merchant-card-holder');
    if (!holder) return;

    let matPrice = (typeof systemDatabase !== 'undefined' && systemDatabase.materialPrice) ? parseFloat(systemDatabase.materialPrice) : 0.3;
    
    let goldInputEl = document.getElementById('input-gold-rate');
    let rawVal = goldInputEl ? goldInputEl.value : "";
    let goldRateVnd = 155000;

    if (rawVal) {
        let cleanVal = parseFloat(rawVal.replace(/\./g, "").replace(/,/g, ""));
        if (!isNaN(cleanVal) && cleanVal > 0) {
            goldRateVnd = cleanVal;
        }
    } else if (typeof systemDatabase !== 'undefined' && systemDatabase.goldRate) {
        let cleanVal = parseFloat(String(systemDatabase.goldRate).replace(/\./g, "").replace(/,/g, ""));
        if (!isNaN(cleanVal) && cleanVal > 0) {
            goldRateVnd = cleanVal;
        }
    }

    let isEventMode = false;
    if (typeof isEventCurrentlyActiveGMT7 === 'function') {
        isEventMode = isEventCurrentlyActiveGMT7();
    } else {
        let startDate = localStorage.getItem('EVENT_START_DATE') || (typeof systemDatabase !== 'undefined' && systemDatabase.eventStartDate);
        let endDate = localStorage.getItem('EVENT_END_DATE') || (typeof systemDatabase !== 'undefined' && systemDatabase.eventEndDate);
        if (startDate && endDate) {
            let now = new Date();
            let utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
            let gmt7Ms = utcMs + (3600000 * 7);
            let todayMs = new Date(gmt7Ms).setHours(0, 0, 0, 0);
            let startMs = new Date(startDate).setHours(0, 0, 0, 0);
            let endMs = new Date(endDate).setHours(23, 59, 59, 999);
            if (todayMs >= startMs && todayMs <= endMs) isEventMode = true;
        }
    }

    let totalActiveAccounts = 0;
    let completedAccounts = 0;
    let unfinishedAccounts = 0;
    let totalRuns = 0;

    let memberMap = new Map();

    if (typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
        let dataTeams = systemDatabase.teams.filter(t => t.type === 'data' || (!t.type && t.memberIds));
        if (dataTeams.length === 0) {
            dataTeams = systemDatabase.teams.filter(t => t.type !== 'lineup');
        }

        dataTeams.forEach(t => {
            (t.memberIds || []).forEach(mId => {
                if (!mId || memberMap.has(mId)) return;
                let m = (systemDatabase.members && systemDatabase.members[mId]) ? systemDatabase.members[mId] : { id: mId, merchantRuns: 0, merchantLocked: false };
                memberMap.set(mId, m);
            });
        });
    }

    if (memberMap.size === 0 && typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.entries(systemDatabase.members).forEach(([mId, m]) => {
            if (m) memberMap.set(mId, m);
        });
    }

    memberMap.forEach(m => {
        let isLocked = (m.merchantLocked === true || m.merchantLocked === "true");
        if (isLocked) return;

        totalActiveAccounts++;
        let runs = parseInt(m.merchantRuns) || 0;
        if (runs >= 3) {
            completedAccounts++;
        } else {
            unfinishedAccounts++;
        }
        totalRuns += runs;
    });

    let directGold = isMerchantExcludeRefund ? 0 : (totalRuns * 1.2);
    let totalMaterials = isEventMode ? (totalRuns * 8) : 0;
    let materialGold = totalMaterials * matPrice;
    let totalGold = directGold + materialGold;
    
    let totalVnd = goldRateVnd > 0 ? (totalGold / 1000) * goldRateVnd : 0;

    let existingCard = document.getElementById('floating-merchant-card');
    let isHidden = existingCard ? existingCard.classList.contains('hidden') : true;

    holder.innerHTML = `
        <div id="floating-merchant-card" onclick="event.stopPropagation()" class="${isHidden ? 'hidden' : ''} w-[345px] bg-gray-900 border border-amber-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-xs">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2">
                <span class="text-amber-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-gem animate-pulse"></i> Thu Nhập Thương Nhân
                </span>
                <div class="flex items-center gap-2">
                    <label class="flex items-center gap-1 cursor-pointer bg-gray-955 px-2 py-0.5 rounded border border-cyan-500/40 select-none" title="Không tính tiền vàng hoàn thương nhân">
                        <input id="chk-merchant-exclude-refund" type="checkbox" ${isMerchantExcludeRefund ? 'checked' : ''} onchange="toggleMerchantExcludeRefundState(this.checked)" class="accent-cyan-400 cursor-pointer w-3 h-3">
                        <span class="text-[10px] font-bold text-cyan-300">Bỏ Hoàn</span>
                    </label>
                    <button onclick="toggleFloatingMerchantCard(event)" class="text-gray-400 hover:text-white text-sm font-black cursor-pointer">&times;</button>
                </div>
            </div>
            
            <div class="flex flex-col gap-2 text-gray-300 font-semibold my-1 font-mono text-[11px]">
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Số TK đã hoàn thành (3/3):</span>
                    <strong class="text-emerald-400 text-xs font-black">${completedAccounts} / ${totalActiveAccounts} acc</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Số TK chưa hoàn thành:</span>
                    <strong class="text-cyan-400 text-xs font-black">${unfinishedAccounts} acc</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Tổng trận thực tế đã đi:</span>
                    <strong class="text-yellow-300 text-xs font-black">${totalRuns} lượt</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Vàng Thương Nhân (${isMerchantExcludeRefund ? 'Đã Bỏ Hoàn' : '1.2v/lượt'}):</span>
                    <strong class="text-amber-400 text-xs font-bold">+${directGold.toFixed(2)}v</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Nguyên liệu ${isEventMode ? '(+8NL/lượt)' : '(Chưa bật SK)'}:</span>
                    <strong class="text-amber-400 text-xs font-bold">${totalMaterials.toLocaleString('vi-VN')} NL ${isEventMode ? `(+${materialGold.toFixed(2)}v)` : '(+0.00v)'}</strong>
                </div>
            </div>
            
            <div class="w-full h-px bg-gray-800"></div>
            
            <div class="bg-gray-955 border border-gray-800 rounded-xl p-3 text-center flex flex-col items-center justify-center font-mono">
                <div class="text-emerald-400 font-black text-xl">
                    +${totalGold.toFixed(2)} Vàng
                </div>
                <div class="text-gray-400 text-[11px] font-bold mt-0.5 font-sans">
                    ~ ${Math.round(totalVnd).toLocaleString('vi-VN')} VNĐ
                </div>
            </div>
        </div>
    `;
}

function toggleMerchantExcludeRefundState(isChecked) {
    isMerchantExcludeRefund = isChecked;
    renderMerchantCardModal();
    if (typeof calculateComprehensiveProfitsRealtime === 'function') {
        calculateComprehensiveProfitsRealtime();
    }
}

function toggleFloatingMerchantCard(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    let card = document.getElementById('floating-merchant-card');
    if (!card) {
        renderMerchantCardModal();
        card = document.getElementById('floating-merchant-card');
    }
    if (card) {
        card.classList.toggle('hidden');
    }
}

function setupGoldRateLiveSync() {
    let goldInputEl = document.getElementById('input-gold-rate');
    if (goldInputEl && !goldInputEl.dataset.merchantLiveBound) {
        goldInputEl.dataset.merchantLiveBound = "true";
        goldInputEl.addEventListener('input', function() {
            renderMerchantCardModal();
        });
    }
}

// --- 1. CHUYỂN TAB THƯƠNG NHÂN ĐỒNG BỘ THANH ĐIỀU HƯỚNG ---
function switchToMerchantManagementTab() {
    isMerchantTabActive = true;
    activeTeamId = "merchant_tab_active";

    let btnThaihu = document.getElementById('btn-main-tab-thaihu');
    let btnMerchant = document.getElementById('btn-main-tab-merchant');
    let btnOptimize = document.getElementById('btn-main-tab-optimize');
    let btnDeo = document.getElementById('btn-main-tab-deo');
    let btnLogs = document.getElementById('btn-main-tab-logs');

    if (btnThaihu) btnThaihu.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnMerchant) btnMerchant.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-amber-600 text-white shadow border border-amber-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnOptimize) btnOptimize.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnDeo) btnDeo.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnLogs) btnLogs.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');

    applyMerchantPopupVisibility();
    initMerchantViewport();
    let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');
    if (merchantPanel) {
        merchantPanel.classList.remove('hidden');
        renderMerchantMainUI();
    }
}

// --- 2. DỰNG KHUNG VIEWPORT THƯƠNG NHÂN ---
function initMerchantViewport() {
    let viewport = document.getElementById('active-panel-view-viewport');
    if (!viewport) return;

    Array.from(viewport.children).forEach(child => child.classList.add('hidden'));

    let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');
    if (!merchantPanel) {
        merchantPanel = document.createElement('div');
        merchantPanel.id = 'tab-content-quan-ly-thuong-nhan';
        merchantPanel.className = "w-full h-full flex flex-col gap-3 text-gray-200";
        
        merchantPanel.innerHTML = `
            <div class="flex items-center justify-between gap-2 pb-2 border-b border-gray-700/70">
                <div class="flex-1 overflow-x-auto no-scrollbar">
                    <div class="flex items-center gap-1.5 min-w-max" id="merchant-sub-tabs-holder"></div>
                </div>
            </div>

            <div class="flex-1 overflow-hidden bg-gray-900/60 rounded-xl border border-gray-800 p-1.5">
                <table class="w-full text-left text-xs border-collapse table-fixed">
                    <thead>
                        <tr class="text-gray-400 border-b border-gray-800 pb-2 uppercase text-[11px] font-bold">
                            <th class="p-2 w-8 text-center">KÉO</th>
                            <th class="p-2 w-8 text-center">STT</th>
                            <th class="p-2 w-[250px]">TÊN TÀI KHOẢN</th>
                            <th class="p-2 w-16 text-center">CHECK</th>
                            <th class="p-2 text-center w-[220px]">TIẾN ĐỘ THƯƠNG NHÂN</th>
                            <th class="p-2 w-12 text-center">KHÓA</th>
                            <th class="p-2 w-12 text-center">COPY</th>
                            <th class="p-2 w-28 text-center">CHUYỂN NHÓM</th>
                        </tr>
                    </thead>
                    <tbody id="merchant-members-table-body"></tbody>
                </table>
            </div>
        `;
        viewport.appendChild(merchantPanel);
    }
}

// --- 3. RENDER UI CHÍNH CHO THƯƠNG NHÂN ---
function renderMerchantMainUI() {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.teams) return;

    let dataTeams = systemDatabase.teams.filter(t => t.type === 'data');
    if (dataTeams.length === 0) return;

    if (!activeMerchantTeamId || !dataTeams.find(t => t.id === activeMerchantTeamId)) {
        activeMerchantTeamId = dataTeams[0].id;
    }

    let subTabsHolder = document.getElementById('merchant-sub-tabs-holder');
    if (subTabsHolder) {
        subTabsHolder.innerHTML = dataTeams.map(t => {
            let isActive = t.id === activeMerchantTeamId;
            return `
                <button onclick="selectMerchantTeam('${t.id}')" class="px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${isActive ? 'bg-amber-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}">
                    <i class="fa-solid fa-users text-[10px] mr-1"></i>${t.name.toUpperCase()}
                </button>
            `;
        }).join('');
    }

    renderMerchantTableBody();
    setupGoldRateLiveSync();
    renderMerchantCardModal();
}

function selectMerchantTeam(teamId) {
    activeMerchantTeamId = teamId;
    renderMerchantMainUI();
}

function renderMerchantTableBody() {
    let tbody = document.getElementById('merchant-members-table-body');
    if (!tbody) return;

    let team = systemDatabase.teams.find(t => t.id === activeMerchantTeamId);
    if (!team) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-gray-500 italic">Chưa chọn nhóm tài khoản.</td></tr>`;
        return;
    }

    let allDataTeams = systemDatabase.teams.filter(t => t.type === 'data');
    let currentHour = new Date().getHours();
    let html = "";

    for (let i = 0; i < 8; i++) {
        let memberId = team.memberIds[i];
        let m = memberId ? systemDatabase.members[memberId] : null;

        if (!m) {
            html += `
                <tr class="border-b border-gray-800/50 bg-gray-900/30 text-gray-600">
                    <td class="py-3 px-1 text-center"><i class="fa-solid fa-bars opacity-30"></i></td>
                    <td class="py-3 px-1 text-center font-bold">${i + 1}</td>
                    <td class="py-3 px-1 italic whitespace-nowrap overflow-hidden text-ellipsis">-- Vị trí trống --</td>
                    <td class="py-3 px-1 text-center">--</td>
                    <td class="py-3 px-1 text-center">--</td>
                    <td class="py-3 px-1 text-center">--</td>
                    <td class="py-3 px-1 text-center">--</td>
                    <td class="py-3 px-1 text-center">--</td>
                </tr>
            `;
            continue;
        }

        let fullDisplayName = (typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, team) : m.name;
        let pureCoreName = (typeof getPureCoreAccountName === 'function') ? getPureCoreAccountName(m.name) : m.name;

        let isEditing = editingMerchantMemberId === m.id;
        let isLocked = m.merchantLocked || false;
        let runs = parseInt(m.merchantRuns) || 0;
        let percent = Math.min(100, Math.max(0, Math.round((runs / 3) * 100)));

        let checkHourText = "0h";
        let checkClass = "bg-gray-800/60 text-gray-500 border border-gray-700/50";

        if (m.merchantLastHour !== undefined && m.merchantLastHour !== null) {
            let lastHour = parseInt(m.merchantLastHour);
            checkHourText = `${lastHour}h`;

            let diffHour = currentHour - lastHour;
            if (diffHour < 0) diffHour += 24;

            if (diffHour === 0) {
                checkClass = "bg-emerald-600 text-white font-black shadow-md border border-emerald-400";
            } else if (diffHour === 1) {
                checkClass = "bg-amber-500 text-white font-black shadow-md border border-amber-400";
            } else {
                checkClass = "bg-gray-800 text-gray-400 font-bold border border-gray-700";
            }
        }

        let nameCellHtml = "";
        if (isEditing) {
            nameCellHtml = `
                <div class="flex items-center gap-1 w-[240px]">
                    <input type="text" id="merchant-input-name-${m.id}" value="${pureCoreName}" class="bg-gray-800 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-[170px] font-bold shrink-0" />
                    <button onclick="saveMerchantMemberName('${m.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded transition text-xs flex items-center gap-1 cursor-pointer shrink-0">
                        <i class="fa-solid fa-floppy-disk"></i> Lưu
                    </button>
                </div>
            `;
        } else {
            nameCellHtml = `
                <div class="flex items-center gap-1.5 group cursor-pointer w-[240px] overflow-hidden">
                    <span class="font-bold text-gray-100 text-xs whitespace-nowrap overflow-hidden text-ellipsis shrink" title="${fullDisplayName}">${fullDisplayName || '<span class="text-gray-600 italic">[Trống]</span>'}</span>
                    <button onclick="enableEditMerchantMemberName('${m.id}')" class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gray-800 hover:bg-gray-700 text-blue-400 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-gray-700 cursor-pointer shrink-0">
                        <i class="fa-solid fa-pen"></i> Sửa
                    </button>
                </div>
            `;
        }

        let progressCellHtml = "";
        if (isLocked) {
            progressCellHtml = `
                <div class="flex items-center justify-between w-full h-9 bg-gray-955 border border-gray-800 rounded-lg overflow-hidden opacity-30 pointer-events-none select-none">
                    <button class="bg-gray-800/80 text-gray-500 w-7 h-full font-black flex items-center justify-center text-xs shrink-0">-</button>
                    <div class="flex-1 h-full relative flex items-center justify-center">
                        <div class="absolute left-0 top-0 bottom-0 bg-emerald-600/50 transition-all duration-300" style="width: ${percent}%;"></div>
                        <span class="relative z-10 font-black text-xs text-gray-400">${runs} / 3</span>
                    </div>
                    <button class="bg-gray-800/80 text-gray-500 w-7 h-full font-black flex items-center justify-center text-xs shrink-0">+</button>
                </div>
            `;
        } else {
            progressCellHtml = `
                <div class="flex items-center justify-between w-full h-9 bg-gray-955 border border-gray-700 hover:border-amber-500/60 rounded-lg overflow-hidden select-none shadow-inner transition">
                    <button onclick="changeMerchantProgress('${m.id}', -1)" class="bg-gray-800/90 hover:bg-gray-700 text-rose-400 hover:text-white w-7 h-full font-black transition cursor-pointer border-r border-gray-700/80 flex items-center justify-center text-xs shrink-0 shadow-sm">-</button>
                    <div onclick="tapIncrementMerchantProgress('${m.id}')" title="Nhấn trực tiếp để tăng tiến độ" class="flex-1 h-full relative cursor-pointer flex items-center justify-center group/bar">
                        <div class="absolute left-0 top-0 bottom-0 ${runs === 3 ? 'bg-emerald-500' : 'bg-emerald-600/90'} transition-all duration-300" style="width: ${percent}%;"></div>
                        <span class="relative z-10 font-black text-xs text-white drop-shadow group-hover/bar:scale-105 transition-transform">${runs} / 3</span>
                    </div>
                    <button onclick="changeMerchantProgress('${m.id}', 1)" class="bg-gray-800/90 hover:bg-gray-700 text-emerald-400 hover:text-white w-7 h-full font-black transition cursor-pointer border-l border-gray-700/80 flex items-center justify-center text-xs shrink-0 shadow-sm">+</button>
                </div>
            `;
        }

        let teamOptionsHtml = allDataTeams.map(dt => `
            <option value="${dt.id}" ${dt.id === team.id ? 'selected' : ''}>- ${dt.name.toUpperCase()} -</option>
        `).join('');

        html += `
            <tr draggable="true" 
                ondragstart="handleMerchantDragStart(event, ${i})" 
                ondragover="handleMerchantDragOver(event)" 
                ondrop="handleMerchantDrop(event, ${i})" 
                class="border-b border-gray-800 hover:bg-gray-800/40 transition">
                
                <td class="py-3 px-1 text-center cursor-grab active:cursor-grabbing text-gray-500 hover:text-amber-400">
                    <i class="fa-solid fa-bars"></i>
                </td>
                <td class="py-3 px-1 text-center font-bold text-gray-400">${i + 1}</td>
                <td class="py-3 px-1 w-[250px]">${nameCellHtml}</td>
                <td class="py-3 px-1 text-center">
                    <span class="inline-block px-2 py-0.5 rounded text-xs transition-all duration-200 ${checkClass}">
                        ${checkHourText}
                    </span>
                </td>
                <td class="py-3 px-1 text-center">${progressCellHtml}</td>
                <td class="py-3 px-1 text-center">
                    <button onclick="toggleMerchantMemberLock('${m.id}')" class="text-sm transition cursor-pointer ${isLocked ? 'text-rose-500' : 'text-gray-600 hover:text-gray-400'}">
                        <i class="fa-solid ${isLocked ? 'fa-lock' : 'fa-lock-open'}"></i>
                    </button>
                </td>
                <td class="py-3 px-1 text-center">
                    <button onclick="copyMerchantMemberName('${pureCoreName}')" class="bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-lg transition border border-gray-700 cursor-pointer hover:border-gray-500" title="Copy tên TK gốc: ${pureCoreName}">
                        <i class="fa-solid fa-copy"></i>
                    </button>
                </td>
                <td class="py-3 px-1 text-center">
                    <select onchange="moveMerchantMemberToTeam('${m.id}', this.value)" class="bg-gray-800 border border-gray-700 rounded p-1 text-[11px] text-gray-200 focus:outline-none font-semibold cursor-pointer w-full text-center">
                        ${teamOptionsHtml}
                    </select>
                </td>
            </tr>
        `;
    }

    tbody.innerHTML = html;
}

// --- 4. THAO TÁC TIẾN ĐỘ & DỮ LIỆU THƯƠNG NHÂN (+1 LƯỢT = +1 NGÂN PHIẾU) ---
function enableEditMerchantMemberName(memberId) {
    editingMerchantMemberId = memberId;
    renderMerchantTableBody();
    setTimeout(() => {
        let input = document.getElementById(`merchant-input-name-${memberId}`);
        if (input) input.focus();
    }, 50);
}

function saveMerchantMemberName(memberId) {
    let input = document.getElementById(`merchant-input-name-${memberId}`);
    if (!input) return;

    let rawInput = input.value.trim();
    let cleanName = (typeof getPureCoreAccountName === 'function') ? getPureCoreAccountName(rawInput) : rawInput;

    if (systemDatabase.members[memberId]) {
        systemDatabase.members[memberId].name = cleanName;
        editingMerchantMemberId = null;

        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
        if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
        renderMerchantCardModal();
        renderMerchantTableBody();
        if (typeof logUserAction === 'function') logUserAction(`Đổi tên tài khoản thành: [ ${cleanName} ]`);
    }
}

function changeMerchantProgress(memberId, delta) {
    let m = systemDatabase.members[memberId];
    if (!m || m.merchantLocked) return;

    let current = parseInt(m.merchantRuns) || 0;
    
    if (delta > 0 && current >= 3) {
        if (typeof logUserAction === 'function') logUserAction(`Tài khoản [${m.name}] đã hoàn thành tối đa 3/3 lượt!`);
        return;
    }

    let nextVal = current + delta;

    if (nextVal >= 0 && nextVal <= 3) {
        let actualStep = nextVal - current;
        m.merchantRuns = nextVal;
        m.merchantLastHour = new Date().getHours();

        let currentNP = (m.nganPhieu !== undefined && m.nganPhieu !== null) ? parseInt(m.nganPhieu) || 0 : 0;
        m.nganPhieu = currentNP + actualStep;

        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
        renderMerchantCardModal();
        renderMerchantTableBody();
        if (typeof logUserAction === 'function') logUserAction(`Tiến độ Thương Nhân [ ${m.name} ]: ${nextVal}/3 lượt (Ngân Phiếu: ${m.nganPhieu})`);
    }
}

function tapIncrementMerchantProgress(memberId) {
    let m = systemDatabase.members[memberId];
    if (!m || m.merchantLocked) return;

    let current = parseInt(m.merchantRuns) || 0;

    if (current >= 3) {
        if (typeof logUserAction === 'function') logUserAction(`Tài khoản [${m.name}] đã hoàn thành tối đa 3/3 lượt Thương Nhân!`);
        return;
    }

    m.merchantRuns = current + 1;
    m.merchantLastHour = new Date().getHours();

    let currentNP = (m.nganPhieu !== undefined && m.nganPhieu !== null) ? parseInt(m.nganPhieu) || 0 : 0;
    m.nganPhieu = currentNP + 1;

    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    renderMerchantCardModal();
    renderMerchantTableBody();
    if (typeof logUserAction === 'function') logUserAction(`Tiến độ Thương Nhân [ ${m.name} ]: ${current + 1}/3 lượt (Ngân Phiếu: ${m.nganPhieu})`);
}

function toggleMerchantMemberLock(memberId) {
    let m = systemDatabase.members[memberId];
    if (!m) return;

    m.merchantLocked = !m.merchantLocked;
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    renderMerchantCardModal();
    renderMerchantTableBody();
    if (typeof logUserAction === 'function') logUserAction(`${m.merchantLocked ? 'Khóa' : 'Mở khóa'} Thương Nhân [ ${m.name} ]`);
}

function copyMerchantMemberName(name) {
    let cleanName = (typeof getPureCoreAccountName === 'function') ? getPureCoreAccountName(name) : name;
    navigator.clipboard.writeText(cleanName).then(() => {
        if (typeof logUserAction === 'function') logUserAction(`Đã Copy: ${cleanName}`);
    });
}

function moveMerchantMemberToTeam(memberId, targetTeamId) {
    let currentTeam = systemDatabase.teams.filter(t => t.type === 'data').find(t => t.id === activeMerchantTeamId);
    let targetTeam = systemDatabase.teams.find(t => t.id === targetTeamId);

    if (!currentTeam || !targetTeam || currentTeam.id === targetTeam.id) return;

    let m = systemDatabase.members[memberId];
    currentTeam.memberIds = currentTeam.memberIds.filter(id => id !== memberId);
    targetTeam.memberIds.push(memberId);

    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
    renderMerchantCardModal();
    renderMerchantMainUI();
    if (typeof logUserAction === 'function') logUserAction(`Chuyển [ ${m ? m.name : memberId} ] sang nhóm ${targetTeam.name.toUpperCase()}`);
}

// --- 5. DRAG & DROP VỊ TRÍ TÀI KHOẢN ---
function handleMerchantDragStart(e, index) {
    draggedMerchantRowIndex = index;
    e.dataTransfer.effectAllowed = 'move';
}

function handleMerchantDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleMerchantDrop(e, targetIndex) {
    e.preventDefault();
    if (draggedMerchantRowIndex === null || draggedMerchantRowIndex === targetIndex) return;

    let team = systemDatabase.teams.filter(t => t.type === 'data').find(t => t.id === activeMerchantTeamId);
    if (!team) return;

    let temp = team.memberIds[draggedMerchantRowIndex];
    team.memberIds[draggedMerchantRowIndex] = team.memberIds[targetIndex];
    team.memberIds[targetIndex] = temp;

    draggedMerchantRowIndex = null;

    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
    renderMerchantCardModal();
    renderMerchantTableBody();
    if (typeof logUserAction === 'function') logUserAction("Đã thay đổi thứ tự vị trí tài khoản Thương Nhân");
}

if (typeof window.refreshUserInterfaceLayout === 'function') {
    let originalRefreshUI = window.refreshUserInterfaceLayout;
    window.refreshUserInterfaceLayout = function() {
        originalRefreshUI();
        
        let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');
        if (isMerchantTabActive && merchantPanel) {
            let viewport = document.getElementById('active-panel-view-viewport');
            if (viewport) {
                Array.from(viewport.children).forEach(child => {
                    if (child.id !== 'tab-content-quan-ly-thuong-nhan') {
                        child.classList.add('hidden');
                    }
                });
            }
            let subNavbar = document.getElementById('sub-navbar-container-zone');
            if (subNavbar) subNavbar.classList.add('hidden');

            applyMerchantPopupVisibility();
            merchantPanel.classList.remove('hidden');
            renderMerchantMainUI();
        } else {
            isMerchantTabActive = false;
            applyMerchantPopupVisibility();
        }
    };
}

setInterval(() => {
    let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');
    if (merchantPanel && !merchantPanel.classList.contains('hidden')) {
        renderMerchantTableBody();
    }
}, 30000);

setInterval(() => {
    setupGoldRateLiveSync();
}, 500);

window.switchToMerchantManagementTab = switchToMerchantManagementTab;
window.selectMerchantTeam = selectMerchantTeam;
window.changeMerchantProgress = changeMerchantProgress;
window.tapIncrementMerchantProgress = tapIncrementMerchantProgress;
window.toggleMerchantMemberLock = toggleMerchantMemberLock;
window.copyMerchantMemberName = copyMerchantMemberName;
window.moveMerchantMemberToTeam = moveMerchantMemberToTeam;
window.handleMerchantDragStart = handleMerchantDragStart;
window.handleMerchantDragOver = handleMerchantDragOver;
window.handleMerchantDrop = handleMerchantDrop;
window.enableEditMerchantMemberName = enableEditMerchantMemberName;
window.saveMerchantMemberName = saveMerchantMemberName;
window.applyMerchantPopupVisibility = applyMerchantPopupVisibility;
window.renderMerchantCardModal = renderMerchantCardModal;
window.toggleMerchantExcludeRefundState = toggleMerchantExcludeRefundState;
window.toggleFloatingMerchantCard = toggleFloatingMerchantCard;

// Tổng số dòng code trong file này: 440 dòng.