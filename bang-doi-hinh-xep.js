/* ==========================================================================
   MODULE: QUẢN LÝ VÀ HIỂN THỊ BẢNG ĐỘI HÌNH XẾP (LINEUP PRESET WORKSPACE)
   Chức năng: Quản lý các bộ preset đội hình, chuyển tab đội hình con (1->8, x2, x3),
   bổ sung cột Copy tên nhân vật độc lập, tối ưu chiều ngang cột tiến độ và
   cố định huy hiệu Thương Nhân ở đầu ô tiến độ.
   ========================================================================== */

let activeLineupSetupIndex = 0;

// HÀM SAO CHÉP TÊN NHÂN VẬT VÀO CLIPBOARD
function copyLineupMemberName(memberName) {
    if (!memberName || memberName === '-- Trống --' || String(memberName).trim() === '') return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(memberName).then(function() {
            if (typeof showSystemToastNotification === 'function') {
                showSystemToastNotification('Đã Copy Tên TK Gốc: ' + memberName, 'success');
            }
            if (typeof logActivityAction === 'function') {
                logActivityAction('Đã Copy Tên TK Gốc: ' + memberName, 'info');
            }
        }).catch(function() {
            fallbackCopyText(memberName);
        });
    } else {
        fallbackCopyText(memberName);
    }
}

function fallbackCopyText(text) {
    let ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        if (typeof showSystemToastNotification === 'function') {
            showSystemToastNotification('Đã Copy Tên TK Gốc: ' + text, 'success');
        }
        if (typeof logActivityAction === 'function') {
            logActivityAction('Đã Copy Tên TK Gốc: ' + text, 'info');
        }
    } catch (e) {}
    document.body.removeChild(ta);
}

