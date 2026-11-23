// Tên file: quan-ly-thuong-nhan.js
// Chức năng: Quản lý Tab Thương Nhân - Quét chuẩn xác toàn bộ 64 acc từ 8 Data Team (chỉ trừ đúng acc khóa để ra 60 acc), tính đủ 18 acc xong = 54 lượt, tích hợp nút gạt [Bỏ Hoàn Vàng] auto bật sẵn (1.2v/lượt), đồng bộ Ngân Phiếu (+1 NP/lượt) và tôn trọng tuyệt đối nút Ẩn Tất Cả Popup trên Header.
// Con của file: index.html (Nạp qua thẻ script trong khung xương chính).

let activeMerchantTeamId = null;
let editingMerchantMemberId = null;
let draggedMerchantRowIndex = null;
let isMerchantTabActive = false;
window.isMerchantExcludeRefund = (typeof window.isMerchantExcludeRefund !== 'undefined') ? window.isMerchantExcludeRefund : true;

// --- HÀM ĐIỀU PHỐI HIỂN THỊ AN TOÀN CHO CÁC TAB (TÔN TRỌNG NÚT ẨN POPUP) ---
function applyMerchantPopupVisibility() {
    let profitContainer = document.getElementById('floating-bubble-profit-container');
    let deoContainer = document.getElementById('floating-bubble-deo-container');
    let isAllPopupsHidden = localStorage.getItem('HIDE_ALL_FLOATING_POPUPS') === 'true';

    // Nếu người dùng đang bật nút "Ẩn Popup" trên Header -> Khóa ẩn toàn bộ
    if (isAllPopupsHidden) {
        if (deoContainer) deoContainer.classList.add('hidden');
        if (profitContainer) profitContainer.classList.add('hidden');
        if (typeof applyAllFloatingPopupsVisibility === 'function') {
            applyAllFloatingPopupsVisibility(true);
        }
        return;
    }

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

    let directGold = window.isMerchantExcludeRefund ? 0 : (totalRuns * 1.2);
    let totalMaterials = isEventMode ? (totalRuns * 8) : 0;
    let materialGold = totalMaterials * matPrice;
    let totalGold = directGold + materialGold;
    
    let totalVnd = goldRateVnd > 0 ? (totalGold / 1000) * goldRateVnd : 0;

    let existingCard = document.getElementById('floating-merchant-card');
    let isAllPopupsHidden = localStorage.getItem('HIDE_ALL_FLOATING_POPUPS') === 'true';
    let isHidden = isAllPopupsHidden ? true : (existingCard ? existingCard.classList.contains('hidden') : true);

    holder.innerHTML = `
        &lt;div id="floating-merchant-card" onclick="event.stopPropagation()" class="${isHidden ? 'hidden' : ''} w-[345px] bg-gray-900 border border-amber-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-xs"&gt;
            &lt;div class="flex items-center justify-between border-b border-gray-800 pb-2"&gt;
                &lt;span class="text-amber-400 font-black uppercase tracking-wider flex items-center gap-1.5"&gt;
                    &lt;i class="fa-solid fa-gem animate-pulse"&gt;&lt;/i&gt; Thu Nhập Thương Nhân
                &lt;/span&gt;
                &lt;div class="flex items-center gap-2"&gt;
                    &lt;label class="flex items-center gap-1 cursor-pointer bg-gray-955 px-2 py-0.5 rounded border border-cyan-500/40 select-none" title="Không tính tiền vàng hoàn thương nhân"&gt;
                        &lt;input id="chk-merchant-exclude-refund" type="checkbox" ${window.isMerchantExcludeRefund ? 'checked' : ''} onchange="toggleMerchantExcludeRefundState(this.checked)" class="accent-cyan-400 cursor-pointer w-3 h-3"&gt;
                        &lt;span class="text-[10px] font-bold text-cyan-300"&gt;Bỏ Hoàn&lt;/span&gt;
                    &lt;/label&gt;
                    &lt;button onclick="toggleFloatingMerchantCard(event)" class="text-gray-400 hover:text-white text-sm font-black cursor-pointer"&gt;&times;&lt;/button&gt;
                &lt;/div&gt;
            &lt;/div&gt;
            
            &lt;div class="flex flex-col gap-2 text-gray-300 font-semibold my-1 font-mono text-[11px]"&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Số TK đã hoàn thành (3/3):&lt;/span&gt;
                    &lt;strong class="text-emerald-400 text-xs font-black"&gt;${completedAccounts} / ${totalActiveAccounts} acc&lt;/strong&gt;
                &lt;/div&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Số TK chưa hoàn thành:&lt;/span&gt;
                    &lt;strong class="text-cyan-400 text-xs font-black"&gt;${unfinishedAccounts} acc&lt;/strong&gt;
                &lt;/div&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Tổng trận thực tế đã đi:&lt;/span&gt;
                    &lt;strong class="text-yellow-300 text-xs font-black"&gt;${totalRuns} lượt&lt;/strong&gt;
                &lt;/div&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Vàng Thương Nhân (${window.isMerchantExcludeRefund ? 'Đã Bỏ Hoàn' : '1.2v/lượt'}):&lt;/span&gt;
                    &lt;strong class="text-amber-400 text-xs font-bold"&gt;+${directGold.toFixed(2)}v&lt;/strong&gt;
                &lt;/div&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Nguyên liệu ${isEventMode ? '(+8NL/lượt)' : '(Chưa bật SK)'}:&lt;/span&gt;
                    &lt;strong class="text-amber-400 text-xs font-bold"&gt;${totalMaterials.toLocaleString('vi-VN')} NL ${isEventMode ? `(+${materialGold.toFixed(2)}v)` : '(+0.00v)'}&lt;/strong&gt;
                &lt;/div&gt;
            &lt;/div&gt;
            
            &lt;div class="w-full h-px bg-gray-800"&gt;&lt;/div&gt;
            
            &lt;div class="bg-gray-955 border border-gray-800 rounded-xl p-3 text-center flex flex-col items-center justify-center font-mono"&gt;
                &lt;div class="text-emerald-400 font-black text-xl"&gt;
                    +${totalGold.toFixed(2)} Vàng
                &lt;/div&gt;
                &lt;div class="text-gray-400 text-[11px] font-bold mt-0.5 font-sans"&gt;
                    ~ ${Math.round(totalVnd).toLocaleString('vi-VN')} VNĐ
                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
    `;
}

