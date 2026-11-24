// Tên file: quan-ly-thuong-nhan.js
// Chức năng: Bộ điều phối tổng Tab Thương Nhân (liên kết thuong-nhan-tinh-toan.js, thuong-nhan-popup.js, thuong-nhan-bang-chinh.js).
// Con của file: index.html

let activeMerchantTeamId = null;
let editingMerchantMemberId = null;
let draggedMerchantRowIndex = null;
let isMerchantTabActive = false;

// --- 1. CHUYỂN TAB THƯƠNG NHÂN ---
function switchToMerchantManagementTab() {
    isMerchantTabActive = true;
    if (typeof activeTeamId !== 'undefined') {
        activeTeamId = "merchant_tab_active";
    }

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');

    if (typeof applyMerchantPopupVisibility === 'function') applyMerchantPopupVisibility();
    if (typeof initMerchantViewport === 'function') initMerchantViewport();
    
    let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');
    if (merchantPanel) {
        merchantPanel.classList.remove('hidden');
        if (typeof renderMerchantMainUI === 'function') renderMerchantMainUI();
    }
    if (typeof syncMerchantTimerWidgetVisibility === 'function') {
        syncMerchantTimerWidgetVisibility();
    }
}

function selectMerchantTeam(teamId) {
    activeMerchantTeamId = teamId;
    if (typeof renderMerchantMainUI === 'function') renderMerchantMainUI();
}

// --- 2. THAO TÁC DỮ LIỆU & TIẾN ĐỘ (+1 LƯỢT = +1 NGÂN PHIẾU) ---
function enableEditMerchantMemberName(memberId) {
    editingMerchantMemberId = memberId;
    if (typeof renderMerchantTableBody === 'function') renderMerchantTableBody();
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
        if (typeof renderMerchantCardModal === 'function') renderMerchantCardModal();
        if (typeof renderMerchantTableBody === 'function') renderMerchantTableBody();
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
        if (typeof renderMerchantCardModal === 'function') renderMerchantCardModal();
        if (typeof renderMerchantTableBody === 'function') renderMerchantTableBody();
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
    if (typeof renderMerchantCardModal === 'function') renderMerchantCardModal();
    if (typeof renderMerchantTableBody === 'function') renderMerchantTableBody();
    if (typeof logUserAction === 'function') logUserAction(`Tiến độ Thương Nhân [ ${m.name} ]: ${current + 1}/3 lượt (Ngân Phiếu: ${m.nganPhieu})`);
}

function toggleMerchantMemberLock(memberId) {
    let m = systemDatabase.members[memberId];
    if (!m) return;

    m.merchantLocked = !m.merchantLocked;
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    if (typeof renderMerchantCardModal === 'function') renderMerchantCardModal();
    if (typeof renderMerchantTableBody === 'function') renderMerchantTableBody();
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
    if (typeof renderMerchantCardModal === 'function') renderMerchantCardModal();
    if (typeof renderMerchantMainUI === 'function') renderMerchantMainUI();
    if (typeof logUserAction === 'function') logUserAction(`Chuyển [ ${m ? m.name : memberId} ] sang nhóm ${targetTeam.name.toUpperCase()}`);
}

// --- 3. DRAG & DROP VỊ TRÍ ---
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
    if (typeof renderMerchantCardModal === 'function') renderMerchantCardModal();
    if (typeof renderMerchantTableBody === 'function') renderMerchantTableBody();
    if (typeof logUserAction === 'function') logUserAction("Đã thay đổi thứ tự vị trí tài khoản Thương Nhân");
}

// --- 4. HOOK ĐỒNG BỘ GIAO DIỆN & BỘ ĐẾM THỜI GIAN THỰC ---
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
                Array.from(viewport.children).forEach(child => {
                    if (child.id !== 'tab-content-quan-ly-thuong-nhan') {
                        child.classList.add('hidden');
                    }
                });
            }
            let subNavbar = document.getElementById('sub-navbar-container-zone');
            if (subNavbar) subNavbar.classList.add('hidden');

            if (typeof applyMerchantPopupVisibility === 'function') applyMerchantPopupVisibility();
            merchantPanel.classList.remove('hidden');
            if (typeof renderMerchantMainUI === 'function') renderMerchantMainUI();
        } else {
            isMerchantTabActive = false;
            if (typeof applyMerchantPopupVisibility === 'function') applyMerchantPopupVisibility();
        }
    };
    window.refreshUserInterfaceLayout.__merchantHooked = true;
}

setInterval(() => {
    let merchantPanel = document.getElementById('tab-content-quan-ly-thuong-nhan');
    if (merchantPanel && !merchantPanel.classList.contains('hidden')) {
        if (typeof renderMerchantTableBody === 'function') renderMerchantTableBody();
    }
}, 30000);

setInterval(() => {
    if (typeof setupGoldRateLiveSync === 'function') setupGoldRateLiveSync();
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
