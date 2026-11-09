// Tên file: quan-ly-sat-thu.js
// Chức năng: Quản lý Tab Sát Thủ - Giờ định dạng xHy nền xanh ngọc, click trực tiếp vào ô tiến độ để +1 lượt, bảng nền đỏ rượu.
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

    if (typeof showSatThuStatsPopup === 'function') {
        showSatThuStatsPopup();
    }
}

function initSatThuTableWorkspace() {
    let viewport = document.getElementById('active-panel-view-viewport');
    if (!viewport) return;

    let panel = document.getElementById('tab-content-quan-ly-sat-thu');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'tab-content-quan-ly-sat-thu';
        panel.className = "w-full h-full flex flex-col gap-2 text-gray-200 select-none";

        panel.innerHTML = `
            <!-- HÀNG SUB-TABS: TEAM A -> TEAM L CÓ MŨI TÊN VÀNG TO -->
            <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-rose-900/40 shrink-0">
                <div class="flex-1 overflow-x-auto no-scrollbar">
                    <div class="flex items-center gap-1.5 min-w-max" id="sat-thu-sub-tabs-holder"></div>
                </div>
            </div>

            <!-- BẢNG DỮ LIỆU NỀN ĐỎ RƯỢU TỐI (#16080c) -->
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
                    <i class="fa-solid fa-users text-[10px]"></i>
                    <span>${t.name.toUpperCase()}</span>
                    ${isActive ? '<i class="fa-solid fa-caret-down text-sm ml-1 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce"></i>' : ''}
                </button>
            `;
        }).join('');
    }

    renderSatThuTableRows();
    if (typeof updateSatThuStatsDashboardUI === 'function') {
        updateSatThuStatsDashboardUI();
    }
}

function selectSatThuSubTeam(tId) {
    activeSatThuTeamId = tId;
    renderSatThuMainUI();
}

function renderSatThuTableRows() {
    let tbody = document.getElementById('sat-thu-table-body-rows');
    if (!tbody || typeof systemDatabase === 'undefined') return;

    let team = systemDatabase.teams.find(t => t.id === activeSatThuTeamId);
    if (!team) return;

    let allDataTeams = systemDatabase.teams.filter(t => t.type === 'data');
    let rowsHtml = "";

    team.memberIds.forEach((mId, index) => {
        let m = systemDatabase.members[mId];
        if (!m) return;

        let runs = parseInt(m.satThuRuns) || 0;
        let isLocked = m.satThuLocked === true || m.satThuLocked === "true";
        let fullTitle = (typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, team) : (m.name || `Tài khoản ${index + 1}`);

        // ĐỊNH DẠNG GIỜ xHy NỀN XANH NGỌC - BỎ HẲN CHỮ CHECK
        let timeBadgeHtml = "";
        if (runs === 0) {
            timeBadgeHtml = `
                <span class="inline-block py-1 px-2.5 rounded-lg bg-gray-900/80 border border-gray-800 text-gray-500 font-mono text-[11px] font-bold">0h</span>
            `;
        } else {
            let clockStr = m.satThuCheckTime || "0h";
            timeBadgeHtml = `
                <span class="inline-block py-1 px-2.5 rounded-lg bg-emerald-600 border border-emerald-400 text-white font-mono font-black text-xs shadow-[0_0_8px_rgba(16,185,129,0.4)] tracking-wide">${clockStr}</span>
            `;
        }

        let percent = Math.round((runs / 3) * 100);
        let progressFillClass = (runs === 3) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-600";

        let teamOptions = allDataTeams.map(t => `
            <option value="${t.id}" ${t.id === team.id ? 'selected' : ''} class="bg-gray-900 text-white">- ${t.name.toUpperCase()} -</option>
        `).join('');

        rowsHtml += `
            <tr class="border-b border-rose-950/40 hover:bg-rose-950/20 transition text-xs select-none ${isLocked ? 'opacity-35 grayscale' : ''}">
                <td class="p-2.5 text-center font-mono text-rose-400/80 font-bold">${index + 1}</td>
                <td class="p-2.5 font-bold text-gray-100 truncate max-w-[280px]">${fullTitle}</td>
                
                <!-- CỘT GIỜ CHECK xHy -->
                <td class="p-2 text-center">
                    ${timeBadgeHtml}
                </td>

                <!-- TIẾN ĐỘ: CHO PHÉP CLICK TRỰC TIẾP VÀO Ô GIỮA ĐỂ +1 TIẾN ĐỘ -->
                <td class="p-2.5 text-center">
                    <div class="flex items-center justify-center gap-1.5 bg-[#100508] p-1 rounded-lg border border-rose-900/60 w-[210px] mx-auto shadow-inner">
                        <button onclick="changeSatThuRunProgress('${m.id}', -1)" ${isLocked ? 'disabled' : ''} class="w-6 h-6 rounded bg-rose-950 hover:bg-rose-800 text-rose-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-20 transition shrink-0" title="Trừ 1 lượt">-</button>
                        
                        <div onclick="${isLocked ? '' : `changeSatThuRunProgress('${m.id}', 1)`}" class="relative flex-1 h-6 rounded overflow-hidden bg-gray-955 border border-rose-950 flex items-center justify-center font-mono font-bold text-xs cursor-pointer hover:border-rose-500 transition select-none" title="Click để +1 tiến độ">
                            <div class="absolute left-0 top-0 h-full ${progressFillClass} transition-all duration-300" style="width: ${percent}%"></div>
                            <span class="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none">${runs} / 3</span>
                        </div>

                        <button onclick="changeSatThuRunProgress('${m.id}', 1)" ${isLocked ? 'disabled' : ''} class="w-6 h-6 rounded bg-rose-950 hover:bg-rose-800 text-emerald-300 font-bold flex items-center justify-center cursor-pointer disabled:opacity-20 transition shrink-0" title="Cộng 1 lượt">+</button>
                    </div>
                </td>

                <td class="p-2.5 text-center">
                    <button onclick="toggleSatThuLockMember('${m.id}')" class="text-gray-400 hover:text-white transition cursor-pointer">
                        <i class="fa-solid ${isLocked ? 'fa-lock text-rose-500' : 'fa-lock-open text-gray-500'} text-xs"></i>
                    </button>
                </td>

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
}

// CẬP NHẬT TIẾN ĐỘ VÀ GHI MỐC THỜI GIAN ĐỊNH DẠNG xHy
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

        let now = new Date();
        let nowMs = now.getTime();

        if (next === 0) {
            delete m.satThuCheckTime;
            delete m.satThuTimestamp;
            delete m.satThuCompletedTimestamp;
        } else {
            // ĐỊNH DẠNG CHUẨN xHy (VD: 8h57, 20h15)
            let hh = now.getHours();
            let mm = String(now.getMinutes()).padStart(2, '0');
            m.satThuCheckTime = `${hh}h${mm}`;
            if (!m.satThuTimestamp) m.satThuTimestamp = nowMs;

            if (next === 3) {
                m.satThuCompletedTimestamp = nowMs;
            } else {
                delete m.satThuCompletedTimestamp;
            }
        }

        renderSatThuTableRows();

        if (typeof updateSatThuStatsDashboardUI === 'function') updateSatThuStatsDashboardUI();
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

    if (typeof updateSatThuStatsDashboardUI === 'function') updateSatThuStatsDashboardUI();
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
