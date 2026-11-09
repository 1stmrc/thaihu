// Tên file: giao-dien-cai-dat.js
// Chức năng: Điều phối Cài Đặt Hệ Thống - Mốc lượt, Môn phái, Màu đội hình và Đồng bộ sự kiện với EventManager.
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

    setTimeout(() => {
        let picker = document.getElementById('modal-team-filter-picker');
        if (picker && typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
            let dataTeams = systemDatabase.teams.filter(x => x.type === 'data');
            picker.innerHTML = dataTeams.map(x => `<option value="${x.id}">${x.name.toUpperCase()}</option>`).join(''); 
        }

        syncEventDataFromManager();
        switchModalTab('modal-tab-runs'); 
    }, 60);
}

function syncEventDataFromManager() {
    let nameEl = document.getElementById('input-event-name-custom');
    let startEl = document.getElementById('input-event-start-date');
    let endEl = document.getElementById('input-event-end-date');

    if (typeof EventManager !== 'undefined') {
        let active = EventManager.getActiveEvent();
        if (active) {
            if (nameEl) nameEl.value = active.name || "";
            if (startEl) startEl.value = active.startDate || "";
            if (endEl) endEl.value = active.endDate || "";
        }
        renderEventsHistoryUI();
    } else {
        if (nameEl) nameEl.value = (typeof systemDatabase !== 'undefined' && systemDatabase.eventName) || localStorage.getItem('EVENT_NAME') || "";
        if (startEl) startEl.value = (typeof systemDatabase !== 'undefined' && systemDatabase.eventStartDate) || localStorage.getItem('EVENT_START_DATE') || "";
        if (endEl) endEl.value = (typeof systemDatabase !== 'undefined' && systemDatabase.eventEndDate) || localStorage.getItem('EVENT_END_DATE') || "";
    }
}

