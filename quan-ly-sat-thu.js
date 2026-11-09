// Tên file: quan-ly-sat-thu.js
// Chức năng: Quản lý Tab Sát Thủ - Kế thừa 100% giao diện bảng Thương Nhân (8 cột chuẩn), tiến độ 3/3 (+1 NP, +1.2v, SK: +18 NL).
// Con của file: index.html

let activeSatThuTeamId = null;

function switchToSatThuTab() {
    // 1. Reset class của toàn bộ các nút tab chính
    document.querySelectorAll('[id^="btn-main-tab-"]').forEach(btn => {
        btn.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    });

    // 2. Kích hoạt màu đỏ cho tab Sát Thủ
    let btnSatThu = document.getElementById('main-nav-tab-sat-thu');
    if (btnSatThu) {
        btnSatThu.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-rose-600 text-white shadow border border-rose-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    }

    // 3. Ẩn thanh điều hướng phụ mặc định của Thái Hư
    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');

    // 4. Ẩn toàn bộ view con hiện tại trong Viewport
    let viewport = document.getElementById('active-panel-view-viewport');
    if (viewport) {
        Array.from(viewport.children).forEach(child => child.classList.add('hidden'));
    }

    // 5. Khởi tạo và hiển thị khung Sát Thủ
    initSatThuTableWorkspace();
    let satThuPanel = document.getElementById('tab-content-quan-ly-sat-thu');
    if (satThuPanel) {
        satThuPanel.classList.remove('hidden');
        renderSatThuMainUI();
    }
}

// KHỞI TẠO BẢNG CHUẨN FORM THƯƠNG NHÂN (TABLE 8 CỘT)
function initSatThuTableWorkspace() {
    let viewport = document.getElementById('active-panel-view-viewport');
    if (!viewport) return;

    let panel = document.getElementById('tab-content-quan-ly-sat-thu');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'tab-content-quan-ly-sat-thu';
        panel.className = "w-full h-full flex flex-col gap-2 text-gray-200 select-none";

        panel.innerHTML = `
            <!-- HÀNG SUB-TABS: TEAM A -> TEAM L -->
            <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-700/70 shrink-0">
                <div class="flex-1 overflow-x-auto no-scrollbar">
                    <div class="flex items-center gap-1.5 min-w-max" id="sat-thu-sub-tabs-holder"></div>
                </div>
            </div>

            <!-- BẢNG DỮ LIỆU ĐÚNG CHUẨN FORM THƯƠNG NHÂN -->
            <div class="flex-1 overflow-hidden bg-gray-955 rounded-xl border border-gray-800 p-2 flex flex-col">
                <div class="w-full overflow-y-auto custom-scrollbar flex-1">
                    <table class="w-full text-left text-xs border-collapse table-fixed">
                        <thead>
                            <tr class="text-gray-400 border-b border-gray-800 pb-2 uppercase text-[11px] font-bold">
                                <th class="p-2.5 w-10 text-center">KÉO</th>
                                <th class="p-2.5 w-10 text-center">STT</th>
                                <th class="p-2.5 w-[260px]">TÊN TÀI KHOẢN</th>
                                <th class="p-2.5 w-16 text-center">CHECK</th>
                                <th class="p-2.5 text-center w-[230px]">TIẾN ĐỘ SÁT THỦ</th>
                                <th class="p-2.5 w-14 text-center">KHÓA</th>
                                <th class="p-2.5 w-14 text-center">COPY</th>
                                <th class="p-2.5 w-32 text-center">CHUYỂN NHÓM</th>
                            </tr>
                        </thead>
                        <tbody id="sat-thu-table-body-rows"></tbody>
                    </table>
                </div>
            </div>
        `;
        viewport.appendChild(panel);
    }
}

