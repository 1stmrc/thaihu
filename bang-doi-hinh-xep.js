/* ==========================================================================
   MODULE: QUẢN LÝ VÀ HIỂN THỊ BẢNG ĐỘI HÌNH XẾP (LINEUP PRESET WORKSPACE)
   Chức năng: Quản lý toàn diện các bộ Preset đội hình, chuyển tab đội hình con (1->8, x2, x3),
   thanh công cụ tác vụ nhanh, thống kê đội hình, bổ sung cột Copy tên nhân vật độc lập,
   tối ưu chiều rộng cột tiến độ và cố định huy hiệu Thương Nhân ở đầu ô tiến độ.
   ========================================================================== */

let activeLineupSetupIndex = 0;
let activeLineupTeamId = "";
let isLineupWorkspaceInitialized = false;

// ==========================================================================
// 1. CÁC HÀM TIỆN ÍCH, SAO CHÉP & ĐỊNH DẠNG TÊN NHÂN VẬT
// ==========================================================================

// Lấy tiền tố ký hiệu đội gốc (A, B, C, D, E, G, H, L...)
function getMemberTeamLetterPrefix(member) {
    if (!member || !member.originalTeamId) return "";
    if (typeof systemDatabase === 'undefined' || !systemDatabase.teams) return "";

    let teamsList = Array.isArray(systemDatabase.teams)
        ? systemDatabase.teams
        : Object.values(systemDatabase.teams);

    let foundTeam = teamsList.find(function(t) {
        return String(t.id) === String(member.originalTeamId);
    });

    if (!foundTeam || !foundTeam.name) return "";
    let rawName = String(foundTeam.name).trim();
    let parts = rawName.split(" ");
    let letter = parts[parts.length - 1] || rawName;
    return letter.toUpperCase() + ".";
}

// Định dạng tên hiển thị đầy đủ trong danh sách chọn (VD: D.01 dgc S11mon05)
function formatLineupMemberDisplayFull(member) {
    if (!member || !member.name) return "-- Trống --";
    let prefix = getMemberTeamLetterPrefix(member);
    let fCode = member.factionCode || member.factionId || "";
    if (fCode) {
        return prefix + fCode + " " + member.name;
    }
    return prefix + member.name;
}

// Sao chép tên nhân vật gốc vào bộ nhớ tạm (Clipboard)
function copyLineupMemberName(memberName) {
    if (!memberName || memberName === '-- Trống --' || String(memberName).trim() === '') return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(memberName).then(function() {
            showLineupToastNotification('Đã Copy Tên TK Gốc: ' + memberName, 'success');
            logLineupActivityAction('Đã Copy Tên TK Gốc: ' + memberName, 'info');
        }).catch(function() {
            fallbackCopyLineupText(memberName);
        });
    } else {
        fallbackCopyLineupText(memberName);
    }
}

function fallbackCopyLineupText(text) {
    let ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showLineupToastNotification('Đã Copy Tên TK Gốc: ' + text, 'success');
        logLineupActivityAction('Đã Copy Tên TK Gốc: ' + text, 'info');
    } catch (e) {}
    document.body.removeChild(ta);
}

function showLineupToastNotification(msg, type) {
    if (typeof showSystemToastNotification === 'function') {
        showSystemToastNotification(msg, type);
    }
}

