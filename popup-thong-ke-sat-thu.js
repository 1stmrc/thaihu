// Tên file: popup-thong-ke-sat-thu.js
// Chức năng: Widget Thống Kê Hiệu Suất Sát Thủ - Biểu đồ tròn tiến độ %, thời gian trung bình/tài khoản, dự toán thời gian toàn bộ dựa trên khung giờ 20h00-23h59 Thứ 2-3-4-5.
// Vị trí: Cố định bên phải bảng Sát Thủ, có nút thu nhỏ nép góc, chỉ hiện độc quyền ở Tab Sát Thủ.
// Con của file: index.html

const SAT_THU_STORAGE_KEY = 'SYSTEM_SAT_THU_ANALYTICS_V1';
let isSatThuStatsCollapsed = false;

// 1. KIỂM TRA KHUNG GIỜ NHIỆM VỤ SÁT THỦ (20h - 23h59 mỗi tối Thứ 2, 3, 4, 5)
function isSatThuEventSessionActive() {
    let now = new Date();
    let dayOfWeek = now.getDay(); // 0: CN, 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7
    let isTargetDay = (dayOfWeek >= 1 && dayOfWeek <= 4); // Thứ 2, 3, 4, 5
    let hour = now.getHours();
    let isTargetHour = (hour >= 20 && hour <= 23);
    return {
        isEventTime: isTargetDay && isTargetHour,
        dayOfWeek: dayOfWeek,
        hour: hour
    };
}

