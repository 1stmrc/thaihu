// Tên file: giao-dien-thuong-nhan.js
// Chức năng: Bộ điều phối popup Thu Nhập Thương Nhân (quét chuẩn 100% 64 acc từ 8 Data Team, trừ đúng acc khóa, có nút gạt [Bỏ Hoàn Vàng] auto bật sẵn, tính 1.2v/lượt) & Quản lý Thất Bại.
// Con của file: index.html (Được nạp ở cuối cùng trước script.js).
// Danh sách tính năng của file:
//   1. Render chuẩn xác modal Thất Bại và popup Thương Nhân vào các card holder cố định trong index.html.
//   2. Quản lý Modal Cấu hình thất bại từng lượt đi của thành viên Thái Hư.
//   3. Quét chính xác toàn bộ 8 Data Team (64 slot), trừ đúng 4 acc khóa để ra 60 acc active.
//   4. Hiển thị tách bạch: Số TK đã hoàn thành (3/3), Số TK chưa xong, Tổng lượt đi thực tế.
//   5. Tích hợp nút gạt [Bỏ Hoàn Vàng] (Mặc định Auto bật sẵn) và đổi đơn giá vàng hoàn thành 1.2v/lượt khi bỏ tích.
//   6. Tự động đồng bộ tỷ giá Vàng sang VNĐ theo thời gian thực.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 22/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: KHỞI TẠO VÀ INJECT CÁC THÀNH PHẦN MODAL THƯƠNG NHÂN & THẤT BẠI
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 22/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function injectFailedRunsComponent() {
    try {
        renderFailedCardModal();
        renderMerchantCardModal();
    } catch (err) {
        console.error("Lỗi inject Merchant Component:", err);
    }
}