// HÀM DỰNG GIAO DIỆN BẢNG ĐỘI HÌNH XẾP
function renderLineupWorkspaceView() {
    let viewport = document.getElementById('active-panel-view-viewport') || 
                   document.getElementById('team-content-container') || 
                   document.getElementById('main-workspace-body');
    if (!viewport) return;

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.remove('hidden');

    if (!systemDatabase || !systemDatabase.lineupPresets || systemDatabase.lineupPresets.length === 0) {
        viewport.innerHTML = '<div class="p-6 text-center text-gray-500 text-xs italic">Chưa có cấu hình đội hình xếp nào.</div>';
        return;
    }

    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; }) || systemDatabase.lineupPresets[0];
    let setups = preset.setups || [];

    if (activeLineupSetupIndex >= setups.length) {
        activeLineupSetupIndex = 0;
    }

    let activeSetup = setups[activeLineupSetupIndex] || { name: "1", memberIds: [] };

    // 1. DỰNG THANH TAB ĐỘI HÌNH CON (1 -> 8, DROPDOWN, THÊM, XÓA)
    let first8Setups = setups.slice(0, 8);
    let extraSetups = setups.slice(8);

    let tabsHtml = first8Setups.map(function(s, idx) {
        let isActive = (idx === activeLineupSetupIndex);
        let cls = isActive 
            ? "px-3 py-1.5 rounded-lg text-xs font-black bg-purple-900/60 text-purple-300 border border-purple-500 shadow transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            : "px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-800/80 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-gray-200 transition flex items-center gap-1.5 shrink-0 cursor-pointer";
        return '<button onclick="switchLineupSetup(' + idx + ')" class="' + cls + '"><i class="fa-solid fa-shuffle text-[10px]"></i>' + s.name + '</button>';
    }).join('');

    // Dropdown cho các đội ngoài top 8
    let extraDropdownHtml = '';
    if (extraSetups.length !== 0) {
        let extraOptions = extraSetups.map(function(s, eIdx) {
            let realIdx = eIdx + 8;
            let isSel = (realIdx === activeLineupSetupIndex) ? 'selected' : '';
            return '<option value="' + realIdx + '" ' + isSel + '>' + s.name + '</option>';
        }).join('');

        extraDropdownHtml = 
            '<select onchange="switchLineupSetup(parseInt(this.value))" class="bg-gray-800 border border-gray-700 text-purple-300 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer">' +
                '<option value="" disabled ' + (activeLineupSetupIndex < 8 ? 'selected' : '') + '>▼ Thêm</option>' +
                extraOptions +
            '</select>';
    }

    let setupNavHtml = 
        '<div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-800 shrink-0 flex-wrap">' +
            '<div class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 pb-1 sm:pb-0">' +
                tabsHtml +
                extraDropdownHtml +
                '<button onclick="addNewLineupSetup()" class="px-2.5 py-1.5 rounded-lg text-xs font-black bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1 shadow cursor-pointer" title="Thêm đội hình con mới">' +
                    '<i class="fa-solid fa-shuffle text-[10px]"></i> +' +
                '</button>' +
                '<button onclick="deleteCurrentLineupSetup()" class="px-2 py-1.5 rounded-lg text-xs font-black bg-rose-955 hover:bg-rose-700 text-rose-300 border border-rose-600 transition flex items-center justify-center shadow cursor-pointer ml-1" title="Xóa đội hình con đang chọn">' +
                    '<i class="fa-solid fa-trash-can text-[11px]"></i>' +
                '</button>' +
            '</div>' +
        '</div>';

    // 2. DỰNG BẢNG 8 TÀI KHOẢN (ĐÃ THÊM CỘT COPY & THU GỌN TIẾN ĐỘ)
    let rowsHtml = '';
    let membersDict = (systemDatabase && systemDatabase.members) ? systemDatabase.members : {};

    // Chuẩn bị danh sách thành viên để chọn trong dropdown
    let allMembersList = Object.values(membersDict);

    for (let slot = 0; slot !== 8; slot++) {
        let memId = (activeSetup.memberIds && activeSetup.memberIds[slot]) ? activeSetup.memberIds[slot] : '';
        let mem = memId ? membersDict[memId] : null;

        // Xây dựng dropdown chọn nhân vật
        let optionsHtml = '<option value="">-- Trống --</option>';
        optionsHtml += allMembersList.map(function(m) {
            let isSelected = (m.id === memId) ? 'selected' : '';
            let fCode = m.factionCode || m.factionId || '';
            let displayLabel = fCode ? (fCode + ' ' + m.name) : m.name;
            return '<option value="' + m.id + '" ' + isSelected + '>' + displayLabel + '</option>';
        }).join('');

        let selectMemberHtml = 
            '<select onchange="updateLineupMemberSlot(' + activeLineupSetupIndex + ', ' + slot + ', this.value)" class="w-full bg-gray-900 border border-gray-800 text-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer">' +
                optionsHtml +
            '</select>';

        // Nút Copy Tên Nhân Vật
        let copyBtnHtml = '';
        if (mem && mem.name) {
            copyBtnHtml = 
                '<button onclick="copyLineupMemberName(\'' + mem.name + '\')" class="w-7 h-7 rounded-lg bg-gray-900 hover:bg-cyan-600 text-gray-400 hover:text-white border border-gray-800 hover:border-cyan-500 transition flex items-center justify-center cursor-pointer shadow mx-auto" title="Copy tên: ' + mem.name + '">' +
                    '<i class="fa-regular fa-copy text-xs"></i>' +
                '</button>';
        } else {
            copyBtnHtml = 
                '<button disabled class="w-7 h-7 rounded-lg bg-gray-900/50 text-gray-600 border border-gray-800/40 flex items-center justify-center opacity-40 cursor-not-allowed mx-auto">' +
                    '<i class="fa-regular fa-copy text-xs"></i>' +
                '</button>';
        }

        // Cột Ngân Phiếu
        let npVal = (mem && typeof mem.nganPhieu !== 'undefined') ? mem.nganPhieu : 0;
        let npDisplayHtml = 
            '<div class="text-center font-mono font-bold text-amber-300 bg-gray-900 border border-gray-800 py-1 px-2 rounded-lg text-xs inline-block">' +
                npVal +
            '</div>';

        // Cột Tiến Độ (Đã thu gọn và đưa huy hiệu ◆ TN về sát mép trái - đầu ô)
        let curRuns = mem ? (parseInt(mem.currentRuns) || 0) : 0;
        let maxRuns = mem ? (parseInt(mem.maxRuns) || 2) : 2;
        let isDoneMerchant = mem ? (parseInt(mem.merchantRuns) >= 3) : false;

        let tnBadgeStart = isDoneMerchant 
            ? '<span class="absolute left-1.5 flex items-center gap-0.5 text-[9px] text-amber-300 bg-amber-950/90 border border-amber-500/60 px-1 py-0.5 rounded font-black font-sans shadow-xs">◆ TN</span>'
            : '';

        let progressCellHtml = 
            '<div class="flex items-center justify-center gap-1.5">' +
                '<button onclick="decrementLineupMemberRun(\'' + (mem ? mem.id : '') + '\')" ' + (!mem ? 'disabled' : '') + ' class="w-7 h-7 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold border border-gray-800 transition flex items-center justify-center cursor-pointer shadow text-xs disabled:opacity-30 disabled:cursor-not-allowed">-</button>' +
                '<button onclick="incrementLineupMemberRun(\'' + (mem ? mem.id : '') + '\')" ' + (!mem ? 'disabled' : '') + ' class="w-32 sm:w-36 h-7 rounded-lg relative flex items-center justify-center bg-gray-955 border border-gray-800 hover:border-purple-500/60 transition shadow font-mono text-xs font-bold text-gray-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">' +
                    tnBadgeStart +
                    '<span class="text-gray-100">' + curRuns + ' / ' + maxRuns + '</span>' +
                '</button>' +
            '</div>';

        // Cột Lần 2 & Lần 3
        let payL2 = (mem && mem.payModeL2) ? mem.payModeL2 : 'ticket';
        let payL3 = (mem && mem.payModeL3) ? mem.payModeL3 : 'ticket';

        let l2Html = 
            '<select onchange="changeLineupPayMode(\'' + (mem ? mem.id : '') + '\', 2, this.value)" ' + (!mem ? 'disabled' : '') + ' class="bg-gray-900 border border-gray-800 text-blue-300 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer disabled:opacity-30">' +
                '<option value="ticket" ' + (payL2 === 'ticket' ? 'selected' : '') + '>-Vé</option>' +
                '<option value="np50" ' + (payL2 === 'np50' ? 'selected' : '') + '>-50 NP</option>' +
                '<option value="free" ' + (payL2 === 'free' ? 'selected' : '') + '>Free</option>' +
            '</select>';

        let l3Html = (mem && maxRuns === 3)
            ? ('<select onchange="changeLineupPayMode(\'' + mem.id + '\', 3, this.value)" class="bg-gray-900 border border-gray-800 text-blue-300 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer">' +
                   '<option value="ticket" ' + (payL3 === 'ticket' ? 'selected' : '') + '>-Vé</option>' +
                   '<option value="np50" ' + (payL3 === 'np50' ? 'selected' : '') + '>-50 NP</option>' +
                   '<option value="free" ' + (payL3 === 'free' ? 'selected' : '') + '>Free</option>' +
               '</select>')
            : '<span class="text-gray-600 font-mono text-xs">-</span>';

        rowsHtml += 
            '<tr class="border-b border-gray-800/80 hover:bg-gray-850/30 transition text-xs">' +
                '<td class="p-2.5 text-center text-gray-500 font-mono"><i class="fa-solid fa-bars text-[10px] mr-1 opacity-60"></i>' + (slot + 1) + '</td>' +
                '<td class="p-2.5 text-left">' + selectMemberHtml + '</td>' +
                '<td class="p-2.5 text-center w-12">' + copyBtnHtml + '</td>' +
                '<td class="p-2.5 text-center w-16">' + npDisplayHtml + '</td>' +
                '<td class="p-2.5 text-center w-48">' + progressCellHtml + '</td>' +
                '<td class="p-2.5 text-center w-24">' + l2Html + '</td>' +
                '<td class="p-2.5 text-center w-20">' + l3Html + '</td>' +
            '</tr>';
    }

    viewport.innerHTML = 
        '<div class="w-full h-full flex flex-col p-3 bg-gray-900 border border-purple-500/50 rounded-2xl shadow-2xl text-xs overflow-hidden select-none font-sans">' +
            setupNavHtml +
            '<div class="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-gray-800 bg-gray-955/60">' +
                '<table class="w-full text-left border-collapse">' +
                    '<thead class="sticky top-0 bg-gray-950 z-10 border-b border-gray-800 shadow">' +
                        '<tr class="text-gray-400 uppercase font-bold text-[11px]">' +
                            '<th class="p-2.5 text-center w-10">STT</th>' +
                            '<th class="p-2.5 text-left">LẮP ĐỘI HÌNH</th>' +
                            '<th class="p-2.5 text-center w-12 text-cyan-400"><i class="fa-regular fa-copy mr-0.5"></i> COPY</th>' +
                            '<th class="p-2.5 text-center w-16 text-amber-400"><i class="fa-solid fa-scroll mr-0.5"></i> NP</th>' +
                            '<th class="p-2.5 text-center w-48">' +
                                '<div class="flex items-center justify-center gap-1.5">' +
                                    '<span>TIẾN ĐỘ</span>' +
                                    '<button onclick="batchIncrementRunsLineupTeam()" class="bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow" title="Cộng 1 lượt cho cả 8 tài khoản">' +
                                        '<i class="fa-solid fa-angles-up text-[9px]"></i> +1 Team' +
                                    '</button>' +
                                '</div>' +
                            '</th>' +
                            '<th class="p-2.5 text-center w-24">LẦN 2</th>' +
                            '<th class="p-2.5 text-center w-20">LẦN 3</th>' +
                        '</tr>' +
                    '</thead>' +
                    '<tbody class="divide-y divide-gray-800/80 font-sans">' +
                        rowsHtml +
                    '</tbody>' +
                '</table>' +
            '</div>' +
        '</div>';
}

