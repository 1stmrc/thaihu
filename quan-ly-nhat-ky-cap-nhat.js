/* ==========================================================================
   MODULE: QUẢN LÝ NHẬT KÝ CẬP NHẬT (CHANGELOG)
   Chức năng: Quản lý hiển thị lịch sử thay đổi phiên bản, đồng bộ mở/đóng modal.
   ========================================================================== */

const CHANGELOG_DATA = [
    {
        version: "v2.1.0",
        date: "23/09/2026",
        title: "Tối ưu hóa hệ thống & Bổ sung Nhật ký cập nhật",
        items: [
            "Tích hợp nút xem Nhật ký cập nhật trên thanh công cụ nổi.",
            "Tự động đồng bộ cấu hình thất bại (zero/half) với bảng thống kê doanh thu.",
            "Bảo toàn dữ liệu snapshot theo ngày chuẩn giờ Việt Nam (GMT+7)."
        ]
    },
    {
        version: "v2.0.0",
        date: "22/08/2026",
        title: "Khóa mã nguồn V2 & Hệ thống quản lý Thất bại",
        items: [
            "Tách biệt bộ nhớ LocalStorage cho phiên bản V2 (V2_THAI_HU_UPGRADED_RUNTIME_DB).",
            "Bổ sung module Quản lý thất bại ải Thái Hư độc lập.",
            "Nâng cấp bộ bấm giờ Thương nhân và cơ chế tính toán lợi nhuận thời gian thực."
        ]
    }
];

// Hàm khởi tạo và chèn khung giao diện vào thẻ holder
function injectChangelogComponent() {
    let holder = document.getElementById('injection-changelog-card-holder');
    if (!holder) {
        holder = document.createElement('div');
        holder.id = 'injection-changelog-card-holder';
        holder.className = "fixed bottom-16 right-[1065px] z-50 select-none";
        document.body.appendChild(holder);
    }
    renderChangelogCardModal();
}

// Hàm vẽ giao diện Popup Nhật Ký
function renderChangelogCardModal() {
    let holder = document.getElementById('injection-changelog-card-holder');
    if (!holder) return;

    let logsHtml = CHANGELOG_DATA.map(function(log) {
        let itemsHtml = log.items.map(function(item) {
            return '<li>' + item + '</li>';
        }).join('');

        return (
            '<div class="mb-3 border-b border-gray-700/60 pb-2.5 last:border-b-0 last:pb-0">' +
                '<div class="flex items-center justify-between mb-1">' +
                    '<span class="text-cyan-400 font-bold text-xs">' + log.version + ' - ' + log.title + '</span>' +
                    '<span class="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">' + log.date + '</span>' +
                '</div>' +
                '<ul class="list-disc list-inside text-[11px] text-gray-300 space-y-0.5">' +
                    itemsHtml +
                '</ul>' +
            '</div>'
        );
    }).join('');

    holder.innerHTML = 
        '<div id="floating-changelog-card" class="hidden w-80 max-h-[480px] bg-gray-900 border border-cyan-500 rounded-xl shadow-2xl p-3 flex flex-col font-sans">' +
            '<div class="flex items-center justify-between pb-2 mb-2 border-b border-gray-700 shrink-0">' +
                '<div class="flex items-center gap-1.5 text-cyan-400 font-black text-xs">' +
                    '<i class="fa-solid fa-clock-rotate-left"></i>' +
                    '<span>NHẬT KÝ CẬP NHẬT</span>' +
                '</div>' +
                '<button onclick="toggleFloatingChangelogCard(event)" class="text-gray-400 hover:text-white text-xs px-1 cursor-pointer">' +
                    '<i class="fa-solid fa-xmark"></i>' +
                '</button>' +
            '</div>' +
            '<div class="overflow-y-auto pr-1 space-y-2 flex-1 custom-scrollbar text-left">' +
                logsHtml +
            '</div>' +
        '</div>';
}

// Hàm bật/tắt (Toggle) hiển thị bảng Nhật ký
function toggleFloatingChangelogCard(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    let card = document.getElementById('floating-changelog-card');
    if (!card) {
        renderChangelogCardModal();
        card = document.getElementById('floating-changelog-card');
    }
    if (card) {
        card.classList.toggle('hidden');
    }
}

// Tự động khởi chạy khi trang web tải xong
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectChangelogComponent);
} else {
    injectChangelogComponent();
}

// Xuất hàm ra phạm vi toàn cục window
window.toggleFloatingChangelogCard = toggleFloatingChangelogCard;
window.renderChangelogCardModal = renderChangelogCardModal;
