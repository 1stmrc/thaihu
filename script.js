// Tên file: script.js
// Chức năng: Trung tâm điều phối lõi trạng thái hệ thống, khởi tạo định danh, nạp đè/chuyển giao tài khoản, quản lý Presets, chống đá văng tab khi gọi refresh và Master Override hàm Reset Ngày.
// Con của file: index.html (Được nạp ở cuối cùng để khởi chạy toàn bộ luồng xử lý hệ thống).

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
        systemDatabase.members[newBlankId] = { id: newBlankId, name: "", maxRuns: 3, currentRuns: 0, originalTeamId: sourceTeamId, isEditing: true, freeRun2: false, freeRun3: false, skipStatNL: false, merchantRuns: 0, satThuRuns: 0, nganPhieu: 0 }; 
        sTeam.memberIds[sIdx] = newBlankId; 
    }
    
    mObj.originalTeamId = destTeamId; 
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity(); 
    refreshUserInterfaceLayout(); 
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
}

// KHÓA THÔNG MINH: CHỐNG TỰ ĐÁ VĂNG VỀ THÁI HƯ NẾU ĐANG Ở SÁT THỦ HOẶC THƯƠNG NHÂN
function refreshUserInterfaceLayout() {
    let satThuView = document.getElementById('tab-content-quan-ly-sat-thu');
    let isCurrentlyAtSatThu = satThuView && !satThuView.classList.contains('hidden');

    let merchantView = document.getElementById('tab-content-quan-ly-thuong-nhan');
    let isCurrentlyAtMerchant = merchantView && !merchantView.classList.contains('hidden');

    if (isCurrentlyAtSatThu) {
        if (typeof renderSatThuTableRows === 'function') renderSatThuTableRows();
        if (typeof updateSatThuStatsDashboardUI === 'function') updateSatThuStatsDashboardUI();
        if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
        return;
    }

    if (isCurrentlyAtMerchant) {
        if (typeof renderMerchantTableRows === 'function') renderMerchantTableRows();
        if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
        return;
    }

    // Chỉ thực thi vẽ giao diện Thái Hư khi thực sự đang ở tab Thái Hư
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
    if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
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

/* ==========================================================================
   KHỐI 3: MASTER OVERRIDE RESET NGÀY TOÀN DIỆN (ĐÈ BẸP HÀM RESET CŨ Ở CÁC FILE KHÁC)
   ========================================================================== */
function executeDailyResetPipeline() {
    if (!confirm("Xác nhận RESET toàn bộ tiến độ ngày hôm nay (Bao gồm Thái Hư, Thương Nhân và Sát Thủ)?")) {
        return;
    }

    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();

    // Reset sạch dữ liệu cả 3 phân hệ
    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.keys(systemDatabase.members).forEach(id => {
            let m = systemDatabase.members[id];
            if (!m) return;

            // Thái Hư
            m.currentRuns = 0;
            m.freeRun2 = false;
            m.freeRun3 = false;
            m.failures = {};

            // Thương Nhân
            m.merchantRuns = 0;

            // Sát Thủ
            m.satThuRuns = 0;
            delete m.satThuCheckTime;
            delete m.satThuTimestamp;
            delete m.satThuCompletedTimestamp;
        });
    }

    // Kiểm tra vị trí đứng hiện tại
    let satThuView = document.getElementById('tab-content-quan-ly-sat-thu');
    let isAtSatThu = satThuView && !satThuView.classList.contains('hidden');

    let merchantView = document.getElementById('tab-content-quan-ly-thuong-nhan');
    let isAtMerchant = merchantView && !merchantView.classList.contains('hidden');

    if (isAtSatThu) {
        if (typeof renderSatThuTableRows === 'function') renderSatThuTableRows();
        if (typeof updateSatThuStatsDashboardUI === 'function') updateSatThuStatsDashboardUI();
    } else if (isAtMerchant) {
        if (typeof renderMerchantTableRows === 'function') renderMerchantTableRows();
    } else {
        if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
        if (typeof renderThaiHuMainView === 'function') renderThaiHuMainView();
        if (typeof renderNavigationSubTabs === 'function') renderNavigationSubTabs();
        if (typeof renderActiveWorkspacePanel === 'function') renderActiveWorkspacePanel();
    }

    if (typeof updateSatThuStatsDashboardUI === 'function') updateSatThuStatsDashboardUI();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
    if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();

    if (typeof showSystemToastNotification === 'function') {
        showSystemToastNotification("Đã Reset thành công tiến độ Thái Hư, Thương Nhân và Sát Thủ!", "success");
    }
}

// Ép ghi đè ra phạm vi toàn cục (window)
window.executeDailyResetPipeline = executeDailyResetPipeline;
window.resetDailyRunsOnly = executeDailyResetPipeline;

window.onload = initSystemEngine;
