// Tên file: thuong-nhan-popup.js
// Chức năng: Hiển thị Popup thu nhập Thương Nhân, xử lý nút gạt Bỏ Hoàn, ẩn/hiện popup đồng bộ Header.

function applyMerchantPopupVisibility() {
    let profitContainer = document.getElementById('floating-bubble-profit-container');
    let deoContainer = document.getElementById('floating-bubble-deo-container');
    let isAllPopupsHidden = localStorage.getItem('HIDE_ALL_FLOATING_POPUPS') === 'true';

    if (isAllPopupsHidden) {
        if (deoContainer) deoContainer.classList.add('hidden');
        if (profitContainer) profitContainer.classList.add('hidden');
        if (typeof applyAllFloatingPopupsVisibility === 'function') {
            applyAllFloatingPopupsVisibility(true);
        }
        return;
    }

    if (typeof isMerchantTabActive !== 'undefined' && isMerchantTabActive) {
        if (deoContainer) deoContainer.classList.add('hidden');
        if (profitContainer) profitContainer.classList.remove('hidden');
    } else {
        if (deoContainer) deoContainer.classList.remove('hidden');
        if (profitContainer) profitContainer.classList.remove('hidden');
    }
}

function renderMerchantCardModal() {
    let holder = document.getElementById('injection-merchant-card-holder');
    if (!holder || typeof calculateMerchantMetricsData !== 'function') return;

    let stats = calculateMerchantMetricsData();

    let existingCard = document.getElementById('floating-merchant-card');
    let isAllPopupsHidden = localStorage.getItem('HIDE_ALL_FLOATING_POPUPS') === 'true';
    let isHidden = isAllPopupsHidden ? true : (existingCard ? existingCard.classList.contains('hidden') : true);

    holder.innerHTML = `
        <div id="floating-merchant-card" onclick="event.stopPropagation()" class="${isHidden ? 'hidden' : ''} w-[345px] bg-gray-900 border border-amber-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-xs">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2">
                <span class="text-amber-400 font-black uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-gem animate-pulse"></i> Thu Nhập Thương Nhân
                </span>
                <div class="flex items-center gap-2">
                    <label class="flex items-center gap-1 cursor-pointer bg-gray-955 px-2 py-0.5 rounded border border-cyan-500/40 select-none" title="Không tính tiền vàng hoàn thương nhân">
                        <input id="chk-merchant-exclude-refund" type="checkbox" ${window.isMerchantExcludeRefund ? 'checked' : ''} onchange="toggleMerchantExcludeRefundState(this.checked)" class="accent-cyan-400 cursor-pointer w-3 h-3">
                        <span class="text-[10px] font-bold text-cyan-300">Bỏ Hoàn</span>
                    </label>
                    <button onclick="toggleFloatingMerchantCard(event)" class="text-gray-400 hover:text-white text-sm font-black cursor-pointer">&times;</button>
                </div>
            </div>
            
            <div class="flex flex-col gap-2 text-gray-300 font-semibold my-1 font-mono text-[11px]">
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Số TK đã hoàn thành (3/3):</span>
                    <strong class="text-emerald-400 text-xs font-black">${stats.completedAccounts} / ${stats.totalActiveAccounts} acc</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Số TK chưa hoàn thành:</span>
                    <strong class="text-cyan-400 text-xs font-black">${stats.unfinishedAccounts} acc</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Tổng trận thực tế đã đi:</span>
                    <strong class="text-yellow-300 text-xs font-black">${stats.totalRuns} lượt</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Vàng Thương Nhân (${window.isMerchantExcludeRefund ? 'Đã Bỏ Hoàn' : '1.2v/lượt'}):</span>
                    <strong class="text-amber-400 text-xs font-bold">+${stats.directGold.toFixed(2)}v</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-gray-400 font-sans">Nguyên liệu ${stats.isEventMode ? '(+8NL/lượt)' : '(Chưa bật SK)'}:</span>
                    <strong class="text-amber-400 text-xs font-bold">${stats.totalMaterials.toLocaleString('vi-VN')} NL ${stats.isEventMode ? `(+${stats.materialGold.toFixed(2)}v)` : '(+0.00v)'}</strong>
                </div>
            </div>
            
            <div class="w-full h-px bg-gray-800"></div>
            
            <div class="bg-gray-955 border border-gray-800 rounded-xl p-3 text-center flex flex-col items-center justify-center font-mono">
                <div class="text-emerald-400 font-black text-xl">
                    +${stats.totalGold.toFixed(2)} Vàng
                </div>
                <div class="text-gray-400 text-[11px] font-bold mt-0.5 font-sans">
                    ~ ${Math.round(stats.totalVnd).toLocaleString('vi-VN')} VNĐ
                </div>
            </div>
        </div>
    `;
}

function toggleMerchantExcludeRefundState(isChecked) {
    window.isMerchantExcludeRefund = isChecked;
    renderMerchantCardModal();
    if (typeof calculateComprehensiveProfitsRealtime === 'function') {
        calculateComprehensiveProfitsRealtime();
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

function setupGoldRateLiveSync() {
    let goldInputEl = document.getElementById('input-gold-rate');
    if (goldInputEl && !goldInputEl.dataset.merchantLiveBound) {
        goldInputEl.dataset.merchantLiveBound = "true";
        goldInputEl.addEventListener('input', function() {
            renderMerchantCardModal();
        });
    }
}

window.applyMerchantPopupVisibility = applyMerchantPopupVisibility;
window.renderMerchantCardModal = renderMerchantCardModal;
window.toggleMerchantExcludeRefundState = toggleMerchantExcludeRefundState;
window.toggleFloatingMerchantCard = toggleFloatingMerchantCard;
window.setupGoldRateLiveSync = setupGoldRateLiveSync;