function toggleMerchantExcludeRefundState(isChecked) {
    window.isMerchantExcludeRefund = isChecked;
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
    if (typeof activeTeamId !== 'undefined') {
        activeTeamId = "merchant_tab_active";
    }

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');

    applyMerchantPopupVisibility();
    initMerchantViewport();
    let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');
    if (merchantPanel) {
        merchantPanel.classList.remove('hidden');
        renderMerchantMainUI();
    }
    if (typeof syncMerchantTimerWidgetVisibility === 'function') {
        syncMerchantTimerWidgetVisibility();
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
            &lt;div class="flex items-center justify-between gap-2 pb-2 border-b border-gray-700/70"&gt;
                &lt;div class="flex-1 overflow-x-auto no-scrollbar"&gt;
                    &lt;div class="flex items-center gap-1.5 min-w-max" id="merchant-sub-tabs-holder"&gt;&lt;/div&gt;
                &lt;/div&gt;
            &lt;/div&gt;

            &lt;div class="flex-1 overflow-hidden bg-gray-900/60 rounded-xl border border-gray-800 p-1.5"&gt;
                &lt;table class="w-full text-left text-xs border-collapse table-fixed"&gt;
                    &lt;thead&gt;
                        &lt;tr class="text-gray-400 border-b border-gray-800 pb-2 uppercase text-[11px] font-bold"&gt;
                            &lt;th class="p-2 w-8 text-center"&gt;KÉO&lt;/th&gt;
                            &lt;th class="p-2 w-8 text-center"&gt;STT&lt;/th&gt;
                            &lt;th class="p-2 w-[250px]"&gt;TÊN TÀI KHOẢN&lt;/th&gt;
                            &lt;th class="p-2 w-16 text-center"&gt;CHECK&lt;/th&gt;
                            &lt;th class="p-2 text-center w-[220px]"&gt;TIẾN ĐỘ THƯƠNG NHÂN&lt;/th&gt;
                            &lt;th class="p-2 w-12 text-center"&gt;KHÓA&lt;/th&gt;
                            &lt;th class="p-2 w-12 text-center"&gt;COPY&lt;/th&gt;
                            &lt;th class="p-2 w-28 text-center"&gt;CHUYỂN NHÓM&lt;/th&gt;
                        &lt;/tr&gt;
                    &lt;/thead&gt;
                    &lt;tbody id="merchant-members-table-body"&gt;&lt;/tbody&gt;
                &lt;/table&gt;
            &lt;/div&gt;
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
                &lt;button onclick="selectMerchantTeam('${t.id}')" class="px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${isActive ? 'bg-amber-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}"&gt;
                    &lt;i class="fa-solid fa-users text-[10px] mr-1"&gt;&lt;/i&gt;${t.name.toUpperCase()}
                &lt;/button&gt;
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
        tbody.innerHTML = `&lt;tr&gt;&lt;td colspan="8" class="text-center py-6 text-gray-500 italic"&gt;Chưa chọn nhóm tài khoản.&lt;/td&gt;&lt;/tr&gt;`;
        return;
    }

    let allDataTeams = systemDatabase.teams.filter(t => t.type === 'data');
    let currentHour = new Date().getHours();
    let html = "";

    for (let i = 0; i &lt; 8; i++) {
        let memberId = team.memberIds[i];
        let m = memberId ? systemDatabase.members[memberId] : null;

        if (!m) {
            html += `
                &lt;tr class="border-b border-gray-800/50 bg-gray-900/30 text-gray-600"&gt;
                    &lt;td class="py-3 px-1 text-center"&gt;&lt;i class="fa-solid fa-bars opacity-30"&gt;&lt;/i&gt;&lt;/td&gt;
                    &lt;td class="py-3 px-1 text-center font-bold"&gt;${i + 1}&lt;/td&gt;
                    &lt;td class="py-3 px-1 italic whitespace-nowrap overflow-hidden text-ellipsis"&gt;-- Vị trí trống --&lt;/td&gt;
                    &lt;td class="py-3 px-1 text-center"&gt;--&lt;/td&gt;
                    &lt;td class="py-3 px-1 text-center"&gt;--&lt;/td&gt;
                    &lt;td class="py-3 px-1 text-center"&gt;--&lt;/td&gt;
                    &lt;td class="py-3 px-1 text-center"&gt;--&lt;/td&gt;
                    &lt;td class="py-3 px-1 text-center"&gt;--&lt;/td&gt;
                &lt;/tr&gt;
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
            if (diffHour &lt; 0) diffHour += 24;

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
                &lt;div class="flex items-center gap-1 w-[240px]"&gt;
                    &lt;input type="text" id="merchant-input-name-${m.id}" value="${pureCoreName}" class="bg-gray-800 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-[170px] font-bold shrink-0" /&gt;
                    &lt;button onclick="saveMerchantMemberName('${m.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded transition text-xs flex items-center gap-1 cursor-pointer shrink-0"&gt;
                        &lt;i class="fa-solid fa-floppy-disk"&gt;&lt;/i&gt; Lưu
                    &lt;/button&gt;
                &lt;/div&gt;
            `;
        } else {
            nameCellHtml = `
                &lt;div class="flex items-center gap-1.5 group cursor-pointer w-[240px] overflow-hidden"&gt;
                    &lt;span class="font-bold text-gray-100 text-xs whitespace-nowrap overflow-hidden text-ellipsis shrink" title="${fullDisplayName}"&gt;${fullDisplayName || '&lt;span class="text-gray-600 italic"&gt;[Trống]&lt;/span&gt;'}&lt;/span&gt;
                    &lt;button onclick="enableEditMerchantMemberName('${m.id}')" class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-gray-800 hover:bg-gray-700 text-blue-400 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-gray-700 cursor-pointer shrink-0"&gt;
                        &lt;i class="fa-solid fa-pen"&gt;&lt;/i&gt; Sửa
                    &lt;/button&gt;
                &lt;/div&gt;
            `;
        }

        let progressCellHtml = "";
        if (isLocked) {
            progressCellHtml = `
                &lt;div class="flex items-center justify-between w-full h-9 bg-gray-955 border border-gray-800 rounded-lg overflow-hidden opacity-30 pointer-events-none select-none"&gt;
                    &lt;button class="bg-gray-800/80 text-gray-500 w-7 h-full font-black flex items-center justify-center text-xs shrink-0"&gt;-&lt;/button&gt;
                    &lt;div class="flex-1 h-full relative flex items-center justify-center"&gt;
                        &lt;div class="absolute left-0 top-0 bottom-0 bg-emerald-600/50 transition-all duration-300" style="width: ${percent}%;"&gt;&lt;/div&gt;
                        &lt;span class="relative z-10 font-black text-xs text-gray-400"&gt;${runs} / 3&lt;/span&gt;
                    &lt;/div&gt;
                    &lt;button class="bg-gray-800/80 text-gray-500 w-7 h-full font-black flex items-center justify-center text-xs shrink-0"&gt;+&lt;/button&gt;
                &lt;/div&gt;
            `;
        } else {
            progressCellHtml = `
                &lt;div class="flex items-center justify-between w-full h-9 bg-gray-955 border border-gray-700 hover:border-amber-500/60 rounded-lg overflow-hidden select-none shadow-inner transition"&gt;
                    &lt;button onclick="changeMerchantProgress('${m.id}', -1)" class="bg-gray-800/90 hover:bg-gray-700 text-rose-400 hover:text-white w-7 h-full font-black transition cursor-pointer border-r border-gray-700/80 flex items-center justify-center text-xs shrink-0 shadow-sm"&gt;-&lt;/button&gt;
                    &lt;div onclick="tapIncrementMerchantProgress('${m.id}')" title="Nhấn trực tiếp để tăng tiến độ" class="flex-1 h-full relative cursor-pointer flex items-center justify-center group/bar"&gt;
                        &lt;div class="absolute left-0 top-0 bottom-0 ${runs === 3 ? 'bg-emerald-500' : 'bg-emerald-600/90'} transition-all duration-300" style="width: ${percent}%;"&gt;&lt;/div&gt;
                        &lt;span class="relative z-10 font-black text-xs text-white drop-shadow group-hover/bar:scale-105 transition-transform"&gt;${runs} / 3&lt;/span&gt;
                    &lt;/div&gt;
                    &lt;button onclick="changeMerchantProgress('${m.id}', 1)" class="bg-gray-800/90 hover:bg-gray-700 text-emerald-400 hover:text-white w-7 h-full font-black transition cursor-pointer border-l border-gray-700/80 flex items-center justify-center text-xs shrink-0 shadow-sm"&gt;+&lt;/button&gt;
                &lt;/div&gt;
            `;
        }

        let teamOptionsHtml = allDataTeams.map(dt => `
            &lt;option value="${dt.id}" ${dt.id === team.id ? 'selected' : ''}&gt;- ${dt.name.toUpperCase()} -&lt;/option&gt;
        `).join('');

        html += `
            &lt;tr draggable="true" 
                ondragstart="handleMerchantDragStart(event, ${i})" 
                ondragover="handleMerchantDragOver(event)" 
                ondrop="handleMerchantDrop(event, ${i})" 
                class="border-b border-gray-800 hover:bg-gray-800/40 transition"&gt;
                
                &lt;td class="py-3 px-1 text-center cursor-grab active:cursor-grabbing text-gray-500 hover:text-amber-400"&gt;
                    &lt;i class="fa-solid fa-bars"&gt;&lt;/i&gt;
                &lt;/td&gt;
                &lt;td class="py-3 px-1 text-center font-bold text-gray-400"&gt;${i + 1}&lt;/td&gt;
                &lt;td class="py-3 px-1 w-[250px]"&gt;${nameCellHtml}&lt;/td&gt;
                &lt;td class="py-3 px-1 text-center"&gt;
                    &lt;span class="inline-block px-2 py-0.5 rounded text-xs transition-all duration-200 ${checkClass}"&gt;
                        ${checkHourText}
                    &lt;/span&gt;
                &lt;/td&gt;
                &lt;td class="py-3 px-1 text-center"&gt;${progressCellHtml}&lt;/td&gt;
                &lt;td class="py-3 px-1 text-center"&gt;
                    &lt;button onclick="toggleMerchantMemberLock('${m.id}')" class="text-sm transition cursor-pointer ${isLocked ? 'text-rose-500' : 'text-gray-600 hover:text-gray-400'}"&gt;
                        &lt;i class="fa-solid ${isLocked ? 'fa-lock' : 'fa-lock-open'}"&gt;&lt;/i&gt;
                    &lt;/button&gt;
                &lt;/td&gt;
                &lt;td class="py-3 px-1 text-center"&gt;
                    &lt;button onclick="copyMerchantMemberName('${pureCoreName}')" class="bg-gray-800 hover:bg-gray-700 text-gray-300 p-1.5 rounded-lg transition border border-gray-700 cursor-pointer hover:border-gray-500" title="Copy tên TK gốc: ${pureCoreName}"&gt;
                        &lt;i class="fa-solid fa-copy"&gt;&lt;/i&gt;
                    &lt;/button&gt;
                &lt;/td&gt;
                &lt;td class="py-3 px-1 text-center"&gt;
                    &lt;select onchange="moveMerchantMemberToTeam('${m.id}', this.value)" class="bg-gray-800 border border-gray-700 rounded p-1 text-[11px] text-gray-200 focus:outline-none font-semibold cursor-pointer w-full text-center"&gt;
                        ${teamOptionsHtml}
                    &lt;/select&gt;
                &lt;/td&gt;
            &lt;/tr&gt;
        `;
    }

    tbody.innerHTML = html;
}