function logLineupActivityAction(msg, type) {
    if (typeof logActivityAction === 'function') {
        logActivityAction(msg, type);
    }
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

// ==========================================================================
// 2. GIAO DIỆN THANH QUẢN LÝ BỘ PRESET ĐỘI HÌNH (PRESET SELECTOR)
// ==========================================================================

function renderLineupPresetSelectorBarHtml(preset) {
    if (!systemDatabase || !systemDatabase.lineupPresets) return "";

    let presetOptionsHtml = systemDatabase.lineupPresets.map(function(p) {
        let isSel = (p.id === preset.id) ? 'selected' : '';
        return '<option value="' + p.id + '" ' + isSel + '>Bộ Đội Hình: ' + p.name + ' (' + (p.setups ? p.setups.length : 0) + ' Đội)</option>';
    }).join('');

    return (
        '<div class="flex items-center justify-between gap-2 p-2 bg-gray-950/90 border border-gray-800 rounded-xl mb-2.5 shrink-0 flex-wrap">' +
            '<div class="flex items-center gap-2 flex-1 min-w-[260px]">' +
                '<div class="flex items-center gap-1.5 text-purple-400 font-black text-xs uppercase shrink-0">' +
                    '<i class="fa-solid fa-layer-group text-sm text-amber-400"></i>' +
                    '<span>CẤU HÌNH ĐỘI HÌNH:</span>' +
                '</div>' +
                '<select onchange="switchLineupPreset(this.value)" class="flex-1 bg-gray-900 border border-purple-500/40 text-purple-200 font-bold text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-400 cursor-pointer shadow-inner">' +
                    presetOptionsHtml +
                '</select>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 flex-wrap shrink-0">' +
                '<button onclick="openCreateLineupPresetPrompt()" class="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer" title="Tạo bộ cấu hình đội hình mới">' +
                    '<i class="fa-solid fa-plus text-[10px] text-emerald-400"></i> Thêm Bộ' +
                '</button>' +
                '<button onclick="openRenameLineupPresetPrompt()" class="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer" title="Đổi tên bộ cấu hình đang chọn">' +
                    '<i class="fa-solid fa-pen text-[10px] text-amber-400"></i> Đổi Tên' +
                '</button>' +
                '<button onclick="duplicateCurrentLineupPreset()" class="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer" title="Nhân bản bộ cấu hình này">' +
                    '<i class="fa-regular fa-clone text-[10px] text-cyan-400"></i> Nhân Bản' +
                '</button>' +
                '<button onclick="deleteCurrentLineupPreset()" class="bg-rose-955 hover:bg-rose-700 text-rose-300 border border-rose-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer" title="Xóa bộ cấu hình này">' +
                    '<i class="fa-solid fa-trash text-[10px]"></i> Xóa Bộ' +
                '</button>' +
            '</div>' +
        '</div>'
    );
}

// ==========================================================================
// 3. GIAO DIỆN THANH TÁC VỤ NHANH & THỐNG KÊ ĐỘI HÌNH
// ==========================================================================

function renderLineupTeamToolbarHtml(activeSetup, membersDict) {
    let memberIds = activeSetup.memberIds || [];
    let countMax2 = 0;
    let countMax3 = 0;
    let countDoneTN = 0;
    let totalNPInTeam = 0;

    memberIds.forEach(function(mId) {
        if (mId && membersDict[mId]) {
            let mem = membersDict[mId];
            let maxR = parseInt(mem.maxRuns) || 2;
            if (maxR === 3) countMax3++;
            else countMax2++;

            if (parseInt(mem.merchantRuns) >= 3) {
                countDoneTN++;
            }
            totalNPInTeam += (parseInt(mem.nganPhieu) || 0);
        }
    });

    return (
        '<div class="flex items-center justify-between gap-2 p-2 bg-gray-950/80 border border-gray-800 rounded-xl mb-2 shrink-0 flex-wrap font-sans text-xs">' +
            '<div class="flex items-center gap-2.5 flex-wrap">' +
                '<span class="font-black text-purple-300 flex items-center gap-1">' +
                    '<i class="fa-solid fa-users-viewfinder text-purple-400"></i>' +
                    'Đội [' + activeSetup.name + ']:' +
                '</span>' +
                '<span class="text-gray-400 font-mono text-[11px]">' +
                    '<strong class="text-white">' + countMax2 + '</strong> Max 2 | ' +
                    '<strong class="text-white">' + countMax3 + '</strong> Max 3' +
                '</span>' +
                '<span class="text-amber-300 font-mono text-[11px] bg-amber-955/60 border border-amber-500/40 px-2 py-0.5 rounded">' +
                    'Tổng NP: <strong>' + totalNPInTeam.toLocaleString('vi-VN') + '</strong>' +
                '</span>' +
                (countDoneTN !== 0 ? (
                    '<span class="text-emerald-300 font-mono text-[11px] bg-emerald-955/60 border border-emerald-500/40 px-2 py-0.5 rounded">' +
                        'Đã xong TN: <strong>' + countDoneTN + '/8</strong>' +
                    '</span>'
                ) : '') +
            '</div>' +
            '<div class="flex items-center gap-1.5 shrink-0">' +
                '<button onclick="renameCurrentLineupSetupPrompt()" class="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer" title="Đổi tên đội hình con này">' +
                    '<i class="fa-solid fa-i-cursor text-[9px] text-amber-400"></i> Đổi Tên Đội' +
                '</button>' +
                '<button onclick="resetCurrentLineupTeamRunsConfirm()" class="bg-gray-800 hover:bg-amber-700 text-amber-300 hover:text-white border border-gray-700 px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer" title="Reset tiến độ 8 acc trong đội này về 0">' +
                    '<i class="fa-solid fa-arrows-rotate text-[9px]"></i> Reset Đội' +
                '</button>' +
                '<button onclick="clearCurrentLineupTeamMembersConfirm()" class="bg-gray-800 hover:bg-rose-700 text-rose-300 hover:text-white border border-gray-700 px-2 py-1 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer" title="Xóa trắng 8 vị trí trong đội này">' +
                    '<i class="fa-solid fa-eraser text-[9px]"></i> Xóa Trắng' +
                '</button>' +
            '</div>' +
        '</div>'
    );
}

// ==========================================================================
// 4. HÀM DỰNG GIAO DIỆN CHÍNH (RENDER LINEUP WORKSPACE VIEW)
// ==========================================================================

function renderLineupWorkspaceView(targetTeamId) {
    let viewport = document.getElementById('active-panel-view-viewport') || 
                   document.getElementById('team-content-container') || 
                   document.getElementById('main-workspace-body');
    if (!viewport) return;

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.remove('hidden');

    if (!systemDatabase || !systemDatabase.lineupPresets || systemDatabase.lineupPresets.length === 0) {
        viewport.innerHTML = '<div class="p-6 text-center text-gray-500 text-xs italic">Chưa có cấu hình đội hình xếp nào trong cơ sở dữ liệu.</div>';
        return;
    }

    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; }) || systemDatabase.lineupPresets[0];
    let setups = preset.setups || [];

    // Nếu có truyền ID đội hình con từ thanh điều hướng (hoặc tên đội như "1", "2")
    if (targetTeamId && typeof targetTeamId === 'string') {
        activeLineupTeamId = targetTeamId;
        let matchedIdx = setups.findIndex(function(s) {
            return s.id === targetTeamId || s.name === targetTeamId || ('team_' + s.name) === targetTeamId;
        });
        if (matchedIdx !== -1) {
            activeLineupSetupIndex = matchedIdx;
        }
    }

    if (Math.sign(activeLineupSetupIndex) === -1 || activeLineupSetupIndex >= setups.length) {
        activeLineupSetupIndex = 0;
    }

    let activeSetup = setups[activeLineupSetupIndex] || { name: "1", memberIds: ["","","","","","","",""] };
    let membersDict = (systemDatabase && systemDatabase.members) ? systemDatabase.members : {};

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

    let extraDropdownHtml = '';
    if (extraSetups.length !== 0) {
        let extraOptions = extraSetups.map(function(s, eIdx) {
            let realIdx = eIdx + 8;
            let isSel = (realIdx === activeLineupSetupIndex) ? 'selected' : '';
            return '<option value="' + realIdx + '" ' + isSel + '>' + s.name + '</option>';
        }).join('');

        extraDropdownHtml = 
            '<select onchange="switchLineupSetup(parseInt(this.value))" class="bg-gray-800 border border-gray-700 text-purple-300 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer">' +
                '<option value="" disabled ' + (activeLineupSetupIndex <= 7 ? 'selected' : '') + '>▼ Thêm</option>' +
                extraOptions +
            '</select>';
    }

    let setupNavHtml = 
        '<div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-800 shrink-0 flex-wrap">' +
            '<div class="flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 pb-1 sm:pb-0">' +
                tabsHtml +
                extraDropdownHtml +
                '<button onclick="addNewLineupSetupPrompt()" class="px-2.5 py-1.5 rounded-lg text-xs font-black bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1 shadow cursor-pointer" title="Thêm đội hình con mới">' +
                    '<i class="fa-solid fa-shuffle text-[10px]"></i> +' +
                '</button>' +
                '<button onclick="deleteCurrentLineupSetupConfirm()" class="px-2 py-1.5 rounded-lg text-xs font-black bg-rose-955 hover:bg-rose-700 text-rose-300 border border-rose-600 transition flex items-center justify-center shadow cursor-pointer ml-1" title="Xóa đội hình con đang chọn">' +
                    '<i class="fa-solid fa-trash-can text-[11px]"></i>' +
                '</button>' +
            '</div>' +
        '</div>';

    // 2. DỰNG DANH SÁCH 8 THÀNH VIÊN VÀ CÁC CỘT (CÓ CỘT COPY & HUY HIỆU ĐẦU Ô TIẾN ĐỘ)
    let allMembersList = Object.values(membersDict);

    allMembersList.sort(function(a, b) {
        let nameA = formatLineupMemberDisplayFull(a);
        let nameB = formatLineupMemberDisplayFull(b);
        return nameA.localeCompare(nameB);
    });

    let rowsHtml = '';
    for (let slot = 0; slot !== 8; slot++) {
        let memId = (activeSetup.memberIds && activeSetup.memberIds[slot]) ? activeSetup.memberIds[slot] : '';
        let mem = memId ? membersDict[memId] : null;

        // Dropdown chọn tài khoản
        let optionsHtml = '<option value="">-- Trống --</option>';
        optionsHtml += allMembersList.map(function(m) {
            let isSelected = (m.id === memId) ? 'selected' : '';
            let displayLabel = formatLineupMemberDisplayFull(m);
            return '<option value="' + m.id + '" ' + isSelected + '>' + displayLabel + '</option>';
        }).join('');

        let selectMemberHtml = 
            '<select onchange="updateLineupMemberSlot(' + activeLineupSetupIndex + ', ' + slot + ', this.value)" class="w-full bg-gray-900 border border-gray-800 text-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer">' +
                optionsHtml +
            '</select>';

        // CỘT NÚT COPY TÊN NHÂN VẬT ĐỘC LẬP
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
            '<div class="text-center font-mono font-bold text-amber-300 bg-gray-900 border border-gray-800 py-1 px-1.5 rounded-lg text-xs inline-block min-w-[42px]">' +
                npVal +
            '</div>';

        // CỘT TIẾN ĐỘ (ĐÃ THU GỌN BÙ DIỆN TÍCH CHO CỘT COPY, HUY HIỆU ĐẦU Ô)
        let curRuns = mem ? (parseInt(mem.currentRuns) || 0) : 0;
        let maxRuns = mem ? (parseInt(mem.maxRuns) || 2) : 2;
        let isDoneMerchant = mem ? (parseInt(mem.merchantRuns) >= 3) : false;

        // Huy hiệu Thương Nhân nằm cố định ở sát mép trái (đầu ô)
        let tnBadgeStart = isDoneMerchant 
            ? '<span class="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[9px] text-amber-300 bg-amber-955/90 border border-amber-500/60 px-1 py-0.5 rounded font-black font-sans shadow-xs pointer-events-none" title="Đã chạy 3/3 Thương Nhân">◆ TN</span>'
            : '';

        let progressCellHtml = 
            '<div class="flex items-center justify-center gap-1.5">' +
                '<button onclick="decrementLineupMemberRun(\'' + (mem ? mem.id : '') + '\')" ' + (!mem ? 'disabled' : '') + ' class="w-7 h-7 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold border border-gray-800 transition flex items-center justify-center cursor-pointer shadow text-xs disabled:opacity-30 disabled:cursor-not-allowed shrink-0">-</button>' +
                '<button onclick="incrementLineupMemberRun(\'' + (mem ? mem.id : '') + '\')" ' + (!mem ? 'disabled' : '') + ' class="w-28 sm:w-32 h-7 rounded-lg relative flex items-center justify-center bg-gray-955 border border-gray-800 hover:border-purple-500/60 transition shadow font-mono text-xs font-bold text-gray-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0">' +
                    tnBadgeStart +
                    '<span class="text-gray-100 text-center select-none">' + curRuns + ' / ' + maxRuns + '</span>' +
                '</button>' +
            '</div>';

        // Cột Lần 2 & Lần 3
        let payL2 = (mem && mem.payModeL2) ? mem.payModeL2 : 'ticket';
        let payL3 = (mem && mem.payModeL3) ? mem.payModeL3 : 'ticket';

        let l2Html = 
            '<select onchange="changeLineupPayMode(\'' + (mem ? mem.id : '') + '\', 2, this.value)" ' + (!mem ? 'disabled' : '') + ' class="w-full bg-gray-900 border border-gray-800 text-blue-300 rounded-lg px-1.5 py-1 text-xs font-bold focus:outline-none cursor-pointer disabled:opacity-30 text-center">' +
                '<option value="ticket" ' + (payL2 === 'ticket' ? 'selected' : '') + '>-Vé</option>' +
                '<option value="np50" ' + (payL2 === 'np50' ? 'selected' : '') + '>-50 NP</option>' +
                '<option value="free" ' + (payL2 === 'free' ? 'selected' : '') + '>Free</option>' +
            '</select>';

        let l3Html = (mem && maxRuns === 3)
            ? ('<select onchange="changeLineupPayMode(\'' + mem.id + '\', 3, this.value)" class="w-full bg-gray-900 border border-gray-800 text-blue-300 rounded-lg px-1.5 py-1 text-xs font-bold focus:outline-none cursor-pointer text-center">' +
                   '<option value="ticket" ' + (payL3 === 'ticket' ? 'selected' : '') + '>-Vé</option>' +
                   '<option value="np50" ' + (payL3 === 'np50' ? 'selected' : '') + '>-50 NP</option>' +
                   '<option value="free" ' + (payL3 === 'free' ? 'selected' : '') + '>Free</option>' +
               '</select>')
            : '<span class="text-gray-600 font-mono text-xs block text-center">-</span>';

        rowsHtml += 
            '<tr class="border-b border-gray-800/80 hover:bg-gray-850/30 transition text-xs">' +
                '<td class="p-2.5 text-center text-gray-500 font-mono w-10 shrink-0"><i class="fa-solid fa-bars text-[10px] mr-1 opacity-60"></i>' + (slot + 1) + '</td>' +
                '<td class="p-2.5 text-left">' + selectMemberHtml + '</td>' +
                '<td class="p-2.5 text-center w-11 shrink-0">' + copyBtnHtml + '</td>' +
                '<td class="p-2.5 text-center w-16 shrink-0">' + npDisplayHtml + '</td>' +
                '<td class="p-2.5 text-center w-40 sm:w-44 shrink-0">' + progressCellHtml + '</td>' +
                '<td class="p-2.5 text-center w-24 shrink-0">' + l2Html + '</td>' +
                '<td class="p-2.5 text-center w-20 shrink-0">' + l3Html + '</td>' +
            '</tr>';
    }

    viewport.innerHTML = 
        '<div class="w-full h-full flex flex-col p-3 bg-gray-900 border border-purple-500/50 rounded-2xl shadow-2xl text-xs overflow-hidden select-none font-sans">' +
            renderLineupPresetSelectorBarHtml(preset) +
            setupNavHtml +
            renderLineupTeamToolbarHtml(activeSetup, membersDict) +
            '<div class="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-gray-800 bg-gray-955/60 min-h-0">' +
                '<table class="w-full text-left border-collapse">' +
                    '<thead class="sticky top-0 bg-gray-950 z-10 border-b border-gray-800 shadow">' +
                        '<tr class="text-gray-400 uppercase font-bold text-[11px]">' +
                            '<th class="p-2.5 text-center w-10">STT</th>' +
                            '<th class="p-2.5 text-left">LẮP ĐỘI HÌNH</th>' +
                            '<th class="p-2.5 text-center w-11 text-cyan-400"><i class="fa-regular fa-copy mr-0.5"></i> COPY</th>' +
                            '<th class="p-2.5 text-center w-16 text-amber-400"><i class="fa-solid fa-scroll mr-0.5"></i> NP</th>' +
                            '<th class="p-2.5 text-center w-40 sm:w-44">' +
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

