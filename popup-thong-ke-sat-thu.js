// Tên file: popup-thong-ke-sat-thu.js
// Chức năng: Widget Thống Kê Sát Thủ - Tông màu xanh Light điện tử, dữ liệu dàn dọc chữ to, kích thước bám chuẩn cột Copy -> mép phải, có số acc chưa xong.
// Con của file: index.html

const SAT_THU_STORAGE_KEY = 'SYSTEM_SAT_THU_ANALYTICS_V1';
let isSatThuStatsCollapsed = false;

function isSatThuEventSessionActive() {
    let now = new Date();
    let dayOfWeek = now.getDay(); // 0: CN, 1: T2, 2: T3, 3: T4, 4: T5, 5: T6, 6: T7
    let isTargetDay = (dayOfWeek >= 1 && dayOfWeek <= 4);
    let hour = now.getHours();
    let isTargetHour = (hour >= 20 && hour <= 23);
    return {
        isEventTime: isTargetDay && isTargetHour,
        dayOfWeek: dayOfWeek,
        hour: hour
    };
}

// TỰ ĐỘNG ĐO VỊ TRÍ & ĐỘ RỘNG CỘT COPY -> MÉP PHẢI ĐỂ POPUP BÁM CHUẨN XÁC 100%
function updatePopupPositionAndWidth() {
    let card = document.getElementById('sat-thu-stats-main-card');
    if (!card || isSatThuStatsCollapsed) return;

    let table = document.querySelector('#sat-thu-members-table-body') || document.querySelector('table');
    let copyTh = document.querySelector('th:nth-child(5)') || document.querySelector('th:nth-last-child(2)');

    if (copyTh) {
        let rect = copyTh.getBoundingClientRect();
        let targetWidth = window.innerWidth - rect.left - 12; // Chiều rộng từ mép cột copy đến sát mép phải
        if (targetWidth > 180 && targetWidth < 400) {
            card.style.width = targetWidth + 'px';
        }
    }
}

