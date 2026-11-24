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
        &lt;div id="floating-merchant-card" onclick="event.stopPropagation()" class="${isHidden ? 'hidden' : ''} w-[345px] bg-gray-900 border border-amber-500 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-xs"&gt;
            &lt;div class="flex items-center justify-between border-b border-gray-800 pb-2"&gt;
                &lt;span class="text-amber-400 font-black uppercase tracking-wider flex items-center gap-1.5"&gt;
                    &lt;i class="fa-solid fa-gem animate-pulse"&gt;&lt;/i&gt; Thu Nhập Thương Nhân
                &lt;/span&gt;
                &lt;div class="flex items-center gap-2"&gt;
                    &lt;label class="flex items-center gap-1 cursor-pointer bg-gray-955 px-2 py-0.5 rounded border border-cyan-500/40 select-none" title="Không tính tiền vàng hoàn thương nhân"&gt;
                        &lt;input id="chk-merchant-exclude-refund" type="checkbox" ${window.isMerchantExcludeRefund ? 'checked' : ''} onchange="toggleMerchantExcludeRefundState(this.checked)" class="accent-cyan-400 cursor-pointer w-3 h-3"&gt;
                        &lt;span class="text-[10px] font-bold text-cyan-300"&gt;Bỏ Hoàn&lt;/span&gt;
                    &lt;/label&gt;
                    &lt;button onclick="toggleFloatingMerchantCard(event)" class="text-gray-400 hover:text-white text-sm font-black cursor-pointer"&gt;&times;&lt;/button&gt;
                &lt;/div&gt;
            &lt;/div&gt;
            
            &lt;div class="flex flex-col gap-2 text-gray-300 font-semibold my-1 font-mono text-[11px]"&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Số TK đã hoàn thành (3/3):&lt;/span&gt;
                    &lt;strong class="text-emerald-400 text-xs font-black"&gt;${stats.completedAccounts} / ${stats.totalActiveAccounts} acc&lt;/strong&gt;
                &lt;/div&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Số TK chưa hoàn thành:&lt;/span&gt;
                    &lt;strong class="text-cyan-400 text-xs font-black"&gt;${stats.unfinishedAccounts} acc&lt;/strong&gt;
                &lt;/div&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Tổng trận thực tế đã đi:&lt;/span&gt;
                    &lt;strong class="text-yellow-300 text-xs font-black"&gt;${stats.totalRuns} lượt&lt;/strong&gt;
                &lt;/div&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Vàng Thương Nhân (${window.isMerchantExcludeRefund ? 'Đã Bỏ Hoàn' : '1.2v/lượt'}):&lt;/span&gt;
                    &lt;strong class="text-amber-400 text-xs font-bold"&gt;+${stats.directGold.toFixed(2)}v&lt;/strong&gt;
                &lt;/div&gt;
                &lt;div class="flex justify-between items-center"&gt;
                    &lt;span class="text-gray-400 font-sans"&gt;Nguyên liệu ${stats.isEventMode ? '(+8NL/lượt)' : '(Chưa bật SK)'}:&lt;/span&gt;
                    &lt;strong class="text-amber-400 text-xs font-bold"&gt;${stats.totalMaterials.toLocaleString('vi-VN')} NL ${stats.isEventMode ? `(+${stats.materialGold.toFixed(2)}v)` : '(+0.00v)'}&lt;/strong&gt;
                &lt;/div&gt;
            &lt;/div&gt;
            
            &lt;div class="w-full h-px bg-gray-800"&gt;&lt;/div&gt;
            
            &lt;div class="bg-gray-955 border border-gray-800 rounded-xl p-3 text-center flex flex-col items-center justify-center font-mono"&gt;
                &lt;div class="text-emerald-400 font-black text-xl"&gt;
                    +${stats.totalGold.toFixed(2)} Vàng
                &lt;/div&gt;
                &lt;div class="text-gray-400 text-[11px] font-bold mt-0.5 font-sans"&gt;
                    ~ ${Math.round(stats.totalVnd).toLocaleString('vi-VN')} VNĐ
                &lt;/div&gt;
            &lt;/div&gt;
        &lt;/div&gt;
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
