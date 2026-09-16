// Tên file: thanh-dieu-huong-tab.js
// Chức năng: Điều phối thanh 5 Tabs chính, tự động dọn sạch màu active cũ, chỉ làm sáng DUY NHẤT 1 tab đang mở và kích hoạt chính xác tab So Sánh Tối Ưu.
// Con của file: index.html (Được nạp qua thẻ script trong khung xương chính).
// Danh sách tính năng của file:
//   1. Tự động kiểm tra và chuyển đổi an toàn 5 Tab hệ thống.
//   2. Đồng bộ giao diện sáng/tối chuẩn màu nhận diện từng tab.
//   3. Gọi chính xác các view điều hướng: Thái Hư, Thương Nhân, So Sánh Tối Ưu, Quản Lý Đoài, Lịch Sử.

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

/* ==========================================================================
   KHỐI 1: BỘ ĐIỀU PHỐI ĐỔI MÀU SÁNG / TỐI DUY NHẤT 1 TAB CHÍNH
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]
   ========================================================================== */
function setActiveMainTabUI(activeKey) {
    const INACTIVE_CLASS = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";

    const TAB_ACTIVE_STYLES = {
        thaihu: "px-3 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white shadow border border-blue-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0",
        merchant: "px-3 py-1.5 rounded-lg text-xs font-black bg-amber-600 text-white shadow border border-amber-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0",
        optimize: "px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white shadow border border-emerald-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0",
        deo: "px-3 py-1.5 rounded-lg text-xs font-black bg-purple-600 text-white shadow border border-purple-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0",
        logs: "px-3 py-1.5 rounded-lg text-xs font-black bg-cyan-600 text-white shadow border border-cyan-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0"
    };

    const TAB_BUTTON_IDS = {
        thaihu: 'btn-main-tab-thaihu',
        merchant: 'btn-main-tab-merchant',
        optimize: 'btn-main-tab-optimize',
        deo: 'btn-main-tab-deo',
        logs: 'btn-main-tab-logs'
    };

    Object.keys(TAB_BUTTON_IDS).forEach(key => {
        let btn = document.getElementById(TAB_BUTTON_IDS[key]);
        if (btn) {
            btn.className = (key === activeKey) ? TAB_ACTIVE_STYLES[key] : INACTIVE_CLASS;
        }
    });
}

/* ==========================================================================
   KHỐI 2: XỬ LÝ CHUYỂN TAB VÀ KÍCH HOẠT HÀM RENDER TƯƠNG ỨNG
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]
   ========================================================================== */
function handleMainTabSwitch(target) {
    setActiveMainTabUI(target);

    if (target === 'thaihu') {
        if (typeof switchMainSystemTab === 'function') switchMainSystemTab('thai_hu_main');
    } else if (target === 'merchant') {
        if (typeof switchToMerchantManagementTab === 'function') switchToMerchantManagementTab();
        else if (typeof switchMainSystemTab === 'function') switchMainSystemTab('merchant_tab');
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

/* ==========================================================================
   KHỐI 3: TIÊM THÀNH PHẦN THANH TAB VÀO KHUNG GIAO DIỆN
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]
   ========================================================================== */
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

            <!-- 3. SO SÁNH TỐI ƯU -->
            <button onclick="handleMainTabSwitch('optimize')" id="btn-main-tab-optimize" class="px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0">
                <i class="fa-solid fa-scale-balanced text-emerald-400"></i> So Sánh Tối Ưu
            </button>

            <!-- 4. QUẢN LÝ ĐOÀI -->
            <button onclick="handleMainTabSwitch('deo')" id="btn-main-tab-deo" class="px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0">
                <i class="fa-solid fa-gem text-purple-400"></i> Quản Lý Đoài
            </button>

            <!-- 5. LỊCH SỬ HÀNH ĐỘNG -->
            <button onclick="handleMainTabSwitch('logs')" id="btn-main-tab-logs" class="px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0">
                <i class="fa-solid fa-clock-rotate-left text-cyan-400"></i> Lịch Sử Hành Động
            </button>
        </div>
    `;
}

window.setActiveMainTabUI = setActiveMainTabUI;
window.handleMainTabSwitch = handleMainTabSwitch;
window.injectMainTabsComponent = injectMainTabsComponent;

// Tổng số dòng code trong file này: 110 dòng.