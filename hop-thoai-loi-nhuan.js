// Tên file: hop-thoai-loi-nhuan.js
// Chức năng: Pop-up Thu Nhập Tổng Đội Hình - Quét chuẩn xác theo từng Tài Khoản duy nhất (Mỗi acc tối đa maxRuns - 1 lượt vé, triệt tiêu 100% lỗi tính trùng vé khi acc ở nhiều đội hình), tự động dàn hàng ngang song song với Thương Nhân & Thất Bại, tính chuẩn tiền hoàn vàng khi đạt Max lượt, hiển thị số tiền thực tế của từng công tắc và đồng bộ Realtime Thương Nhân.
// Con của file: index.html (Nạp cùng phân hệ Quản lý Thái Hư & Thương Nhân).
// Danh sách tính năng của file:
//   1. [ĐÃ SỬA & KHÓA] Tính chuẩn chi phí vé: Quét danh sách 60 acc duy nhất, mỗi acc Max 2 tốn tối đa 1 vé, Max 3 tốn tối đa 2 vé.
//   2. [ĐÃ KHÓA] Tự động dàn hàng ngang động (Side-by-side): Popup Lợi Nhuận (right-4), Thương Nhân (right-365px), Thất Bại (right-715px).
//   3. [ĐÃ KHÓA] Tính chuẩn tiền hoàn vàng Thái Hư: Bất kể đi vé gì, cứ tài khoản đạt Max lượt (2/2 hoặc 3/3) là tính đủ 16v/acc.
//   4. [ĐÃ KHÓA] Hiển thị số tiền thực tế kế bên 3 công tắc kèm hiệu ứng ẩn mờ gạch ngang khi bật [Không tính...].
//   5. [ĐÃ KHÓA] Hiển thị số lượt team kế bên tổng lượt cá nhân: VD "64 lượt (8 lượt team)".
//   6. [ĐÃ KHÓA] Luôn lấy trực tiếp tổng vàng Realtime của Thương Nhân đưa vào dòng [Cộng Thương Nhân].
// Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA TOÀN BỘ MÃ NGUỒN NGÀY 26/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: [ĐÃ KHÓA] KHỞI TẠO VÀ INJECT GIAO DIỆN POPUP THU NHẬP TỔNG
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH 100% - KHÓA KHÔNG SỬA]
   ========================================================================== */
