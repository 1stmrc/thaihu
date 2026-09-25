/* ==========================================================================
   MODULE: QUẢN LÝ NHẬT KÝ CẬP NHẬT (CHANGELOG)
   Chức năng: Tự động gom nhóm theo ngày, hiển thị chi tiết mốc giờ từng giây,
   phân trang từng ngày mượt mà và tự sinh modal độc lập vào body.
   ========================================================================== */

// Dữ liệu nhật ký cập nhật chi tiết đến từng giây (Ghi nhận theo thứ tự thời gian)
const CHANGELOG_DATA = [
    {
        version: "v2.1.2",
        timestamp: "09:15:20 25/09/2026",
        title: "Tối ưu hóa giao diện Changelog & Phân trang ngày",
        items: [
            "Gom nhóm lịch sử cập nhật theo từng ngày riêng biệt.",
            "Tích hợp hiển thị mốc thời gian chi tiết từng giây (HH:mm:ss).",
            "Bổ sung thanh điều hướng phân trang xem lại các ngày trước đó."
        ]
    },
    {
        version: "v2.1.1",
        timestamp: "08:42:15 25/09/2026",
        title: "Sửa lỗi CDN Tailwind CSS & FontAwesome",
        items: [
            "Chuyển đổi CDN Tailwind CSS sang bản v3 Play chính thức chống vỡ khung.",
            "Khắc phục lỗi 404 gói icon FontAwesome trên trình duyệt PC."
        ]
    },
    {
        version: "v2.1.0",
        timestamp: "07:30:00 25/09/2026",
        title: "Tích hợp nút Nhật Ký Cập Nhật",
        items: [
            "Tích hợp nút xem Nhật ký cập nhật nổi màu xanh cyan.",
            "Cơ chế tự tạo Overlay Modal gắn trực tiếp vào body chống kẹt tọa độ."
        ]
    },
    {
        version: "v2.0.0",
        timestamp: "23:59:59 22/08/2026",
        title: "Khóa mã nguồn V2 & Hệ thống quản lý Thất bại",
        items: [
            "Tách biệt bộ nhớ LocalStorage cho phiên bản V2 (V2_THAI_HU_UPGRADED_RUNTIME_DB).",
            "Bổ sung module Quản lý thất bại ải Thái Hư độc lập.",
            "Nâng cấp bộ bấm giờ Thương nhân và cơ chế tính toán lợi nhuận thời gian thực."
        ]
    }
];

// Biến lưu trang ngày đang xem (0 = Ngày mới nhất)
let currentChangelogDayIndex = 0;

// Hàm gom dữ liệu theo từng ngày (Date grouping)
function getGroupedChangelogByDate() {
    let groups = {};
    CHANGELOG_DATA.forEach(function(item) {
        // Tách chuỗi ngày từ timestamp: "HH:mm:ss DD/MM/YYYY" -> "DD/MM/YYYY"
        let parts = item.timestamp.split(' ');
        let dateKey = parts.length > 1 ? parts[1] : parts[0];
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(item);
    });

    let result = [];
    Object.keys(groups).forEach(function(date) {
        result.push({
            date: date,
            logs: groups[date]
        });
    });
    return result;
}

// Hàm chuyển trang ngày
function changeChangelogDayPage(offset) {
    let grouped = getGroupedChangelogByDate();
    let newIndex = currentChangelogDayIndex + offset;
    if (newIndex >= 0 && newIndex < grouped.length) {
        currentChangelogDayIndex = newIndex;
        renderChangelogContentBody();
    }
}