// CÁC HÀM XỬ LÝ DỮ LIỆU ĐỘI HÌNH XẾP
function switchLineupSetup(setupIdx) {
    activeLineupSetupIndex = setupIdx;
    renderLineupWorkspaceView();
}

function updateLineupMemberSlot(setupIdx, slotIdx, newMemberId) {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset || !preset.setups || !preset.setups[setupIdx]) return;

    if (!preset.setups[setupIdx].memberIds) {
        preset.setups[setupIdx].memberIds = ["","","","","","","",""];
    }

    preset.setups[setupIdx].memberIds[slotIdx] = newMemberId;
    saveLineupSystemDatabase();
    renderLineupWorkspaceView();
}

function incrementLineupMemberRun(memberId) {
    if (!memberId || !systemDatabase.members[memberId]) return;
    let mem = systemDatabase.members[memberId];
    let cur = parseInt(mem.currentRuns) || 0;
    let max = parseInt(mem.maxRuns) || 2;
    if (cur !== max) {
        mem.currentRuns = cur + 1;
        saveLineupSystemDatabase();
        renderLineupWorkspaceView();
    }
}

function decrementLineupMemberRun(memberId) {
    if (!memberId || !systemDatabase.members[memberId]) return;
    let mem = systemDatabase.members[memberId];
    let cur = parseInt(mem.currentRuns) || 0;
    if (cur !== 0) {
        mem.currentRuns = cur - 1;
        saveLineupSystemDatabase();
        renderLineupWorkspaceView();
    }
}

