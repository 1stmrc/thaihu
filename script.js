// Tên file: script.js
// Chức năng: Trung tâm điều phối lõi trạng thái hệ thống, khởi tạo định danh, nạp đè/chuyển giao tài khoản, quản lý Presets và đồng bộ giao diện.
// Con của file: index.html (Được nạp ở cuối cùng để khởi chạy toàn bộ luồng xử lý hệ thống).
// Danh sách tính năng của file:
//   1. Khởi tạo đối tượng systemDatabase và bộ sinh mã createUniqueId.
//   2. Điều phối gán vị trí tài khoản vào Đội hình xếp (Lineup).
//   3. Chuyển giao tài khoản giữa các team dữ liệu (Migration).
//   4. Quản lý lưu, nạp, xóa Sơ đồ chiến thuật (Lineup Presets).
//   5. Khởi động hệ thống khi tải trang hoàn tất qua initSystemEngine.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

let systemDatabase = { 
    teams: [], 
    members: {}, 
    deoHistory: [], 
    eventStartDate: "", 
    eventEndDate: "", 
    lineupPresets: [], 
    currentPresetId: "default_blank",
    materialPrice: localStorage.getItem('HEADER_MAT_PRICE') || "0.25",
    goldRate: localStorage.getItem('HEADER_GOLD_RATE') || "155.000",
    ticketPrice: localStorage.getItem('HEADER_TICKET_PRICE') || "24",
    refundPrice: localStorage.getItem('HEADER_REFUND_PRICE') || "16"
};

let activeTeamId = "";
let draggedRowIndex = null;
let tokenCount = Date.now();