// Hàm render nội dung bên trong modal
function renderChangelogContentBody() {
    let contentContainer = document.getElementById('thaihu-changelog-content-zone');
    let paginationContainer = document.getElementById('thaihu-changelog-pagination-zone');
    if (!contentContainer) return;

    let grouped = getGroupedChangelogByDate();
    if (grouped.length === 0) {
        contentContainer.innerHTML = '<div class="text-gray-500 text-center py-4 text-xs italic">Chưa có nhật ký nào.</div>';
        return;
    }

    if (currentChangelogDayIndex >= grouped.length) {
        currentChangelogDayIndex = 0;
    }

    let activeDay = grouped[currentChangelogDayIndex];

    // Tạo HTML danh sách cập nhật của ngày đang chọn
    let logsHtml = activeDay.logs.map(function(log) {
        let itemsHtml = log.items.map(function(it) {
            return '<li class="text-gray-300 leading-relaxed">' + it + '</li>';
        }).join('');

        return (
            '<div class="mb-3.5 bg-gray-950/70 border border-gray-800 rounded-xl p-3 shadow-inner">' +
                '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 border-b border-gray-800/80 pb-2">' +
                    '<span class="text-cyan-400 font-bold text-xs flex items-center gap-1.5">' +
                        '<i class="fa-solid fa-code-commit text-[11px] text-cyan-500"></i>' + log.version + ' - ' + log.title +
                    '</span>' +
                    '<span class="text-[10px] text-amber-300 font-mono bg-gray-900 border border-amber-500/30 px-2 py-0.5 rounded shrink-0 self-start sm:self-auto">' +
                        '<i class="fa-regular fa-clock text-[9px] mr-1"></i>' + log.timestamp +
                    '</span>' +
                '</div>' +
                '<ul class="list-disc list-inside text-[11px] space-y-1 pl-1">' +
                    itemsHtml +
                '</ul>' +
            '</div>'
        );
    }).join('');

    contentContainer.innerHTML = logsHtml;

    // Thanh điều hướng phân trang
    if (paginationContainer) {
        let hasPrev = currentChangelogDayIndex > 0;
        let hasNext = currentChangelogDayIndex < grouped.length - 1;

        paginationContainer.innerHTML = 
            '<div class="flex items-center justify-between w-full bg-gray-950 px-3 py-2 rounded-xl border border-gray-800 text-xs font-sans">' +
                '<button onclick="changeChangelogDayPage(-1)" ' + (!hasPrev ? 'disabled' : '') + ' class="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer">' +
                    '<i class="fa-solid fa-chevron-left text-[10px]"></i> Ngày Mới Hơn' +
                '</button>' +
                '<div class="flex items-center gap-1.5 text-center">' +
                    '<span class="text-gray-400 text-[11px]">Ngày:</span>' +
                    '<strong class="text-cyan-300 font-mono text-xs">' + activeDay.date + '</strong>' +
                    '<span class="text-[10px] text-gray-500">(' + (currentChangelogDayIndex + 1) + '/' + grouped.length + ')</span>' +
                '</div>' +
                '<button onclick="changeChangelogDayPage(1)" ' + (!hasNext ? 'disabled' : '') + ' class="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer">' +
                    'Ngày Trước <i class="fa-solid fa-chevron-right text-[10px]"></i>' +
                '</button>' +
            '</div>';
    }
}

// Bật/Tắt hiển thị Modal Nhật Ký
function toggleFloatingChangelogCard(e) {
    if (e && e.stopPropagation) e.stopPropagation();

    let existingModal = document.getElementById('thaihu-changelog-modal-overlay');
    if (existingModal) {
        existingModal.remove();
        return;
    }

    currentChangelogDayIndex = 0; // Mặc định mở luôn ngày mới nhất

    let overlay = document.createElement('div');
    overlay.id = 'thaihu-changelog-modal-overlay';
    overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-xs select-none p-3";
    overlay.onclick = function(event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    };

    overlay.innerHTML = 
        '<div class="w-full max-w-lg bg-gray-900 border-2 border-cyan-500/80 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.25)] p-4 flex flex-col font-sans max-h-[85vh] relative" onclick="event.stopPropagation()">' +
            '<div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-700 shrink-0">' +
                '<div class="flex items-center gap-2 text-cyan-400 font-black text-sm tracking-wide uppercase">' +
                    '<i class="fa-solid fa-clock-rotate-left"></i>' +
                    '<span>NHẬT KÝ CẬP NHẬT HỆ THỐNG</span>' +
                '</div>' +
                '<button onclick="document.getElementById(\'thaihu-changelog-modal-overlay\').remove()" class="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer text-xs">' +
                    '<i class="fa-solid fa-xmark"></i>' +
                '</button>' +
            '</div>' +

            '<div id="thaihu-changelog-pagination-zone" class="mb-2 shrink-0"></div>' +

            '<div id="thaihu-changelog-content-zone" class="overflow-y-auto pr-1 space-y-2 flex-1 custom-scrollbar text-left max-h-[55vh]"></div>' +

            '<div class="pt-2.5 mt-2 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500 font-mono shrink-0">' +
                '<span>Hệ thống Thái Hư V2 • Cập nhật thời gian thực</span>' +
                '<button onclick="document.getElementById(\'thaihu-changelog-modal-overlay\').remove()" class="bg-gray-800 hover:bg-gray-700 text-cyan-300 px-3.5 py-1 rounded-lg border border-gray-700 text-xs font-bold cursor-pointer transition shadow">Đóng</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);
    renderChangelogContentBody();
}

// Xuất các hàm ra phạm vi toàn cục window
window.toggleFloatingChangelogCard = toggleFloatingChangelogCard;
window.changeChangelogDayPage = changeChangelogDayPage;
