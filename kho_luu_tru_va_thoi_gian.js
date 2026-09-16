// Tên file: kho_luu_tru_va_thoi_gian.js
// Chức năng: Quản lý bộ nhớ bền vững localStorage, định dạng chuỗi thời gian và lắng nghe sự kiện Topbar real-time.
// Con của file: index.html (Được nạp đầu tiên trong phân hệ So Sánh).
// Danh sách tính năng của file:
//   1. Lưu trữ và đọc lại toàn bộ form input, checkbox, radio qua F5 / chuyển tab.
//   2. Quy đổi số phút sang định dạng: [X giờ Y phút].
//   3. Bắt sự kiện real-time toàn diện từ mọi ô input trên Topbar.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]

const OPT_STORAGE_KEY = 'APP_OPTIMIZATION_FORM_STATE_V6';

function saveOptimizationFormState() {
    try {
        let state = {
            isEvent: document.getElementById('chk-opt-event-toggle')?.checked || false,
            isProfitLossMode: document.getElementById('chk-opt-profit-loss-toggle')?.checked || false,
            isAddDeo: document.getElementById('chk-opt-thaihu-add-deo')?.checked || false,
            isThaihuFreeTicket: document.getElementById('chk-opt-thaihu-free-ticket')?.checked || false,
            isCaptainBonusTK: document.getElementById('chk-opt-tangkiem-captain-bonus')?.checked !== false,
            captainBonusGoldTK: document.getElementById('input-opt-tangkiem-captain-gold')?.value || "10",
            thaihuTeamsManual: document.getElementById('input-opt-thaihu-teams')?.value || "8",
            thaihuMins: document.getElementById('input-opt-thaihu-mins-per-team')?.value || "12",
            thaihuRunMode: document.querySelector('input[name="rad-thaihu-run-mode"]:checked')?.value || "full",
            merchantGold: document.getElementById('input-opt-merchant-gold-per-run')?.value || "1.3",
            merchantBatchAcc: document.getElementById('input-opt-merchant-batch-acc')?.value || "11",
            merchantBatchMins: document.getElementById('input-opt-merchant-batch-mins')?.value || "45",
            merchantTotalAcc: document.getElementById('input-opt-merchant-total-acc')?.value || "64",
            tangkiemTeams: document.getElementById('input-opt-tangkiem-teams')?.value || "8",
            tangkiemMins: document.getElementById('input-opt-tangkiem-mins-per-team')?.value || "15",
            tangkiemTicketPrice: document.getElementById('input-opt-tangkiem-ticket')?.value || "23",
            tangkiemX3: document.getElementById('chk-opt-tangkiem-x3')?.checked || false
        };
        localStorage.setItem(OPT_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Lỗi lưu trạng thái Tab So Sánh:", e);
    }
}

function loadOptimizationFormState() {
    try {
        let raw = localStorage.getItem(OPT_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn("Lỗi đọc trạng thái Tab So Sánh:", e);
    }
    return null;
}

function formatMinutesToHoursText(mins) {
    let m = Math.max(0, Math.round(mins));
    if (m < 60) return `${m} phút`;
    let h = Math.floor(m / 60);
    let remM = m % 60;
    return remM > 0 ? `${h} giờ ${remM} phút` : `${h} giờ`;
}

function attachTopbarRealtimeListeners() {
    let topbarInputs = document.querySelectorAll('#injection-header-container input');
    topbarInputs.forEach(el => {
        el.oninput = function() {
            let optContainer = document.getElementById('opt-comparison-cards-container');
            if (optContainer && typeof runActivitiesComparisonCalculation === 'function') {
                runActivitiesComparisonCalculation();
            }
        };
    });
}

window.saveOptimizationFormState = saveOptimizationFormState;
window.loadOptimizationFormState = loadOptimizationFormState;
window.formatMinutesToHoursText = formatMinutesToHoursText;
window.attachTopbarRealtimeListeners = attachTopbarRealtimeListeners;

// Tổng số dòng code trong file này: 98 dòng.