// Tên file: giao-dien-thuong-nhan.js
// Chức năng: Cầu nối kích hoạt Popup Thu Nhập Thương Nhân (từ thuong-nhan-popup.js) và đồng bộ tỷ giá Vàng theo thời gian thực.

function injectMerchantComponent() {
    try {
        if (typeof renderMerchantCardModal === 'function') {
            renderMerchantCardModal();
        }
    } catch (err) {
        console.error("Lỗi inject Merchant Component:", err);
    }
}

let lastKnownMerchantGoldRateValue = "";
setInterval(() => {
    let card = document.getElementById('floating-merchant-card');
    let isVisible = card && !card.classList.contains('hidden');
    let goldInputEl = document.getElementById('input-gold-rate');
    let currentVal = goldInputEl ? goldInputEl.value : "";
    
    if (isVisible && currentVal !== lastKnownMerchantGoldRateValue) {
        lastKnownMerchantGoldRateValue = currentVal;
        if (typeof renderMerchantCardModal === 'function') {
            renderMerchantCardModal();
        }
    }
}, 300);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectMerchantComponent);
} else {
    injectMerchantComponent();
}

window.injectMerchantComponent = injectMerchantComponent;