// 2. KHỞI TẠO VÀ INJECT GIAO DIỆN POPUP
function injectSatThuStatsPopupComponent() {
    let existing = document.getElementById('sat-thu-stats-floating-widget');
    if (existing) return;

    let widget = document.createElement('div');
    widget.id = 'sat-thu-stats-floating-widget';
    widget.className = "fixed top-20 right-3 z-40 select-none transition-all duration-300 hidden font-sans";

    widget.innerHTML = `
        <!-- NÚT THU NHỎ NÉP SÁT VIỀN PHẢI -->
        <div id="sat-thu-stats-toggle-btn" onclick="toggleSatThuStatsCollapse()" class="hidden bg-[#1f0b12] hover:bg-rose-900 border border-rose-500 text-rose-300 px-2 py-3 rounded-l-xl shadow-2xl cursor-pointer flex flex-col items-center gap-1.5 transition">
            <i class="fa-solid fa-chevron-left text-xs"></i>
            <span class="text-[10px] font-black uppercase [writing-mode:vertical-lr] tracking-wider text-rose-300">THỐNG KÊ SÁT THỦ</span>
        </div>

        <!-- BẢNG POPUP CHÍNH -->
        <div id="sat-thu-stats-main-card" class="w-[285px] bg-[#14080b]/95 backdrop-blur-md border-2 border-rose-600/80 rounded-2xl p-3.5 shadow-[0_0_25px_rgba(225,29,72,0.3)] text-gray-200 flex flex-col gap-2.5">
            <!-- HEADER & NÚT NÉP VÀO TRONG -->
            <div class="flex items-center justify-between border-b border-rose-900/60 pb-1.5">
                <span class="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-chart-pie text-rose-500"></i> HIỆU SUẤT SÁT THỦ
                </span>
                <button onclick="toggleSatThuStatsCollapse()" class="text-gray-400 hover:text-white bg-rose-950/60 hover:bg-rose-900 w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition cursor-pointer border border-rose-900/80" title="Thu nhỏ vào viền">
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
            </div>

            <!-- BIỂU ĐỒ TRÒN TIẾN ĐỘ TỔNG THỂ -->
            <div class="bg-[#1b0a10] border border-rose-950/80 rounded-xl p-2.5 flex items-center gap-3">
                <div class="relative w-14 h-14 flex items-center justify-center shrink-0">
                    <svg class="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                        <path class="text-gray-800" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path id="sat-thu-pie-progress-circle" class="text-rose-500 transition-all duration-500" stroke-dasharray="0, 100" stroke-linecap="round" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span id="sat-thu-pie-percent-text" class="absolute font-mono font-black text-xs text-white">0%</span>
                </div>
                <div class="flex flex-col min-w-0">
                    <span class="text-[10px] text-gray-400 font-bold uppercase">Tổng Lượt Hoàn Thành:</span>
                    <strong id="sat-thu-total-runs-fraction" class="text-sm font-black text-rose-300 font-mono mt-0.5">0 / 0</strong>
                    <span id="sat-thu-completed-accs-count" class="text-[10px] text-emerald-400 font-mono mt-0.5">Xong 3/3: 0 acc</span>
                </div>
            </div>

            <!-- CHỈ SỐ THỜI GIAN TRUNG BÌNH -->
            <div class="grid grid-cols-2 gap-1.5 font-mono">
                <div class="bg-[#1b0a10] border border-rose-950/80 p-2 rounded-xl flex flex-col">
                    <span class="text-[9px] font-sans text-gray-400 font-bold uppercase">TB 1 Tài Khoản:</span>
                    <strong id="sat-thu-avg-acc-time" class="text-xs font-black text-cyan-300 mt-1">--:--</strong>
                    <span class="text-[8px] font-sans text-gray-500 mt-0.5">Thời gian/acc xong</span>
                </div>
                <div class="bg-[#1b0a10] border border-rose-950/80 p-2 rounded-xl flex flex-col">
                    <span class="text-[9px] font-sans text-gray-400 font-bold uppercase">TB Hoàn Toàn Bộ:</span>
                    <strong id="sat-thu-avg-total-time" class="text-xs font-black text-amber-300 mt-1">--:--</strong>
                    <span class="text-[8px] font-sans text-gray-500 mt-0.5">Dự tính quy đổi</span>
                </div>
            </div>

            <!-- THÔNG TIN PHIÊN LÀM VIỆC & KHUNG GIỜ -->
            <div class="bg-[#1b0a10] border border-rose-950/80 p-2 rounded-xl flex flex-col gap-1 text-[10px]">
                <div class="flex items-center justify-between text-gray-300">
                    <span class="text-gray-400">Khung giờ nhiệm vụ:</span>
                    <span class="font-mono font-bold text-rose-300">20:00 ➔ 23:59</span>
                </div>
                <div class="flex items-center justify-between text-gray-300">
                    <span class="text-gray-400">Lịch diễn ra:</span>
                    <span class="font-bold text-amber-400">Tối Thứ 2, 3, 4, 5</span>
                </div>
                <div class="flex items-center justify-between pt-1 border-t border-rose-950/60 mt-0.5">
                    <span class="text-gray-400">Trạng thái tối nay:</span>
                    <span id="sat-thu-session-status-badge" class="font-bold text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">Đang kiểm tra...</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(widget);
    updateSatThuStatsDashboardUI();
}

// 3. THU NHỎ / MỞ RỘNG WIDGET NÉP SÁT VIỀN
function toggleSatThuStatsCollapse() {
    isSatThuStatsCollapsed = !isSatThuStatsCollapsed;
    let mainCard = document.getElementById('sat-thu-stats-main-card');
    let toggleBtn = document.getElementById('sat-thu-stats-toggle-btn');
    if (mainCard && toggleBtn) {
        if (isSatThuStatsCollapsed) {
            mainCard.classList.add('hidden');
            toggleBtn.classList.remove('hidden');
        } else {
            mainCard.classList.remove('hidden');
            toggleBtn.classList.add('hidden');
            updateSatThuStatsDashboardUI();
        }
    }
}

// 4. HIỂN THỊ HOẶC ẨN POPUP THEO TAB
function showSatThuStatsPopup() {
    let widget = document.getElementById('sat-thu-stats-floating-widget');
    if (!widget) {
        injectSatThuStatsPopupComponent();
        widget = document.getElementById('sat-thu-stats-floating-widget');
    }
    if (widget) {
        widget.classList.remove('hidden');
        updateSatThuStatsDashboardUI();
    }
}

function hideSatThuStatsPopup() {
    let widget = document.getElementById('sat-thu-stats-floating-widget');
    if (widget) {
        widget.classList.add('hidden');
    }
}

// 5. TÍNH TOÁN DỮ LIỆU VÀ CẬP NHẬT GIAO DIỆN WIDGET
function updateSatThuStatsDashboardUI() {
    if (typeof systemDatabase === 'undefined' || !systemDatabase.members) return;

    let memberList = Object.values(systemDatabase.members).filter(m => m && m.name && !m.satThuLocked);
    let totalAccs = memberList.length;
    let maxPossibleRuns = totalAccs * 3;

    let totalDoneRuns = 0;
    let completed3RunsCount = 0;
    let timestampsList = [];

    memberList.forEach(m => {
        let r = parseInt(m.satThuRuns) || 0;
        totalDoneRuns += r;
        if (r >= 3) completed3RunsCount++;
        if (m.satThuTimestamp) timestampsList.push(m.satThuTimestamp);
    });

    let percent = maxPossibleRuns > 0 ? Math.round((totalDoneRuns / maxPossibleRuns) * 100) : 0;

    // Cập nhật biểu đồ tròn
    let circleEl = document.getElementById('sat-thu-pie-progress-circle');
    let textEl = document.getElementById('sat-thu-pie-percent-text');
    let fracEl = document.getElementById('sat-thu-total-runs-fraction');
    let doneAccEl = document.getElementById('sat-thu-completed-accs-count');

    if (circleEl) circleEl.setAttribute('stroke-dasharray', `${percent}, 100`);
    if (textEl) textEl.innerText = `${percent}%`;
    if (fracEl) fracEl.innerText = `${totalDoneRuns} / ${maxPossibleRuns} Lượt`;
    if (doneAccEl) doneAccEl.innerText = `Xong 3/3: ${completed3RunsCount} / ${totalAccs} acc`;

    // TÍNH THỜI GIAN TRUNG BÌNH 1 TÀI KHOẢN VÀ HOÀN TOÀN BỘ
    let avgAccEl = document.getElementById('sat-thu-avg-acc-time');
    let avgTotalEl = document.getElementById('sat-thu-avg-total-time');

    if (timestampsList.length >= 2 && completed3RunsCount > 0) {
        timestampsList.sort((a, b) => a - b);
        let firstMs = timestampsList[0];
        let lastMs = timestampsList[timestampsList.length - 1];
        let elapsedSeconds = Math.max(60, Math.round((lastMs - firstMs) / 1000));

        // Thời gian trung bình hoàn thành 1 tài khoản (giây)
        let secPerAcc = Math.round(elapsedSeconds / completed3RunsCount);
        let mAcc = Math.floor(secPerAcc / 60);
        let sAcc = secPerAcc % 60;
        if (avgAccEl) avgAccEl.innerText = `${mAcc}p ${sAcc.toString().padStart(2, '0')}s`;

        // Dự tính thời gian hoàn thành toàn bộ 100% tài khoản
        let totalEstimatedSec = secPerAcc * totalAccs;
        let mTotal = Math.floor(totalEstimatedSec / 60);
        let sTotal = totalEstimatedSec % 60;
        if (avgTotalEl) avgTotalEl.innerText = `${mTotal}p ${sTotal.toString().padStart(2, '0')}s`;
    } else {
        if (avgAccEl) avgAccEl.innerText = "--:--";
        if (avgTotalEl) avgTotalEl.innerText = "--:--";
    }

    // KIỂM TRA TRẠNG THÁI KHUNG GIỜ NHIỆM VỤ
    let sessionInfo = isSatThuEventSessionActive();
    let statusBadge = document.getElementById('sat-thu-session-status-badge');
    if (statusBadge) {
        if (sessionInfo.isEventTime) {
            statusBadge.className = "font-bold text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/50 animate-pulse";
            statusBadge.innerText = "● Đang Trong Giờ";
        } else {
            statusBadge.className = "font-bold text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700";
            statusBadge.innerText = "Chưa Đến Giờ";
        }
    }
}

// Khởi chạy khi tải trang
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSatThuStatsPopupComponent);
} else {
    injectSatThuStatsPopupComponent();
}

window.injectSatThuStatsPopupComponent = injectSatThuStatsPopupComponent;
window.showSatThuStatsPopup = showSatThuStatsPopup;
window.hideSatThuStatsPopup = hideSatThuStatsPopup;
window.toggleSatThuStatsCollapse = toggleSatThuStatsCollapse;
window.updateSatThuStatsDashboardUI = updateSatThuStatsDashboardUI;