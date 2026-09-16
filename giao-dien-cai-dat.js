// Tên file: giao-dien-cai-dat.js
// Chức năng: Điều phối Cài Đặt Hệ Thống - Hiển thị tên đầy đủ dạng A.01 dgc bên tab Mốc Lượt.
// Con của file: index.html

let currentActiveSettingsTabId = 'modal-tab-runs';

function openSettingsModal() { 
    if (typeof injectSettingsModalComponent === 'function') {
        injectSettingsModalComponent();
    }

    let modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('hidden'); 
    }
    
    if (typeof injectFactionSettingsTabUI === 'function') injectFactionSettingsTabUI();
    if (typeof injectEventNameFieldUI === 'function') injectEventNameFieldUI();

    setTimeout(() => {
        let picker = document.getElementById('modal-team-filter-picker');
        if (picker && typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
            let dataTeams = systemDatabase.teams.filter(x => x.type === 'data');
            picker.innerHTML = dataTeams.map(x => `<option value="${x.id}">${x.name.toUpperCase()}</option>`).join(''); 
        }

        let nameEl = document.getElementById('input-event-name-custom');
        let dateInputs = document.querySelectorAll('#settings-modal input[type="date"], input[type="date"]');

        if (nameEl) nameEl.value = systemDatabase.eventName || localStorage.getItem('EVENT_NAME') || "";
        
        if (dateInputs.length >= 2) {
            let savedStart = systemDatabase.eventStartDate || localStorage.getItem('EVENT_START_DATE') || "";
            let savedEnd = systemDatabase.eventEndDate || localStorage.getItem('EVENT_END_DATE') || "";
            if (savedStart) dateInputs[0].value = savedStart;
            if (savedEnd) dateInputs[1].value = savedEnd;
        }

        switchModalTab('modal-tab-runs'); 
    }, 60);
}

function injectEventNameFieldUI() {
    let tabEventView = document.getElementById('view-modal-tab-event') || document.querySelector('.modal-tab-panel:nth-child(3)');
    if (!tabEventView) {
        let anyDateInput = document.querySelector('#settings-modal input[type="date"]');
        if (anyDateInput) tabEventView = anyDateInput.closest('.modal-tab-panel') || anyDateInput.parentElement.parentElement.parentElement;
    }

    if (tabEventView && !document.getElementById('input-event-name-custom')) {
        let nameWrapper = document.createElement('div');
        nameWrapper.className = "flex flex-col gap-1 mb-3";
        nameWrapper.innerHTML = `
            <label class="text-xs font-bold text-amber-400 flex items-center gap-1">
                <i class="fa-solid fa-pen-to-square"></i> Tên Sự Kiện:
            </label>
            <input id="input-event-name-custom" type="text" placeholder="Nhập tên sự kiện..." class="w-full bg-gray-800 border border-amber-500/50 rounded-lg px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 shadow-inner">
        `;
        tabEventView.insertBefore(nameWrapper, tabEventView.firstChild);
    }
}

function closeSettingsModal() { 
    let modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden'); 
}

function switchModalTab(tabId) {
    currentActiveSettingsTabId = tabId;
    document.querySelectorAll('.modal-tab-panel').forEach(el => el.classList.add('hidden'));
    
    let activeTab = document.getElementById('view-' + tabId);
    if (activeTab) activeTab.classList.remove('hidden');
    
    document.querySelectorAll('[id^="btn-modal-tab-"]').forEach(btn => {
        btn.className = "flex-1 py-1.5 text-gray-400 cursor-pointer text-center font-bold text-xs hover:text-amber-300 transition";
    });
    
    let activeBtn = document.getElementById('btn-' + tabId);
    if(activeBtn) {
        activeBtn.className = "flex-1 py-1.5 text-amber-400 border-b-2 border-amber-500 cursor-pointer text-center font-bold text-xs";
    }
    
    if (tabId === 'modal-tab-runs') { renderModalMembersConfigRows(); }
    if (tabId === 'modal-tab-faction') { 
        if (typeof renderModalFactionConfigRows === 'function') renderModalFactionConfigRows(); 
    }
    if (tabId === 'modal-tab-colors') { renderModalTeamColorsConfig(); }
    if (tabId === 'modal-tab-event') { injectEventNameFieldUI(); }
}

