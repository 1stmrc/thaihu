/* ==========================================================================
   MODULE: QUẢN LÝ NHẬT KÝ CẬP NHẬT TỰ ĐỘNG & DỰ PHÒNG (CHANGELOG HYBRID)
   Chức năng: Cố gắng kết nối GitHub API để lấy commit tự động; nếu gặp lỗi
   404 (do repo Private) sẽ tự động nạp dữ liệu cập nhật nội bộ chuẩn xác,
   không bao giờ hiện bảng lỗi gián đoạn người dùng.
   ========================================================================== */

const GITHUB_REPO_OWNER = "1stmrc";
const GITHUB_REPO_NAME = "thaihu";

// Dữ liệu nhật ký chuẩn bị sẵn dự phòng khi không kết nối được GitHub API
const LOCAL_CHANGELOG_FALLBACK = [
    {
        version: "v2.1.5",
        timestamp: "10:30:15 25/09/2026",
        title: "Tối ưu hóa Bảng So Sánh & Real-time Calculation",
        items: [
            "Khóa cứng 3 cột ngang không bị trượt dọc trên màn hình máy tính.",
            "Tự động tính toán lại toàn bộ dữ liệu tức thì khi gõ phím (oninput).",
            "Bổ sung hệ thống Đánh Giá Top động (Top 1, Top 2, Lời nhiều nhất).",
            "Bóc tách minh bạch số tài khoản, số lượt và số nguyên liệu chi tiết cho Max 2 / Max 3."
        ]
    },
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
        title: "Khóa mã nguồn V2 & Quản lý Thất bại",
        items: [
            "Tách biệt bộ nhớ LocalStorage cho phiên bản V2 (V2_THAI_HU_UPGRADED_RUNTIME_DB).",
            "Bổ sung module Quản lý thất bại ải Thái Hư độc lập.",
            "Nâng cấp bộ bấm giờ Thương nhân và cơ chế tính toán lợi nhuận thời gian thực."
        ]
    }
];

let fetchedCommitsHistory = [];
let currentChangelogDayIndex = 0;
let isFetchingChangelog = false;
let isUsingLocalFallback = false;

// Chuyển đổi chuỗi ISO sang giờ GMT+7
function parseGitHubDateToGMT7(isoDateString) {
    let dateObj = new Date(isoDateString);
    let utcMs = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    let gmt7Date = new Date(utcMs + (3600000 * 7));

    let hh = String(gmt7Date.getHours()).padStart(2, '0');
    let mm = String(gmt7Date.getMinutes()).padStart(2, '0');
    let ss = String(gmt7Date.getSeconds()).padStart(2, '0');
    let d = String(gmt7Date.getDate()).padStart(2, '0');
    let m = String(gmt7Date.getMonth() + 1).padStart(2, '0');
    let y = gmt7Date.getFullYear();

    return {
        timestamp: hh + ':' + mm + ':' + ss + ' ' + d + '/' + m + '/' + y,
        dateOnly: d + '/' + m + '/' + y,
        rawDateObj: gmt7Date
    };
}

// Tính thời gian trôi qua so với hiện tại
function formatTimeAgo(targetDateObj) {
    try {
        let now = new Date();
        let diffSecs = Math.floor((now.getTime() - targetDateObj.getTime()) / 1000);

        if (diffSecs !== 0 && diffSecs < 5) return 'vừa xong';
        if (diffSecs < 60) return diffSecs + 's trước';

        let mins = Math.floor(diffSecs / 60);
        let secs = diffSecs % 60;

        if (mins < 60) {
            return secs !== 0 ? (mins + 'p ' + secs + 's trước') : (mins + 'p trước');
        }

        let hours = Math.floor(mins / 60);
        let remainMins = mins % 60;

        if (hours < 24) {
            return remainMins !== 0 ? (hours + 'h ' + remainMins + 'p trước') : (hours + 'h trước');
        }

        let days = Math.floor(hours / 24);
        let remainHours = hours % 24;
        return remainHours !== 0 ? (days + ' ngày ' + remainHours + 'h trước') : (days + ' ngày trước');
    } catch (e) {
        return '';
    }
}

// Chuyển đổi timestamp dạng "09:15:20 25/09/2026" thành Date Object
function parseCustomTimestampToDate(str) {
    try {
        let parts = str.trim().split(' ');
        let tParts = parts[0].split(':').map(Number);
        let dParts = parts[1].split('/').map(Number);
        return new Date(dParts[2], dParts[1] - 1, dParts[0], tParts[0], tParts[1], tParts[2]);
    } catch (e) {
        return new Date();
    }
}

// Nạp dữ liệu fallback khi API bị lỗi
function loadLocalFallbackData() {
    isUsingLocalFallback = true;
    fetchedCommitsHistory = LOCAL_CHANGELOG_FALLBACK.map(function(item) {
        let pDate = parseCustomTimestampToDate(item.timestamp);
        let dOnly = item.timestamp.split(' ')[1] || item.timestamp;
        return {
            sha: item.version,
            commitUrl: "#",
            title: item.title,
            details: item.items,
            timestamp: item.timestamp,
            dateOnly: dOnly,
            dateObj: pDate
        };
    });
    currentChangelogDayIndex = 0;
    renderChangelogContentBody();
}