function renderEventsHistoryUI() {
    let container = document.getElementById('events-history-list');
    if (!container) return;

    if (typeof EventManager === 'undefined') {
        container.innerHTML = `<div class="text-gray-500 text-center py-4 italic">Chưa kết nối mô-đun EventManager.</div>`;
        return;
    }

    let data = EventManager.getData();
    let activeId = data.activeId;

    let now = new Date();
    let utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    let gmt7Time = new Date(utc + (3600000 * 7));
    let curYear = gmt7Time.getFullYear();
    let curMonth = String(gmt7Time.getMonth() + 1).padStart(2, '0');
    let curDay = String(gmt7Time.getDate()).padStart(2, '0');
    let todayStr = curYear + '-' + curMonth + '-' + curDay;

    if (!data.list || data.list.length === 0) {
        container.innerHTML = `<div class="text-gray-500 text-center py-4 italic">Chưa có lịch sử sự kiện nào.</div>`;
        return;
    }

    container.innerHTML = data.list.map(ev => {
        let isCurrent = ev.id === activeId;
        let isExpired = todayStr > ev.endDate;
        let isIncoming = todayStr < ev.startDate;

        let statusBadge = '';
        if (isExpired) {
            statusBadge = '<span class="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold shrink-0">Hết hạn</span>';
        } else if (isIncoming) {
            statusBadge = '<span class="text-[9px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded font-bold shrink-0">Chưa tới</span>';
        } else {
            statusBadge = '<span class="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold shrink-0 animate-pulse">Đang chạy</span>';
        }

        return `
            <div class="p-2 rounded-lg border ${isCurrent ? 'bg-amber-500/10 border-amber-500/50' : 'bg-gray-900 border-gray-800'} flex items-center justify-between gap-2 transition">
                <div class="flex flex-col min-w-0 flex-1">
                    <div class="font-bold text-gray-200 flex items-center gap-1.5 truncate">
                        <span class="truncate">${ev.name}</span>
                        ${isCurrent ? '<span class="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-black shrink-0">ĐANG CHỌN</span>' : ''}
                        ${statusBadge}
                    </div>
                    <div class="text-[10px] text-gray-400 font-mono mt-0.5">
                        ${ev.startDate} ➔ ${ev.endDate}
                    </div>
                </div>
                ${!isCurrent ? `
                    <button type="button" onclick="handleSelectHistoricEvent('${ev.id}')" class="shrink-0 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-amber-300 px-2.5 py-1 rounded border border-gray-700 text-[11px] font-bold transition cursor-pointer">
                        Chọn dùng
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');
}

function handleSelectHistoricEvent(eventId) {
    if (typeof EventManager !== 'undefined') {
        EventManager.setActiveEvent(eventId);
        syncEventDataFromManager();
        if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
        if (typeof updateDeoStatisticsDisplays === 'function') updateDeoStatisticsDisplays();
        if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
    }
}

function closeSettingsModal() { 
    let modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden'); 
}

function switchModalTab(tabId) {
    let cleanId = tabId.replace('btn-', '').replace('view-', '');
    currentActiveSettingsTabId = cleanId;

    document.querySelectorAll('.modal-tab-panel').forEach(el => el.classList.add('hidden'));
    
    let activeView = document.getElementById('view-' + cleanId) || document.getElementById(cleanId);
    if (activeView) activeView.classList.remove('hidden');
    
    document.querySelectorAll('[id^="btn-modal-tab-"]').forEach(btn => {
        btn.className = "flex-1 py-1.5 text-gray-400 cursor-pointer text-center font-bold text-xs hover:text-amber-300 transition";
    });
    
    let activeBtn = document.getElementById('btn-' + cleanId);
    if (activeBtn) {
        activeBtn.className = "flex-1 py-1.5 text-amber-400 border-b-2 border-amber-500 cursor-pointer text-center font-bold text-xs";
    }
    
    if (cleanId === 'modal-tab-runs') { renderModalMembersConfigRows(); }
    if (cleanId === 'modal-tab-faction') { 
        if (typeof renderModalFactionConfigRows === 'function') renderModalFactionConfigRows(); 
    }
    if (cleanId === 'modal-tab-colors') { renderModalTeamColorsConfig(); }
    if (cleanId === 'modal-tab-event') { syncEventDataFromManager(); }
}

function commitModalMaxRunBoundSettings() { 
    let noticeText = "";

    let eventView = document.getElementById('view-modal-tab-event');
    let isEventTabVisible = eventView && !eventView.classList.contains('hidden');

    if (currentActiveSettingsTabId === 'modal-tab-event' || isEventTabVisible) {
        let nameEl = document.getElementById('input-event-name-custom');
        let startEl = document.getElementById('input-event-start-date');
        let endEl = document.getElementById('input-event-end-date');

        let eventNameVal = nameEl ? nameEl.value.trim() : "";
        let eventStartVal = startEl ? startEl.value : "";
        let eventEndVal = endEl ? endEl.value : "";

        if (!eventNameVal) {
            alert("Vui lòng nhập tên sự kiện!");
            return;
        }

        if (typeof EventManager !== 'undefined') {
            EventManager.saveOrUpdateEvent(eventNameVal, eventStartVal, eventEndVal);
        }

        localStorage.setItem('EVENT_NAME', eventNameVal);
        if (eventStartVal) localStorage.setItem('EVENT_START_DATE', eventStartVal);
        if (eventEndVal) localStorage.setItem('EVENT_END_DATE', eventEndVal);

        if (typeof systemDatabase !== 'undefined') {
            systemDatabase.eventName = eventNameVal;
            systemDatabase.eventStartDate = eventStartVal;
            systemDatabase.eventEndDate = eventEndVal;
            if (!systemDatabase.eventConfig) systemDatabase.eventConfig = {};
            systemDatabase.eventConfig.eventName = eventNameVal;
            systemDatabase.eventConfig.startDate = eventStartVal;
            systemDatabase.eventConfig.endDate = eventEndVal;
        }

        renderEventsHistoryUI();
        let skNameShow = eventNameVal ? `[${eventNameVal}]` : '';
        noticeText = `Đã cập nhật sự kiện ${skNameShow}: Từ ${eventStartVal || '---'} đến ${eventEndVal || '---'}`;
    }
    else if (currentActiveSettingsTabId === 'modal-tab-runs') {
        document.querySelectorAll('.modal-inner-max-run-select').forEach(box => { 
            let mId = box.getAttribute('data-target-mid'), maxVal = parseInt(box.value) || 3; 
            let m = systemDatabase.members[mId];
            if (m) { 
                m.maxRuns = maxVal; 
                if (m.currentRuns > maxVal) m.currentRuns = maxVal; 
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

    closeSettingsModal(); 

    if (typeof calculateRealtimeProfits === 'function') { calculateRealtimeProfits(); }
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

function renderModalMembersConfigRows() {
    let picker = document.getElementById('modal-team-filter-picker');
    let targetWrapper = document.getElementById('modal-members-config-scroll-area');
    if (!picker || !targetWrapper || typeof systemDatabase === 'undefined') return;
    
    let teamId = picker.value;
    targetWrapper.innerHTML = ""; 
    let team = systemDatabase.teams.find(x => x.id === teamId); 
    if (!team) return;
    
    team.memberIds.forEach(mId => { 
        let m = systemDatabase.members[mId]; 
        if (!m) return; 
        
        let fullTitle = (typeof getMemberFullDisplayTitle === 'function') ? getMemberFullDisplayTitle(m, team) : m.name;

        let block = document.createElement('div'); 
        block.className = "flex items-center justify-between bg-gray-900 p-2 rounded-lg border border-gray-750 gap-2 text-xs mt-1 shadow-sm"; 
        block.innerHTML = `
            <div class="truncate font-bold text-gray-200 flex-1 pr-2">
                <span class="truncate">${fullTitle}</span>
            </div>
            <select data-target-mid="${m.id}" class="modal-inner-max-run-select bg-gray-800 border border-gray-600 rounded p-1 text-[11px] text-yellow-400 font-bold focus:outline-none shrink-0 cursor-pointer">
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
    if (!container) return;
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

window.syncEventDataFromManager = syncEventDataFromManager;
window.renderEventsHistoryUI = renderEventsHistoryUI;
window.handleSelectHistoricEvent = handleSelectHistoricEvent;
