// Tên file: quan-ly-sat-thu.js
// Chức năng: Quản lý Tab Sát Thủ - Giao diện giống 100% Thương Nhân, tiến độ 3/3, mỗi lượt +1 NP, +1.2v (sự kiện +18 NL), có ổ khóa bỏ qua.
// Con của file: index.html

let activeSatThuTeamId = null;
let isSatThuTabActive = false;

// 1. CHUYỂN ĐỔI TAB SANG SÁT THỦ
function switchToSatThuTab() {
    isSatThuTabActive = true;
    if (typeof isMerchantTabActive !== 'undefined') isMerchantTabActive = false;

    // Đổi màu thanh điều hướng tab
    document.querySelectorAll('[id^="main-nav-tab-"]').forEach(btn => {
        btn.className = "px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition text-gray-400 hover:text-white border border-transparent cursor-pointer";
    });
    let curBtn = document.getElementById('main-nav-tab-sat-thu');
    if (curBtn) {
        curBtn.className = "px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition bg-rose-600 text-white shadow-lg cursor-pointer";
    }

    // Ẩn vùng sub-navbar của Thái Hư (Lineup & Sub tabs), hiển thị Sub-tab Data Team
    let subNavbar = document.getElementById('sub-navbar-container-zone');
    if (subNavbar) subNavbar.classList.remove('hidden');

    // Mặc định chọn Team đầu tiên nếu chưa chọn
    if (!activeSatThuTeamId && typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
        let firstDataTeam = systemDatabase.teams.find(t => t.type === 'data');
        if (firstDataTeam) activeSatThuTeamId = firstDataTeam.id;
    }

    renderSatThuSubTabs();
    renderSatThuWorkspaceView();
}

// 2. RENDER CÁC TAB CON (TEAM A -> TEAM L)
function renderSatThuSubTabs() {
    let holder = document.getElementById('sub-tabs-data-team-holder');
    if (!holder || typeof systemDatabase === 'undefined' || !systemDatabase.teams) return;

    let dataTeams = systemDatabase.teams.filter(t => t.type === 'data');
    holder.innerHTML = dataTeams.map(t => {
        let isActive = t.id === activeSatThuTeamId;
        return `
            <button onclick="switchSatThuSubTeam('${t.id}')" class="px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${isActive ? 'bg-rose-600 text-white shadow' : 'bg-gray-800 text-gray-400 hover:text-rose-300'}">
                <i class="fa-solid fa-users"></i> ${t.name.toUpperCase()}
            </button>
        `;
    }).join('');

    // Ẩn hàng 2 của lineup đi nếu đang ở tab Sát Thủ
    let lineupHolder = document.getElementById('sub-tabs-lineup-team-holder');
    if (lineupHolder && lineupHolder.parentElement && lineupHolder.parentElement.parentElement) {
        lineupHolder.parentElement.parentElement.classList.add('hidden');
    }
}

function switchSatThuSubTeam(teamId) {
    activeSatThuTeamId = teamId;
    renderSatThuSubTabs();
    renderSatThuWorkspaceView();
}

// 3. RENDER BẢNG GIAO DIỆN TÀI KHOẢN TAB SÁT THỦ
function renderSatThuWorkspaceView() {
    let viewport = document.getElementById('active-panel-view-viewport');
    if (!viewport || typeof systemDatabase === 'undefined') return;

    let currentTeam = systemDatabase.teams.find(t => t.id === activeSatThuTeamId);
    if (!currentTeam) return;

    let rowsHtml = currentTeam.memberIds.map((mId, idx) => {
        let m = systemDatabase.members[mId];
        if (!m) return '';

        let runs = parseInt(m.satThuRuns) || 0;
        let isLocked = m.satThuLocked === true || m.satThuLocked === "true";
        let fullTitle = (typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, currentTeam) : (m.name || `Tài khoản ${idx + 1}`);

        return `
            <div class="flex items-center justify-between p-2 bg-gray-900 border border-gray-800 rounded-lg text-xs gap-2 select-none hover:border-gray-700 transition ${isLocked ? 'opacity-40 grayscale' : ''}">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                    <span class="text-gray-500 font-mono w-5 text-center">${idx + 1}</span>
                    <span class="font-bold text-gray-200 truncate flex-1">${fullTitle}</span>
                </div>

                <!-- BỘ ĐIỀU KHIỂN TIẾN ĐỘ 3/3 -->
                <div class="flex items-center gap-1">
                    <button onclick="decrementSatThuRun('${m.id}')" ${isLocked ? 'disabled' : ''} class="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-30">-</button>
                    <span class="w-16 text-center font-mono font-bold ${runs >= 3 ? 'text-emerald-400' : 'text-amber-400'}">${runs} / 3</span>
                    <button onclick="incrementSatThuRun('${m.id}')" ${isLocked ? 'disabled' : ''} class="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-30">+</button>
                </div>

                <!-- Ổ KHÓA BỎ QUA -->
                <button onclick="toggleSatThuLock('${m.id}')" class="w-7 h-7 rounded flex items-center justify-center border transition cursor-pointer ${isLocked ? 'bg-rose-950/80 border-rose-600 text-rose-400' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}" title="${isLocked ? 'Mở khóa' : 'Khóa không tính'}">
                    <i class="fa-solid ${isLocked ? 'fa-lock' : 'fa-lock-open'} text-[11px]"></i>
                </button>

                <!-- NÚT COPY TÊN -->
                <button onclick="navigator.clipboard.writeText('${m.name || ''}')" class="w-7 h-7 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer" title="Copy tên nhân vật">
                    <i class="fa-regular fa-copy text-[11px]"></i>
                </button>
            </div>
        `;
    }).join('');

    viewport.innerHTML = `
        <div class="h-full flex flex-col gap-2">
            <div class="flex items-center justify-between px-2 py-1 bg-gray-955 rounded-lg border border-gray-800 text-xs">
                <span class="font-bold text-rose-400 uppercase flex items-center gap-1.5">
                    <i class="fa-solid fa-skull"></i> DANH SÁCH SÁT THỦ - ${currentTeam.name.toUpperCase()}
                </span>
                <span class="text-gray-400 text-[11px]">Thưởng: <b>+1 NP</b> | <b>+1.2v</b> ${typeof EventManager !== 'undefined' && EventManager.isEventCurrentlyActiveGMT7() ? '| <b class="text-amber-400">+18 NL (Sự Kiện)</b>' : ''}</span>
            </div>
            <div class="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                ${rowsHtml}
            </div>
        </div>
    `;
}

