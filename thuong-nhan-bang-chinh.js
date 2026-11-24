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
    if (typeof setupGoldRateLiveSync === 'function') setupGoldRateLiveSync();
    if (typeof renderMerchantCardModal === 'function') renderMerchantCardModal();
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

window.initMerchantViewport = initMerchantViewport;
window.renderMerchantMainUI = renderMerchantMainUI;
window.renderMerchantTableBody = renderMerchantTableBody;
