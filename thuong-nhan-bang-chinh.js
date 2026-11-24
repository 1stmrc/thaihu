// Tên file: thuong-nhan-bang-chinh.js
// Chức năng: Dựng khung Viewport tab Thương Nhân, thanh chuyển team con và bảng danh sách 8 tài khoản.

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
    if (typeof setupGoldRateLiveSync === 'function') setupGoldRateLiveSync();
    if (typeof renderMerchantCardModal === 'function') renderMerchantCardModal();
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

window.initMerchantViewport = initMerchantViewport;
window.renderMerchantMainUI = renderMerchantMainUI;
window.renderMerchantTableBody = renderMerchantTableBody;
