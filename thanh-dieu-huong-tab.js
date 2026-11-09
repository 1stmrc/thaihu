// Tên file: thanh-dieu-huong-tab.js
// Chức năng: Điều phối 6 Tab chính, tự động thêm mũi tên chỉa xuống (▼) khi tab được chọn, đổi icon Sát Thủ tách màu, ẩn sạch popup.
// Con của file: index.html

const BAT_QUAI_SVG_ICON = `
<svg class="w-3.5 h-3.5 inline-block align-middle fill-current text-amber-300" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="30,5 70,5 95,30 95,70 70,95 30,95 5,70 5,30" fill="none" stroke="currentColor" stroke-width="5"/>
    <line x1="40" y1="12" x2="60" y2="12" stroke="currentColor" stroke-width="3"/>
    <line x1="40" y1="17" x2="60" y2="17" stroke="currentColor" stroke-width="3"/>
    <line x1="40" y1="22" x2="60" y2="22" stroke="currentColor" stroke-width="3"/>
    <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" stroke-width="3.5"/>
    <path d="M 50,28 A 11,11 0 0,1 50,50 A 11,11 0 0,0 50,72 A 22,22 0 0,1 50,28 Z" fill="currentColor"/>
    <circle cx="50" cy="39" r="3.5" fill="#111827"/>
    <circle cx="50" cy="61" r="3.5" fill="currentColor"/>
</svg>`;

function setActiveMainTabUI(activeKey) {
    const INACTIVE_CLASS = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";

    const TAB_ACTIVE_STYLES = {
        thaihu: "px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow border border-blue-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0",
        merchant: "px-3 py-1.5 rounded-lg text-xs font-black bg-amber-600 text-white shadow border border-amber-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0",
        satthu: "px-3 py-1.5 rounded-lg text-xs font-black bg-rose-600 text-white shadow border border-rose-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0",
        optimize: "px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white shadow border border-emerald-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0",
        deo: "px-3 py-1.5 rounded-lg text-xs font-black bg-purple-600 text-white shadow border border-purple-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0",
        logs: "px-3 py-1.5 rounded-lg text-xs font-black bg-cyan-600 text-white shadow border border-cyan-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0"
    };

    const TAB_BUTTON_IDS = {
        thaihu: 'btn-main-tab-thaihu',
        merchant: 'btn-main-tab-merchant',
        satthu: 'btn-main-tab-satthu',
        optimize: 'btn-main-tab-optimize',
        deo: 'btn-main-tab-deo',
        logs: 'btn-main-tab-logs'
    };

    Object.keys(TAB_BUTTON_IDS).forEach(key => {
        let btn = document.getElementById(TAB_BUTTON_IDS[key]);
        if (btn) {
            let isCurrentActive = (key === activeKey);
            btn.className = isCurrentActive ? TAB_ACTIVE_STYLES[key] : INACTIVE_CLASS;

            // Xóa mũi tên cũ nếu có
            let oldArrow = btn.querySelector('.tab-down-arrow');
            if (oldArrow) oldArrow.remove();

            // Nếu đang active: thêm mũi tên nhỏ chỉa xuống
            if (isCurrentActive) {
                let arrowSpan = document.createElement('span');
                arrowSpan.className = "tab-down-arrow ml-0.5 text-[10px] text-white/90 animate-bounce";
                arrowSpan.innerHTML = '<i class="fa-solid fa-caret-down"></i>';
                btn.appendChild(arrowSpan);
            }
        }
    });

    // Ẩn tất cả các popup nổi khi ở Tab Sát Thủ
    let floatingProfits = document.getElementById('floating-bubble-profit-container');
    let floatingDeo = document.getElementById('floating-bubble-deo-container');
    let cardProfit = document.getElementById('floating-profit-card');
    let cardMerchant = document.getElementById('floating-merchant-card');
    let cardFailed = document.getElementById('floating-failed-card');
    let cardChangelog = document.getElementById('floating-changelog-card');

    if (activeKey === 'satthu') {
        if (floatingProfits) floatingProfits.classList.add('hidden');
        if (floatingDeo) floatingDeo.classList.add('hidden');
        if (cardProfit) cardProfit.classList.add('hidden');
        if (cardMerchant) cardMerchant.classList.add('hidden');
        if (cardFailed) cardFailed.classList.add('hidden');
        if (cardChangelog) cardChangelog.classList.add('hidden');
    } else {
        if (floatingProfits) floatingProfits.classList.remove('hidden');
        if (floatingDeo) floatingDeo.classList.remove('hidden');
    }
}

