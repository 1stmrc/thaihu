// Tên file: giao-dien-cai-dat-mon-phai.js
// Chức năng: Module Cài Đặt Môn Phái - Hỗ trợ hiển thị tên trống dạng A.01 dgc, ghép định dạng chuẩn và xử lý riêng biệt.
// Con của file: index.html

const FACTION_LIST_CONFIG = [
    { id: "",       code: "",       label: "-- Chưa chọn phái --" },
    { id: "01_dgc", code: "01 dgc", label: "01 dgc (Dương Gia Cung)" },
    { id: "02_5d",  code: "02 5d",  label: "02 5d (Ngũ Độc)" },
    { id: "03_nmd", code: "03 nmd", label: "03 nmd (Nga Mi Đàn)" },
    { id: "09_cs",  code: "09 cs",  label: "09 cs (Cổ Sư)" },
    { id: "12_cbq", code: "12 cbq", label: "12 cbq (Cái Bang Quyền)" },
    { id: "13_nmk", code: "13 nmk", label: "13 nmk (Nga Mi Kiếm)" },
    { id: "14_dmc", code: "14 dmc", label: "14 dmc (Đường Môn Châm)" },
    { id: "18_cbb", code: "18 cbb", label: "18 cbb (Cái Bang Bổng)" },
    { id: "19_vdk", code: "19 vdk", label: "19 vdk (Võ Đang Kiếm)" },
    { id: "22_tlt", code: "22 tlt", label: "22 tlt (Thiếu Lâm Trượng)" },
    { id: "23_dgt", code: "23 dgt", label: "23 dgt (Dương Gia Thương)" },
    { id: "24_tld", code: "24 tld", label: "24 tld (Thiếu Lâm Đao)" },
    { id: "25_vdb", code: "25 vdb", label: "25 vdb (Võ Đang Bút)" },
    { id: "26_tlq", code: "26 tlq", label: "26 tlq (Thiếu Lâm Quyền)" }
];

// GHÉP CHUỖI HIỂN THỊ CHUẨN (HỖ TRỢ CẢ TRƯỜNG HỢP TÊN TRỐNG)
function getMemberFullDisplayTitle(member, team) {
    if (!member) return "";
    let rawName = member.name || "";
    let coreName = (typeof getPureCoreAccountName === 'function') ? getPureCoreAccountName(rawName) : rawName;

    let teamPrefix = team && team.name ? (team.name.replace(/^TEAM\s+/i, '').trim().charAt(0).toUpperCase() + '.') : '';
    let factionObj = FACTION_LIST_CONFIG.find(f => f.id === member.factionId || (f.code && f.code === member.factionCode));
    let factionCode = factionObj ? factionObj.code : "";

    // Nếu tên TK trống: ghép A. + 01 dgc -> A.01 dgc
    let result = coreName.trim();
    if (factionCode) {
        result = result ? `${factionCode} ${result}` : factionCode;
    }
    if (teamPrefix) {
        result = `${teamPrefix}${result}`;
    }

    return result || teamPrefix;
}