function renderSatThuMainUI() {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.teams) return;

    let dataTeams = systemDatabase.teams.filter(t => t.type === 'data');
    if (dataTeams.length === 0) return;

    if (!activeSatThuTeamId || !dataTeams.find(t => t.id === activeSatThuTeamId)) {
        activeSatThuTeamId = dataTeams[0].id;
    }

    // Vẽ các nút Team A -> Team L
    let holder = document.getElementById('sat-thu-sub-tabs-holder');
    if (holder) {
        holder.innerHTML = dataTeams.map(t => {
            let isActive = t.id === activeSatThuTeamId;
            return `
                <button onclick="selectSatThuSubTeam('${t.id}')" class="px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${isActive ? 'bg-amber-600 text-white shadow-md' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}">
                    <i class="fa-solid fa-users text-[10px]"></i> ${t.name.toUpperCase()}
                </button>
            `;
        }).join('');
    }

    renderSatThuTableRows();
}

function selectSatThuSubTeam(tId) {
    activeSatThuTeamId = tId;
    renderSatThuMainUI();
}

// VẼ CÁC HÀNG THEO ĐÚNG NGUYÊN BẢN ẢNH 2
function renderSatThuTableRows() {
    let tbody = document.getElementById('sat-thu-table-body-rows');
    if (!tbody || typeof systemDatabase === 'undefined') return;

    let team = systemDatabase.teams.find(t => t.id === activeSatThuTeamId);
    if (!team) return;

    let allDataTeams = systemDatabase.teams.filter(t => t.type === 'data');
    let currentHour = new Date().getHours();
    let rowsHtml = "";

    team.memberIds.forEach((mId, index) => {
        let m = systemDatabase.members[mId];
        if (!m) return;

        let runs = parseInt(m.satThuRuns) || 0;
        let isLocked = m.satThuLocked === true || m.satThuLocked === "true";
        let fullTitle = (typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, team) : (m.name || `Tài khoản ${index + 1}`);

        let teamOptions = allDataTeams.map(t => `
            <option value="${t.id}" ${t.id === team.id ? 'selected' : ''} class="bg-gray-900 text-white">- ${t.name.toUpperCase()} -</option>
        `).join('');

        rowsHtml += `
            <tr class="border-b border-gray-800/60 hover:bg-gray-800/30 transition text-xs select-none ${isLocked ? 'opacity-40 grayscale' : ''}">
                <td class="p-2.5 text-center text-gray-600"><i class="fa-solid fa-bars cursor-grab"></i></td>
                <td class="p-2.5 text-center font-mono text-gray-400">${index + 1}</td>
                <td class="p-2.5 font-bold text-gray-200 truncate max-w-[260px]">${fullTitle}</td>
                
                <td class="p-2.5 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-800/80 text-gray-400 border border-gray-700/80">${currentHour}h</span>
                </td>

                <td class="p-2.5 text-center">
                    <div class="flex items-center justify-center gap-1.5 bg-gray-955 p-1 rounded-lg border border-gray-800 w-[210px] mx-auto">
                        <button onclick="changeSatThuRunProgress('${m.id}', -1)" ${isLocked ? 'disabled' : ''} class="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-rose-400 font-bold flex items-center justify-center cursor-pointer disabled:opacity-20">-</button>
                        <span class="flex-1 text-center font-mono font-bold text-gray-200 text-xs">${runs} / 3</span>
                        <button onclick="changeSatThuRunProgress('${m.id}', 1)" ${isLocked ? 'disabled' : ''} class="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-emerald-400 font-bold flex items-center justify-center cursor-pointer disabled:opacity-20">+</button>
                    </div>
                </td>

                <td class="p-2.5 text-center">
                    <button onclick="toggleSatThuLockMember('${m.id}')" class="text-gray-400 hover:text-white transition cursor-pointer">
                        <i class="fa-solid ${isLocked ? 'fa-lock text-rose-500' : 'fa-lock-open text-gray-500'} text-xs"></i>
                    </button>
                </td>

                <td class="p-2.5 text-center">
                    <button onclick="copySatThuName('${m.name || ''}', event)" class="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 transition flex items-center justify-center mx-auto cursor-pointer" title="Copy tên">
                        <i class="fa-regular fa-copy text-[11px]"></i>
                    </button>
                </td>

                <td class="p-2.5 text-center">
                    <select onchange="moveSatThuMemberToOtherTeam('${m.id}', this.value)" class="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-[11px] font-mono outline-none cursor-pointer">
                        ${teamOptions}
                    </select>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
}

// ĐIỀU CHỈNH TIẾN ĐỘ & BÙ TRỪ NGÂN PHIẾU (+1 LƯỢT = +1 NP)
function changeSatThuRunProgress(mId, delta) {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.members) return;
    let m = systemDatabase.members[mId];
    if (!m) return;

    let cur = parseInt(m.satThuRuns) || 0;
    let next = Math.max(0, Math.min(3, cur + delta));

    if (next !== cur) {
        let diff = next - cur;
        m.satThuRuns = next;
        m.nganPhieu = Math.max(0, (parseInt(m.nganPhieu) || 0) + diff);

        renderSatThuTableRows();

        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
        if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
        if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
    }
}

// Ổ KHÓA BỎ QUA
function toggleSatThuLockMember(mId) {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.members) return;
    let m = systemDatabase.members[mId];
    if (!m) return;

    m.satThuLocked = !(m.satThuLocked === true || m.satThuLocked === "true");

    renderSatThuTableRows();

    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
    if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
}

// CHUYỂN NHÓM
function moveSatThuMemberToOtherTeam(mId, targetTeamId) {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.teams) return;
    let fromTeam = systemDatabase.teams.find(t => t.id === activeSatThuTeamId);
    let toTeam = systemDatabase.teams.find(t => t.id === targetTeamId);

    if (fromTeam && toTeam && fromTeam.id !== toTeam.id) {
        fromTeam.memberIds = fromTeam.memberIds.filter(id => id !== mId);
        if (!toTeam.memberIds.includes(mId)) {
            toTeam.memberIds.push(mId);
        }
        renderSatThuTableRows();
        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    }
}

// HÀM COPY ĐỒNG BỘ CHỐNG LỖI FOCUS
function copySatThuName(name, event) {
    if (event) event.stopPropagation();
    if (!name) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(name);
    }
}

// HÀM XUẤT SỐ LIỆU ĐỂ CÁC POPUP THỐNG KÊ GỌI
function getRealtimeSatThuMetrics() {
    let matPrice = (typeof systemDatabase !== 'undefined' && systemDatabase.materialPrice) ? parseFloat(systemDatabase.materialPrice) : 0.3;
    let isEvent = (typeof EventManager !== 'undefined' && typeof EventManager.isEventCurrentlyActiveGMT7 === 'function')
        ? EventManager.isEventCurrentlyActiveGMT7()
        : (typeof isEventCurrentlyActiveGMT7 === 'function' ? isEventCurrentlyActiveGMT7() : false);

    let totalRuns = 0;
    let totalNganPhieu = 0;

    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.values(systemDatabase.members).forEach(m => {
            if (!m || !m.name) return;
            if (m.satThuLocked === true || m.satThuLocked === "true") return;
            let r = parseInt(m.satThuRuns) || 0;
            totalRuns += r;
            totalNganPhieu += r;
        });
    }

    let directGold = totalRuns * 1.2;
    let totalMaterials = isEvent ? (totalRuns * 18) : 0;
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
window.selectSatThuSubTeam = selectSatThuSubTeam;
window.changeSatThuRunProgress = changeSatThuRunProgress;
window.toggleSatThuLockMember = toggleSatThuLockMember;
window.moveSatThuMemberToOtherTeam = moveSatThuMemberToOtherTeam;
window.copySatThuName = copySatThuName;
window.getRealtimeSatThuMetrics = getRealtimeSatThuMetrics;