// ==========================================================================
// 5. CÁC HÀM XỬ LÝ SỰ KIỆN & CẬP NHẬT DỮ LIỆU
// ==========================================================================

function switchLineupPreset(presetId) {
    if (!systemDatabase || !systemDatabase.lineupPresets) return;
    let found = systemDatabase.lineupPresets.find(function(p) { return p.id === presetId; });
    if (found) {
        systemDatabase.currentPresetId = presetId;
        activeLineupSetupIndex = 0;
        saveLineupSystemDatabase();
        renderLineupWorkspaceView();
    }
}

function openCreateLineupPresetPrompt() {
    let name = prompt('Nhập tên bộ cấu hình đội hình mới:');
    if (!name || String(name).trim() === '') return;

    let newPresetId = 'preset_' + Date.now();
    let newPreset = {
        id: newPresetId,
        name: name.trim(),
        setups: [
            { name: "1", memberIds: ["","","","","","","",""] },
            { name: "2", memberIds: ["","","","","","","",""] }
        ]
    };

    systemDatabase.lineupPresets.push(newPreset);
    systemDatabase.currentPresetId = newPresetId;
    activeLineupSetupIndex = 0;
    saveLineupSystemDatabase();
    showLineupToastNotification('Đã tạo bộ cấu hình [' + newPreset.name + ']', 'success');
    renderLineupWorkspaceView();
}

