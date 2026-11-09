// Tên file: quan-ly-sat-thu.js
// Chức năng: Quản lý Tab Sát Thủ - Nền hơi đỏ dark-wine, bỏ cột kéo, giờ dạng xHy sáng nét, copy chuẩn xác 100%, có thanh tiến độ trực quan.
// Con của file: index.html

let activeSatThuTeamId = null;

function switchToSatThuTab() {
    if (typeof setActiveMainTabUI === 'function') {
        setActiveMainTabUI('satthu');
    }

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');

    let viewport = document.getElementById('active-panel-view-viewport');
    if (viewport) {
        Array.from(viewport.children).forEach(child => child.classList.add('hidden'));
    }

    initSatThuTableWorkspace();
    let satThuPanel = document.getElementById('tab-content-quan-ly-sat-thu');
    if (satThuPanel) {
        satThuPanel.classList.remove('hidden');
        renderSatThuMainUI();
    }
}

// KHỞI TẠO BẢNG SÁT THỦ: NỀN HƠI ĐỎ, CÓ THANH TIẾN ĐỘ, BỎ CỘT KÉO
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
            <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-rose-900/40 shrink-0">
                <div class="flex-1 overflow-x-auto no-scrollbar">
                    <div class="flex items-center gap-1.5 min-w-max" id="sat-thu-sub-tabs-holder"></div>
                </div>
            </div>

            <!-- THANH TIẾN ĐỘ TỔNG THỂ CỦA TEAM (MÀU ĐỎ HỒNG NEON) -->
            <div class="bg-[#1b0d12] border border-rose-900/50 rounded-xl px-3 py-2 shrink-0 flex items-center justify-between gap-3 shadow-inner">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-black text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <i class="fa-solid fa-fire text-rose-500"></i> Tiến Độ Sát Thủ:
                    </span>
                    <span id="sat-thu-progress-text" class="text-xs font-mono font-bold text-white">0 / 24 Lượt (0%)</span>
                </div>
                <div class="flex-1 max-w-xs bg-gray-900/90 h-2.5 rounded-full overflow-hidden border border-rose-950 p-0.5">
                    <div id="sat-thu-progress-bar" class="h-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-400 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(244,63,94,0.6)]" style="width: 0%"></div>
                </div>
            </div>

            <!-- BẢNG DỮ LIỆU NỀN HƠI ĐỎ (#16080c) -->
            <div class="flex-1 overflow-hidden bg-[#16080c] rounded-xl border border-rose-950/70 p-2 flex flex-col shadow-2xl">
                <div class="w-full overflow-y-auto custom-scrollbar flex-1">
                    <table class="w-full text-left text-xs border-collapse table-fixed">
                        <thead>
                            <tr class="text-rose-300/80 border-b border-rose-900/40 pb-2 uppercase text-[11px] font-bold">
                                <th class="p-2.5 w-12 text-center">STT</th>
                                <th class="p-2.5 w-[280px]">TÊN TÀI KHOẢN</th>
                                <th class="p-2.5 w-20 text-center">CHECK</th>
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

    let holder = document.getElementById('sat-thu-sub-tabs-holder');
    if (holder) {
        holder.innerHTML = dataTeams.map(t => {
            let isActive = t.id === activeSatThuTeamId;
            return `
                <button onclick="selectSatThuSubTeam('${t.id}')" class="px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${isActive ? 'bg-rose-600 text-white shadow-md border border-rose-400/50' : 'bg-[#220d14] text-rose-300/70 border border-rose-950 hover:text-white hover:bg-rose-900/50'}">
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

// VẼ CÁC HÀNG: GIỜ DẠNG xHy SÁNG NÉT, NÚT COPY CHUẨN, BỎ CỘT KÉO
function renderSatThuTableRows() {
    let tbody = document.getElementById('sat-thu-table-body-rows');
    if (!tbody || typeof systemDatabase === 'undefined') return;

    let team = systemDatabase.teams.find(t => t.id === activeSatThuTeamId);
    if (!team) return;

    let allDataTeams = systemDatabase.teams.filter(t => t.type === 'data');
    
    // Tính toán tiến độ tổng cho thanh Progress bar
    let totalTeamRuns = 0;
    let maxPossibleRuns = team.memberIds.length * 3;

    let rowsHtml = "";

    team.memberIds.forEach((mId, index) => {
        let m = systemDatabase.members[mId];
        if (!m) return;

        let runs = parseInt(m.satThuRuns) || 0;
        let isLocked = m.satThuLocked === true || m.satThuLocked === "true";
        if (!isLocked) totalTeamRuns += runs;

        let fullTitle = (typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, team) : (m.name || `Tài khoản ${index + 1}`);

        // ĐỊNH DẠNG GIỜ CHUẨN xHy (Ví dụ: 8H30)
        let timeDisplay = m.satThuCheckTime;
        if (!timeDisplay) {
            let now = new Date();
            let hh = now.getHours();
            let mm = String(now.getMinutes()).padStart(2, '0');
            timeDisplay = `${hh}H${mm}`;
            m.satThuCheckTime = timeDisplay;
        }

        let teamOptions = allDataTeams.map(t => `
            <option value="${t.id}" ${t.id === team.id ? 'selected' : ''} class="bg-gray-900 text-white">- ${t.name.toUpperCase()} -</option>
        `).join('');

        rowsHtml += `
            <tr class="border-b border-rose-950/40 hover:bg-rose-950/20 transition text-xs select-none ${isLocked ? 'opacity-35 grayscale' : ''}">
                <td class="p-2.5 text-center font-mono text-rose-400/80 font-bold">${index + 1}</td>
                <td class="p-2.5 font-bold text-gray-100 truncate max-w-[280px]">${fullTitle}</td>
                
                <!-- GIỜ CHECK SÁNG RÕ RÀNG DẠNG xHy (VD: 8H30) -->
                <td class="p-2.5 text-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-rose-950/90 text-rose-300 border border-rose-600/80 shadow-[0_0_8px_rgba(244,63,94,0.3)]">${timeDisplay}</span>
                </td>

                <td class="p-2.5 text-center">
                    <div class="flex items-center justify-center gap-1.5 bg-[#100508] p-1 rounded-lg border border-rose-900/60 w-[210px] mx-auto shadow-inner">
                        <button onclick="changeSatThuRunProgress('${m.id}', -1)" ${isLocked ? 'disabled' : ''} class="w-6 h-6 rounded bg-rose-950 hover:bg-rose-800 text-rose-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-20 transition">-</button>
                        <span class="flex-1 text-center font-mono font-bold ${runs >= 3 ? 'text-emerald-400' : 'text-rose-300'} text-xs">${runs} / 3</span>
                        <button onclick="changeSatThuRunProgress('${m.id}', 1)" ${isLocked ? 'disabled' : ''} class="w-6 h-6 rounded bg-rose-950 hover:bg-rose-800 text-emerald-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-20 transition">+</button>
                    </div>
                </td>

                <td class="p-2.5 text-center">
                    <button onclick="toggleSatThuLockMember('${m.id}')" class="text-gray-400 hover:text-white transition cursor-pointer">
                        <i class="fa-solid ${isLocked ? 'fa-lock text-rose-500' : 'fa-lock-open text-gray-500'} text-xs"></i>
                    </button>
                </td>

                <!-- NÚT COPY CHUẨN XÁC VỚI FALLBACK -->
                <td class="p-2.5 text-center">
                    <button onclick="copySatThuName('${m.name || ''}', this)" class="w-6 h-6 rounded bg-rose-950/80 hover:bg-rose-700 text-rose-300 hover:text-white border border-rose-800 transition flex items-center justify-center mx-auto cursor-pointer" title="Copy tên nhân vật">
                        <i class="fa-regular fa-copy text-[11px]"></i>
                    </button>
                </td>

                <td class="p-2.5 text-center">
                    <select onchange="moveSatThuMemberToOtherTeam('${m.id}', this.value)" class="bg-[#240e15] border border-rose-900/80 text-rose-200 rounded px-1.5 py-1 text-[11px] font-mono outline-none cursor-pointer">
                        ${teamOptions}
                    </select>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;

    // Cập nhật giá trị hiển thị trên thanh tiến độ
    let progPercent = maxPossibleRuns > 0 ? Math.round((totalTeamRuns / maxPossibleRuns) * 100) : 0;
    let progTextEl = document.getElementById('sat-thu-progress-text');
    let progBarEl = document.getElementById('sat-thu-progress-bar');
    if (progTextEl) progTextEl.innerText = `${totalTeamRuns} / ${maxPossibleRuns} Lượt (${progPercent}%)`;
    if (progBarEl) progBarEl.style.width = `${progPercent}%`;
}

// CẬP NHẬT TIẾN ĐỘ, TỰ ĐỘNG CẬP NHẬT GIỜ CHECK THỰC TẾ
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

        // Cập nhật mốc giờ check khi có thay đổi lượt
        let now = new Date();
        m.satThuCheckTime = `${now.getHours()}H${String(now.getMinutes()).padStart(2, '0')}`;

        renderSatThuTableRows();

        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
        if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
        if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
    }
}

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

// HÀM COPY HOẠT ĐỘNG CHẮC CHẮN TRÊN MỌI TRÌNH DUYỆT (KÈM FEEDBACK ICON TÍCH XANH)
function copySatThuName(text, btnElement) {
    if (!text) return;

    function showSuccess() {
        if (btnElement) {
            let icon = btnElement.querySelector('i');
            if (icon) {
                icon.className = "fa-solid fa-check text-emerald-400 text-[11px]";
                setTimeout(() => {
                    icon.className = "fa-regular fa-copy text-[11px]";
                }, 1000);
            }
        }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
            fallbackCopy(text);
            showSuccess();
        });
    } else {
        fallbackCopy(text);
        showSuccess();
    }
}

function fallbackCopy(text) {
    let textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
    } catch (e) {
        console.error(e);
    }
    document.body.removeChild(textArea);
}

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