function commitModalMaxRunBoundSettings() { 
    let noticeText = "";

    if (currentActiveSettingsTabId === 'modal-tab-runs') {
        document.querySelectorAll('.modal-inner-max-run-select').forEach(box => { 
            let mId = box.getAttribute('data-target-mid'), maxVal = parseInt(box.value) || 3; 
            let m = systemDatabase.members[mId];
            if(m) { 
                m.maxRuns = maxVal; 
                if(m.currentRuns > maxVal) m.currentRuns = maxVal; 
            } 
        }); 
        noticeText = `Đã lưu cài đặt Mốc Lượt đi cho các tài khoản.`;
    }
    else if (currentActiveSettingsTabId === 'modal-tab-faction') {
        if (typeof saveFactionSettingsConfiguration === 'function') {
            let factionLogs = saveFactionSettingsConfiguration();
            let count = factionLogs.length;
            noticeText = count > 0 ? `Đã cập nhật môn phái cho ${count} tài khoản.` : `Đã lưu cài đặt Môn Phái.`;
        }
    }
    else if (currentActiveSettingsTabId === 'modal-tab-colors') {
        if (!systemDatabase.customColors) systemDatabase.customColors = {};
        document.querySelectorAll('.modal-team-color-picker-select').forEach(select => {
            let teamKeyName = select.getAttribute('data-team-key');
            if (typeof TEAM_COLOR_MAP !== 'undefined') {
                TEAM_COLOR_MAP[teamKeyName] = select.value;
            }
            systemDatabase.customColors[teamKeyName] = select.value;
        });
        noticeText = `Đã lưu cấu hình Màu Đội Hình.`;
    }
    else if (currentActiveSettingsTabId === 'modal-tab-event') {
        let nameEl = document.getElementById('input-event-name-custom');
        let dateInputs = document.querySelectorAll('#settings-modal input[type="date"], input[type="date"]');

        let eventNameVal = nameEl ? nameEl.value.trim() : "";
        let eventStartVal = dateInputs.length > 0 ? dateInputs[0].value : "";
        let eventEndVal = dateInputs.length > 1 ? dateInputs[1].value : "";

        if (eventNameVal) localStorage.setItem('EVENT_NAME', eventNameVal);
        if (eventStartVal) localStorage.setItem('EVENT_START_DATE', eventStartVal);
        if (eventEndVal) localStorage.setItem('EVENT_END_DATE', eventEndVal);

        systemDatabase.eventName = eventNameVal;
        systemDatabase.eventStartDate = eventStartVal;
        systemDatabase.eventEndDate = eventEndVal;

        if (!systemDatabase.eventConfig) systemDatabase.eventConfig = {};
        systemDatabase.eventConfig.eventName = eventNameVal;
        systemDatabase.eventConfig.startDate = eventStartVal;
        systemDatabase.eventConfig.endDate = eventEndVal;

        let skNameShow = eventNameVal ? `[${eventNameVal}]` : '';
        noticeText = `Đã cập nhật sự kiện ${skNameShow}: Từ ${eventStartVal || '---'} đến ${eventEndVal || '---'}`;
    }

    closeSettingsModal(); 

    if (typeof updateDeoStatisticsDisplays === 'function') { updateDeoStatisticsDisplays(); }
    if (typeof evaluateLineupsDynamicCapacity === 'function') { evaluateLineupsDynamicCapacity(); }
    if (typeof refreshUserInterfaceLayout === 'function') { refreshUserInterfaceLayout(); }
    if (typeof saveStateToMemoryCache === 'function') { saveStateToMemoryCache(); }

    if (noticeText) {
        if (typeof logUserAction === 'function') {
            logUserAction(noticeText);
        }
        if (typeof showSystemToastNotification === 'function') {
            showSystemToastNotification(`⚙️ ${noticeText}`, 'success');
        }
    }
}

// BÊN MỐC LƯỢT HIỂN THỊ ĐẦY ĐỦ ĐỊNH DẠNG TÊN GIỐNG BÊN MÔN PHÁI
function renderModalMembersConfigRows() {
    let picker = document.getElementById('modal-team-filter-picker');
    let targetWrapper = document.getElementById('modal-members-config-scroll-area');
    if (!picker || !targetWrapper || typeof systemDatabase === 'undefined') return;
    
    let teamId = picker.value;
    targetWrapper.innerHTML = ""; 
    let team = systemDatabase.teams.find(x => x.id === teamId); 
    if(!team) return;
    
    team.memberIds.forEach(mId => { 
        let m = systemDatabase.members[mId]; 
        if(!m) return; 
        
        // Gọi hàm ghép đầy đủ tên A.01 dgc
        let fullTitle = (typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, team) : m.name;

        let block = document.createElement('div'); 
        block.className = "flex items-center justify-between bg-gray-900 p-2 rounded-lg border border-gray-750 gap-2 text-xs mt-1 shadow-sm"; 
        block.innerHTML = `
            <div class="truncate font-bold text-gray-200 flex-1 pr-2">
                <span class="truncate">${fullTitle}</span>
            </div>
            <select data-target-mid="${m.id}" class="modal-inner-max-run-select bg-gray-800 border border-gray-600 rounded p-1 text-[11px] text-yellow-400 font-bold focus:outline-none shrink-0">
                <option value="1" ${m.maxRuns === 1 ? 'selected' : ''}>Max 1 Lượt</option>
                <option value="2" ${m.maxRuns === 2 ? 'selected' : ''}>Max 2 Lượt</option>
                <option value="3" ${m.maxRuns === 3 ? 'selected' : ''}>Max 3 Lượt</option>
            </select>
        `; 
        targetWrapper.appendChild(block); 
    });
}