function openRenameLineupPresetPrompt() {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset) return;

    let newName = prompt('Nhập tên mới cho bộ cấu hình:', preset.name);
    if (!newName || String(newName).trim() === '' || newName === preset.name) return;

    preset.name = newName.trim();
    saveLineupSystemDatabase();
    showLineupToastNotification('Đã đổi tên thành [' + preset.name + ']', 'success');
    renderLineupWorkspaceView();
}

function duplicateCurrentLineupPreset() {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset) return;

    let clonedSetups = JSON.parse(JSON.stringify(preset.setups || []));
    let newPresetId = 'preset_' + Date.now();
    let clonedPreset = {
        id: newPresetId,
        name: preset.name + ' (Bản Sao)',
        setups: clonedSetups
    };

    systemDatabase.lineupPresets.push(clonedPreset);
    systemDatabase.currentPresetId = newPresetId;
    activeLineupSetupIndex = 0;
    saveLineupSystemDatabase();
    showLineupToastNotification('Đã nhân bản thành [' + clonedPreset.name + ']', 'success');
    renderLineupWorkspaceView();
}

function deleteCurrentLineupPreset() {
    if (!systemDatabase || !systemDatabase.lineupPresets || systemDatabase.lineupPresets.length <= 1) {
        alert('Hệ thống phải giữ lại ít nhất 1 bộ cấu hình đội hình!');
        return;
    }

    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset) return;

    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bộ cấu hình [' + preset.name + ']?')) return;

    systemDatabase.lineupPresets = systemDatabase.lineupPresets.filter(function(p) { return p.id !== curPresetId; });
    systemDatabase.currentPresetId = systemDatabase.lineupPresets[0].id;
    activeLineupSetupIndex = 0;
    saveLineupSystemDatabase();
    showLineupToastNotification('Đã xóa bộ cấu hình thành công', 'success');
    renderLineupWorkspaceView();
}

