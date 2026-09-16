// Tên file: bang-du-lieu-goc.js
// Chức năng: Bảng Dữ Liệu Gốc - +1 tiến độ Thái Hư tự động +4 Ngân Phiếu, chỉ đổi màu text Ngân Phiếu âm & click Ngân Phiếu chuyển đến Đội Hình Xếp.
// Con của file: giao-dien-thai-hu.js

function renderDataViewTableLayout(team, targetWrapper) {
    let currentTicketPriceInput = parseFloat(document.getElementById('input-ticket-price')?.value) || 25;
    let todayKey = new Date().toISOString().split('T')[0];
    if (typeof systemDatabase !== 'undefined') {
        if (!systemDatabase.ticketPriceSnapshots) systemDatabase.ticketPriceSnapshots = {};
        systemDatabase.ticketPriceSnapshots[todayKey] = currentTicketPriceInput;
    }

    let html = `
        <table class="w-full text-left border-collapse min-w-[780px] text-xs table-fixed">
            <thead>
                <tr class="bg-gray-900 border-b border-gray-700 text-gray-400 text-[11px] uppercase tracking-wider font-bold">
                    <th class="p-3 text-center w-10">STT</th>
                    <th class="p-3 w-[290px]">TÊN TÀI KHOẢN</th>
                    <th class="p-3 text-center w-[190px]">TIẾN ĐỘ</th>
                    <th class="p-3 text-center w-[145px]">LẦN 2</th>
                    <th class="p-3 text-center w-[145px]">LẦN 3</th>
                    <th class="p-3 text-center w-24">CHUYỂN NHÓM</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
    `;

    team.memberIds.forEach((mId, index) => {
        let m = systemDatabase.members[mId]; if(!m) return;

        let displayTitle = (typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, team) : m.name;
        let coreAccountName = m.name || "";

        // 1. ĐỌC SỐ NGÂN PHIẾU: CHỈ NHẤP NHÁY MÀU CHỮ SỐ NGÂN PHIẾU ÂM
        let npVal = (m.nganPhieu !== undefined && m.nganPhieu !== null) ? parseInt(m.nganPhieu) || 0 : 0;
        let isNegativeNp = npVal < 0;
        let npColorClass = isNegativeNp 
            ? "text-rose-500 font-black animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]" 
            : "text-amber-400/90 font-medium";
        let npDisplay = `${npVal.toLocaleString('vi-VN')} Ngân Phiếu`;

        let textSlotCell = m.isEditing ? `
            <div class="flex items-center gap-1.5 py-1">
                <input type="text" id="edit-txt-field-${m.id}" value="${coreAccountName}" placeholder="Nhập tên TK..." class="w-full bg-gray-700 border border-gray-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-bold">
                <button onclick="commitMemberNameSave('${m.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1.5 rounded-md transition shrink-0 shadow cursor-pointer"><i class="fa-solid fa-save"></i> Lưu</button>
            </div>` : `
            <div class="relative flex items-center justify-between group/rowname py-1 px-1 min-h-[38px]">
                <div class="flex flex-col justify-center min-w-0 flex-1 pr-1">
                    <span class="font-bold text-gray-100 text-xs tracking-wide block whitespace-normal break-words">${displayTitle || '<span class="text-gray-600 font-normal italic">[Trống]</span>'}</span>
                    
                    <!-- 2. CLICK VÀO TEXT NGÂN PHIẾU SẼ TỰ CHUYỂN ĐẾN ĐỘI HÌNH XẾP -->
                    <span onclick="navigateToLineupTeamForMember('${m.id}')" class="text-[10px] ${npColorClass} font-mono block mt-0.5 inline-block cursor-pointer hover:underline" title="Nhấn để chuyển đến Đội Hình Xếp của tài khoản này">
                        ${npDisplay} <i class="fa-solid fa-arrow-up-right-from-square text-[8px] ml-0.5 opacity-60"></i>
                    </span>
                </div>
                
                <div class="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-30 opacity-0 pointer-events-none group-hover/rowname:opacity-100 group-hover/rowname:pointer-events-auto transition-opacity duration-200">
                    <select onchange="updateMemberMaxRunsLimit('${m.id}', this.value)" class="bg-gray-800 border border-gray-600 rounded text-gray-200 text-[10px] px-1.5 py-1 focus:outline-none cursor-pointer shadow" title="Chọn số lượt">
                        <option value="3" ${m.maxRuns === 3 ? 'selected' : ''}>3 Lượt</option>
                        <option value="2" ${m.maxRuns === 2 ? 'selected' : ''}>2 Lượt</option>
                        <option value="1" ${m.maxRuns === 1 ? 'selected' : ''}>1 Lượt</option>
                    </select>
                    <button onclick="enableMemberNameEditing('${m.id}')" class="text-blue-300 hover:text-white text-[10px] bg-blue-900/80 hover:bg-blue-800 px-2 py-1 rounded border border-blue-600 transition cursor-pointer font-bold shadow" title="Sửa tên TK"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button onclick="handleCopyMemberNameWithLog('${coreAccountName}')" class="text-amber-300 hover:text-white text-[10px] bg-amber-900/80 hover:bg-amber-800 px-2 py-1 rounded border border-amber-600 transition cursor-pointer font-bold shadow" title="Copy tên TK gốc"><i class="fa-solid fa-copy"></i> Copy</button>
                </div>
            </div>`;

        let crossMigrationOptions = systemDatabase.teams.filter(x => x.type === 'data' && x.id !== team.id).map(x => `<option value="${x.id}">${x.name.toUpperCase()}</option>`).join('');
        let percent = m.maxRuns > 0 ? (m.currentRuns / m.maxRuns) * 100 : 0;
        let isCompleted = m.currentRuns >= m.maxRuns;
        let fillBg = isCompleted ? "bg-emerald-500" : "bg-teal-500";
        
        let dynamicGlowStyle = !isCompleted ? `background: linear-gradient(90deg, #0d9488 0%, #2dd4bf 25%, #5eead4 50%, #2dd4bf 75%, #0d9488 100%); background-size: 250% 100%; animation: shimmerProgress 1.2s infinite linear;` : "";
        let textColor = m.currentRuns === 0 ? "text-white opacity-80" : "text-green-300 font-black drop-shadow-md";
        let runColorStyle = m.currentRuns === 0 ? "text-white" : "text-green-300 font-black";

        let modeL2 = m.payModeL2 || 'np50';
        let modeL3 = m.payModeL3 || 'np50';

        let colL2Html = "";
        let colL3Html = "";

        if (m.maxRuns >= 2) {
            colL2Html = `
                <div class="flex items-center justify-center" onmousedown="event.stopPropagation()">
                    <select id="select-datamember-paymode-${m.id}-2" onchange="handleDataMemberPayModeChange('${m.id}', 2, this.value)" class="bg-gray-900 border border-gray-700 text-purple-300 font-bold rounded px-2 py-1 text-[11px] focus:outline-none cursor-pointer w-[135px] text-center shadow-inner">
                        <option value="np50" ${modeL2 === 'np50' ? 'selected' : ''}>-50 Ngân Phiếu</option>
                        <option value="ticket" ${modeL2 === 'ticket' ? 'selected' : ''}>-Vé</option>
                        <option value="xu40" ${modeL2 === 'xu40' ? 'selected' : ''}>-40 Xu</option>
                    </select>
                </div>`;
        } else {
            colL2Html = `<div class="text-gray-600 text-center text-xs">-</div>`;
        }

        if (m.maxRuns >= 3) {
            colL3Html = `
                <div class="flex items-center justify-center" onmousedown="event.stopPropagation()">
                    <select id="select-datamember-paymode-${m.id}-3" onchange="handleDataMemberPayModeChange('${m.id}', 3, this.value)" class="bg-gray-900 border border-gray-700 text-cyan-300 font-bold rounded px-2 py-1 text-[11px] focus:outline-none cursor-pointer w-[135px] text-center shadow-inner">
                        <option value="np50" ${modeL3 === 'np50' ? 'selected' : ''}>-50 Ngân Phiếu</option>
                        <option value="ticket" ${modeL3 === 'ticket' ? 'selected' : ''}>-Vé</option>
                        <option value="xu40" ${modeL3 === 'xu40' ? 'selected' : ''}>-40 Xu</option>
                    </select>
                </div>`;
        } else {
            colL3Html = `<div class="text-gray-600 text-center text-xs">-</div>`;
        }

        let skipNLButton = `
            <label class="flex items-center justify-center cursor-pointer text-gray-500 hover:text-amber-500 transition shrink-0 ml-1" title="${m.skipStatNL ? 'Đang khóa: Không tính NL' : 'Đang mở: Tính NL'}">
                <input type="checkbox" ${m.skipStatNL ? 'checked' : ''} onchange="toggleSkipStatNLState('${m.id}', this.checked)" class="sr-only">
                <i class="fa-solid ${m.skipStatNL ? 'fa-lock text-amber-500 text-xs' : 'fa-lock-open opacity-40 text-[10px]'}"></i>
            </label>
        `;

        html += `
            <tr class="hover:bg-gray-800/40 transition group-rows" draggable="true" ondragstart="onRowDragStart(event, ${index})" ondragover="onRowDragOver(event)" ondragleave="onRowDragLeave(event)" ondrop="onRowDrop(event, ${index})">
                <td class="p-2 text-center font-mono text-gray-500 font-bold align-middle cursor-move whitespace-nowrap">
                    <i class="fa-solid fa-bars text-[10px] opacity-40 mr-1"></i>${index + 1}
                </td>
                
                <td class="p-2 align-middle overflow-visible">${textSlotCell}</td>
                
                <td class="p-2 align-middle">
                    <div class="flex items-center gap-2 justify-between w-full mx-auto">
                        <button onclick="adjustRunsCounter('${m.id}', -1)" class="w-7 h-7 bg-gray-700 border border-gray-600 text-gray-300 hover:bg-rose-955 hover:text-rose-400 rounded-lg flex items-center justify-center font-black transition cursor-pointer shrink-0">&minus;</button>
                        <button onclick="adjustRunsCounter('${m.id}', 1)" class="relative flex-1 h-7 rounded-lg border border-gray-600 overflow-hidden shadow-inner bg-gray-955 cursor-pointer group hover:border-gray-500 transition-colors">
                            <div class="absolute left-0 top-0 h-full ${fillBg} transition-all duration-300 ease-out opacity-90" style="width: ${percent}%; ${dynamicGlowStyle}"></div>
                            <div class="absolute inset-0 flex items-center justify-center text-[11px] font-black ${textColor} z-10 tracking-wider">
                                <span class="font-mono bg-gray-900/70 px-1.5 py-0.5 rounded ${runColorStyle}">${m.currentRuns} / ${m.maxRuns}</span>
                            </div>
                        </button>
                        <div class="w-6 h-7 flex items-center justify-center">${skipNLButton}</div>
                    </div>
                </td>

                <td class="p-2 align-middle text-center">${colL2Html}</td>
                <td class="p-2 align-middle text-center">${colL3Html}</td>
                
                <td class="p-2 text-center align-middle">
                    <div class="flex items-center justify-center gap-1">
                        <select id="migration-target-box-${m.id}" class="bg-gray-700 border border-gray-600 rounded-md px-1 py-1 text-[11px] text-white focus:outline-none w-[58px] font-semibold">
                            <option value="">- Nhóm -</option>${crossMigrationOptions}
                        </select>
                        <button onclick="handleRecordTeamMigrationWithLog('${m.id}', '${team.id}')" class="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-1.5 py-1 rounded-md transition shadow cursor-pointer">Đi</button>
                    </div>
                </td>
            </tr>`;
    });

    html += `</tbody></table>`; targetWrapper.innerHTML = html;
}

