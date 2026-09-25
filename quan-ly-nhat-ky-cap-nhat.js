/* ==========================================================================
   MODULE: QUẢN LÝ NHẬT KÝ CẬP NHẬT (CHANGELOG)
   Chức năng: Tự động dựng khung modal trực tiếp vào Body khi bấm nút,
   đảm bảo hiển thị 100% không bị kẹt tọa độ hay thiếu thẻ container.
   ========================================================================== */

const CHANGELOG_DATA = [
    {
        version: "v2.1.0",
        date: "25/09/2026",
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

// Hàm chính: Bật/Tắt hiển thị Modal Nhật Ký
function toggleFloatingChangelogCard(e) {
    if (e && e.stopPropagation) e.stopPropagation();

    // 1. Nếu modal đang mở thì bấm sẽ đóng lại (Toggle)
    let existingModal = document.getElementById('thaihu-changelog-modal-overlay');
    if (existingModal) {
        existingModal.remove();
        return;
    }

    // 2. Dựng nội dung các mục nhật ký
    let logsHtml = CHANGELOG_DATA.map(function(log) {
        let itemsHtml = log.items.map(function(item) {
            return '<li class="text-gray-300">' + item + '</li>';
        }).join('');

        return (
            '<div class="mb-3.5 border-b border-gray-700/60 pb-3 last:border-b-0 last:pb-0">' +
                '<div class="flex items-center justify-between mb-1.5">' +
                    '<span class="text-cyan-400 font-bold text-xs flex items-center gap-1.5">' +
                        '<i class="fa-solid fa-code-commit text-[10px]"></i>' + log.version + ' - ' + log.title +
                    '</span>' +
                    '<span class="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 font-mono">' + log.date + '</span>' +
                '</div>' +
                '<ul class="list-disc list-inside text-[11px] space-y-1 pl-1">' +
                    itemsHtml +
                '</ul>' +
            '</div>'
        );
    }).join('');

    // 3. Tạo khung Overlay gắn trực tiếp vào cuối thẻ body
    let overlay = document.createElement('div');
    overlay.id = 'thaihu-changelog-modal-overlay';
    overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs select-none p-4";
    overlay.onclick = function(event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    };

    overlay.innerHTML = 
        '<div class="w-full max-w-md bg-gray-900 border-2 border-cyan-500/80 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)] p-4 flex flex-col font-sans max-h-[80vh]" onclick="event.stopPropagation()">' +
            '<div class="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-700 shrink-0">' +
                '<div class="flex items-center gap-2 text-cyan-400 font-black text-sm tracking-wide">' +
                    '<i class="fa-solid fa-clock-rotate-left"></i>' +
                    '<span>NHẬT KÝ CẬP NHẬT HỆ THỐNG</span>' +
                '</div>' +
                '<button onclick="document.getElementById(\'thaihu-changelog-modal-overlay\').remove()" class="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer text-xs">' +
                    '<i class="fa-solid fa-xmark"></i>' +
                '</button>' +
            '</div>' +
            '<div class="overflow-y-auto pr-1 space-y-2 flex-1 custom-scrollbar text-left">' +
                logsHtml +
            '</div>' +
            '<div class="pt-2.5 mt-2 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500 font-mono shrink-0">' +
                '<span>Bản quyền hệ thống Thái Hư V2</span>' +
                '<button onclick="document.getElementById(\'thaihu-changelog-modal-overlay\').remove()" class="bg-gray-800 hover:bg-gray-700 text-cyan-300 px-3 py-1 rounded border border-gray-700 text-xs font-bold cursor-pointer transition">Đóng</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);
}

// Xuất hàm ra phạm vi toàn cục window để nút bấm trên giao diện gọi được
window.toggleFloatingChangelogCard = toggleFloatingChangelogCard;