function switchLineupSetup(setupIdx) {
    activeLineupSetupIndex = setupIdx;
    renderLineupWorkspaceView();
}

function switchLineupTeam(teamId) {
    renderLineupWorkspaceView(teamId);
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
        showLineupToastNotification('Đã +1 lượt cho ' + updatedCount + ' tài khoản!', 'success');
        renderLineupWorkspaceView();
    }
}

function resetCurrentLineupTeamRunsConfirm() {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset || !preset.setups || !preset.setups[activeLineupSetupIndex]) return;

    let teamName = preset.setups[activeLineupSetupIndex].name;
    if (!confirm('Đặt lại (Reset) tiến độ về 0/x cho toàn bộ tài khoản trong đội [' + teamName + ']?')) return;

    let memberIds = preset.setups[activeLineupSetupIndex].memberIds || [];
    memberIds.forEach(function(mId) {
        if (mId && systemDatabase.members[mId]) {
            systemDatabase.members[mId].currentRuns = 0;
        }
    });

    saveLineupSystemDatabase();
    showLineupToastNotification('Đã reset tiến độ đội [' + teamName + '] về 0', 'success');
    renderLineupWorkspaceView();
}

function clearCurrentLineupTeamMembersConfirm() {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset || !preset.setups || !preset.setups[activeLineupSetupIndex]) return;

    let teamName = preset.setups[activeLineupSetupIndex].name;
    if (!confirm('Bạn có chắc muốn xóa trắng toàn bộ 8 vị trí trong đội [' + teamName + ']?')) return;

    preset.setups[activeLineupSetupIndex].memberIds = ["","","","","","","",""];
    saveLineupSystemDatabase();
    showLineupToastNotification('Đã xóa trắng đội [' + teamName + ']', 'success');
    renderLineupWorkspaceView();
}