// HÀM ĐIỀU HƯỚNG TỪ TEXT NGÂN PHIẾU SANG ĐỘI HÌNH XẾP
function navigateToLineupTeamForMember(memberId) {
    if (!systemDatabase || !systemDatabase.members || !systemDatabase.members[memberId]) return;
    let m = systemDatabase.members[memberId];
    let memberName = m.name || "Không rõ tên";

    if (!systemDatabase.teams) return;

    let targetLineupTeam = systemDatabase.teams.find(t => t.type === 'lineup' && t.memberIds && t.memberIds.includes(memberId));

    if (targetLineupTeam) {
        activeTeamId = targetLineupTeam.id;
        
        if (typeof renderNavigationSubTabs === 'function') renderNavigationSubTabs();
        if (typeof renderActiveWorkspacePanel === 'function') renderActiveWorkspacePanel();
        
        if (typeof logUserAction === 'function') {
            logUserAction(`Chuyển đến [ ${targetLineupTeam.name.toUpperCase()} ] để chỉnh ngân phiếu tài khoản [ ${memberName} ]`);
        }
    } else {
        alert(`Tài khoản [ ${memberName} ] chưa có trong Đội Hình Xếp, không thể sửa ngân phiếu!`);
    }
}
window.navigateToLineupTeamForMember = navigateToLineupTeamForMember;