function batchIncrementRunsLineupTeam() {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset || !preset.setups || !preset.setups[activeLineupSetupIndex]) return;

    let memberIds = preset.setups[activeLineupSetupIndex].memberIds || [];
    let updatedCount = 0;

    memberIds.forEach(function(mId) {
        if (mId && systemDatabase.members[mId]) {
            let mem = systemDatabase.members[mId];
            let cur = parseInt(mem.currentRuns) || 0;
            let max = parseInt(mem.maxRuns) || 2;
            if (cur !== max) {
                mem.currentRuns = cur + 1;
                updatedCount++;
            }
        }
    });

    if (updatedCount !== 0) {
        saveLineupSystemDatabase();
        if (typeof showSystemToastNotification === 'function') {
            showSystemToastNotification('Đã +1 lượt cho ' + updatedCount + ' tài khoản!', 'success');
        }
        renderLineupWorkspaceView();
    }
}

function changeLineupPayMode(memberId, runNum, newMode) {
    if (!memberId || !systemDatabase.members[memberId]) return;
    let mem = systemDatabase.members[memberId];
    if (runNum === 2) mem.payModeL2 = newMode;
    if (runNum === 3) mem.payModeL3 = newMode;
    saveLineupSystemDatabase();
}

function addNewLineupSetup() {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset) return;

    let newSetupName = prompt('Nhập tên đội hình con mới (VD: 9, 2x2, Team VIP):');
    if (!newSetupName || String(newSetupName).trim() === '') return;

    preset.setups.push({
        name: newSetupName.trim(),
        memberIds: ["","","","","","","",""]
    });

    activeLineupSetupIndex = preset.setups.length - 1;
    saveLineupSystemDatabase();
    renderLineupWorkspaceView();
}

function deleteCurrentLineupSetup() {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset || preset.setups.length <= 1) {
        alert('Phải giữ lại ít nhất 1 đội hình con!');
        return;
    }

    if (!confirm('Bạn có chắc muốn xóa đội hình [' + preset.setups[activeLineupSetupIndex].name + '] không?')) return;

    preset.setups.splice(activeLineupSetupIndex, 1);
    if (activeLineupSetupIndex >= preset.setups.length) {
        activeLineupSetupIndex = preset.setups.length - 1;
    }
    saveLineupSystemDatabase();
    renderLineupWorkspaceView();
}

function saveLineupSystemDatabase() {
    if (typeof saveSystemDatabase === 'function') {
        saveSystemDatabase();
    } else if (typeof autoSaveToDisk === 'function') {
        autoSaveToDisk();
    } else {
        localStorage.setItem('THAI_HU_UPGRADED_RUNTIME_DB', JSON.stringify(systemDatabase));
    }
}

window.copyLineupMemberName = copyLineupMemberName;
window.renderLineupWorkspaceView = renderLineupWorkspaceView;
window.switchLineupSetup = switchLineupSetup;
window.updateLineupMemberSlot = updateLineupMemberSlot;
window.incrementLineupMemberRun = incrementLineupMemberRun;
window.decrementLineupMemberRun = decrementLineupMemberRun;
window.batchIncrementRunsLineupTeam = batchIncrementRunsLineupTeam;
window.changeLineupPayMode = changeLineupPayMode;
window.addNewLineupSetup = addNewLineupSetup;
window.deleteCurrentLineupSetup = deleteCurrentLineupSetup;