/* ==========================================================================
   KHỐI 1: ĐIỀU PHỐI GÁN THÀNH VIÊN VÀO LINEUP & CHUYỂN TEAM
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function createUniqueId() { 
    tokenCount++; 
    return 'uid_' + tokenCount + '_' + Math.random().toString(36).substring(2, 6); 
}

function bindSelectionToLineupIndexSlot(lineupTeamId, index, memberId) { 
    let team = systemDatabase.teams.find(x => x.id === lineupTeamId); 
    if(team) { 
        team.memberIds[index] = memberId; 
        if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity(); 
        refreshUserInterfaceLayout(); 
        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache(); 
    } 
}

function executeRecordTeamMigration(memberId, sourceTeamId) {
    let destTeamId = document.getElementById(`migration-target-box-${memberId}`).value; 
    if(!destTeamId) return;
    let sTeam = systemDatabase.teams.find(x => x.id === sourceTeamId), 
        dTeam = systemDatabase.teams.find(x => x.id === destTeamId), 
        mObj = systemDatabase.members[memberId];
    if(!sTeam || !dTeam || !mObj) return;
    
    let emptyTargetIdx = dTeam.memberIds.findIndex(id => !systemDatabase.members[id] || systemDatabase.members[id].name.trim() === "");
    if(emptyTargetIdx !== -1) { 
        delete systemDatabase.members[dTeam.memberIds[emptyTargetIdx]]; 
        dTeam.memberIds[emptyTargetIdx] = memberId; 
    } else { 
        if(dTeam.memberIds.length >= 8) { 
            alert("Nhóm đích đã đầy đủ 8 vị trí!"); 
            return; 
        } 
        dTeam.memberIds.push(memberId); 
    }
    
    let sIdx = sTeam.memberIds.indexOf(memberId); 
    if(sIdx !== -1) { 
        let newBlankId = createUniqueId(); 
        systemDatabase.members[newBlankId] = { id: newBlankId, name: "", maxRuns: 3, currentRuns: 0, originalTeamId: sourceTeamId, isEditing: true, freeRun2: false, freeRun3: false, skipStatNL: false }; 
        sTeam.memberIds[sIdx] = newBlankId; 
    }
    
    mObj.originalTeamId = destTeamId; 
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity(); 
    refreshUserInterfaceLayout(); 
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
}

function refreshUserInterfaceLayout() {
    if (typeof renderNavigationSubTabs === 'function') renderNavigationSubTabs(); 
    if (typeof renderActiveWorkspacePanel === 'function') renderActiveWorkspacePanel(); 
    if (typeof updateDeoStatisticsDisplays === 'function') updateDeoStatisticsDisplays(); 
    if (typeof renderDeoHistoryLedger === 'function') renderDeoHistoryLedger(); 
    
    let startEl = document.getElementById('input-event-start-date');
    let endEl = document.getElementById('input-event-end-date');
    if (startEl) startEl.value = systemDatabase.eventStartDate || "";
    if (endEl) endEl.value = systemDatabase.eventEndDate || "";
    
    if (typeof updateEventRangeLabel === 'function') updateEventRangeLabel(); 
    if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
}

function toggleFloatingDeoCard() { 
    let card = document.getElementById('floating-deo-card'); 
    if (card) card.classList.toggle('hidden'); 
}

function toggleFloatingProfitCard() { 
    let card = document.getElementById('floating-profit-card'); 
    if (card) card.classList.toggle('hidden'); 
}

function switchToDeoManagementTab() {
    activeTeamId = "deo_tab_active_special";
    
    let btnThaihu = document.getElementById('btn-main-tab-thaihu');
    let btnDeo = document.getElementById('btn-main-tab-deo');
    if (btnThaihu) btnThaihu.className = "px-4 py-2 rounded-xl text-xs font-black bg-gray-700/50 text-gray-400 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5";
    if (btnDeo) btnDeo.className = "px-4 py-2 rounded-xl text-xs font-black bg-purple-600 text-white shadow-md border border-purple-500 transition cursor-pointer uppercase flex items-center gap-1.5";
    
    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');
    
    let fDeoCard = document.getElementById('floating-deo-card');
    let fProfitCard = document.getElementById('floating-profit-card');
    let fDeoBubble = document.getElementById('floating-bubble-deo-container');
    let fProfitBubble = document.getElementById('floating-bubble-profit-container');
    
    if (fDeoCard) fDeoCard.classList.add('hidden');
    if (fProfitCard) fProfitCard.classList.add('hidden');
    if (fDeoBubble) fDeoBubble.classList.add('hidden');
    if (fProfitBubble) fProfitBubble.classList.add('hidden');

    if (typeof renderDeoManagementView === 'function') {
        renderDeoManagementView();
    }
}

/* ==========================================================================
   KHỐI 2: TỔ HỢP ĐỘI HÌNH PRESETS
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function renderPresetDropdownController() {
    let combo = document.getElementById('preset-combo-selector');
    if (!combo) return;
    if (!systemDatabase.lineupPresets) systemDatabase.lineupPresets = [];
    
    let currentId = systemDatabase.currentPresetId || "default_blank";
    
    let html = `<option value="default_blank" ${currentId === 'default_blank' ? 'selected' : ''}>-- Đội hình trống --</option>`;
    systemDatabase.lineupPresets.forEach(p => {
        html += `<option value="${p.id}" ${currentId === p.id ? 'selected' : ''}>${p.name.toUpperCase()}</option>`;
    });
    combo.innerHTML = html;
}

function saveCurrentLineupsAsPreset() {
    if (!systemDatabase.lineupPresets) systemDatabase.lineupPresets = [];
    
    let presetName = prompt("Nhập tên định danh cho Tổ Hợp Chiến Thuật Đội Hình này:", "");
    if (!presetName || presetName.trim() === "") return;
    
    let pId = 'preset_' + Date.now();
    
    let savedLineups = systemDatabase.teams.filter(x => x.type === 'lineup').map(t => {
        return { name: t.name, memberIds: [...t.memberIds] };
    });
    
    systemDatabase.lineupPresets.push({ id: pId, name: presetName.trim(), setups: savedLineups });
    systemDatabase.currentPresetId = pId;
    
    renderNavigationSubTabs();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    alert("Đã khóa và lưu Tổ hợp đội hình mới thành công!");
}

function loadSelectedPresetStrategyPipeline() {
    let combo = document.getElementById('preset-combo-selector');
    if (!combo) return;
    
    let targetId = combo.value;
    systemDatabase.currentPresetId = targetId;
    
    systemDatabase.teams = systemDatabase.teams.filter(x => x.type !== 'lineup');
    
    if (targetId === "default_blank") {
        activeTeamId = systemDatabase.teams[0]?.id || "";
    } else {
        let preset = systemDatabase.lineupPresets.find(x => x.id === targetId);
        if (preset && preset.setups) {
            preset.setups.forEach(s => {
                systemDatabase.teams.push({
                    id: 'team_' + createUniqueId(),
                    name: s.name,
                    type: 'lineup',
                    memberIds: [...s.memberIds]
                });
            });
        }
        let firstLineup = systemDatabase.teams.find(x => x.type === 'lineup');
        if (firstLineup) activeTeamId = firstLineup.id;
    }
    
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
    refreshUserInterfaceLayout();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
}

function deleteCurrentSelectedPreset() {
    let combo = document.getElementById('preset-combo-selector');
    if (!combo || combo.value === "default_blank") return;
    
    if (!confirm("Xác nhận xóa hoàn toàn Tổ hợp đội hình chiến thuật đang chọn này?")) return;
    
    let targetId = combo.value;
    systemDatabase.lineupPresets = systemDatabase.lineupPresets.filter(x => x.id !== targetId);
    systemDatabase.currentPresetId = "default_blank";
    
    systemDatabase.teams = systemDatabase.teams.filter(x => x.type !== 'lineup');
    activeTeamId = systemDatabase.teams[0]?.id || "";
    
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
    refreshUserInterfaceLayout();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
}

window.onload = initSystemEngine;

// Tổng số dòng code trong file này: 185 dòng.