// --- 4. THAO TÁC TIẾN ĐỘ & DỮ LIỆU THƯƠNG NHÂN (+1 LƯỢT = +1 NGÂN PHIẾU) ---
function enableEditMerchantMemberName(memberId) {
    editingMerchantMemberId = memberId;
    renderMerchantTableBody();
    setTimeout(() =&gt; {
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
    
    if (delta &gt; 0 && current &gt;= 3) {
        if (typeof logUserAction === 'function') logUserAction(`Tài khoản [${m.name}] đã hoàn thành tối đa 3/3 lượt!`);
        return;
    }

    let nextVal = current + delta;

    if (nextVal &gt;= 0 && nextVal &lt;= 3) {
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

    if (current &gt;= 3) {
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
    navigator.clipboard.writeText(cleanName).then(() =&gt; {
        if (typeof logUserAction === 'function') logUserAction(`Đã Copy: ${cleanName}`);
    });
}

function moveMerchantMemberToTeam(memberId, targetTeamId) {
    let currentTeam = systemDatabase.teams.filter(t =&gt; t.type === 'data').find(t =&gt; t.id === activeMerchantTeamId);
    let targetTeam = systemDatabase.teams.find(t =&gt; t.id === targetTeamId);

    if (!currentTeam || !targetTeam || currentTeam.id === targetTeam.id) return;

    let m = systemDatabase.members[memberId];
    currentTeam.memberIds = currentTeam.memberIds.filter(id =&gt; id !== memberId);
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

    let team = systemDatabase.teams.filter(t =&gt; t.type === 'data').find(t =&gt; t.id === activeMerchantTeamId);
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

if (typeof window.refreshUserInterfaceLayout === 'function' && !window.refreshUserInterfaceLayout.__merchantHooked) {
    let originalRefreshUI = window.refreshUserInterfaceLayout;
    window.refreshUserInterfaceLayout = function() {
        originalRefreshUI();
        
        let btnMerchant = document.getElementById('btn-main-tab-merchant');
        let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');
        let isStillAtMerchant = btnMerchant && btnMerchant.classList.contains('bg-amber-600');

        if ((isMerchantTabActive || isStillAtMerchant) && merchantPanel) {
            isMerchantTabActive = true;
            let viewport = document.getElementById('active-panel-view-viewport');
            if (viewport) {
                Array.from(viewport.children).forEach(child =&gt; {
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
    window.refreshUserInterfaceLayout.__merchantHooked = true;
}

setInterval(() =&gt; {
    let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');
    if (merchantPanel && !merchantPanel.classList.contains('hidden')) {
        renderMerchantTableBody();
    }
}, 30000);

setInterval(() =&gt; {
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