function injectFactionSettingsTabUI() {
    let modal = document.getElementById('settings-modal');
    if (!modal) return;

    let tabHeader = modal.querySelector('.border-b') || modal.querySelector('[id^="btn-modal-tab-"]')?.parentElement;
    if (tabHeader && !document.getElementById('btn-modal-tab-faction')) {
        let btnFaction = document.createElement('button');
        btnFaction.id = 'btn-modal-tab-faction';
        btnFaction.type = 'button';
        btnFaction.className = 'flex-1 py-1 text-gray-400 cursor-pointer text-center font-bold text-xs hover:text-amber-300 transition';
        btnFaction.innerText = 'Môn Phái';
        btnFaction.onclick = () => switchModalTab('modal-tab-faction');

        let btnRuns = document.getElementById('btn-modal-tab-runs');
        if (btnRuns && btnRuns.nextSibling) {
            tabHeader.insertBefore(btnFaction, btnRuns.nextSibling);
        } else {
            tabHeader.appendChild(btnFaction);
        }
    }

    let bodyContainer = modal.querySelector('.p-4') || modal.querySelector('.p-3') || modal.firstElementChild;
    if (bodyContainer && !document.getElementById('view-modal-tab-faction')) {
        let panelView = document.createElement('div');
        panelView.id = 'view-modal-tab-faction';
        panelView.className = 'modal-tab-panel hidden flex flex-col gap-2.5 mt-2';
        
        panelView.innerHTML = `
            <div class="flex items-center justify-between gap-2 mb-1">
                <label class="text-xs font-bold text-gray-300">Chọn Nhóm Cài Môn Phái:</label>
                <select id="modal-faction-team-picker" onchange="renderModalFactionConfigRows()" class="bg-gray-800 border border-gray-700 rounded-lg p-1.5 text-xs text-amber-300 font-bold focus:outline-none w-48 shadow">
                </select>
            </div>

            <div id="modal-faction-config-scroll-area" class="max-h-56 overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar bg-gray-955 p-2 rounded-xl border border-gray-800 min-h-[160px]">
            </div>
        `;

        let footerBtns = modal.querySelector('.flex.justify-end') || modal.querySelector('button[onclick*="commitModalMaxRunBoundSettings"]')?.parentElement;
        if (footerBtns) {
            bodyContainer.insertBefore(panelView, footerBtns);
        } else {
            bodyContainer.appendChild(panelView);
        }
    }

    let factionPicker = document.getElementById('modal-faction-team-picker');
    if (factionPicker && typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
        let dataTeams = systemDatabase.teams.filter(x => x.type === 'data');
        factionPicker.innerHTML = dataTeams.map(t => `<option value="${t.id}">${t.name.toUpperCase()}</option>`).join('');
    }
}

function renderModalFactionConfigRows() {
    let picker = document.getElementById('modal-faction-team-picker');
    let targetWrapper = document.getElementById('modal-faction-config-scroll-area');
    if (!picker || !targetWrapper || typeof systemDatabase === 'undefined') return;

    let teamId = picker.value;
    targetWrapper.innerHTML = "";
    let team = systemDatabase.teams.find(x => x.id === teamId);
    if (!team) return;

    team.memberIds.forEach(mId => {
        let m = systemDatabase.members[mId];
        if (!m) return;

        let fullTitle = getMemberFullDisplayTitle(m, team);

        let optionsHtml = FACTION_LIST_CONFIG.map(f => `
            <option value="${f.id}" class="bg-gray-900 text-white font-semibold" ${m.factionId === f.id ? 'selected' : ''}>
                ${f.label}
            </option>
        `).join('');

        let block = document.createElement('div');
        block.className = "flex items-center justify-between bg-gray-900 p-2 rounded-lg border border-gray-750 gap-2 text-xs shadow-sm hover:border-amber-500/50 transition";
        
        block.innerHTML = `
            <div class="truncate font-bold text-gray-200 flex items-center gap-1.5 flex-1 pr-2">
                <span class="truncate">${fullTitle}</span>
            </div>
            <select data-faction-mid="${m.id}" class="modal-inner-faction-select bg-gray-800 border border-gray-600 rounded px-2 py-1 text-[11px] text-emerald-300 font-bold focus:outline-none focus:border-amber-500 max-w-[180px] shrink-0">
                ${optionsHtml}
            </select>
        `;
        targetWrapper.appendChild(block);
    });
}

function saveFactionSettingsConfiguration() {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.members) return [];

    let updatedLogs = [];
    let selects = document.querySelectorAll('.modal-inner-faction-select');

    selects.forEach(select => {
        let mId = select.getAttribute('data-faction-mid');
        let selectedFactionId = select.value;
        let m = systemDatabase.members[mId];

        if (m) {
            let factionObj = FACTION_LIST_CONFIG.find(f => f.id === selectedFactionId);
            m.factionId = selectedFactionId;
            m.factionCode = factionObj ? factionObj.code : "";

            let rawName = m.name || "";
            let coreName = (typeof getPureCoreAccountName === 'function') ? getPureCoreAccountName(rawName) : rawName;
            
            m.name = coreName; 
            updatedLogs.push(`${coreName || '[Trống]'} -> Phái: ${factionObj ? factionObj.code : 'Chưa chọn'}`);
        }
    });

    return updatedLogs;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectFactionSettingsTabUI);
} else {
    injectFactionSettingsTabUI();
}