function renderModalTeamColorsConfig() {
    let container = document.getElementById('modal-team-colors-config-list'); 
    if(!container) return;
    container.innerHTML = "";
    let html = "";
    
    const colorOptions = [
        { value: "bg-emerald-500/15 border-emerald-500 text-emerald-300", label: "Xanh Lá Cây" },
        { value: "bg-blue-500/15 border-blue-500 text-blue-300", label: "Xanh Dương" },
        { value: "bg-amber-500/15 border-amber-500 text-amber-300", label: "Vàng Hổ Phách" },
        { value: "bg-purple-500/15 border-purple-500 text-purple-300", label: "Tím Thạch Anh" },
        { value: "bg-rose-500/15 border-rose-500 text-rose-300", label: "Đỏ Hoa Hồng" },
        { value: "bg-yellow-500/15 border-yellow-500 text-yellow-300", label: "Vàng Sáng" },
        { value: "bg-cyan-500/15 border-cyan-500 text-cyan-300", label: "Xanh Băng" },
        { value: "bg-orange-500/15 border-orange-500 text-orange-300", label: "Cam Lửa" },
        { value: "bg-pink-500/15 border-pink-500 text-pink-300", label: "Hồng Neon" },
        { value: "bg-teal-500/15 border-teal-500 text-teal-300", label: "Xanh Ngọc Lá" },
        { value: "bg-indigo-500/15 border-indigo-500 text-indigo-300", label: "Xanh Chàm" },
        { value: "bg-fuchsia-500/15 border-fuchsia-500 text-fuchsia-300", label: "Hồng Tím Điện Tử" },
        { value: "bg-lime-500/15 border-lime-500 text-lime-300", label: "Xanh Chanh Chói" },
        { value: "bg-sky-500/15 border-sky-500 text-sky-300", label: "Xanh Da Trời" },
        { value: "bg-red-500/15 border-red-500 text-red-400", label: "Đỏ Rực" },
        { value: "bg-violet-500/15 border-violet-500 text-violet-300", label: "Tím Huyền Ảo" },
        { value: "bg-stone-400/15 border-stone-400 text-stone-300", label: "Xám Đá Khói" },
        { value: "bg-emerald-600/25 border-emerald-400 text-emerald-200", label: "Xanh Lục Bảo Đậm" },
        { value: "bg-sky-600/25 border-sky-400 text-sky-200", label: "Xanh Hải Quân Đậm" },
        { value: "bg-amber-600/25 border-amber-400 text-amber-200", label: "Vàng Đồng Hoàng Kim" }
    ];

    if (!systemDatabase.teams) return;
    let dataTeams = systemDatabase.teams.filter(x => x.type === 'data');

    dataTeams.forEach(t => {
        let key = t.name.toLowerCase();
        let currentClass = (systemDatabase.customColors && systemDatabase.customColors[key]) 
            ? systemDatabase.customColors[key] 
            : ((typeof TEAM_COLOR_MAP !== 'undefined') ? (TEAM_COLOR_MAP[key] || colorOptions[0].value) : colorOptions[0].value);
        
        html += `
            <div class="flex items-center justify-between p-2 bg-gray-900 rounded-lg border border-gray-750 mt-1 gap-2">
                <span class="font-bold uppercase text-gray-300 truncate max-w-[120px]">${t.name}</span>
                <select data-team-key="${key}" onchange="handleModalColorChange(this, '${t.name}')" class="modal-team-color-picker-select rounded p-1 text-[11px] focus:outline-none font-bold border ${currentClass}">
                    ${colorOptions.map(opt => `<option value="${opt.value}" class="bg-gray-900 text-white" ${currentClass === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            </div>`;
    });
    container.innerHTML = html;
    filterAvailableModalColors();
}

function handleModalColorChange(selectElement, teamName = '') {
    selectElement.className = "modal-team-color-picker-select rounded p-1 text-[11px] focus:outline-none font-bold border " + selectElement.value;
    filterAvailableModalColors();
}

function filterAvailableModalColors() {
    let selects = document.querySelectorAll('.modal-team-color-picker-select');
    let selectedColors = [];
    selects.forEach(select => { selectedColors.push(select.value); });

    selects.forEach(select => {
        let currentValue = select.value;
        let options = select.querySelectorAll('option');
        options.forEach(opt => {
            if (selectedColors.includes(opt.value) && opt.value !== currentValue) {
                opt.style.display = 'none';
            } else {
                opt.style.display = 'block';
            }
        });
    });
}