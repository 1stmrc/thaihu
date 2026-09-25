/* ==========================================================================
   MODULE: QUẢN LÝ NHẬT KÝ CẬP NHẬT TỰ ĐỘNG QUA GITHUB API (CHANGELOG AUTO)
   Chức năng: Tự động bắt toàn bộ lịch sử commit/sửa file từ repo GitHub 1stmrc/thaihu,
   gom nhóm theo ngày chuẩn GMT+7, tính thời gian tương đối từng giây, phân trang
   từng ngày và tự động dựng modal trực tiếp vào body.
   ========================================================================== */

const GITHUB_REPO_OWNER = "1stmrc";
const GITHUB_REPO_NAME = "thaihu";

// Bộ nhớ đệm danh sách commits lấy từ GitHub API
let fetchedCommitsHistory = [];
let currentChangelogDayIndex = 0;
let isFetchingChangelog = false;

// Hàm chuyển đổi thời gian UTC từ GitHub sang giờ chuẩn Việt Nam (GMT+7)
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
        timestamp: `\({hh}:\){mm}:\({ss}\){d}/\({m}/\){y}`,
        dateOnly: `\({d}/\){m}/${y}`,
        rawDateObj: gmt7Date
    };
}

// Hàm tính khoảng thời gian tương đối so với hiện tại (VD: 30p 20s trước)
function formatTimeAgoFromDate(targetDateObj) {
    try {
        let now = new Date();
        let diffSecs = Math.floor((now.getTime() - targetDateObj.getTime()) / 1000);

        if (diffSecs < 5) return 'vừa xong';
        if (diffSecs < 60) return diffSecs + 's trước';

        let mins = Math.floor(diffSecs / 60);
        let secs = diffSecs % 60;

        if (mins < 60) {
            return secs > 0 ? (mins + 'p ' + secs + 's trước') : (mins + 'p trước');
        }

        let hours = Math.floor(mins / 60);
        let remainMins = mins % 60;

        if (hours < 24) {
            return remainMins > 0 ? (hours + 'h ' + remainMins + 'p trước') : (hours + 'h trước');
        }

        let days = Math.floor(hours / 24);
        let remainHours = hours % 24;
        return remainHours > 0 ? (days + ' ngày ' + remainHours + 'h trước') : (days + ' ngày trước');
    } catch (e) {
        return '';
    }
}