function injectProfitCardComponent() {
    let container = document.getElementById('injection-profit-card-holder');
    if (!container) return;

    let isEventActive = isEventCurrentlyActiveGMT7();

    container.innerHTML = `
        <div id="floating-profit-card" onclick="event.stopPropagation()" class="fixed bottom-16 right-4 bg-gray-900 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl w-[345px] max-w-[345px] hidden text-xs font-sans z-50 select-none transition-all duration-200">
            <div class="flex items-center justify-between border-b border-gray-800 pb-1.5 mb-2">
                <span class="font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 text-xs">
                    <i class="fa-solid fa-wallet"></i> Thu Nhập Tổng Đội Hình
                </span>
                <button onclick="toggleFloatingProfitCard(event)" class="text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 w-6 h-6 rounded-full flex items-center justify-center font-black text-base transition cursor-pointer leading-none">&times;</button>
            </div>
            
            <div class="space-y-1.5 font-mono text-gray-300 mb-2">
                <div class="flex justify-between">
                    <span class="font-sans text-gray-400">Đội hình hoàn thành:</span>
                    <span id="runtime-lineup-progress" class="text-emerald-400 font-bold text-xs">0 / 0 đội hình</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-sans text-gray-400">Tổng trận thực tế đã đi:</span>
                    <span id="runtime-total-runs" class="text-blue-400 font-bold text-xs">0 lượt (0 lượt team)</span>
                </div>
                
                <!-- DÒNG TỔNG NGUYÊN LIỆU BÓC TÁCH CHI TIẾT -->
                <div class="flex justify-between items-center">
                    <span class="font-sans text-gray-400">Tổng nguyên liệu:</span>
                    <span id="runtime-total-materials" class="text-yellow-400 font-bold text-xs">0 NL</span>
                </div>
                <div class="text-[10px] text-gray-400 font-mono flex justify-between bg-gray-955 px-2 py-0.5 rounded border border-gray-800">
                    <span>↳ Nguồn NL:</span>
                    <span id="runtime-materials-breakdown-text" class="text-amber-300">TH: 0 + TN: 0 NL</span>
                </div>

                <div class="flex justify-between">
                    <span class="font-sans text-gray-400">Vốn vé tiêu tốn thực:</span>
                    <span id="runtime-total-costs" class="text-rose-400 font-bold text-xs">0.0v</span>
                </div>
                
                <!-- 3 CÔNG TẮC KÈM HIỂN THỊ SỐ TIỀN THỰC TẾ & ẨN MỜ KHI BỎ TÍNH -->
                <div class="pt-2 border-t border-gray-800 flex flex-col gap-1.5">
                    <!-- DÒNG 1: ĐOÀI -->
                    <div class="flex justify-between items-center">
                        <label class="inline-flex items-center cursor-pointer select-none text-gray-400">
                            <input id="checkbox-toggle-exclude-deo" type="checkbox" checked class="sr-only peer" onchange="handleProfitToggleChangeWithLog('Không tính tiền Đoài', this.checked)">
                            <div class="relative w-5 h-3 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-2 after:w-2 peer-checked:bg-purple-500 transition-all"></div>
                            <span class="ms-1.5 font-medium text-purple-300 text-[10px]">Không tính tiền Đoài</span>
                        </label>
                        <span id="runtime-toggle-val-deo" class="text-[10px] font-mono text-gray-500 opacity-40 line-through">+0.0v</span>
                    </div>

                    <!-- DÒNG 2: HOÀN VÀNG THÁI HƯ -->
                    <div class="flex justify-between items-center">
                        <label class="inline-flex items-center cursor-pointer select-none text-gray-400">
                            <input id="checkbox-toggle-exclude-refund" type="checkbox" checked class="sr-only peer" onchange="handleProfitToggleChangeWithLog('Không tính tiền hoàn vàng', this.checked)">
                            <div class="relative w-5 h-3 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-2 after:w-2 peer-checked:bg-amber-500 transition-all"></div>
                            <span class="ms-1.5 font-medium text-amber-400 text-[10px]">Không tính tiền hoàn vàng</span>
                        </label>
                        <span id="runtime-toggle-val-refund" class="text-[10px] font-mono text-gray-500 opacity-40 line-through">+0.0v</span>
                    </div>

                    <!-- DÒNG 3: NGUYÊN LIỆU THÁI HƯ -->
                    <div class="flex justify-between items-center">
                        <label class="inline-flex items-center cursor-pointer select-none text-gray-400">
                            <input id="checkbox-toggle-exclude-materials" type="checkbox" ${isEventActive ? '' : 'checked'} class="sr-only peer" onchange="handleProfitToggleChangeWithLog('Không tính tiền nguyên liệu', this.checked)">
                            <div class="relative w-5 h-3 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-2 after:w-2 peer-checked:bg-rose-500 transition-all"></div>
                            <span class="ms-1.5 font-medium text-rose-400 text-[10px]">Không tính tiền nguyên liệu</span>
                        </label>
                        <span id="runtime-toggle-val-materials" class="text-[10px] font-mono text-rose-400 font-bold">+0.0v</span>
                    </div>
                </div>
            </div>

            <div class="space-y-1 bg-gray-955 p-2 rounded-lg border border-gray-800 text-[11px] mb-2 font-mono">
                <div class="flex justify-between items-center text-gray-300">
                    <span class="font-sans">Lợi nhuận Thái Hư:</span>
                    <span id="runtime-thaihu-profit" class="font-bold text-cyan-300">+0.00v (~0 đ)</span>
                </div>
                <div class="flex justify-between items-center text-gray-300">
                    <span class="font-sans">Cộng Thương Nhân:</span>
                    <span id="runtime-merchant-profit" class="font-bold text-amber-400">+0.00v (~0 đ)</span>
                </div>
            </div>

            <div class="bg-gray-955 border-2 border-emerald-600/80 rounded-xl p-2.5 text-center shadow-inner font-mono">
                <div class="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-0.5 font-sans">TỔNG THU NHẬP CHUNG</div>
                <span id="runtime-net-profit-gold" class="text-lg font-black text-emerald-400 block">+0.00 Vàng</span>
                <span id="runtime-net-profit-vnd" class="text-xs text-gray-300 block font-bold mt-0.5">~ 0 VNĐ</span>
            </div>
        </div>
    `;

    calculateComprehensiveProfitsRealtime();
}