function injectSatThuStatsPopupComponent() {
    let existing = document.getElementById('sat-thu-stats-floating-widget');
    if (existing) return;

    let widget = document.createElement('div');
    widget.id = 'sat-thu-stats-floating-widget';
    widget.className = "fixed right-2.5 top-[18%] z-40 select-none transition-all duration-200 hidden font-sans";

    widget.innerHTML = `
        <!-- NÚT MŨI TÊN NHỎ GỌN Ở GIỮA MÉP PHẢI KHI THU NHỎ -->
        <button id="sat-thu-stats-toggle-btn" onclick="toggleSatThuStatsCollapse()" class="hidden fixed right-0 top-1/2 -translate-y-1/2 bg-[#05131a] hover:bg-cyan-950 border-l border-y border-cyan-400 text-cyan-300 w-6 h-12 rounded-l-lg shadow-[0_0_15px_rgba(6,182,212,0.5)] cursor-pointer flex items-center justify-center transition z-50 group" title="Mở thống kê sát thủ">
            <i class="fa-solid fa-chevron-left text-xs group-hover:-translate-x-0.5 transition-transform"></i>
        </button>

        <!-- BẢNG POPUP XANH LIGHT ĐIỆN TỬ - DÀN DỮ LIỆU DỌC CHỮ TO -->
        <div id="sat-thu-stats-main-card" class="w-[230px] bg-[#030d14]/95 backdrop-blur-md border-2 border-cyan-400 rounded-2xl p-3 shadow-[0_0_25px_rgba(6,182,212,0.4)] text-gray-200 flex flex-col gap-2.5">
            <!-- HEADER -->
            <div class="flex items-center justify-between border-b border-cyan-900/60 pb-1.5">
                <span class="text-xs font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                    <i class="fa-solid fa-chart-pie text-cyan-400"></i> HIỆU SUẤT SÁT THỦ
                </span>
                <button onclick="toggleSatThuStatsCollapse()" class="text-cyan-400 hover:text-white bg-cyan-950/60 hover:bg-cyan-900 w-5 h-5 rounded flex items-center justify-center font-bold text-xs transition cursor-pointer border border-cyan-800 shrink-0" title="Thu nhỏ vào mép">
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
            </div>

            <!-- KHỐI 1: BIỂU ĐỒ TRÒN & TIẾN ĐỘ DỌC -->
            <div class="bg-[#061824] border border-cyan-800/80 rounded-xl p-2.5 flex flex-col items-center gap-2 shadow-inner">
                <div class="relative w-16 h-16 flex items-center justify-center shrink-0">
                    <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path class="text-gray-900" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path id="sat-thu-pie-progress-circle" class="text-cyan-400 transition-all duration-500 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" stroke-dasharray="0, 100" stroke-linecap="round" stroke-width="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <span id="sat-thu-pie-percent-text" class="absolute font-mono font-black text-sm text-cyan-200">0%</span>
                </div>
                
                <!-- THÔNG SỐ ÉP DỌC CHỮ TO -->
                <div class="w-full flex flex-col gap-1 border-t border-cyan-900/50 pt-2 font-mono">
                    <div class="flex justify-between items-center text-xs">
                        <span class="font-sans text-[11px] text-gray-400 font-bold">Tổng lượt:</span>
                        <strong id="sat-thu-total-runs-fraction" class="text-sm font-black text-cyan-300">0 / 0</strong>
                    </div>
                    <div class="flex justify-between items-center text-xs">
                        <span class="font-sans text-[11px] text-gray-400 font-bold">Đã xong 3/3:</span>
                        <strong id="sat-thu-completed-accs-count" class="text-xs font-black text-emerald-400">0 acc</strong>
                    </div>
                    <div class="flex justify-between items-center text-xs bg-rose-955/40 px-1.5 py-1 rounded border border-rose-900/50">
                        <span class="font-sans text-[11px] text-rose-300 font-black">Chưa xong:</span>
                        <strong id="sat-thu-remaining-accs-count" class="text-sm font-black text-rose-400">0 acc</strong>
                    </div>
                </div>
            </div>

            <!-- KHỐI 2: THỜI GIAN TRUNG BÌNH (DÀN DỌC CHỮ RÕ NÉT) -->
            <div class="bg-[#061824] border border-cyan-800/80 p-2 rounded-xl flex flex-col gap-1.5 font-mono shadow-inner">
                <div class="flex justify-between items-center border-b border-cyan-900/50 pb-1">
                    <span class="font-sans text-[10px] text-gray-400 font-bold uppercase">TB 1 Tài khoản:</span>
                    <strong id="sat-thu-avg-acc-time" class="text-xs font-black text-cyan-300">--:--</strong>
                </div>
                <div class="flex justify-between items-center">
                    <span class="font-sans text-[10px] text-gray-400 font-bold uppercase">TB Toàn bộ:</span>
                    <strong id="sat-thu-avg-total-time" class="text-xs font-black text-amber-300">--:--</strong>
                </div>
            </div>

            <!-- KHỐI 3: KHUNG GIỜ NHIỆM VỤ -->
            <div class="bg-[#061824] border border-cyan-800/80 p-2 rounded-xl flex flex-col gap-1 text-[10px]">
                <div class="flex items-center justify-between text-gray-300">
                    <span class="text-gray-400 font-bold">Giờ nhiệm vụ:</span>
                    <span class="font-mono font-black text-cyan-300">20:00 ➔ 23:59</span>
                </div>
                <div class="flex items-center justify-between text-gray-300">
                    <span class="text-gray-400 font-bold">Ngày diễn ra:</span>
                    <span class="font-bold text-amber-300">Tối T2, T3, T4, T5</span>
                </div>
                <div class="flex items-center justify-between pt-1 border-t border-cyan-900/50 mt-0.5">
                    <span class="text-gray-400 font-bold">Trạng thái:</span>
                    <span id="sat-thu-session-status-badge" class="font-bold text-[9px] px-1.5 py-0.2 rounded bg-gray-900 text-gray-400">Đang kiểm tra...</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(widget);
    window.addEventListener('resize', updatePopupPositionAndWidth);
    updateSatThuStatsDashboardUI();
}

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
            updatePopupPositionAndWidth();
            updateSatThuStatsDashboardUI();
        }
    }
}

function showSatThuStatsPopup() {
    let widget = document.getElementById('sat-thu-stats-floating-widget');
    if (!widget) {
        injectSatThuStatsPopupComponent();
        widget = document.getElementById('sat-thu-stats-floating-widget');
    }
    if (widget) {
        widget.classList.remove('hidden');
        let toggleBtn = document.getElementById('sat-thu-stats-toggle-btn');
        let mainCard = document.getElementById('sat-thu-stats-main-card');
        if (isSatThuStatsCollapsed) {
            if (toggleBtn) toggleBtn.classList.remove('hidden');
            if (mainCard) mainCard.classList.add('hidden');
        } else {
            if (toggleBtn) toggleBtn.classList.add('hidden');
            if (mainCard) mainCard.classList.remove('hidden');
        }
        updatePopupPositionAndWidth();
        updateSatThuStatsDashboardUI();
    }
}

function hideSatThuStatsPopup() {
    let widget = document.getElementById('sat-thu-stats-floating-widget');
    if (widget) widget.classList.add('hidden');
    let toggleBtn = document.getElementById('sat-thu-stats-toggle-btn');
    if (toggleBtn) toggleBtn.classList.add('hidden');
}

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

    let remainingAccs = Math.max(0, totalAccs - completed3RunsCount);
    let percent = maxPossibleRuns > 0 ? Math.round((totalDoneRuns / maxPossibleRuns) * 100) : 0;

    // Cập nhật biểu đồ & số liệu dọc
    let circleEl = document.getElementById('sat-thu-pie-progress-circle');
    let textEl = document.getElementById('sat-thu-pie-percent-text');
    let fracEl = document.getElementById('sat-thu-total-runs-fraction');
    let doneAccEl = document.getElementById('sat-thu-completed-accs-count');
    let remainAccEl = document.getElementById('sat-thu-remaining-accs-count');

    if (circleEl) circleEl.setAttribute('stroke-dasharray', `${percent}, 100`);
    if (textEl) textEl.innerText = `${percent}%`;
    if (fracEl) fracEl.innerText = `${totalDoneRuns} / ${maxPossibleRuns}`;
    if (doneAccEl) doneAccEl.innerText = `${completed3RunsCount} / ${totalAccs} acc`;
    if (remainAccEl) remainAccEl.innerText = `${remainingAccs} acc`;

    // Thời gian trung bình
    let avgAccEl = document.getElementById('sat-thu-avg-acc-time');
    let avgTotalEl = document.getElementById('sat-thu-avg-total-time');

    if (timestampsList.length >= 2 && completed3RunsCount > 0) {
        timestampsList.sort((a, b) => a - b);
        let firstMs = timestampsList[0];
        let lastMs = timestampsList[timestampsList.length - 1];
        let elapsedSeconds = Math.max(60, Math.round((lastMs - firstMs) / 1000));

        let secPerAcc = Math.round(elapsedSeconds / completed3RunsCount);
        let mAcc = Math.floor(secPerAcc / 60);
        let sAcc = secPerAcc % 60;
        if (avgAccEl) avgAccEl.innerText = `${mAcc}p ${sAcc.toString().padStart(2, '0')}s`;

        let totalEstimatedSec = secPerAcc * totalAccs;
        let mTotal = Math.floor(totalEstimatedSec / 60);
        let sTotal = totalEstimatedSec % 60;
        if (avgTotalEl) avgTotalEl.innerText = `${mTotal}p ${sTotal.toString().padStart(2, '0')}s`;
    } else {
        if (avgAccEl) avgAccEl.innerText = "--:--";
        if (avgTotalEl) avgTotalEl.innerText = "--:--";
    }

    // Trạng thái giờ nhiệm vụ
    let sessionInfo = isSatThuEventSessionActive();
    let statusBadge = document.getElementById('sat-thu-session-status-badge');
    if (statusBadge) {
        if (sessionInfo.isEventTime) {
            statusBadge.className = "font-bold text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-400 animate-pulse";
            statusBadge.innerText = "● Đang Trong Giờ";
        } else {
            statusBadge.className = "font-bold text-[9px] px-1.5 py-0.2 rounded bg-gray-900 text-gray-400 border border-gray-700";
            statusBadge.innerText = "Chưa Đến Giờ";
        }
    }

    updatePopupPositionAndWidth();
}

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
