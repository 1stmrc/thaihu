/* ==========================================================================
   MODULE: QUẢN LÝ VÀ HIỂN THỊ BẢNG ĐỘI HÌNH XẾP (BANG-DOI-HINH-XEP.JS)
   Chức năng: Quản lý hiển thị danh sách 8 nhân vật của đội hình xếp,
   bổ sung cột Copy tên nhân vật độc lập, thu gọn chiều ngang cột tiến độ
   và cố định huy hiệu Thương Nhân ở đầu ô tiến độ.
   ========================================================================== */

let activeLineupSetupIndex = 0;
let activeLineupTeamId = "";

// 1. CÁC HÀM TIỆN ÍCH & SAO CHÉP TÊN NHÂN VẬT
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

function formatLineupMemberDisplayFull(member) {
    if (!member || !member.name) return "-- Trống --";
    let prefix = getMemberTeamLetterPrefix(member);
    let fCode = member.factionCode || member.factionId || "";
    if (fCode !== "") {
        return prefix + fCode + " " + member.name;
    }
    return prefix + member.name;
}

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

// 2. HÀM DỰNG BẢNG ĐỘI HÌNH XẾP (TỰ ĐỘNG BẮT ĐÚNG CONTAINER & DỮ LIỆU TEAM)
function renderLineupTableView(targetTeamId) {
    let viewport = document.getElementById('lineup-team-members-container') ||
                   document.getElementById('lineup-sub-tab-content') ||
                   document.getElementById('team-members-table-container') ||
                   document.getElementById('active-panel-view-viewport') || 
                   document.getElementById('team-content-container') || 
                   document.getElementById('main-workspace-body');
    if (!viewport) return;

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.remove('hidden');

    if (!systemDatabase) {
        viewport.innerHTML = '<div class="p-6 text-center text-gray-500 text-xs italic">Chưa nạp cơ sở dữ liệu hệ thống.</div>';
        return;
    }

    let membersDict = systemDatabase.members || {};
    let allMembersList = Object.values(membersDict);
    allMembersList.sort(function(a, b) {
        let nameA = formatLineupMemberDisplayFull(a);
        let nameB = formatLineupMemberDisplayFull(b);
        return nameA.localeCompare(nameB);
    });

    // 1. Quét tìm đội hình đang chọn
    let teamsList = Array.isArray(systemDatabase.teams) ? systemDatabase.teams : Object.values(systemDatabase.teams || {});
    let lineupTeams = teamsList.filter(function(t) { return t && t.type === 'lineup'; });

    let currentReqId = targetTeamId || activeLineupTeamId || (typeof activeTeamId !== 'undefined' ? activeTeamId : "");
    let activeTeamObj = null;

    if (currentReqId) {
        activeTeamObj = lineupTeams.find(function(t) {
            return String(t.id) === String(currentReqId) || String(t.name).toLowerCase() === String(currentReqId).toLowerCase();
        });
    }

    if (!activeTeamObj && lineupTeams.length !== 0) {
        let idx = (typeof activeLineupSetupIndex === 'number' && Math.sign(activeLineupSetupIndex) !== -1 && activeLineupSetupIndex < lineupTeams.length) 
            ? activeLineupSetupIndex 
            : 0;
        activeTeamObj = lineupTeams[idx];
    }

    let curPresetId = systemDatabase.currentPresetId || (systemDatabase.lineupPresets && systemDatabase.lineupPresets[0] ? systemDatabase.lineupPresets[0].id : "");
    let preset = (systemDatabase.lineupPresets || []).find(function(p) { return p.id === curPresetId; }) || (systemDatabase.lineupPresets ? systemDatabase.lineupPresets[0] : null);

    let memberIds = [];
    let currentTeamName = "1";
    let teamKeyIdentifier = "";

    if (activeTeamObj) {
        memberIds = activeTeamObj.memberIds || [];
        currentTeamName = activeTeamObj.name || "1";
        teamKeyIdentifier = activeTeamObj.id;
        activeLineupTeamId = activeTeamObj.id;
    } else if (preset && preset.setups && preset.setups.length !== 0) {
        let setupIdx = (typeof activeLineupSetupIndex === 'number' && Math.sign(activeLineupSetupIndex) !== -1 && activeLineupSetupIndex < preset.setups.length) 
            ? activeLineupSetupIndex 
            : 0;
        let setup = preset.setups[setupIdx] || preset.setups[0];
        memberIds = setup.memberIds || [];
        currentTeamName = setup.name || "1";
        teamKeyIdentifier = "setup_" + setupIdx;
    }

    // 2. Dựng 8 dòng thành viên (Có cột Copy và căn chỉnh tiến độ)
    let rowsHtml = '';
    for (let slot = 0; slot !== 8; slot++) {
        let memId = memberIds[slot] || '';
        let mem = memId ? membersDict[memId] : null;

        let optionsHtml = '<option value="">-- Trống --</option>';
        optionsHtml += allMembersList.map(function(m) {
            let isSelected = (m.id === memId) ? 'selected' : '';
            return '<option value="' + m.id + '" ' + isSelected + '>' + formatLineupMemberDisplayFull(m) + '</option>';
        }).join('');

        let selectMemberHtml = 
            '<select onchange="updateLineupMemberSlot(\'' + teamKeyIdentifier + '\', ' + slot + ', this.value)" class="w-full bg-gray-900 border border-gray-800 text-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer">' +
                optionsHtml +
            '</select>';

        // CỘT NÚT COPY TÊN NHÂN VẬT GỐC
        let copyBtnHtml = (mem && mem.name)
            ? '<button onclick="copyLineupMemberName(\'' + mem.name + '\')" class="w-7 h-7 rounded-lg bg-gray-900 hover:bg-cyan-600 text-gray-400 hover:text-white border border-gray-800 hover:border-cyan-500 transition flex items-center justify-center cursor-pointer shadow mx-auto" title="Copy tên: ' + mem.name + '"><i class="fa-regular fa-copy text-xs"></i></button>'
            : '<button disabled class="w-7 h-7 rounded-lg bg-gray-900/50 text-gray-600 border border-gray-800/40 flex items-center justify-center opacity-40 cursor-not-allowed mx-auto"><i class="fa-regular fa-copy text-xs"></i></button>';

        // Cột Ngân Phiếu
        let npVal = (mem && typeof mem.nganPhieu !== 'undefined') ? mem.nganPhieu : 0;
        let npDisplayHtml = '<div class="text-center font-mono font-bold text-amber-300 bg-gray-900 border border-gray-800 py-1 px-1.5 rounded-lg text-xs inline-block min-w-[42px]">' + npVal + '</div>';

        // CỘT TIẾN ĐỘ: Đã giảm bề ngang, biểu tượng ◆ TN đứng ở đầu mép trái
        let curRuns = mem ? (parseInt(mem.currentRuns) || 0) : 0;
        let maxRuns = mem ? (parseInt(mem.maxRuns) || 2) : 2;
        let isDoneMerchant = mem ? (parseInt(mem.merchantRuns) === 3 || parseInt(mem.merchantRuns) === 4) : false;

        let tnBadgeStart = isDoneMerchant 
            ? '<span class="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[8.5px] text-amber-300 bg-amber-955/90 border border-amber-500/60 px-1 py-0.5 rounded font-black font-sans shadow-xs pointer-events-none" title="Đã chạy 3/3 Thương Nhân">◆ TN</span>'
            : '';

        let progressCellHtml = 
            '<div class="flex items-center justify-center gap-1.5">' +
                '<button onclick="decrementLineupMemberRun(\'' + (mem ? mem.id : '') + '\')" ' + (!mem ? 'disabled' : '') + ' class="w-7 h-7 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold border border-gray-800 transition flex items-center justify-center cursor-pointer shadow text-xs disabled:opacity-30 disabled:cursor-not-allowed shrink-0">-</button>' +
                '<button onclick="incrementLineupMemberRun(\'' + (mem ? mem.id : '') + '\')" ' + (!mem ? 'disabled' : '') + ' class="w-28 sm:w-30 h-7 rounded-lg relative flex items-center justify-center bg-gray-955 border border-gray-800 hover:border-purple-500/60 transition shadow font-mono text-xs font-bold text-gray-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0">' +
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
                '<td class="p-2.5 text-center w-10 shrink-0">' + copyBtnHtml + '</td>' +
                '<td class="p-2.5 text-center w-16 shrink-0">' + npDisplayHtml + '</td>' +
                '<td class="p-2.5 text-center w-36 shrink-0">' + progressCellHtml + '</td>' +
                '<td class="p-2.5 text-center w-24 shrink-0">' + l2Html + '</td>' +
                '<td class="p-2.5 text-center w-20 shrink-0">' + l3Html + '</td>' +
            '</tr>';
    }

    viewport.innerHTML = 
        '<div class="w-full h-full flex flex-col p-3 bg-gray-900 border border-purple-500/50 rounded-2xl shadow-2xl text-xs overflow-hidden select-none font-sans">' +
            '<div class="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-gray-800 bg-gray-955/60 min-h-0">' +
                '<table class="w-full text-left border-collapse">' +
                    '<thead class="sticky top-0 bg-gray-950 z-10 border-b border-gray-800 shadow">' +
                        '<tr class="text-gray-400 uppercase font-bold text-[11px]">' +
                            '<th class="p-2.5 text-center w-10">STT</th>' +
                            '<th class="p-2.5 text-left">LẮP ĐỘI HÌNH</th>' +
                            '<th class="p-2.5 text-center w-10 text-cyan-400" title="Sao chép tên nhân vật"><i class="fa-regular fa-copy"></i></th>' +
                            '<th class="p-2.5 text-center w-16 text-amber-400"><i class="fa-solid fa-scroll mr-0.5"></i>NP</th>' +
                            '<th class="p-2.5 text-center w-36">' +
                                '<div class="flex items-center justify-center gap-1.5">' +
                                    '<span>TIẾN ĐỘ</span>' +
                                    '<button onclick="batchIncrementRunsLineupTeam(\'' + teamKeyIdentifier + '\')" class="bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer flex items-center gap-1 shadow" title="Cộng 1 lượt cho cả 8 tài khoản">' +
                                        '<i class="fa-solid fa-angles-up text-[9px]"></i>+1 Team' +
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

// 3. CÁC HÀM XỬ LÝ DỮ LIỆU & SỰ KIỆN CLICK
function switchLineupTeam(teamId) {
    activeLineupTeamId = teamId;
    if (typeof activeTeamId !== 'undefined') {
        activeTeamId = teamId;
    }
    renderLineupTableView(teamId);
}

function switchLineupSetup(setupIdx) {
    activeLineupSetupIndex = setupIdx;
    renderLineupTableView();
}

function updateLineupMemberSlot(teamKey, slotIdx, newMemberId) {
    if (!systemDatabase) return;

    let teamsList = Array.isArray(systemDatabase.teams) ? systemDatabase.teams : Object.values(systemDatabase.teams || {});
    let team = teamsList.find(function(t) { return t.id === teamKey; });
    if (team) {
        if (!team.memberIds) team.memberIds = ["","","","","","","",""];
        team.memberIds[slotIdx] = newMemberId;
    }

    if (systemDatabase.lineupPresets) {
        let curPresetId = systemDatabase.currentPresetId || (systemDatabase.lineupPresets[0] ? systemDatabase.lineupPresets[0].id : "");
        let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
        if (preset && preset.setups) {
            let sIdx = (teamKey && String(teamKey).indexOf("setup_") !== -1) ? parseInt(teamKey.replace("setup_", "")) : activeLineupSetupIndex;
            if (preset.setups[sIdx]) {
                if (!preset.setups[sIdx].memberIds) preset.setups[sIdx].memberIds = ["","","","","","","",""];
                preset.setups[sIdx].memberIds[slotIdx] = newMemberId;
            }
        }
    }

    saveLineupSystemDatabase();
    renderLineupTableView(teamKey);
}

function incrementLineupMemberRun(memberId) {
    if (!memberId || !systemDatabase.members || !systemDatabase.members[memberId]) return;
    let mem = systemDatabase.members[memberId];
    let cur = parseInt(mem.currentRuns) || 0;
    let max = parseInt(mem.maxRuns) || 2;
    if (cur !== max) {
        mem.currentRuns = cur + 1;
        saveLineupSystemDatabase();
        renderLineupTableView();
    }
}

function decrementLineupMemberRun(memberId) {
    if (!memberId || !systemDatabase.members || !systemDatabase.members[memberId]) return;
    let mem = systemDatabase.members[memberId];
    let cur = parseInt(mem.currentRuns) || 0;
    if (cur !== 0) {
        mem.currentRuns = cur - 1;
        saveLineupSystemDatabase();
        renderLineupTableView();
    }
}

function batchIncrementRunsLineupTeam(teamKey) {
    if (!systemDatabase) return;
    let memberIds = [];

    let teamsList = Array.isArray(systemDatabase.teams) ? systemDatabase.teams : Object.values(systemDatabase.teams || {});
    let team = teamsList.find(function(t) { return t.id === teamKey; });
    
    if (team && team.memberIds) {
        memberIds = team.memberIds;
    } else if (systemDatabase.lineupPresets) {
        let curPresetId = systemDatabase.currentPresetId || (systemDatabase.lineupPresets[0] ? systemDatabase.lineupPresets[0].id : "");
        let preset = systemDatabase.lineupPresets.find(function(p) { return p.id === curPresetId; });
        let sIdx = (teamKey && String(teamKey).indexOf("setup_") !== -1) ? parseInt(teamKey.replace("setup_", "")) : activeLineupSetupIndex;
        if (preset && preset.setups && preset.setups[sIdx]) {
            memberIds = preset.setups[sIdx].memberIds || [];
        }
    }

    let updatedCount = 0;
    memberIds.forEach(function(mId) {
        if (mId && systemDatabase.members && systemDatabase.members[mId]) {
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
        renderLineupTableView(teamKey);
    }
}

function changeLineupPayMode(memberId, runNum, newMode) {
    if (!memberId || !systemDatabase.members || !systemDatabase.members[memberId]) return;
    let mem = systemDatabase.members[memberId];
    if (runNum === 2) mem.payModeL2 = newMode;
    if (runNum === 3) mem.payModeL3 = newMode;
    saveLineupSystemDatabase();
}

// 4. XUẤT CÁC HÀM TOÀN CỤC RA WINDOW
window.getMemberTeamLetterPrefix = getMemberTeamLetterPrefix;
window.formatLineupMemberDisplayFull = formatLineupMemberDisplayFull;
window.copyLineupMemberName = copyLineupMemberName;
window.copyMemberName = copyLineupMemberName;

window.renderLineupWorkspaceView = renderLineupTableView;
window.renderLineupTableView = renderLineupTableView;
window.renderLineupTable = renderLineupTableView;
window.renderLineupView = renderLineupTableView;
window.renderLineupTeam = renderLineupTableView;

window.switchLineupTeam = switchLineupTeam;
window.switchLineupSetup = switchLineupSetup;
window.updateLineupMemberSlot = updateLineupMemberSlot;

window.incrementLineupMemberRun = incrementLineupMemberRun;
window.decrementLineupMemberRun = decrementLineupMemberRun;
window.batchIncrementRunsLineupTeam = batchIncrementRunsLineupTeam;
window.batchIncrementLineupTeam = batchIncrementRunsLineupTeam;
window.changeLineupPayMode = changeLineupPayMode;
window.saveLineupSystemDatabase = saveLineupSystemDatabase;