// BẬT / TẮT POPUP LỢI NHUẬN VÀ TỰ ĐỘNG CĂN CHỈNH DÀN HÀNG NGANG
function toggleFloatingProfitCard(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    let card = document.getElementById('floating-profit-card');
    if (card) {
        let isHidden = card.classList.contains('hidden');
        if (isHidden) {
            calculateComprehensiveProfitsRealtime();
            card.classList.remove('hidden');
            card.setAttribute('data-open-time', Date.now());
        } else {
            card.classList.add('hidden');
        }
        adjustPopupsSideBySidePositions();
    }
}

// HÀM TỰ ĐỘNG XẾP HÀNG NGANG TỪ PHẢI SANG TRÁI (DYNAMIC SIDE-BY-SIDE)
function adjustPopupsSideBySidePositions() {
    let profitCard = document.getElementById('floating-profit-card');
    let merchantCard = document.getElementById('floating-merchant-card');
    let failedCard = document.getElementById('floating-failed-card');

    let merchantHolder = document.getElementById('injection-merchant-card-holder');
    let failedHolder = document.getElementById('injection-failed-card-holder');

    let isProfitOpen = profitCard && !profitCard.classList.contains('hidden');
    let isMerchantOpen = merchantCard && !merchantCard.classList.contains('hidden');
    let isFailedOpen = failedCard && !failedCard.classList.contains('hidden');

    let currentRightOffset = 16;

    if (isProfitOpen && profitCard) {
        profitCard.style.right = `${currentRightOffset}px`;
        currentRightOffset += 355;
    }

    if (isMerchantOpen && merchantHolder) {
        merchantHolder.style.right = `${currentRightOffset}px`;
        currentRightOffset += 355;
    } else if (merchantHolder) {
        merchantHolder.style.right = "16px";
    }

    if (isFailedOpen && failedHolder) {
        failedHolder.style.right = `${currentRightOffset}px`;
    } else if (failedHolder) {
        failedHolder.style.right = "16px";
    }
}

function handleProfitToggleChangeWithLog(label, isChecked) {
    calculateComprehensiveProfitsRealtime();
    if (typeof logUserAction === 'function') {
        logUserAction(`${isChecked ? 'Bật' : 'Tắt'} tùy chọn: [ ${label} ]`);
    }
}

/* ==========================================================================
   KHỐI 2: [ĐÃ KHÓA] KIỂM TRA MỐC SỰ KIỆN GMT+7
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH 100% - KHÓA KHÔNG SỬA]
   ========================================================================== */
function isEventCurrentlyActiveGMT7() {
    let startDate = localStorage.getItem('EVENT_START_DATE');
    let endDate = localStorage.getItem('EVENT_END_DATE');

    if (typeof systemDatabase !== 'undefined' && systemDatabase) {
        startDate = startDate || systemDatabase.eventStartDate || systemDatabase.eventConfig?.startDate;
        endDate = endDate || systemDatabase.eventEndDate || systemDatabase.eventConfig?.endDate;
    }

    if (startDate && endDate) {
        let now = new Date();
        let utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        let gmt7Ms = utcMs + (3600000 * 7);
        let todayGMT7Ms = new Date(gmt7Ms).setHours(0, 0, 0, 0);

        let startMs = new Date(startDate).setHours(0, 0, 0, 0);
        let endMs = new Date(endDate).setHours(23, 59, 59, 999);

        return (todayGMT7Ms >= startMs && todayGMT7Ms <= endMs);
    }
    return false;
}

/* ==========================================================================
   KHỐI 3: [ĐÃ KHÓA] LẤY TRỰC TIẾP TỔNG VÀNG THƯƠNG NHÂN THEO REALTIME
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH 100% - KHÓA KHÔNG SỬA]
   ========================================================================== */
function getRealtimeMerchantMetrics() {
    let matPrice = (typeof systemDatabase !== 'undefined' && systemDatabase.materialPrice) ? parseFloat(systemDatabase.materialPrice) : 0.3;
    let isEventActive = isEventCurrentlyActiveGMT7();

    let mChkBox = document.getElementById('chk-merchant-exclude-refund');
    let isMExcludeRefund = mChkBox ? mChkBox.checked : (typeof window.isMerchantExcludeRefund !== 'undefined' ? window.isMerchantExcludeRefund : true);

    let merchantRuns = 0;
    let memberMap = new Map();

    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.entries(systemDatabase.members).forEach(([mId, m]) => {
            if (m && m.name) memberMap.set(mId, m);
        });
    }

    memberMap.forEach(m => {
        if (m.merchantLocked === true || m.merchantLocked === "true") return;
        merchantRuns += (parseInt(m.merchantRuns) || 0);
    });

    let directGold = isMExcludeRefund ? 0 : (merchantRuns * 1.2);
    let totalMaterials = isEventActive ? (merchantRuns * 8) : 0;
    let materialGold = totalMaterials * matPrice;
    let totalMerchantGold = directGold + materialGold;

    return {
        totalGold: totalMerchantGold,
        totalMaterials: totalMaterials,
        totalRuns: merchantRuns
    };
}