function handleMainTabSwitch(target) {
    setActiveMainTabUI(target);

    let satThuView = document.getElementById('tab-content-quan-ly-sat-thu');
    if (satThuView && target !== 'satthu') {
        satThuView.classList.add('hidden');
    }

    let merchantView = document.getElementById('tab-content-quan-ly-thuong-nhan');
    if (merchantView && target !== 'merchant') {
        merchantView.classList.add('hidden');
    }

    if (target === 'thaihu') {
        if (typeof switchMainSystemTab === 'function') switchMainSystemTab('thai_hu_main');
    } else if (target === 'merchant') {
        if (typeof switchToMerchantManagementTab === 'function') switchToMerchantManagementTab();
        else if (typeof switchMainSystemTab === 'function') switchMainSystemTab('merchant_tab');
    } else if (target === 'satthu') {
        if (typeof switchToSatThuTab === 'function') switchToSatThuTab();
    } else if (target === 'optimize') {
        if (typeof switchToOptimizationTab === 'function') {
            switchToOptimizationTab();
        } else if (typeof renderOptimizationWorkspaceView === 'function') {
            renderOptimizationWorkspaceView();
        }
    } else if (target === 'deo') {
        if (typeof switchToDeoManagementTab === 'function') switchToDeoManagementTab();
    } else if (target === 'logs') {
        if (typeof switchToActivityLogTab === 'function') switchToActivityLogTab();
    }
}

function injectMainTabsComponent() {
    let container = document.getElementById('injection-main-tabs-container');
    if (!container) return;

    container.innerHTML = `
        <div class="shrink-0 bg-gray-900 px-2.5 py-1.5 border-b border-gray-700 flex items-center gap-1.5 rounded-t-xl z-20 overflow-x-auto no-scrollbar">
            <!-- 1. THÁI HƯ -->
            <button onclick="handleMainTabSwitch('thaihu')" id="btn-main-tab-thaihu" class="px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow border border-blue-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0">
                ${BAT_QUAI_SVG_ICON} Thái Hư
            </button>

            <!-- 2. QUẢN LÝ THƯƠNG NHÂN -->
            <button onclick="handleMainTabSwitch('merchant')" id="btn-main-tab-merchant" class="px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0">
                <i class="fa-solid fa-coins text-amber-400"></i> Quản Lý Thương Nhân
            </button>

            <!-- 3. SÁT THỦ (Icon màu trắng tinh tách biệt với nền đỏ) -->
            <button onclick="handleMainTabSwitch('satthu')" id="btn-main-tab-satthu" class="px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0">
                <i class="fa-solid fa-skull text-white drop-shadow"></i> SÁT THỦ
            </button>

            <!-- 4. SO SÁNH TỐI ƯU -->
            <button onclick="handleMainTabSwitch('optimize')" id="btn-main-tab-optimize" class="px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0">
                <i class="fa-solid fa-scale-balanced text-emerald-400"></i> So Sánh Tối Ưu
            </button>

            <!-- 5. QUẢN LÝ ĐOÀI -->
            <button onclick="handleMainTabSwitch('deo')" id="btn-main-tab-deo" class="px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0">
                <i class="fa-solid fa-gem text-purple-400"></i> Quản Lý Đoài
            </button>

            <!-- 6. LỊCH SỬ HÀNH ĐỘNG -->
            <button onclick="handleMainTabSwitch('logs')" id="btn-main-tab-logs" class="px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0">
                <i class="fa-solid fa-clock-rotate-left text-cyan-400"></i> Lịch Sử Hành Động
            </button>
        </div>
    `;
}

window.setActiveMainTabUI = setActiveMainTabUI;
window.handleMainTabSwitch = handleMainTabSwitch;
window.injectMainTabsComponent = injectMainTabsComponent;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectMainTabsComponent);
} else {
    injectMainTabsComponent();
}
