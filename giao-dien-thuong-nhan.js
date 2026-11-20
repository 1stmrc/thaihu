// Tên file: giao-dien-thuong-nhan.js
// Chức năng: Bộ điều phối popup Thu Nhập Thương Nhân (quét chuẩn 100% 64 acc từ 8 Data Team, trừ đúng acc khóa, có nút gạt [Bỏ Hoàn Vàng] auto bật sẵn, tính 1.2v/lượt) & Quản lý Thất Bại.
// Con của file: index.html (Được nạp ở cuối cùng trước script.js).

var isMerchantExcludeRefund = (typeof isMerchantExcludeRefund !== 'undefined') ? isMerchantExcludeRefund : true;
window.tempFailuresState = window.tempFailuresState || {};

/* ==========================================================================
   KHỐI 1: KHỞI TẠO VÀ INJECT CÁC THÀNH PHẦN MODAL THƯƠNG NHÂN & THẤT BẠI
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
   ========================================================================== */
function renderFailedCardModal() {
    let holder = document.getElementById('injection-failed-card-holder');
    if (!holder) return;

    let wasHidden = true;
    let existingCard = document.getElementById('floating-failed-card');
    if (existingCard && !existingCard.classList.contains('hidden')) {
        wasHidden = false;
    }

    holder.innerHTML = `
        <div id="floating-failed-card" onclick="event.stopPropagation()" class="${wasHidden ? 'hidden' : ''} w-[345px] bg-gray-900 border border-rose-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-xs">
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
   ========================================================================== */
function renderMerchantCardModal() {
    let holder = document.getElementById('injection-merchant-card-holder');
    if (!holder) return;

    let wasHidden = true;
    let existingCard = document.getElementById('floating-merchant-card');
    if (existingCard && !existingCard.classList.contains('hidden')) {
        wasHidden = false;
    }

    // Quét chuẩn toàn bộ Data Team (bỏ qua acc khóa)
    let activeAccounts = 0;
    let lockedAccounts = 0;
    let completedAccounts = 0;
    let totalRunsDone = 0;

    if (typeof systemDatabase !== 'undefined' && Array.isArray(systemDatabase.teams) && systemDatabase.members) {
        let dataTeams = systemDatabase.teams.filter(t => t.type === 'data');
        dataTeams.forEach(team => {
            if (!Array.isArray(team.memberIds)) return;
            team.memberIds.forEach(mId => {
                let m = systemDatabase.members[mId];
                if (!m || !m.name) return;
                if (m.isLocked || m.locked) {
                    lockedAccounts++;
                    return;
                }
                activeAccounts++;
                let runs = parseInt(m.merchantRuns) || 0;
                if (runs >= 3) completedAccounts++;
                totalRunsDone += runs;
            });
        });
    }

    let uncompletedAccounts = Math.max(0, activeAccounts - completedAccounts);
    let maxPossibleRuns = activeAccounts * 3;

    // Đơn giá vàng/lượt: Nếu bật [Bỏ Hoàn Vàng] thì tính phần lãi thực tế; bỏ tích thì tính full 1.2v/lượt
    let goldPerRun = isMerchantExcludeRefund ? 0.8 : 1.2;
    let totalGoldEarned = totalRunsDone * goldPerRun;

    // Quy đổi VNĐ theo ô 1K Vàng trên Header
    let goldRateEl = document.getElementById('input-gold-rate');
    let rawRateStr = goldRateEl ? goldRateEl.value : (localStorage.getItem('HEADER_GOLD_RATE') || "155.000");
    let vndPer1KGold = parseFloat(String(rawRateStr).replace(/\./g, '').replace(/,/g, '')) || 155000;
    let totalVndEarned = Math.round((totalGoldEarned / 1000) * vndPer1KGold);

    holder.innerHTML = `
        <div id="floating-merchant-card" onclick="event.stopPropagation()" class="${wasHidden ? 'hidden' : ''} w-[340px] bg-gray-900 border border-amber-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-xs">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2">
                <span class="text-amber-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-gem text-amber-400"></i> Thu Nhập Thương Nhân
                </span>
                <button onclick="toggleFloatingMerchantCard(event)" class="text-gray-400 hover:text-white text-sm font-black cursor-pointer">&times;</button>
            </div>

            <div class="grid grid-cols-2 gap-2 bg-gray-955 p-2.5 rounded-xl border border-gray-800">
                <div class="flex flex-col">
                    <span class="text-[10px] text-gray-400 font-bold uppercase">TK Hoạt Động</span>
                    <span class="text-sm font-black text-white">${activeAccounts} <span class="text-[10px] text-gray-500 font-normal">(Khóa: ${lockedAccounts})</span></span>
                </div>
                <div class="flex flex-col text-right">
                    <span class="text-[10px] text-gray-400 font-bold uppercase">Tổng Lượt Đã Đi</span>
                    <span class="text-sm font-black text-amber-400">${totalRunsDone} /${maxPossibleRuns}</span>
                </div>
                <div class="flex flex-col pt-1 border-t border-gray-800/80">
                    <span class="text-[10px] text-emerald-400 font-bold">Đã xong (3/3): <b>${completedAccounts}</b></span>
                </div>
                <div class="flex flex-col text-right pt-1 border-t border-gray-800/80">
                    <span class="text-[10px] text-rose-400 font-bold">Chưa xong: <b>${uncompletedAccounts}</b></span>
                </div>
            </div>

            <label class="flex items-center justify-between bg-gray-800/80 hover:bg-gray-800 px-3 py-2 rounded-lg border border-gray-700 cursor-pointer select-none">
                <span class="text-gray-200 font-bold text-[11px]">Bỏ Hoàn Vàng (Tính lãi ròng)</span>
                <input type="checkbox" ${isMerchantExcludeRefund ? 'checked' : ''} onchange="toggleMerchantExcludeRefundState(this.checked)" class="w-4 h-4 accent-amber-500 cursor-pointer">
            </label>

            <div class="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex flex-col gap-1">
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-bold">Đơn giá mỗi lượt:</span>
                    <span class="text-amber-300 font-black">${goldPerRun.toFixed(1)} Vàng / lượt</span>
                </div>
                <div class="flex justify-between items-center text-sm pt-1 border-t border-amber-500/20">
                    <span class="text-gray-300 font-bold">Tổng Vàng Thu:</span>
                    <span class="text-yellow-400 font-black font-mono">+${totalGoldEarned.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} V</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-bold">Quy đổi VNĐ:</span>
                    <span class="text-emerald-400 font-black font-mono text-sm">≈ ${totalVndEarned.toLocaleString('vi-VN')} đ</span>
                </div>
            </div>
        </div>
    `;
}

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
        let willShow = card.classList.contains('hidden');
        if (willShow) {
            renderMerchantCardModal();
            card = document.getElementById('floating-merchant-card');
            if (card) card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
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
    
    window.tempFailuresState = m.failures ? JSON.parse(JSON.stringify(m.failures)) : {};
    renderFailedRunsList(m);
}

function renderFailedRunsList(m) {
    let area = document.getElementById('failed-runs-list-area');
    if (!area) return;
    
    let html = `<div class="text-gray-400 font-bold mb-1">Cấu hình lượt đi (Thực tế đã đi: ${m.currentRuns || 0}/${m.maxRuns \vert{}\vert{} 3} lượt):</div>`; let renderedCount = 0; let maxRuns = m.maxRuns \vert{}\vert{} 3;  for (let runIdx = 1; runIdx <= maxRuns; runIdx++) { if (runIdx > (m.currentRuns \vert{}\vert{} 0)) continue;  renderedCount++; let currentFailure = window.tempFailuresState[runIdx]; let statusText = "Thành công"; let selectVal = "success";  if (currentFailure) { if (currentFailure.type === 'zero') { statusText = "Thất bại (0 NL)"; selectVal = "zero"; } else if (currentFailure.type === 'half') { let halfNl = runIdx === 1 ? 12 : 24; statusText = `Thất bại (Nửa NL: ${halfNl} NL)`;
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
                    ${optionZero}${optionHalf}
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
        delete window.tempFailuresState[runIdx];
    } else if (value === "zero") {
        window.tempFailuresState[runIdx] = { type: 'zero', nl: 0 };
    } else if (value === "half") {
        let halfNl = runIdx === 1 ? 12 : 24;
        window.tempFailuresState[runIdx] = { type: 'half', nl: halfNl };
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
        window.tempFailuresState = {};
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
    
    m.failures = JSON.parse(JSON.stringify(window.tempFailuresState));
    
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

window.injectFailedRunsComponent = injectFailedRunsComponent;
window.renderFailedCardModal = renderFailedCardModal;
window.renderMerchantCardModal = renderMerchantCardModal;
window.toggleFloatingFailedCard = toggleFloatingFailedCard;
window.toggleFloatingMerchantCard = toggleFloatingMerchantCard;
window.toggleMerchantExcludeRefundState = toggleMerchantExcludeRefundState;
window.onFailedTeamChange = onFailedTeamChange;
window.onFailedMemberChange = onFailedMemberChange;
window.updateTempFailureRunState = updateTempFailureRunState;
window.clearAllMemberFailures = clearAllMemberFailures;
window.saveFailedRunsConfiguration = saveFailedRunsConfiguration;