function changeLineupPayMode(memberId, runNum, newMode) {
    if (!memberId || !systemDatabase.members[memberId]) return;
    let mem = systemDatabase.members[memberId];
    if (runNum === 2) mem.payModeL2 = newMode;
    if (runNum === 3) mem.payModeL3 = newMode;
    saveLineupSystemDatabase();
}

function addNewLineupSetupPrompt() {
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
    showLineupToastNotification('Đã thêm đội [' + newSetupName.trim() + ']', 'success');
    renderLineupWorkspaceView();
}

function renameCurrentLineupSetupPrompt() {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset || !preset.setups || !preset.setups[activeLineupSetupIndex]) return;

    let curName = preset.setups[activeLineupSetupIndex].name;
    let newName = prompt('Nhập tên mới cho đội hình con:', curName);
    if (!newName || String(newName).trim() === '' || newName === curName) return;

    preset.setups[activeLineupSetupIndex].name = newName.trim();
    saveLineupSystemDatabase();
    showLineupToastNotification('Đã đổi tên đội thành [' + newName.trim() + ']', 'success');
    renderLineupWorkspaceView();
}

function deleteCurrentLineupSetupConfirm() {
    let curPresetId = systemDatabase.currentPresetId || systemDatabase.lineupPresets[0].id;
    let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
    if (!preset || preset.setups.length <= 1) {
        alert('Phải giữ lại ít nhất 1 đội hình con trong bộ cấu hình!');
        return;
    }

    let teamName = preset.setups[activeLineupSetupIndex].name;
    if (!confirm('Bạn có chắc chắn muốn xóa đội hình [' + teamName + ']?')) return;

    preset.setups.splice(activeLineupSetupIndex, 1);
    if (activeLineupSetupIndex >= preset.setups.length) {
        activeLineupSetupIndex = preset.setups.length - 1;
    }
    saveLineupSystemDatabase();
    showLineupToastNotification('Đã xóa đội [' + teamName + ']', 'success');
    renderLineupWorkspaceView();
}

