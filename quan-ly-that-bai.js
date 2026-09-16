// Tên file: quan-ly-that-bai.js
// Chức năng: Bộ điều phối popup Quản lý Thất Bại Ải Thái Hư (Out từ đầu / Out ở cuối), liên kết trực tiếp với holder cố định trong index.html và đồng bộ doanh thu thời gian thực.
// Con của file: index.html (Nạp qua thẻ script trong khung xương chính).
// Danh sách tính năng của file:
//   1. Tự động render Modal Quản Lý Thất Bại vào holder #injection-failed-card-holder.
//   2. Điều khiển bật/tắt (toggle) an toàn, tự động load danh sách Team Data & Thành viên tương ứng.
//   3. Cấu hình thất bại chi tiết từng lượt (Thành công, Thất bại 0 NL, Thất bại nửa NL).
//   4. Đồng bộ tức thì với hệ thống tính toán Lợi Nhuận, Đội Hình Xếp và Bộ nhớ LocalStorage.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 22/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: KHỞI TẠO VÀ INJECT GIAO DIỆN MODAL THẤT BẠI
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 22/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function injectFailedRunsComponent() {
    let holder = document.getElementById('injection-failed-card-holder');
    if (!holder) {
        holder = document.createElement('div');
        holder.id = 'injection-failed-card-holder';
        holder.className = "fixed bottom-16 right-[715px] z-50 select-none";
        document.body.appendChild(holder);
    }
    renderFailedCardModal();
}