// Hàm gửi request lên GitHub API lấy 30 commits gần nhất
async function fetchLatestGitHubCommits() {
    isFetchingChangelog = true;
    renderChangelogLoadingState();

    try {
        let apiUrl = `https://api.github.com/repos/\({GITHUB_REPO_OWNER}/\){GITHUB_REPO_NAME}/commits?per_page=35`;
        let response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`GitHub API HTTP ${response.status}`);
        }

        let rawCommits = await response.json();

        fetchedCommitsHistory = rawCommits.map(function(item) {
            let commitData = item.commit || {};
            let authorInfo = commitData.author || {};
            let commitDateStr = authorInfo.date || item.commit?.committer?.date || new Date().toISOString();
            let parsedTime = parseGitHubDateToGMT7(commitDateStr);
            let rawMsg = commitData.message || "Cập nhật hệ thống";
            let msgLines = rawMsg.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            let mainTitle = msgLines[0] || "Cập nhật mã nguồn";
            let extraDetails = msgLines.slice(1);
            if (extraDetails.length === 0) {
                extraDetails.push("Ghi nhận thay đổi trực tiếp từ nhánh main.");
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
        console.warn("Không thể tải commit từ GitHub API, chuyển sang dữ liệu dự phòng:", err);
        renderChangelogErrorState(err.message);
    } finally {
        isFetchingChangelog = false;
    }
}

// Hàm gom nhóm commit theo từng ngày
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

// Hàm chuyển trang ngày
function changeChangelogDayPage(offset) {
    let grouped = getGroupedCommitsByDate();
    let newIndex = currentChangelogDayIndex + offset;
    if (newIndex >= 0 && newIndex < grouped.length) {
        currentChangelogDayIndex = newIndex;
        renderChangelogContentBody();
    }
}

// Hiển thị trạng thái đang tải
function renderChangelogLoadingState() {
    let contentContainer = document.getElementById('thaihu-changelog-content-zone');
    if (!contentContainer) return;
    contentContainer.innerHTML = 
        '<div class="flex flex-col items-center justify-center py-10 gap-2 text-cyan-400">' +
            '<i class="fa-solid fa-spinner fa-spin text-2xl"></i>' +
            '<span class="text-xs font-mono font-bold">Đang đồng bộ commit từ GitHub repository...</span>' +
        '</div>';
}

// Hiển thị trạng thái lỗi
function renderChangelogErrorState(errorMsg) {
    let contentContainer = document.getElementById('thaihu-changelog-content-zone');
    if (!contentContainer) return;
    contentContainer.innerHTML = 
        '<div class="bg-rose-955/40 border border-rose-500/50 rounded-xl p-4 text-center space-y-2">' +
            '<div class="text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5">' +
                '<i class="fa-solid fa-circle-exclamation"></i> Không thể kết nối với GitHub API' +
            '</div>' +
            '<p class="text-[11px] text-gray-400 font-mono">' + errorMsg + '</p>' +
            '<button onclick="fetchLatestGitHubCommits()" class="bg-gray-800 hover:bg-gray-700 text-cyan-300 px-3 py-1 rounded text-xs font-bold border border-gray-700 transition cursor-pointer">' +
                '<i class="fa-solid fa-rotate mr-1"></i> Thử lại' +
            '</button>' +
        '</div>';
}

// Render dữ liệu commit ra danh sách
function renderChangelogContentBody() {
    let contentContainer = document.getElementById('thaihu-changelog-content-zone');
    let paginationContainer = document.getElementById('thaihu-changelog-pagination-zone');
    if (!contentContainer) return;

    let grouped = getGroupedCommitsByDate();
    if (grouped.length === 0) {
        contentContainer.innerHTML = '<div class="text-gray-500 text-center py-6 text-xs italic">Chưa ghi nhận commit nào.</div>';
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

        let timeAgoStr = formatTimeAgoFromDate(cmt.dateObj);
        let timeAgoBadge = timeAgoStr ? ('<span class="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-1.5">' + timeAgoStr + '</span>') : '';

        return (
            '<div class="mb-3 bg-gray-955/80 border border-gray-800 rounded-xl p-3 shadow-inner hover:border-cyan-500/30 transition">' +
                '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 border-b border-gray-800/80 pb-2">' +
                    '<div class="flex items-center gap-1.5 flex-wrap">' +
                        '<a href="' + cmt.commitUrl + '" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 font-bold text-xs flex items-center gap-1 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-700/50" title="Xem commit trên GitHub">' +
                            '<i class="fa-solid fa-code-commit text-[10px]"></i>' + cmt.sha +
                        '</a>' +
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

    // Thanh điều hướng phân trang ngày
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

// Bật/Tắt hiển thị Modal Nhật Ký
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
                    '<span>NHẬT KÝ CẬP NHẬT TỰ ĐỘNG (GITHUB COMMITS)</span>' +
                '</div>' +
                '<div class="flex items-center gap-1.5">' +
                    '<button onclick="fetchLatestGitHubCommits()" class="text-gray-400 hover:text-cyan-300 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-lg border border-gray-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer" title="Tải lại commit mới nhất">' +
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
                '<span>Đồng bộ từ GitHub: 1stmrc/thaihu • Nhánh main</span>' +
                '<button onclick="document.getElementById(\'thaihu-changelog-modal-overlay\').remove()" class="bg-gray-800 hover:bg-gray-700 text-cyan-300 px-3.5 py-1 rounded-lg border border-gray-700 text-xs font-bold cursor-pointer transition shadow">Đóng</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(overlay);

    // Nếu chưa có dữ liệu trong RAM thì tải ngay từ GitHub API, ngược lại hiển thị luôn
    if (fetchedCommitsHistory.length === 0) {
        fetchLatestGitHubCommits();
    } else {
        renderChangelogContentBody();
    }
}

// Xuất các hàm ra phạm vi toàn cục window
window.toggleFloatingChangelogCard = toggleFloatingChangelogCard;
window.changeChangelogDayPage = changeChangelogDayPage;
window.fetchLatestGitHubCommits = fetchLatestGitHubCommits;