// 4. LOGIC TĂNG TIẾN ĐỘ: +1 LƯỢT = +1 NP, +1.2v, (+18 NL nếu SK)
function incrementSatThuRun(mId) {
    let m = systemDatabase.members[mId];
    if (!m) return;
    let cur = parseInt(m.satThuRuns) || 0;
    if (cur < 3) {
        m.satThuRuns = cur + 1;
        // Tự động cộng +1 Ngân Phiếu vào tài khoản
        m.nganPhieu = (parseInt(m.nganPhieu) || 0) + 1;
        triggerGlobalRecalculation();
    }
}

function decrementSatThuRun(mId) {
    let m = systemDatabase.members[mId];
    if (!m) return;
    let cur = parseInt(m.satThuRuns) || 0;
    if (cur > 0) {
        m.satThuRuns = cur - 1;
        // Bù trừ giảm lại ngân phiếu
        m.nganPhieu = Math.max(0, (parseInt(m.nganPhieu) || 0) - 1);
        triggerGlobalRecalculation();
    }
}

function toggleSatThuLock(mId) {
    let m = systemDatabase.members[mId];
    if (!m) return;
    m.satThuLocked = !(m.satThuLocked === true || m.satThuLocked === "true");
    triggerGlobalRecalculation();
}

function triggerGlobalRecalculation() {
    renderSatThuWorkspaceView();
    if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
    if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
}

// 5. HÀM TRÍCH XUẤT SỐ LIỆU SÁT THỦ TOÀN CỤC (CHO CÁC POPUP DÙNG)
function getRealtimeSatThuMetrics() {
    let matPrice = (typeof systemDatabase !== 'undefined' && systemDatabase.materialPrice) ? parseFloat(systemDatabase.materialPrice) : 0.3;
    let isEvent = (typeof EventManager !== 'undefined' && typeof EventManager.isEventCurrentlyActiveGMT7 === 'function')
        ? EventManager.isEventCurrentlyActiveGMT7()
        : false;

    let totalRuns = 0;
    let totalNganPhieu = 0;

    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.values(systemDatabase.members).forEach(m => {
            if (!m || !m.name) return;
            if (m.satThuLocked === true || m.satThuLocked === "true") return; // Bỏ qua nếu có ổ khóa
            let runs = parseInt(m.satThuRuns) || 0;
            totalRuns += runs;
            totalNganPhieu += runs; // 1 lượt = 1 NP
        });
    }

    let directGold = totalRuns * 1.2; // 1.2v mỗi lượt
    let totalMaterials = isEvent ? (totalRuns * 18) : 0; // 18 NL nếu sự kiện, hết sự kiện = 0
    let materialGold = totalMaterials * matPrice;
    let totalGold = directGold + materialGold;

    return {
        runs: totalRuns,
        directGold: directGold,
        materials: totalMaterials,
        materialGold: materialGold,
        totalGold: totalGold,
        nganPhieu: totalNganPhieu
    };
}

window.switchToSatThuTab = switchToSatThuTab;
window.switchSatThuSubTeam = switchSatThuSubTeam;
window.incrementSatThuRun = incrementSatThuRun;
window.decrementSatThuRun = decrementSatThuRun;
window.toggleSatThuLock = toggleSatThuLock;
window.getRealtimeSatThuMetrics = getRealtimeSatThuMetrics;