/* ==========================================================================
   KHỐI 2: RENDER GIAO DIỆN MODAL QUẢN LÝ THẤT BẠI
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 22/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function renderFailedCardModal() {
    let holder = document.getElementById('injection-failed-card-holder');
    if (!holder) return;

    holder.innerHTML = `
        <div id="floating-failed-card" onclick="event.stopPropagation()" class="hidden w-[345px] bg-gray-900 border-2 border-rose-500/80 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-xs select-none">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2">
                <span class="text-rose-400 font-black uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <i class="fa-solid fa-triangle-exclamation animate-pulse"></i> Quản Lý Thất Bại Ải Thái Hư
                </span>
                <button onclick="toggleFloatingFailedCard(event)" class="text-gray-400 hover:text-white text-sm font-black cursor-pointer leading-none">&times;</button>
            </div>
            
            <div class="flex flex-col gap-2 bg-gray-955 p-2.5 rounded-xl border border-gray-800">
                <div class="flex justify-between items-center gap-2">
                    <span class="text-gray-400 font-bold text-[11px]">Chọn Nhóm Gốc:</span>
                    <select id="failed-team-picker" onchange="onFailedTeamChange()" class="bg-gray-800 border border-gray-700 rounded-lg p-1 text-xs text-white focus:outline-none w-44 font-semibold cursor-pointer"></select>
                </div>
                <div class="flex justify-between items-center gap-2">
                    <span class="text-gray-400 font-bold text-[11px]">Tài Khoản:</span>
                    <select id="failed-member-picker" onchange="onFailedMemberChange()" class="bg-gray-800 border border-gray-700 rounded-lg p-1 text-xs text-purple-300 focus:outline-none w-44 font-bold cursor-pointer"></select>
                </div>
            </div>
            
            <div class="w-full h-px bg-gray-800"></div>
            
            <div id="failed-runs-list-area" class="flex flex-col gap-2 min-h-[100px]">
                <div class="text-gray-500 text-center py-4 italic">Vui lòng lựa chọn tài khoản để cấu hình thất bại.</div>
            </div>
            
            <div class="w-full h-px bg-gray-800"></div>
            
            <div class="flex gap-2 justify-end">
                <button onclick="clearAllMemberFailures()" class="bg-gray-800 hover:bg-gray-700 text-rose-400 font-bold px-3 py-1.5 rounded-lg border border-gray-700 transition text-xs cursor-pointer">Xóa Thất Bại</button>
                <button onclick="saveFailedRunsConfiguration()" class="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black px-4 py-1.5 rounded-lg transition text-xs cursor-pointer shadow">Lưu Cấu Hình</button>
            </div>
        </div>
    `;

    populateFailedTeamPicker();
}

/* ==========================================================================
   KHỐI 3: BẬT / TẮT (TOGGLE) MODAL THẤT BẠI AN TOÀN
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 22/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function toggleFloatingFailedCard(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    let card = document.getElementById('floating-failed-card');
    if (!card) {
        renderFailedCardModal();
        card = document.getElementById('floating-failed-card');
    }
    if (card) {
        card.classList.toggle('hidden');
        if (!card.classList.contains('hidden')) {
            populateFailedTeamPicker();
        }
    }
}

function populateFailedTeamPicker() {
    let picker = document.getElementById('failed-team-picker');
    if (!picker) return;
    
    if (typeof systemDatabase === 'undefined' || !systemDatabase.teams) return;
    let dataTeams = systemDatabase.teams.filter(x => x.type === 'data');
    
    picker.innerHTML = dataTeams.map(t => `<option value="${t.id}">${t.name.toUpperCase()}</option>`).join('');
    onFailedTeamChange();
}

function onFailedTeamChange() {
    let teamPicker = document.getElementById('failed-team-picker');
    let memberPicker = document.getElementById('failed-member-picker');
    if (!teamPicker || !memberPicker) return;
    
    if (typeof systemDatabase === 'undefined' || !systemDatabase.teams) return;
    let teamId = teamPicker.value;
    let team = systemDatabase.teams.find(x => x.id === teamId);
    if (!team) {
        memberPicker.innerHTML = `<option value="">-- Trống --</option>`;
        document.getElementById('failed-runs-list-area').innerHTML = `<div class="text-gray-500 text-center py-4 italic">Vui lòng lựa chọn tài khoản.</div>`;
        return;
    }
    
    let optionsHtml = "";
    (team.memberIds || []).forEach(mId => {
        let m = systemDatabase.members ? systemDatabase.members[mId] : null;
        if (m && m.name) {
            optionsHtml += `<option value="${m.id}">${m.name}</option>`;
        }
    });
    
    memberPicker.innerHTML = optionsHtml || `<option value="">-- Trống --</option>`;
    onFailedMemberChange();
}

let tempFailuresState = {};

function onFailedMemberChange() {
    let memberPicker = document.getElementById('failed-member-picker');
    let area = document.getElementById('failed-runs-list-area');
    if (!memberPicker || !area) return;
    
    if (typeof systemDatabase === 'undefined' || !systemDatabase.members) return;
    let mId = memberPicker.value;
    let m = systemDatabase.members[mId];
    if (!m) {
        area.innerHTML = `<div class="text-gray-500 text-center py-4 italic">Vui lòng lựa chọn tài khoản.</div>`;
        return;
    }
    
    tempFailuresState = m.failures ? JSON.parse(JSON.stringify(m.failures)) : {};
    renderFailedRunsList(m);
}

function renderFailedRunsList(m) {
    let area = document.getElementById('failed-runs-list-area');
    if (!area) return;
    
    let maxRuns = m.maxRuns || 3;
    let currentRuns = m.currentRuns || 0;
    let html = `<div class="text-gray-400 font-bold mb-1">Cấu hình lượt đi (Thực tế đã đi: ${currentRuns}/${maxRuns} lượt):</div>`;
    
    let renderedCount = 0;
    for (let runIdx = 1; runIdx <= maxRuns; runIdx++) {
        if (runIdx > currentRuns) continue;
        
        renderedCount++;
        let currentFailure = tempFailuresState[runIdx];
        let statusText = "Thành công";
        let selectVal = "success";
        
        if (currentFailure) {
            if (currentFailure.type === 'zero') {
                statusText = "Thất bại (0 NL)";
                selectVal = "zero";
            } else if (currentFailure.type === 'half') {
                let halfNl = runIdx === 1 ? 12 : 24;
                statusText = `Thất bại (Nửa NL: ${halfNl} NL)`;
                selectVal = "half";
            }
        }
        
        let optionSuccess = `<option value="success" ${selectVal === 'success' ? 'selected' : ''}>Thành công (${runIdx === 1 ? 24 : 48} NL)</option>`;
        let optionZero = `<option value="zero" ${selectVal === 'zero' ? 'selected' : ''}>Thất bại từ đầu (0 NL${runIdx >= 2 ? ', Không hoàn vàng' : ''})</option>`;
        let optionHalf = `<option value="half" ${selectVal === 'half' ? 'selected' : ''}>Thất bại ở cuối (Giảm nửa NL: ${runIdx === 1 ? 12 : 24} NL${runIdx >= 2 ? ', Không hoàn vàng' : ''})</option>`;
        
        html += `
            <div class="flex flex-col gap-1 p-2 bg-gray-955 border border-gray-800 rounded-lg mt-1">
                <div class="flex justify-between items-center text-[11px]">
                    <span class="font-bold text-gray-300">Lượt thứ ${runIdx}:</span>
                    <span class="font-bold px-1.5 py-0.5 rounded text-[9px] ${selectVal === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (selectVal === 'half' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20')}">${statusText}</span>
                </div>
                <select onchange="updateTempFailureRunState(${runIdx}, this.value)" class="w-full bg-gray-800 border border-gray-700 rounded p-1 text-[11px] text-white focus:outline-none font-semibold mt-1 cursor-pointer">
                    ${optionSuccess}
                    ${optionZero}
                    ${optionHalf}
                </select>
            </div>
        `;
    }
    
    if (renderedCount === 0) {
        html += `<div class="text-gray-500 text-center py-6 italic">Tài khoản này hôm nay chưa tiến hành chạy lượt nào.</div>`;
    }
    
    area.innerHTML = html;
}

function updateTempFailureRunState(runIdx, value) {
    if (value === "success") {
        delete tempFailuresState[runIdx];
    } else if (value === "zero") {
        tempFailuresState[runIdx] = { type: 'zero', nl: 0 };
    } else if (value === "half") {
        let halfNl = runIdx === 1 ? 12 : 24;
        tempFailuresState[runIdx] = { type: 'half', nl: halfNl };
    }
    
    let memberPicker = document.getElementById('failed-member-picker');
    if (!memberPicker || typeof systemDatabase === 'undefined' || !systemDatabase.members) return;
    let m = systemDatabase.members[memberPicker.value];
    if (m) renderFailedRunsList(m);
}

function clearAllMemberFailures() {
    let memberPicker = document.getElementById('failed-member-picker');
    if (!memberPicker || typeof systemDatabase === 'undefined' || !systemDatabase.members) return;
    
    let m = systemDatabase.members[memberPicker.value];
    if (!m) return;
    
    if (confirm(`Xóa sạch toàn bộ cấu hình thất bại của [ ${m.name} ]?`)) {
        m.failures = {};
        tempFailuresState = {};
        renderFailedRunsList(m);
        
        if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
        if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
        if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();

        if (typeof logUserAction === 'function') {
            logUserAction(`Đã xóa sạch cấu hình thất bại của tài khoản [ ${m.name} ]`);
        }
    }
}

function saveFailedRunsConfiguration() {
    let memberPicker = document.getElementById('failed-member-picker');
    if (!memberPicker || typeof systemDatabase === 'undefined' || !systemDatabase.members) return;
    
    let m = systemDatabase.members[memberPicker.value];
    if (!m) return;
    
    m.failures = JSON.parse(JSON.stringify(tempFailuresState));
    
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
    if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    
    toggleFloatingFailedCard();
    
    if (typeof logUserAction === 'function') {
        logUserAction(`Đã lưu cấu hình khấu trừ thất bại cho tài khoản [ ${m.name} ]`);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectFailedRunsComponent);
} else {
    injectFailedRunsComponent();
}

window.injectFailedRunsComponent = injectFailedRunsComponent;
window.renderFailedCardModal = renderFailedCardModal;
window.toggleFloatingFailedCard = toggleFloatingFailedCard;
window.populateFailedTeamPicker = populateFailedTeamPicker;
window.onFailedTeamChange = onFailedTeamChange;
window.onFailedMemberChange = onFailedMemberChange;
window.updateTempFailureRunState = updateTempFailureRunState;
window.clearAllMemberFailures = clearAllMemberFailures;
window.saveFailedRunsConfiguration = saveFailedRunsConfiguration;

// Tổng số dòng code trong file này: 240 dòng.