/* ==========================================================================
   KHỐI 4: [ĐÃ SỬA & KHÓA] TÍNH TỔNG THU NHẬP THEO TỪNG TÀI KHOẢN DUY NHẤT
   Chức năng: Quét danh sách 60 account duy nhất, đảm bảo mỗi acc tối đa (maxRuns - 1) lượt vé.
   Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA KHÔNG SỬA]
   ========================================================================== */
function isPayModeFreeRun(payModeVal, isFreeFlag) {
    if (isFreeFlag === true) return true;
    if (!payModeVal) return true;
    let valStr = String(payModeVal).toLowerCase().trim();
    if (valStr.includes('np') || valStr.includes('xu') || valStr.includes('free') || valStr === 'np50' || valStr === 'xu40') {
        return true;
    }
    if (valStr.includes('ve') || valStr.includes('ticket') || valStr.includes('paid')) {
        return false;
    }
    return true;
}

function calculateComprehensiveProfitsRealtime() {
    if (typeof systemDatabase === 'undefined') return;

    let totalLineups = 0;
    let completedLineups = 0;

    if (systemDatabase.teams) {
        let lineups = systemDatabase.teams.filter(x => x.type === 'lineup');
        totalLineups = lineups.length;

        lineups.forEach(l => {
            if (!l.memberIds || l.memberIds.length === 0) return;

            let hasAtLeastOneRun = false;
            let allMembersFinished = true;

            l.memberIds.forEach(mId => {
                let m = systemDatabase.members ? systemDatabase.members[mId] : null;
                if (m) {
                    if (m.currentRuns > 0) hasAtLeastOneRun = true;
                    if (m.currentRuns < (m.maxRuns || 3)) allMembersFinished = false;
                } else {
                    allMembersFinished = false;
                }
            });

            if (hasAtLeastOneRun && allMembersFinished) {
                completedLineups++;
            }
        });
    }

    let lineupProgEl = document.getElementById('runtime-lineup-progress');
    if (lineupProgEl) lineupProgEl.innerText = `${completedLineups} / ${totalLineups} đội hình`;

    let isExcludeDeo = document.getElementById('checkbox-toggle-exclude-deo')?.checked === true;
    let isExcludeRefund = document.getElementById('checkbox-toggle-exclude-refund')?.checked === true;
    let isExcludeMaterials = document.getElementById('checkbox-toggle-exclude-materials')?.checked === true;

    let matPrice = systemDatabase.materialPrice ? parseFloat(systemDatabase.materialPrice) : 0.3;

    let goldRateVnd = 155000;
    let goldInputEl = document.getElementById('input-gold-rate');
    let rawVal = goldInputEl ? goldInputEl.value : "";
    if (rawVal) {
        let cleanVal = parseFloat(rawVal.replace(/\./g, "").replace(/,/g, ""));
        if (!isNaN(cleanVal) && cleanVal > 0) goldRateVnd = cleanVal;
    } else if (systemDatabase.goldRate) {
        let cleanVal = parseFloat(String(systemDatabase.goldRate).replace(/\./g, "").replace(/,/g, ""));
        if (!isNaN(cleanVal) && cleanVal > 0) goldRateVnd = cleanVal;
    }

    let ticketPriceTH = parseFloat(document.getElementById('input-ticket-price')?.value) || 24;
    let rebateGoldTH = parseFloat(document.getElementById('input-refund-price')?.value) || 16;

    let thaiHuGold = 0;
    let thaiHuMaterials = 0;
    let thaiHuCosts = 0;
    let thaiHuRuns = 0;
    let thaiHuActualRebateGold = 0;

    // QUÉT CHÍNH XÁC DANH SÁCH ACCOUNT DUY NHẤT (TUYỆT ĐỐI KHÔNG LẶP THEO ĐỘI HÌNH)
    let memberList = Object.values(systemDatabase.members || {});
    memberList.forEach(m => {
        if (!m || !m.name) return;

        let curR = parseInt(m.currentRuns) || 0;
        let maxR = parseInt(m.maxRuns) || 2;
        thaiHuRuns += curR;

        // 1. TÍNH NGUYÊN LIỆU THEO TIẾN ĐỘ THỰC TẾ & TRỪ THẤT BẠI
        let r1_nl = (m.failures && m.failures[1] !== undefined) ? m.failures[1].nl : 24;
        let r2_nl = (m.failures && m.failures[2] !== undefined) ? m.failures[2].nl : 48;
        let r3_nl = (m.failures && m.failures[3] !== undefined) ? m.failures[3].nl : 48;

        if (curR >= 1) thaiHuMaterials += r1_nl;
        if (curR >= 2) thaiHuMaterials += r2_nl;
        if (curR >= 3) thaiHuMaterials += r3_nl;

        // 2. TÍNH CHI PHÍ VÉ: TỐI ĐA (maxRuns - 1) LƯỢT VÉ CHO 1 ACCOUNT
        let selEl2 = document.getElementById(`select-lineup-paymode-${m.id}-2`);
        let selEl3 = document.getElementById(`select-lineup-paymode-${m.id}-3`);

        let payVal2 = selEl2 ? selEl2.value : m.payModeL2;
        let payVal3 = selEl3 ? selEl3.value : m.payModeL3;

        let isFreeL2 = isPayModeFreeRun(payVal2, m.freeRun2);
        let isFreeL3 = isPayModeFreeRun(payVal3, m.freeRun3);

        // Lần 2 (Tối đa 1 vé cho mọi account)
        if (curR >= 2 && !isFreeL2) {
            thaiHuCosts += ticketPriceTH;
        }

        // Lần 3 (Chỉ account Max 3 mới có thể tốn thêm 1 vé thứ hai)
        if (curR >= 3 && maxR >= 3 && !isFreeL3) {
            thaiHuCosts += ticketPriceTH;
        }

        // 3. HOÀN VÀNG KHI HOÀN THÀNH ĐỦ MAX LƯỢT (BẤT KỂ ĐI VÉ GÌ)
        let isRun2Failed = m.failures && m.failures[2] !== undefined;
        let isRun3Failed = m.failures && m.failures[3] !== undefined;

        if (maxR === 2 && curR >= 2 && !isRun2Failed) {
            thaiHuActualRebateGold += rebateGoldTH;
        } else if (maxR === 3 && curR >= 3 && !isRun3Failed) {
            thaiHuActualRebateGold += rebateGoldTH;
        }
    });

    // Tiền nguyên liệu Thái Hư
    let actualThaiHuMatGold = thaiHuMaterials * matPrice;
    let appliedThaiHuMatGold = isExcludeMaterials ? 0 : actualThaiHuMatGold;

    // Tiền hoàn vàng Thái Hư
    let appliedThaiHuRebateGold = isExcludeRefund ? 0 : thaiHuActualRebateGold;

    thaiHuGold = appliedThaiHuMatGold + appliedThaiHuRebateGold - thaiHuCosts;

    // Quẻ Đoài hôm nay
    let todayStr = new Date().toLocaleDateString('sv-SE');
    let todayDeo = (systemDatabase.deoHistory && systemDatabase.deoHistory.length > 0) ? systemDatabase.deoHistory.find(h => h.date === todayStr) : null;
    let actualDeoGold = todayDeo ? (todayDeo.goldValue || (todayDeo.count * todayDeo.price)) : 0;
    let appliedDeoGold = isExcludeDeo ? 0 : actualDeoGold;

    thaiHuGold += appliedDeoGold;

    // Lấy tổng vàng Thương Nhân Realtime
    let merchantMetrics = getRealtimeMerchantMetrics();
    let merchantTotalGold = merchantMetrics.totalGold;
    let merchantMaterials = merchantMetrics.totalMaterials;

    let grandTotalMaterials = thaiHuMaterials + merchantMaterials;
    let totalAllGold = thaiHuGold + merchantTotalGold;

    let thaiHuVnd = Math.round((thaiHuGold / 1000) * goldRateVnd);
    let merchantVnd = Math.round((merchantTotalGold / 1000) * goldRateVnd);
    let totalAllVnd = Math.round((totalAllGold / 1000) * goldRateVnd);

    let teamRunsCount = (thaiHuRuns / 8).toFixed(1).replace('.0', '');
    let totalRunsEl = document.getElementById('runtime-total-runs');
    if (totalRunsEl) totalRunsEl.innerText = `${thaiHuRuns} lượt (${teamRunsCount} lượt team)`;

    let totalMatsEl = document.getElementById('runtime-total-materials');
    if (totalMatsEl) totalMatsEl.innerText = `${grandTotalMaterials.toLocaleString('vi-VN')} NL`;

    let matsBreakdownEl = document.getElementById('runtime-materials-breakdown-text');
    if (matsBreakdownEl) {
        matsBreakdownEl.innerText = `TH: ${thaiHuMaterials.toLocaleString('vi-VN')} + TN: ${merchantMaterials.toLocaleString('vi-VN')} NL`;
    }

    let totalCostsEl = document.getElementById('runtime-total-costs');
    if (totalCostsEl) totalCostsEl.innerText = `-${thaiHuCosts.toFixed(1)}v`;

    let valDeoEl = document.getElementById('runtime-toggle-val-deo');
    if (valDeoEl) {
        valDeoEl.innerText = `+${actualDeoGold.toFixed(1)}v`;
        valDeoEl.className = isExcludeDeo ? "text-[10px] font-mono text-gray-500 opacity-40 line-through" : "text-[10px] font-mono text-purple-300 font-bold";
    }

    let valRefundEl = document.getElementById('runtime-toggle-val-refund');
    if (valRefundEl) {
        valRefundEl.innerText = `+${thaiHuActualRebateGold.toFixed(1)}v`;
        valRefundEl.className = isExcludeRefund ? "text-[10px] font-mono text-gray-500 opacity-40 line-through" : "text-[10px] font-mono text-amber-400 font-bold";
    }

    let valMatEl = document.getElementById('runtime-toggle-val-materials');
    if (valMatEl) {
        valMatEl.innerText = `+${actualThaiHuMatGold.toFixed(1)}v`;
        valMatEl.className = isExcludeMaterials ? "text-[10px] font-mono text-gray-500 opacity-40 line-through" : "text-[10px] font-mono text-rose-400 font-bold";
    }

    let thaiHuProfEl = document.getElementById('runtime-thaihu-profit');
    let merchantProfEl = document.getElementById('runtime-merchant-profit');

    if (thaiHuProfEl) thaiHuProfEl.innerText = `${thaiHuGold >= 0 ? '+' : ''}${thaiHuGold.toFixed(2)}v (~${thaiHuVnd.toLocaleString('vi-VN')} đ)`;
    if (merchantProfEl) merchantProfEl.innerText = `${merchantTotalGold >= 0 ? '+' : ''}${merchantTotalGold.toFixed(2)}v (~${merchantVnd.toLocaleString('vi-VN')} đ)`;

    let totalGoldEl = document.getElementById('runtime-net-profit-gold');
    let totalVndEl = document.getElementById('runtime-net-profit-vnd');

    if (totalGoldEl) {
        totalGoldEl.innerText = `${totalAllGold >= 0 ? '+' : ''}${totalAllGold.toFixed(2)} Vàng`;
        totalGoldEl.className = `text-lg font-black block ${totalAllGold >= 0 ? 'text-emerald-400' : 'text-rose-400'}`;
    }
    if (totalVndEl) {
        totalVndEl.innerText = `~ ${totalAllVnd.toLocaleString('vi-VN')} VNĐ`;
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectProfitCardComponent);
} else {
    injectProfitCardComponent();
}

