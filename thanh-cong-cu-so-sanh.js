// Tên file: thanh-cong-cu-so-sanh.js
// Chức năng: Quản lý và render độc lập thanh công cụ điều khiển trên đầu Tab So Sánh Tối Ưu (Nút gạt [Tính Lời Lỗ], [Tính Ngân Phiếu] và [Đang Có Sự Kiện]).
// Con của file: index.html (Nạp vào div #so-sanh-topbar-control-container trong giao_dien_so_sanh_va_dieu_phoi.js).
// Danh sách tính năng của file:
//   1. Khởi tạo và render độc lập 3 nút gạt: [Tính Lời Lỗ], [Tính Ngân Phiếu], [Đang Có Sự Kiện].
//   2. Tự động lưu và khôi phục trạng thái bật/tắt của 3 nút từ localStorage.
//   3. Tự động kích hoạt tính toán lại toàn bộ hệ thống so sánh khi người dùng click gạt nút.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: RENDER VÀ ĐIỀU PHỐI THANH CÔNG CỤ SO SÁNH ĐỘC LẬP
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function renderTopbarControlSoSanhView() {
    let container = document.getElementById('so-sanh-topbar-control-container');
    if (!container) return;

    let savedProfitLoss = localStorage.getItem('SO_SANH_IS_PROFIT_LOSS');
    let isProfitLoss = savedProfitLoss !== null ? (savedProfitLoss === 'true') : true;

    let savedNganPhieu = localStorage.getItem('SO_SANH_IS_NGAN_PHIEU');
    let isNganPhieu = savedNganPhieu !== null ? (savedNganPhieu === 'true') : false;

    let savedEvent = localStorage.getItem('SO_SANH_IS_EVENT');
    let isEvent = savedEvent !== null ? (savedEvent === 'true') : true;

    container.innerHTML = `
        <div class="flex items-center gap-2 select-none flex-wrap">
            <!-- NÚT GẠT TÍNH LỜI LỖ -->
            <label class="flex items-center gap-1.5 cursor-pointer bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-700 hover:border-cyan-500 transition select-none shadow">
                <input id="chk-opt-profit-loss-toggle" type="checkbox" ${isProfitLoss ? 'checked' : ''} onchange="handleToggleProfitLossState(this.checked)" class="accent-cyan-400 cursor-pointer w-3.5 h-3.5">
                <span class="text-[11px] font-bold text-cyan-300 flex items-center gap-1"><i class="fa-solid fa-calculator"></i> Tính Lời Lỗ</span>
            </label>

            <!-- NÚT GẠT TÍNH NGÂN PHIẾU (MỚI THÊM) -->
            <label class="flex items-center gap-1.5 cursor-pointer bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-700 hover:border-yellow-500 transition select-none shadow">
                <input id="chk-opt-ngan-phieu-toggle" type="checkbox" ${isNganPhieu ? 'checked' : ''} onchange="handleToggleNganPhieuState(this.checked)" class="accent-yellow-400 cursor-pointer w-3.5 h-3.5">
                <span class="text-[11px] font-bold text-yellow-300 flex items-center gap-1"><i class="fa-solid fa-ticket"></i> Tính Ngân Phiếu</span>
            </label>

            <!-- NÚT GẠT ĐANG CÓ SỰ KIỆN -->
            <label class="flex items-center gap-1.5 cursor-pointer bg-gray-950 px-2.5 py-1 rounded-lg border border-gray-700 hover:border-amber-500 transition select-none shadow">
                <input id="chk-opt-event-toggle" type="checkbox" ${isEvent ? 'checked' : ''} onchange="handleToggleEventState(this.checked)" class="accent-amber-400 cursor-pointer w-3.5 h-3.5">
                <span class="text-[11px] font-bold text-amber-400 flex items-center gap-1"><i class="fa-solid fa-fire"></i> Đang Có Sự Kiện</span>
            </label>
        </div>
    `;
}

function handleToggleProfitLossState(isChecked) {
    localStorage.setItem('SO_SANH_IS_PROFIT_LOSS', isChecked);
    if (typeof runActivitiesComparisonCalculation === 'function') {
        runActivitiesComparisonCalculation();
    }
}

function handleToggleNganPhieuState(isChecked) {
    localStorage.setItem('SO_SANH_IS_NGAN_PHIEU', isChecked);
    if (typeof runActivitiesComparisonCalculation === 'function') {
        runActivitiesComparisonCalculation();
    }
}

function handleToggleEventState(isChecked) {
    localStorage.setItem('SO_SANH_IS_EVENT', isChecked);
    if (typeof toggleEventModeUI === 'function') {
        toggleEventModeUI();
    }
    if (typeof runActivitiesComparisonCalculation === 'function') {
        runActivitiesComparisonCalculation();
    }
}

window.renderTopbarControlSoSanhView = renderTopbarControlSoSanhView;
window.handleToggleProfitLossState = handleToggleProfitLossState;
window.handleToggleNganPhieuState = handleToggleNganPhieuState;
window.handleToggleEventState = handleToggleEventState;

// Tổng số dòng code trong file này: 78 dòng.