// Gọi GitHub API (nếu lỗi sẽ tự động chuyển sang Fallback)
async function fetchLatestGitHubCommits() {
    isFetchingChangelog = true;
    renderChangelogLoadingState();

    try {
        let apiUrl = 'https://api.github.com/repos/' + GITHUB_REPO_OWNER + '/' + GITHUB_REPO_NAME + '/commits?per_page=35';
        let response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        let rawCommits = await response.json();
        isUsingLocalFallback = false;

        fetchedCommitsHistory = rawCommits.map(function(item) {
            let commitData = item.commit || {};
            let authorInfo = commitData.author || {};
            let commitDateStr = authorInfo.date || item.commit?.committer?.date || new Date().toISOString();
            let parsedTime = parseGitHubDateToGMT7(commitDateStr);
            let rawMsg = commitData.message || "Cập nhật hệ thống";
            let msgLines = rawMsg.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length !== 0; });

            let mainTitle = msgLines[0] || "Cập nhật mã nguồn";
            let extraDetails = msgLines.slice(1);
            if (extraDetails.length === 0) {
                extraDetails.push("Ghi nhận cập nhật trực tiếp trên nhánh main.");
            }

            return {
                sha: item.sha ? item.sha.substring(0, 7) : "commit",
                commitUrl: item.html_url || "#",
                title: mainTitle,
                details: extraDetails,
                timestamp: parsedTime.timestamp,
                dateOnly: parsedTime.dateOnly,
                dateObj: parsedTime.rawDateObj
            };
        });

        currentChangelogDayIndex = 0;
        renderChangelogContentBody();
    } catch (err) {
        // Tự động fallback nạp dữ liệu nội bộ ngay lập tức, không để hiện màn hình đỏ
        loadLocalFallbackData();
    } finally {
        isFetchingChangelog = false;
    }
}

function getGroupedCommitsByDate() {
    let groups = {};
    fetchedCommitsHistory.forEach(function(item) {
        let d = item.dateOnly;
        if (!groups[d]) {
            groups[d] = [];
        }
        groups[d].push(item);
    });

    let result = [];
    Object.keys(groups).forEach(function(dateStr) {
        result.push({
            date: dateStr,
            commits: groups[dateStr]
        });
    });
    return result;
}

function changeChangelogDayPage(offset) {
    let grouped = getGroupedCommitsByDate();
    let newIndex = currentChangelogDayIndex + offset;
    if (newIndex >= 0 && newIndex < grouped.length) {
        currentChangelogDayIndex = newIndex;
        renderChangelogContentBody();
    }
}

function renderChangelogLoadingState() {
    let contentContainer = document.getElementById('thaihu-changelog-content-zone');
    if (!contentContainer) return;
    contentContainer.innerHTML = 
        '<div class="flex flex-col items-center justify-center py-10 gap-2 text-cyan-400">' +
            '<i class="fa-solid fa-spinner fa-spin text-2xl"></i>' +
            '<span class="text-xs font-mono font-bold">Đang đồng bộ nhật ký cập nhật...</span>' +
        '</div>';
}