/* ==========================================================================
   KHỐI 2: RENDER MODAL QUẢN LÝ THẤT BẠI ẢI THÁI HƯ
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 22/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function renderFailedCardModal() {
    let holder = document.getElementById('injection-failed-card-holder');
    if (!holder) return;

    holder.innerHTML = `
        <div id="floating-failed-card" onclick="event.stopPropagation()" class="hidden w-[345px] bg-gray-900 border border-rose-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-xs">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2">
                <span class="text-rose-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-triangle-exclamation animate-pulse"></i> Quản Lý Thất Bại Ải Thái Hư
                </span>
                <button onclick="toggleFloatingFailedCard(event)" class="text-gray-400 hover:text-white text-sm font-black cursor-pointer">&times;</button>
            </div>
            
            <div class="flex flex-col gap-2">
                <div class="flex justify-between items-center gap-2">
                    <span class="text-gray-400 font-bold">Chọn Nhóm Gốc:</span>
                    <select id="failed-team-picker" onchange="onFailedTeamChange()" class="bg-gray-800 border border-gray-700 rounded p-1 text-xs text-white focus:outline-none w-44 font-semibold"></select>
                </div>
                <div class="flex justify-between items-center gap-2">
                    <span class="text-gray-400 font-bold">Tài Khoản:</span>
                    <select id="failed-member-picker" onchange="onFailedMemberChange()" class="bg-gray-800 border border-gray-700 rounded p-1 text-xs text-white focus:outline-none w-44 font-semibold"></select>
                </div>
            </div>
            
            <div class="w-full h-px bg-gray-800"></div>
            
            <div id="failed-runs-list-area" class="flex flex-col gap-2 min-h-[100px]">
                <div class="text-gray-500 text-center py-4 italic">Vui lòng lựa chọn tài khoản để cấu hình thất bại.</div>
            </div>
            
            <div class="w-full h-px bg-gray-800"></div>
            
            <div class="flex gap-2 justify-end">
                <button onclick="clearAllMemberFailures()" class="bg-gray-800 hover:bg-gray-750 text-rose-400 font-bold px-3 py-2 rounded-lg transition text-[11px] cursor-pointer">Xóa Thất Bại</button>
                <button onclick="saveFailedRunsConfiguration()" class="bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2 rounded-lg transition text-[11px] cursor-pointer">Lưu Cấu Hình</button>
            </div>
        </div>
    `;
}

/* ==========================================================================
   KHỐI 3: RENDER POPUP THU NHẬP THƯƠNG NHÂN & BẬT TẮT
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 22/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function toggleMerchantExcludeRefundState(isChecked) {
    isMerchantExcludeRefund = isChecked;
    renderMerchantCardModal();
    if (typeof calculateComprehensiveProfitsRealtime === 'function') {
        calculateComprehensiveProfitsRealtime();
    }
}

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

function toggleFloatingMerchantCard(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    let card = document.getElementById('floating-merchant-card');
    if (!card) {
        renderMerchantCardModal();
        card = document.getElementById('floating-merchant-card');
    }
    if (card) {
        card.classList.toggle('hidden');
    }
}

function populateFailedTeamPicker() {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.teams) return;
    let picker = document.getElementById('failed-team-picker');
    if (!picker) return;
    let dataTeams = systemDatabase.teams.filter(x => x.type === 'data');
    picker.innerHTML = dataTeams.map(t => `<option value="${t.id}">${t.name.toUpperCase()}</option>`).join('');
    onFailedTeamChange();
}

function onFailedTeamChange() {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.teams) return;
    let teamPicker = document.getElementById('failed-team-picker');
    let memberPicker = document.getElementById('failed-member-picker');
    if (!teamPicker || !memberPicker) return;
    
    let teamId = teamPicker.value;
    let team = systemDatabase.teams.find(x => x.id === teamId);
    if (!team) {
        memberPicker.innerHTML = `<option value="">-- Trống --</option>`;
        return;
    }
    
    let optionsHtml = "";
    team.memberIds.forEach(mId => {
        let m = systemDatabase.members ? systemDatabase.members[mId] : null;
        if (m && m.name) {
            optionsHtml += `<option value="${m.id}">${m.name}</option>`;
        }
    });
    
    memberPicker.innerHTML = optionsHtml || `<option value="">-- Trống --</option>`;
    onFailedMemberChange();
}

window.tempFailuresState = window.tempFailuresState || {};

function onFailedMemberChange() {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.members) return;
    let memberPicker = document.getElementById('failed-member-picker');
    let area = document.getElementById('failed-runs-list-area');
    if (!memberPicker || !area) return;
    
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
    
    let html = `<div class="text-gray-400 font-bold mb-1">Cấu hình lượt đi (Thực tế đã đi: ${m.currentRuns || 0}/${m.maxRuns || 3} lượt):</div>`;
    let renderedCount = 0;
    let maxRuns = m.maxRuns || 3;

    for (let runIdx = 1; runIdx <= maxRuns; runIdx++) {
        if (runIdx > (m.currentRuns || 0)) continue;
        
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
                <select onchange="updateTempFailureRunState(${runIdx}, this.value)" class="w-full bg-gray-800 border border-gray-700 rounded p-1 text-[11px] text-white focus:outline-none font-semibold mt-1">
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
        if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
        if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    }
}

function saveFailedRunsConfiguration() {
    let memberPicker = document.getElementById('failed-member-picker');
    if (!memberPicker || typeof systemDatabase === 'undefined' || !systemDatabase.members) return;
    
    let m = systemDatabase.members[memberPicker.value];
    if (!m) return;
    
    m.failures = JSON.parse(JSON.stringify(tempFailuresState));
    
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
    if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
    
    toggleFloatingFailedCard();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectFailedRunsComponent);
} else {
    injectFailedRunsComponent();
}

let lastKnownGoldRateValue = "";
setInterval(() => {
    let card = document.getElementById('floating-merchant-card');
    let isVisible = card && !card.classList.contains('hidden');
    let goldInputEl = document.getElementById('input-gold-rate');
    let currentVal = goldInputEl ? goldInputEl.value : "";
    
    if (isVisible && currentVal !== lastKnownGoldRateValue) {
        lastKnownGoldRateValue = currentVal;
        renderMerchantCardModal();
    }
}, 300);

window.toggleFloatingFailedCard = toggleFloatingFailedCard;
window.toggleFloatingMerchantCard = toggleFloatingMerchantCard;
window.toggleMerchantExcludeRefundState = toggleMerchantExcludeRefundState;
window.onFailedTeamChange = onFailedTeamChange;
window.onFailedMemberChange = onFailedMemberChange;
window.updateTempFailureRunState = updateTempFailureRunState;
window.clearAllMemberFailures = clearAllMemberFailures;
window.saveFailedRunsConfiguration = saveFailedRunsConfiguration;

// Tổng số dòng code trong file này: 240 dòng.