// ==========================================================================
// 6. XUẤT CÁC HÀM TOÀN CỤC RA WINDOW (TƯƠNG THÍCH MỌI LỜI GỌI HỆ THỐNG)
// ==========================================================================

window.getMemberTeamLetterPrefix = getMemberTeamLetterPrefix;
window.formatLineupMemberDisplayFull = formatLineupMemberDisplayFull;
window.copyLineupMemberName = copyLineupMemberName;
window.copyMemberName = copyLineupMemberName;

window.renderLineupWorkspaceView = renderLineupWorkspaceView;
window.renderLineupTableView = renderLineupWorkspaceView;
window.renderLineupTable = renderLineupWorkspaceView;
window.renderLineupView = renderLineupWorkspaceView;
window.renderLineupTeam = renderLineupWorkspaceView;

window.switchLineupPreset = switchLineupPreset;
window.openCreateLineupPresetPrompt = openCreateLineupPresetPrompt;
window.openRenameLineupPresetPrompt = openRenameLineupPresetPrompt;
window.duplicateCurrentLineupPreset = duplicateCurrentLineupPreset;
window.deleteCurrentLineupPreset = deleteCurrentLineupPreset;

window.switchLineupSetup = switchLineupSetup;
window.switchLineupTeam = switchLineupTeam;
window.updateLineupMemberSlot = updateLineupMemberSlot;

window.incrementLineupMemberRun = incrementLineupMemberRun;
window.decrementLineupMemberRun = decrementLineupMemberRun;
window.batchIncrementRunsLineupTeam = batchIncrementRunsLineupTeam;
window.batchIncrementLineupTeam = batchIncrementRunsLineupTeam;

window.resetCurrentLineupTeamRunsConfirm = resetCurrentLineupTeamRunsConfirm;
window.clearCurrentLineupTeamMembersConfirm = clearCurrentLineupTeamMembersConfirm;
window.changeLineupPayMode = changeLineupPayMode;

window.addNewLineupSetupPrompt = addNewLineupSetupPrompt;
window.renameCurrentLineupSetupPrompt = renameCurrentLineupSetupPrompt;
window.deleteCurrentLineupSetupConfirm = deleteCurrentLineupSetupConfirm;
window.saveLineupSystemDatabase = saveLineupSystemDatabase;