function renderChangelogContentBody() {
    let contentContainer = document.getElementById('thaihu-changelog-content-zone');
    let paginationContainer = document.getElementById('thaihu-changelog-pagination-zone');
    let statusSourceLbl = document.getElementById('lbl-changelog-source-status');
    if (!contentContainer) return;

    if (statusSourceLbl) {
        statusSourceLbl.innerText = isUsingLocalFallback 
            ? 'Nhật ký nội bộ hệ thống • Phiên bản V2'
            : 'Đồng bộ từ GitHub: ' + GITHUB_REPO_OWNER + '/' + GITHUB_REPO_NAME + ' • Main';
    }

    let grouped = getGroupedCommitsByDate();
    if (grouped.length === 0) {
        contentContainer.innerHTML = '<div class="text-gray-500 text-center py-6 text-xs italic">Chưa ghi nhận cập nhật nào.</div>';
        return;
    }

    if (currentChangelogDayIndex >= grouped.length) {
        currentChangelogDayIndex = 0;
    }

    let activeDay = grouped[currentChangelogDayIndex];

    let logsHtml = activeDay.commits.map(function(cmt) {
        let detailsHtml = cmt.details.map(function(line) {
            return '<li class="text-gray-300 leading-relaxed font-sans">' + line + '</li>';
        }).join('');

        let timeAgoStr = formatTimeAgo(cmt.dateObj);
        let timeAgoBadge = timeAgoStr ? ('<span class="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-1.5">' + timeAgoStr + '</span>') : '';

        return (
            '<div class="mb-3 bg-gray-955/80 border border-gray-800 rounded-xl p-3 shadow-inner hover:border-cyan-500/30 transition">' +
                '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 border-b border-gray-800/80 pb-2">' +
                    '<div class="flex items-center gap-1.5 flex-wrap">' +
                        '<span class="text-cyan-400 font-bold text-xs flex items-center gap-1 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-700/50">' +
                            '<i class="fa-solid fa-code-commit text-[10px]"></i>' + cmt.sha +
                        '</span>' +
                        '<span class="text-gray-100 font-bold text-xs">' + cmt.title + '</span>' +
                    '</div>' +
                    '<div class="flex items-center self-start sm:self-auto shrink-0">' +
                        '<span class="text-[10px] text-amber-300 font-mono bg-gray-900 border border-amber-500/30 px-2 py-0.5 rounded">' +
                            '<i class="fa-regular fa-clock text-[9px] mr-1"></i>' + cmt.timestamp +
                        '</span>' +
                        timeAgoBadge +
                    '</div>' +
                '</div>' +
                '<ul class="list-disc list-inside text-[11px] space-y-1 pl-1">' +
                    detailsHtml +
                '</ul>' +
            '</div>'
        );
    }).join('');

    contentContainer.innerHTML = logsHtml;

    if (paginationContainer) {
        let hasPrev = currentChangelogDayIndex > 0;
        let hasNext = currentChangelogDayIndex < grouped.length - 1;

        paginationContainer.innerHTML = 
            '<div class="flex items-center justify-between w-full bg-gray-955 px-3 py-2 rounded-xl border border-gray-800 text-xs font-sans">' +
                '<button onclick="changeChangelogDayPage(-1)" ' + (!hasPrev ? 'disabled' : '') + ' class="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer">' +
                    '<i class="fa-solid fa-chevron-left text-[10px]"></i> Ngày Mới Hơn' +
                '</button>' +
                '<div class="flex items-center gap-1.5 text-center">' +
                    '<span class="text-gray-400 text-[11px]">Ngày:</span>' +
                    '<strong class="text-cyan-300 font-mono text-xs">' + activeDay.date + '</strong>' +
                    '<span class="text-[10px] text-gray-500 font-mono">(' + (currentChangelogDayIndex + 1) + '/' + grouped.length + ')</span>' +
                '</div>' +
                '<button onclick="changeChangelogDayPage(1)" ' + (!hasNext ? 'disabled' : '') + ' class="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-cyan-400 font-bold disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer">' +
                    'Ngày Trước <i class="fa-solid fa-chevron-right text-[10px]"></i>' +
                '</button>' +
            '</div>';
    }
}

function toggleFloatingChangelogCard(e) {
    if (e && e.stopPropagation) e.stopPropagation();

    let existingModal = document.getElementById('thaihu-changelog-modal-overlay');
    if (existingModal) {
        existingModal.remove();
        return;
    }

    let overlay = document.createElement('div');
    overlay.id = 'thaihu-changelog-modal-overlay';
    overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs select-none p-3";
    overlay.onclick = function(event) {
        if (event.target === overlay) {
            overlay.remove();
        }
    };

    overlay.innerHTML = 
        '<div class="w-full max-w-xl bg-gray-900 border-2 border-cyan-500/80 rounded-2xl shadow-[0_0_35px_rgba(6,182,212,0.25)] p-4 flex flex-col font-sans max-h-[85vh] relative" onclick="event.stopPropagation()">' +
            '<div class="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-700 shrink-0">' +
                '<div class="flex items-center gap-2 text-cyan-400 font-black text-sm tracking-wide uppercase">' +
                    '<i class="fa-solid fa-clock-rotate-left"></i>' +
                    '<span>NHẬT KÝ CẬP NHẬT HỆ THỐNG</span>' +
                '</div>' +
                '<div class="flex items-center gap-1.5">' +
                    '<button onclick="fetchLatestGitHubCommits()" class="text-gray-400 hover:text-cyan-300 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-lg border border-gray-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Làm mới nhật ký">' +
                        '<i class="fa-solid fa-rotate"></i> Làm mới' +
                    '</button>' +
                    '<button onclick="document.getElementById(\'thaihu-changelog-modal-overlay\').remove()" class="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer text-xs">' +
                        '<i class="fa-solid fa-xmark"></i>' +
                    '</button>' +
                '</div>' +
            '</div>' +

            '<div id="thaihu-changelog-pagination-zone" class="mb-2 shrink-0"></div>' +

            '<div id="thaihu-changelog-content-zone" class="overflow-y-auto pr-1 space-y-2 flex-1 custom-scrollbar text-left max-h-[55vh]"></div>' +

            '<div class="pt-2.5 mt-2 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500 font-mono shrink-0">' +
                '<span id="lbl-changelog-source-status">Đang nạp dữ liệu...</span>' +
                '<button onclick="document.getElementById(\'thaihu-changelog-modal-overlay\').remove()" class="bg-gray-800 hover:bg-gray-700 text-cyan-300 px-3.5 py-1 rounded-lg border border-gray-700 text-xs font-bold cursor-pointer transition shadow">Đóng</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    if (fetchedCommitsHistory.length === 0) {
        fetchLatestGitHubCommits();
    } else {
        renderChangelogContentBody();
    }
}

window.toggleFloatingChangelogCard = toggleFloatingChangelogCard;
window.changeChangelogDayPage = changeChangelogDayPage;
window.fetchLatestGitHubCommits = fetchLatestGitHubCommits;