if (!document.getElementById('shimmer-progress-style')) {
    let styleTag = document.createElement('style');
    styleTag.id = 'shimmer-progress-style';
    styleTag.innerHTML = `
        @keyframes shimmerProgress {
            0% { background-position: 250% 0; }
            100% { background-position: -250% 0; }
        }
    `;
    document.head.appendChild(styleTag);
}

// LOGIC XỬ LÝ THANH TOÁN & TRỪ TRỰC TIẾP NGÂN PHIẾU CỦA TÀI KHOẢN KHI CHỌN -50 NP
function handleDataMemberPayModeChange(memberId, runLevel, modeValue) {
    if (!memberId || !systemDatabase.members || !systemDatabase.members[memberId]) return;
    let m = systemDatabase.members[memberId];

    let currentTicketPrice = parseFloat(document.getElementById('input-ticket-price')?.value) || 25;
    let oldMode = (runLevel === 2) ? (m.payModeL2 || 'np50') : (m.payModeL3 || 'np50');

    if (oldMode === 'np50') {
        m.nganPhieu = (parseInt(m.nganPhieu) || 0) + 50;
    }

    if (modeValue === 'np50') {
        m.nganPhieu = (parseInt(m.nganPhieu) || 0) - 50;
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

function commitMemberNameSave(id) { 
    let field = document.getElementById(`edit-txt-field-${id}`); 
    if(field && systemDatabase.members[id]) { 
        let rawInput = field.value.trim();
        systemDatabase.members[id].name = rawInput;
        systemDatabase.members[id].isEditing = false; 
        if (typeof evaluateLineupsDynamicCapacity === 'function') { evaluateLineupsDynamicCapacity(); } 
        renderNavigationSubTabs(); 
        renderActiveWorkspacePanel(); 
        saveStateToMemoryCache(); 

        if (typeof logUserAction === 'function') {
            logUserAction(`Đổi tên tài khoản Thái Hư: [ ${rawInput} ]`);
        }
    } 
}

function enableMemberNameEditing(id) { 
    if(systemDatabase.members[id]) { 
        systemDatabase.members[id].isEditing = true; 
        renderActiveWorkspacePanel(); 
    } 
}

// HÀM TĂNG/GIẢM TIẾN ĐỘ THÁI HƯ (+1 TIẾN ĐỘ = +4 NGÂN PHIẾU)
function adjustRunsCounter(memberId, step) { 
    let m = systemDatabase.members[memberId]; 
    if(!m) return; 
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

    let actualStep = targetValue - oldRuns; // +1 hoặc -1

    // +1 LƯỢT TIẾN ĐỘ THÁI HƯ = +4 NGÂN PHIẾU CHO TÀI KHOẢN
    let currentNP = (m.nganPhieu !== undefined && m.nganPhieu !== null) ? parseInt(m.nganPhieu) || 0 : 0;
    currentNP += (actualStep * 4);

    // Đồng thời xử lý trừ/hoàn 50 Ngân Phiếu nếu cấu hình thanh toán là -50 NP
    if (targetValue > oldRuns) {
        for (let r = oldRuns + 1; r <= targetValue; r++) {
            if (r === 2 && (m.payModeL2 || 'np50') === 'np50') {
                currentNP -= 50;
            }
            if (r === 3 && (m.payModeL3 || 'np50') === 'np50') {
                currentNP -= 50;
            }
        }
    } else if (targetValue < oldRuns) {
        for (let r = oldRuns; r > targetValue; r--) {
            if (r === 2 && (m.payModeL2 || 'np50') === 'np50') {
                currentNP += 50;
            }
            if (r === 3 && (m.payModeL3 || 'np50') === 'np50') {
                currentNP += 50;
            }
        }
    }

    m.nganPhieu = currentNP;
    m.currentRuns = targetValue; 
    if (typeof evaluateLineupsDynamicCapacity === 'function') { evaluateLineupsDynamicCapacity(); } 
    renderNavigationSubTabs(); 
    renderActiveWorkspacePanel(); 
    saveStateToMemoryCache(); 

    if (typeof logUserAction === 'function') { 
        logUserAction(`Tiến độ Thái Hư [ ${m.name} ]: ${m.currentRuns}/${m.maxRuns} lượt (Ngân Phiếu: ${m.nganPhieu})`); 
    } 
}

function updateMemberMaxRunsLimit(memberId, newLimit) {
    let m = systemDatabase.members[memberId];
    if (!m) return;
    m.maxRuns = parseInt(newLimit) || 3;
    if (m.currentRuns > m.maxRuns) m.currentRuns = m.maxRuns;
    if (typeof evaluateLineupsDynamicCapacity === 'function') { evaluateLineupsDynamicCapacity(); }
    refreshUserInterfaceLayout();
    if (typeof saveStateToMemoryCache === 'function') { saveStateToMemoryCache(); }

    if (typeof logUserAction === 'function') {
        logUserAction(`Đổi giới hạn Thái Hư [ ${m.name} ] thành ${m.maxRuns} lượt`);
    }
}

function handleCopyMemberNameWithLog(name) {
    if (typeof copyToClipboardTextSystem === 'function') {
        copyToClipboardTextSystem(name);
    }
    if (typeof logUserAction === 'function') {
        logUserAction(`Đã Copy Tên TK Gốc: ${name}`);
    }
}

function handleRecordTeamMigrationWithLog(memberId, currentTeamId) {
    let box = document.getElementById(`migration-target-box-${memberId}`);
    let targetTeamId = box ? box.value : "";
    let m = systemDatabase.members[memberId];

    if (typeof executeRecordTeamMigration === 'function') {
        executeRecordTeamMigration(memberId, currentTeamId);
    }

    if (targetTeamId && m && typeof logUserAction === 'function') {
        let targetTeam = systemDatabase.teams.find(x => x.id === targetTeamId);
        let targetName = targetTeam ? targetTeam.name.toUpperCase() : targetTeamId;
        logUserAction(`Chuyển tài khoản [ ${m.name} ] sang nhóm ${targetName}`);
    }
}

window.handleDataMemberPayModeChange = handleDataMemberPayModeChange;

// Tổng số dòng code trong file này: 275 dòng.