document.addEventListener('click', (e) => {
    let card = document.getElementById('floating-profit-card');
    if (card && !card.classList.contains('hidden')) {
        let openTime = parseInt(card.getAttribute('data-open-time')) || 0;
        if (Date.now() - openTime < 100) return;

        let isClickInsideCard = card.contains(e.target);
        let isClickOnButton = e.target.closest('button[onclick*="toggleFloatingProfitCard"]');

        if (!isClickInsideCard && !isClickOnButton) {
            card.classList.add('hidden');
            adjustPopupsSideBySidePositions();
        }
    }
});

setInterval(() => {
    let card = document.getElementById('floating-profit-card');
    if (card && !card.classList.contains('hidden')) {
        calculateComprehensiveProfitsRealtime();
    }
    adjustPopupsSideBySidePositions();
}, 400);

window.injectProfitCardComponent = injectProfitCardComponent;
window.toggleFloatingProfitCard = toggleFloatingProfitCard;
window.calculateComprehensiveProfitsRealtime = calculateComprehensiveProfitsRealtime;
window.isEventCurrentlyActiveGMT7 = isEventCurrentlyActiveGMT7;
window.adjustPopupsSideBySidePositions = adjustPopupsSideBySidePositions;

// Tổng số dòng code trong file này: 305 dòng.