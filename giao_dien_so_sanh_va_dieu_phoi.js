// Tên file: giao_dien_so_sanh_va_dieu_phoi.js
// Chức năng: Điều phối giao diện Tab So Sánh Tối Ưu, khung nhập liệu 3 hoạt động (3 nút Thái Hư nằm gọn trong khung, nút tích chọn x3 Thương Nhân) và hiển thị các thẻ kết quả so sánh (luôn luôn hiển thị bóc tách chi tiết Tiền Vé và Lãi Ròng thực tế).
// Con của file: index.html (Nạp cuối cùng trong phân hệ So Sánh).
// Danh sách tính năng của file:
//   1. Chuyển tab tối ưu (`switchToOptimizationTab`) và ẩn các bong bóng phụ.
//   2. Render khung giao diện HTML 3 cột nhập liệu chính (3 nút Bỏ Hoàn, Free Vé, +Đoài tích hợp gọn gàng bên trong khung Thái Hư).
//   3. Nhận thanh điều khiển độc lập từ `renderTopbarControlSoSanhView()` (Tính Lời Lỗ, Tính Ngân Phiếu, Sự Kiện).
//   4. Tự động chia 2 bảng khi Bật [Tính Lời Lỗ] (Thái Hư & Tàng Kiếm) hoặc chia 3 bảng khi Tắt [Tính Lời Lỗ] (Thái Hư, Thương Nhân, Tàng Kiếm).
//   5. Khung DOANH THU kết hợp Vàng + VNĐ song song, LUÔN LUÔN bóc tách minh bạch Tổng Thu, Tiền Vé Đã Trừ, Ngân Phiếu và Lãi Ròng Thực Tế.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: ĐIỀU HƯỚNG VÀ KHỞI TẠO KHUNG WORKSPACE SO SÁNH
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function switchToOptimizationTab() {
    if (typeof activeTeamId !== 'undefined') activeTeamId = "optimization_tab_active";

    let btnThaihu = document.getElementById('btn-main-tab-thaihu');
    let btnMerchant = document.getElementById('btn-main-tab-merchant');
    let btnOpt = document.getElementById('btn-main-tab-optimize');
    let btnDeo = document.getElementById('btn-main-tab-deo');
    let btnLogs = document.getElementById('btn-main-tab-logs');

    if (btnThaihu) btnThaihu.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnMerchant) btnMerchant.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnOpt) btnOpt.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white shadow border border-emerald-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnDeo) btnDeo.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnLogs) btnLogs.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');

    let fDeo = document.getElementById('floating-bubble-deo-container');
    let fProfit = document.getElementById('floating-bubble-profit-container');
    let fFail = document.getElementById('floating-failure-management-container');
    if (fDeo) fDeo.classList.add('hidden');
    if (fProfit) fProfit.classList.add('hidden');
    if (fFail) fFail.classList.add('hidden');

    renderOptimizationWorkspaceView();
}

function formatSafeMinutesText(mins) {
    let m = Math.max(0, Math.round(mins || 0));
    let hours = Math.floor(m / 60);
    let remMins = m % 60;
    if (hours > 0) return `${hours} giờ ${remMins} phút`;
    return `${remMins} phút`;
}

function renderOptimizationWorkspaceView() {
    let viewport = document.getElementById('active-panel-view-viewport') || 
                   document.getElementById('team-content-container') || 
                   document.getElementById('main-workspace-body');
    if (!viewport) return;

    if (typeof attachTopbarRealtimeListeners === 'function') attachTopbarRealtimeListeners();
    let saved = typeof loadOptimizationFormState === 'function' ? loadOptimizationFormState() : null;

    let lineupCount = saved ? saved.tangkiemTeams : ((typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.filter(t => t.type === 'lineup').length : 8);
    let dataMemberCount = saved ? saved.merchantTotalAcc : ((typeof systemDatabase !== 'undefined' && systemDatabase.members) ? Object.keys(systemDatabase.members).length : 60);
    let isMerchantX3Checked = saved ? (saved.merchantX3 === true) : false;
    let isTangkiemX3Checked = saved ? (saved.tangkiemX3 === true) : true;
    let isTkCaptainBonusChecked = saved ? (saved.isCaptainBonusTK === true) : true;
    let tkCaptainBonusGoldVal = saved ? saved.captainBonusGoldTK : "25";
    let merchantGoldVal = saved ? saved.merchantGold : "1.3";
    let merchantBatchAccVal = saved ? saved.merchantBatchAcc : "11";
    let merchantBatchMinsVal = saved ? saved.merchantBatchMins : "11";
    let tangkiemMinsVal = saved ? saved.tangkiemMins : "45";
    let tangkiemTicketVal = saved ? saved.tangkiemTicketPrice : "23";

    viewport.innerHTML = `
        <div class="w-full h-full flex flex-col gap-3 p-3.5 bg-gray-900 border border-emerald-500/60 rounded-2xl shadow-2xl text-xs overflow-y-auto custom-scrollbar select-none">
            <!-- THANH TIÊU ĐỀ: CONTAINER NẠP ĐỘC LẬP TỪ FILE THANH-CONG-CU-SO-SANH.JS -->
            <div class="flex items-center justify-between border-b border-gray-800 pb-2 flex-wrap gap-2 shrink-0">
                <span class="font-bold text-emerald-300/90 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <i class="fa-solid fa-scale-balanced text-amber-400"></i> BẢNG PHÂN TÍCH TỐI ƯU THỜI GIAN TRÊN VÀNG / TIỀN
                </span>
                <div id="so-sanh-topbar-control-container"></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 shrink-0">
                <!-- KHỐI 1: ẢI THÁI HƯ -->
                <div id="opt-thaihu-input-card" class="bg-gray-955 p-3 rounded-xl border border-purple-500/50 flex flex-col gap-2 shadow-inner"></div>

                <!-- KHỐI 2: THƯƠNG NHÂN (NÚT TÍCH CHỌN X3) -->
                <div class="bg-gray-955 p-3 rounded-xl border border-amber-500/50 flex flex-col gap-2 shadow-inner">
                    <div class="flex items-center justify-between border-b border-gray-800 pb-1 flex-nowrap">
                        <span class="font-black text-amber-300 uppercase text-[11px] flex items-center gap-1 whitespace-nowrap"><i class="fa-solid fa-gem text-amber-400"></i> 2. THƯƠNG NHÂN</span>
                        <label class="flex items-center gap-1 cursor-pointer bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 select-none whitespace-nowrap">
                            <input id="chk-opt-merchant-x3" type="checkbox" ${isMerchantX3Checked ? 'checked' : ''} onchange="runActivitiesComparisonCalculation()" class="accent-amber-400 cursor-pointer w-3 h-3">
                            <span class="text-[9px] font-black text-amber-300">x3 Lượt</span>
                        </label>
                    </div>
                    <div>
                        <label class="text-gray-400 text-[10px] block font-bold mb-0.5">Số Vàng / 1 Lượt:</label>
                        <input id="input-opt-merchant-gold-per-run" type="number" min="0.1" step="0.1" value="${merchantGoldVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-amber-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-500">
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <div>
                            <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Số ACC Mở (x):</label>
                            <input id="input-opt-merchant-batch-acc" type="number" min="1" value="${merchantBatchAccVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-500">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Thời Gian (Phút):</label>
                            <input id="input-opt-merchant-batch-mins" type="number" min="0.5" step="0.5" value="${merchantBatchMinsVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-amber-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-500">
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-gray-400 text-[10px] font-bold">Tổng Số Tài Khoản:</label>
                            <span id="opt-merchant-calculated-time-badge" class="text-[9px] text-cyan-300 font-mono font-bold">~ 0 phút</span>
                        </div>
                        <input id="input-opt-merchant-total-acc" type="number" min="1" value="${dataMemberCount}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-500">
                    </div>
                </div>

                <!-- KHỐI 3: TÀNG KIẾM -->
                <div class="bg-gray-955 p-3 rounded-xl border border-cyan-500/50 flex flex-col gap-2 shadow-inner">
                    <div class="flex items-center justify-between border-b border-gray-800 pb-1 flex-nowrap">
                        <span class="font-black text-cyan-300 uppercase text-[11px] flex items-center gap-1 whitespace-nowrap"><i class="fa-solid fa-shield-halved text-cyan-400"></i> 3. TÀNG KIẾM</span>
                        <div class="flex items-center gap-1.5 flex-nowrap">
                            <label class="flex items-center gap-1 cursor-pointer bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40 select-none whitespace-nowrap">
                                <input id="chk-opt-tangkiem-captain-bonus" type="checkbox" ${isTkCaptainBonusChecked ? 'checked' : ''} onchange="toggleTkCaptainInputVisibility()" class="accent-cyan-400 cursor-pointer w-3 h-3">
                                <span class="text-[9px] font-black text-amber-300">Hoàn Đ.Trưởng</span>
                            </label>
                            <label class="flex items-center gap-1 cursor-pointer bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40 select-none whitespace-nowrap">
                                <input id="chk-opt-tangkiem-x3" type="checkbox" ${isTangkiemX3Checked ? 'checked' : ''} onchange="runActivitiesComparisonCalculation()" class="accent-cyan-400 cursor-pointer w-3 h-3">
                                <span class="text-[9px] font-black text-cyan-300">x3 Lượt</span>
                            </label>
                        </div>
                    </div>
                    <div id="opt-tk-captain-input-box" class="${isTkCaptainBonusChecked ? '' : 'hidden'} flex items-center justify-between bg-gray-900 px-2 py-1 rounded border border-gray-800">
                        <span class="text-gray-400 text-[10px] font-bold">Hoàn Đ.Trưởng (1 lần/team):</span>
                        <input id="input-opt-tangkiem-captain-gold" type="number" min="0" step="1" value="${tkCaptainBonusGoldVal}" oninput="runActivitiesComparisonCalculation()" class="w-16 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-amber-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-cyan-500">
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <div>
                            <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Số Team Đi:</label>
                            <input id="input-opt-tangkiem-teams" type="number" min="1" value="${lineupCount}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-cyan-500">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Giá Vé TK (Vàng):</label>
                            <input id="input-opt-tangkiem-ticket" type="number" min="1" step="1" value="${tangkiemTicketVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-yellow-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-cyan-500">
                        </div>
                    </div>
                    <div>
                        <label class="text-gray-400 text-[10px] block font-bold mb-0.5">Thời Gian 1 Team (Phút):</label>
                        <input id="input-opt-tangkiem-mins-per-team" type="number" min="1" step="0.5" value="${tangkiemMinsVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-cyan-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-cyan-500">
                    </div>
                </div>
            </div>

            <!-- NƠI CHỨA CÁC THẺ KẾT QUẢ SO SÁNH (2 BẢNG HOẶC 3 BẢNG) -->
            <div id="opt-comparison-cards-container" class="w-full pt-1 pb-4"></div>
        </div>
    `;

    if (typeof renderTopbarControlSoSanhView === 'function') renderTopbarControlSoSanhView();
    toggleEventModeUI();
}

/* ==========================================================================
   KHỐI 2: ĐIỀU PHỐI KHUNG NHẬP LIỆU THÁI HƯ (3 NÚT NẰM GỌN TRONG KHUNG)
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function toggleEventModeUI() {
    let card = document.getElementById('opt-thaihu-input-card');
    if (!card) return;

    let saved = typeof loadOptimizationFormState === 'function' ? loadOptimizationFormState() : null;
    let isAddDeoChecked = saved ? (saved.isAddDeo === true) : false;
    let isThaihuFreeTicketChecked = saved ? (saved.isThaihuFreeTicket === true) : false;
    let isThaihuExcludeRefundChecked = saved ? (saved.isThaihuExcludeRefund !== false) : true;
    let thaihuTeamsVal = saved ? saved.thaihuTeamsManual : ((typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.filter(t => t.type === 'lineup').length : 8);
    let thaihuMinsVal = saved ? saved.thaihuMins : "15";
    let thaihuRunMode = saved ? saved.thaihuRunMode : "manual";

    card.innerHTML = `
        <div class="flex items-center justify-between border-b border-gray-800 pb-1">
            <span class="font-black text-purple-300 uppercase text-[11px] flex items-center gap-1 whitespace-nowrap">
                <i class="fa-solid fa-dice-d20 text-purple-400"></i> 1. ẢI THÁI HƯ
            </span>
            <span id="opt-thaihu-calculated-time-badge" class="text-purple-300 font-mono font-bold text-[9px]">~ 0 phút</span>
        </div>

        <div class="flex flex-col gap-1 bg-gray-900 p-1.5 rounded-lg border border-gray-800 text-[10px]">
            <label class="flex items-center gap-1.5 cursor-pointer font-bold text-gray-200">
                <input type="radio" name="rad-thaihu-run-mode" value="full" ${thaihuRunMode === 'full' ? 'checked' : ''} onchange="toggleThaihuRunRadio()" class="accent-purple-400">
                <span>1. Đi full tất cả tài khoản (Max 2 & Max 3)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer font-bold text-gray-300">
                <input type="radio" name="rad-thaihu-run-mode" value="max2_only" ${thaihuRunMode === 'max2_only' ? 'checked' : ''} onchange="toggleThaihuRunRadio()" class="accent-purple-400">
                <span>2. Chỉ đi full TK max 2 (Max 3 đi lượt 1)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer font-bold text-gray-300">
                <input type="radio" name="rad-thaihu-run-mode" value="manual" ${thaihuRunMode === 'manual' ? 'checked' : ''} onchange="toggleThaihuRunRadio()" class="accent-purple-400">
                <span>3. Nhập thủ công số lượng team</span>
            </label>
        </div>

        <!-- 3 NÚT TÙY CHỌN GỌN TRONG KHUNG -->
        <div class="grid grid-cols-3 gap-1 bg-gray-900/80 p-1 rounded-lg border border-gray-800 text-[9px] font-bold select-none">
            <label class="flex items-center justify-center gap-1 cursor-pointer bg-cyan-950/60 py-1 rounded border border-cyan-500/30 hover:border-cyan-400" title="Không tính tiền hoàn vàng">
                <input id="chk-opt-thaihu-exclude-refund" type="checkbox" ${isThaihuExcludeRefundChecked ? 'checked' : ''} onchange="runActivitiesComparisonCalculation()" class="accent-cyan-400 cursor-pointer w-3 h-3">
                <span class="text-cyan-300 whitespace-nowrap">Bỏ Hoàn</span>
            </label>

            <label class="flex items-center justify-center gap-1 cursor-pointer bg-emerald-955/60 py-1 rounded border border-emerald-500/30 hover:border-emerald-400" title="Miễn phí toàn bộ tiền vé">
                <input id="chk-opt-thaihu-free-ticket" type="checkbox" ${isThaihuFreeTicketChecked ? 'checked' : ''} onchange="runActivitiesComparisonCalculation()" class="accent-emerald-400 cursor-pointer w-3 h-3">
                <span class="text-emerald-300 whitespace-nowrap">Free Vé</span>
            </label>
            
            <label class="flex items-center justify-center gap-1 cursor-pointer bg-purple-955/60 py-1 rounded border border-purple-500/30 hover:border-purple-400" title="Cộng dồn tỷ lệ vàng từ quẻ Đoài">
                <input id="chk-opt-thaihu-add-deo" type="checkbox" ${isAddDeoChecked ? 'checked' : ''} onchange="runActivitiesComparisonCalculation()" class="accent-purple-400 cursor-pointer w-3 h-3">
                <span class="text-purple-300 whitespace-nowrap">+ Đoài</span>
            </label>
        </div>

        <!-- Ô NHẬP SỐ TEAM VÀ THỜI GIAN NHỎ GỌN -->
        <div class="grid grid-cols-2 gap-1.5">
            <div id="opt-thaihu-manual-box" class="${thaihuRunMode === 'manual' ? '' : 'hidden'}">
                <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Số Team:</label>
                <input id="input-opt-thaihu-teams" type="number" min="1" value="${thaihuTeamsVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-purple-500">
            </div>
            <div class="${thaihuRunMode === 'manual' ? '' : 'col-span-2'}">
                <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Thời Gian 1 Team (Phút):</label>
                <input id="input-opt-thaihu-mins-per-team" type="number" min="1" step="0.5" value="${thaihuMinsVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-purple-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-purple-500">
            </div>
        </div>
    `;

    runActivitiesComparisonCalculation();
}

function toggleTkCaptainInputVisibility() {
    let isChecked = document.getElementById('chk-opt-tangkiem-captain-bonus')?.checked || false;
    let box = document.getElementById('opt-tk-captain-input-box');
    if (box) {
        if (isChecked) box.classList.remove('hidden');
        else box.classList.add('hidden');
    }
    runActivitiesComparisonCalculation();
}

function toggleThaihuRunRadio() {
    let mode = document.querySelector('input[name="rad-thaihu-run-mode"]:checked')?.value || "full";
    let box = document.getElementById('opt-thaihu-manual-box');
    if (box) {
        if (mode === 'manual') box.classList.remove('hidden');
        else box.classList.add('hidden');
    }
    runActivitiesComparisonCalculation();
}

/* ==========================================================================
   KHỐI 3: XUẤT KẾT QUẢ SO SÁNH (LUÔN SHOW TIỀN VÉ VÀ LÃI RÒNG THỰC TẾ)
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function runActivitiesComparisonCalculation() {
    try {
        let container = document.getElementById('opt-comparison-cards-container');
        if (!container) return;

        if (typeof saveOptimizationFormState === 'function') saveOptimizationFormState();

        let isEvent = document.getElementById('chk-opt-event-toggle')?.checked || false;
        let isProfitLoss = document.getElementById('chk-opt-profit-loss-toggle')?.checked !== false;
        let isNganPhieu = document.getElementById('chk-opt-ngan-phieu-toggle')?.checked === true;
        let isAddDeo = document.getElementById('chk-opt-thaihu-add-deo')?.checked || false;
        let isFreeTicket = document.getElementById('chk-opt-thaihu-free-ticket')?.checked || false;
        let isExcludeRefund = document.getElementById('chk-opt-thaihu-exclude-refund')?.checked !== false;
        let isCaptainBonusTK = document.getElementById('chk-opt-tangkiem-captain-bonus')?.checked !== false;

        let matPrice = parseFloat(document.getElementById('input-material-price')?.value) || 0.28;
        let ticketPriceTH = parseFloat(document.getElementById('input-ticket-price')?.value) || 24;
        let rebateGoldTH = parseFloat(document.getElementById('input-refund-price')?.value) || 16;
        
        let goldRateInput = document.getElementById('input-gold-rate') || document.getElementById('input-gold-price-per-1k');
        let rawGoldRate = goldRateInput ? String(goldRateInput.value).replace(/\./g, '').replace(/,/g, '') : "155000";
        let goldRateVND = parseFloat(rawGoldRate) || 155000;

        let thaihuData = (typeof tinhToanSoLieuThaiHu === 'function') 
            ? tinhToanSoLieuThaiHu(isEvent, isAddDeo, isFreeTicket, matPrice, ticketPriceTH, rebateGoldTH, goldRateVND, isExcludeRefund, isNganPhieu)
            : { teams: 8, totalMins: 96, materials: 0, materialGold: 0, rebateGold: 0, nganPhieuCount: 0, nganPhieuGold: 0, totalIncomeGold: 0, ticketCost: 0, profitGold: 0, profitVND: 0, profitPerAcc: 0, goldPerHour: 0, vndPerHour: 0 };

        let merchantData = (typeof tinhToanSoLieuThuongNhan === 'function') 
            ? tinhToanSoLieuThuongNhan(isEvent, matPrice, goldRateVND, isNganPhieu, ticketPriceTH) 
            : { totalMins: 45, totalGold: 0, totalVND: 0, goldPerHour: 0, vndPerHour: 0, accPerHour: 0, materials: 0, materialGold: 0, nganPhieuCount: 0, nganPhieuGold: 0 };

        let tangkiemData = (typeof tinhToanSoLieuTangKiem === 'function') 
            ? tinhToanSoLieuTangKiem(isEvent, isCaptainBonusTK, parseFloat(document.getElementById('input-opt-tangkiem-captain-gold')?.value) || 25, matPrice, goldRateVND, isNganPhieu) 
            : { totalMins: 45, totalIncomeGold: 0, profitGold: 0, profitVND: 0, goldPerHour: 0, vndPerHour: 0, ticketCost: 0, materials: 0, materialGold: 0, nganPhieuCount: 0, nganPhieuGold: 0 };

        let thTimeBadge = document.getElementById('opt-thaihu-calculated-time-badge');
        if (thTimeBadge) {
            thTimeBadge.innerText = `(${thaihuData.teams || 8} Team ~ ${formatSafeMinutesText(thaihuData.totalMins)})`;
        }

        let mTimeBadge = document.getElementById('opt-merchant-calculated-time-badge');
        if (mTimeBadge) {
            mTimeBadge.innerText = `(~ ${formatSafeMinutesText(merchantData.totalMins)})`;
        }

        let thHours = (thaihuData.totalMins || 1) / 60;
        let tkHours = (tangkiemData.totalMins || 1) / 60;

        let thProfitGoldPerHour = thHours > 0 ? ((thaihuData.profitGold || 0) / thHours) : 0;
        let thProfitVndPerHour = thHours > 0 ? ((thaihuData.profitVND || 0) / thHours) : 0;

        let tkProfitGoldPerHour = tkHours > 0 ? ((tangkiemData.profitGold || 0) / tkHours) : 0;
        let tkProfitVndPerHour = tkHours > 0 ? ((tangkiemData.profitVND || 0) / tkHours) : 0;

        let refundLabel = isExcludeRefund ? "(Đã Bỏ Hoàn)" : `+ Hoàn ${(thaihuData.rebateGold || 0).toFixed(1)}v`;
        let npTHStr = isNganPhieu ? ` + NP: ${(thaihuData.nganPhieuGold || 0).toFixed(1)}v` : "";
        let npTKStr = isNganPhieu ? `+NP ${(tangkiemData.nganPhieuGold || 0).toFixed(1)}v+` : "";

        // BÓC TÁCH CHI TIẾT TỔNG THU - TIỀN VÉ - LÃI RÒNG
        let thBreakdownHTML = `
            <div class="space-y-1 bg-gray-955/90 p-2.5 rounded-xl border border-purple-500/40 text-xs font-mono">
                <div class="flex justify-between text-gray-300"><span>Tổng Thu (NL ${refundLabel}${isAddDeo ? ' + Đoài' : ''}${npTHStr}):</span><b class="text-yellow-300 font-bold">+${(thaihuData.totalIncomeGold || 0).toFixed(1)}v</b></div>
                <div class="flex justify-between text-gray-300"><span>Tổng Chi (Tiền Vé):</span><b class="text-rose-400 font-bold">-${(thaihuData.ticketCost || 0).toFixed(1)}v ${thaihuData.ticketCost === 0 ? '<span class="text-emerald-400 font-black">(FREE VÉ)</span>' : ''}</b></div>
                <div class="flex justify-between border-t border-gray-800 pt-1 text-xs font-black ${(thaihuData.profitGold || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                    <span>Lãi Ròng Hoạt Động:</span><b>${(thaihuData.profitGold || 0) >= 0 ? '+' : ''}${(thaihuData.profitGold || 0).toFixed(1)}v</b>
                </div>
            </div>
        `;

        let tkBreakdownHTML = `
            <div class="space-y-1 bg-gray-955/90 p-2.5 rounded-xl border border-cyan-500/40 text-xs font-mono">
                <div class="flex justify-between text-gray-300"><span>Tổng Thu (Hoàn+NL+${npTKStr}Đ.Trưởng):</span><b class="text-yellow-300 font-bold">+${(tangkiemData.totalIncomeGold || 0).toFixed(1)}v</b></div>
                <div class="flex justify-between text-gray-300"><span>Tổng Chi (Tiền Vé TK):</span><b class="text-rose-400 font-bold">-${(tangkiemData.ticketCost || 0).toFixed(1)}v</b></div>
                <div class="flex justify-between border-t border-gray-800 pt-1 text-xs font-black ${(tangkiemData.profitGold || 0) >= 0 ? 'text-cyan-300' : 'text-rose-400'}">
                    <span>Lãi Ròng Hoạt Động:</span><b>${(tangkiemData.profitGold || 0) >= 0 ? '+' : ''}${(tangkiemData.profitGold || 0).toFixed(1)}v</b>
                </div>
            </div>
        `;

        let activities = [];

        if (isProfitLoss) {
            // KHI BẬT [TÍNH LỜI LỖ]: CHỈ HIỆN 2 BẢNG (THÁI HƯ & TÀNG KIẾM)
            activities = [
                { 
                    key: "thaihu", name: "Ải Thái Hư (Lời / Lỗ)", color: "purple", mins: thaihuData.totalMins || 0, 
                    gold: thaihuData.profitGold || 0, vnd: thaihuData.profitVND || 0, 
                    gPerHour: thProfitGoldPerHour, vPerHour: thProfitVndPerHour,
                    breakdown: thBreakdownHTML,
                    extraNP: isNganPhieu ? `<div class="text-[10px] text-yellow-300 font-bold bg-yellow-955/30 px-2 py-0.5 rounded border border-yellow-500/30">🎫 Ngân Phiếu: ${thaihuData.nganPhieuCount || 0} NP (~${(thaihuData.nganPhieuGold || 0).toFixed(1)}v)</div>` : ""
                },
                { 
                    key: "tangkiem", name: "Tàng Kiếm (Lời / Lỗ)", color: "cyan", mins: tangkiemData.totalMins || 0, 
                    gold: tangkiemData.profitGold || 0, vnd: tangkiemData.profitVND || 0, 
                    gPerHour: tkProfitGoldPerHour, vPerHour: tkProfitVndPerHour,
                    breakdown: tkBreakdownHTML,
                    extraNP: isNganPhieu ? `<div class="text-[10px] text-yellow-300 font-bold bg-yellow-955/30 px-2 py-0.5 rounded border border-yellow-500/30">🎫 Ngân Phiếu: ${tangkiemData.nganPhieuCount || 0} NP (~${(tangkiemData.nganPhieuGold || 0).toFixed(1)}v)</div>` : ""
                }
            ];
        } else {
            // KHI TẮT [TÍNH LỜI LỖ]: HIỂN THỊ ĐỦ 3 BẢNG (NHƯNG VẪN SHOW CHI TIẾT TIỀN VÉ)
            activities = [
                { 
                    key: "thaihu", name: "Ải Thái Hư", color: "purple", mins: thaihuData.totalMins || 0, 
                    gold: thaihuData.profitGold || 0, vnd: thaihuData.profitVND || 0, 
                    gPerHour: thProfitGoldPerHour, vPerHour: thProfitVndPerHour,
                    breakdown: thBreakdownHTML,
                    matText: isEvent ? `Nguyên liệu: <b>${(thaihuData.materials || 0).toLocaleString('vi-VN')} NL</b> (~${(thaihuData.materialGold || 0).toFixed(1)}v)` : "",
                    extraText: isAddDeo ? `<div class="text-[10px] text-purple-300 font-bold bg-purple-955/40 p-1 rounded border border-purple-500/30">${thaihuData.deoStr || '+Đoài'}</div>` : "",
                    extraNP: isNganPhieu ? `<div class="text-[10px] text-yellow-300 font-bold bg-yellow-955/30 px-2 py-0.5 rounded border border-yellow-500/30">🎫 Ngân Phiếu: ${thaihuData.nganPhieuCount || 0} NP (~${(thaihuData.nganPhieuGold || 0).toFixed(1)}v)</div>` : ""
                },
                { 
                    key: "merchant", name: "Chạy Thương Nhân", color: "amber", mins: merchantData.totalMins || 0, 
                    gold: merchantData.totalGold || 0, vnd: merchantData.totalVND || 0, 
                    gPerHour: merchantData.goldPerHour || 0, vPerHour: merchantData.vndPerHour || 0,
                    speedAcc: `Tốc độ: <b>${(merchantData.accPerHour || 0).toFixed(1)} acc/h</b>`,
                    matText: isEvent ? `Nguyên liệu: <b>${(merchantData.materials || 0).toLocaleString('vi-VN')} NL</b> (~${(merchantData.materialGold || 0).toFixed(1)}v)` : "",
                    extraNP: isNganPhieu ? `<div class="text-[10px] text-yellow-300 font-bold bg-yellow-955/30 px-2 py-0.5 rounded border border-yellow-500/30">🎫 Ngân Phiếu: ${merchantData.nganPhieuCount || 0} NP (~${(merchantData.nganPhieuGold || 0).toFixed(1)}v)</div>` : ""
                },
                { 
                    key: "tangkiem", name: "Tàng Kiếm", color: "cyan", mins: tangkiemData.totalMins || 0, 
                    gold: tangkiemData.profitGold || 0, vnd: tangkiemData.profitVND || 0, 
                    gPerHour: tkProfitGoldPerHour, vPerHour: tkProfitVndPerHour,
                    breakdown: tkBreakdownHTML,
                    matText: isEvent ? `Nguyên liệu: <b>${(tangkiemData.materials || 0).toLocaleString('vi-VN')} NL</b> (~${(tangkiemData.materialGold || 0).toFixed(1)}v)` : "",
                    extraText: isCaptainBonusTK ? `<div class="text-[10px] text-cyan-300 font-bold bg-cyan-955/40 p-1 rounded border border-cyan-500/30">+Đ.Trưởng: ${(tangkiemData.captainGold || 0)}v</div>` : "",
                    extraNP: isNganPhieu ? `<div class="text-[10px] text-yellow-300 font-bold bg-yellow-955/30 px-2 py-0.5 rounded border border-yellow-500/30">🎫 Ngân Phiếu: ${tangkiemData.nganPhieuCount || 0} NP (~${(tangkiemData.nganPhieuGold || 0).toFixed(1)}v)</div>` : ""
                }
            ];
        }

        let bestBySpeed = [...activities].sort((a, b) => (b.gPerHour || 0) - (a.gPerHour || 0))[0];
        let secondBySpeed = [...activities].sort((a, b) => (b.gPerHour || 0) - (a.gPerHour || 0))[1];
        let bestByTotalGold = [...activities].sort((a, b) => (b.gold || 0) - (a.gold || 0))[0];

        let gridColsClass = isProfitLoss ? "grid grid-cols-1 md:grid-cols-2 gap-3.5" : "grid grid-cols-1 md:grid-cols-3 gap-2.5";

        container.innerHTML = `
            <div class="${gridColsClass}">
                ${activities.map(act => {
                    let isBestSpeed = act.key === bestBySpeed?.key && act.gPerHour > 0;
                    let isSecondSpeed = act.key === secondBySpeed?.key && act.gPerHour > 0 && !isBestSpeed;
                    let isBestGold = act.key === bestByTotalGold?.key && act.gold > 0;

                    let badges = [];
                    if (isBestSpeed) badges.push(`<div class="bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-2 py-1 rounded-lg text-center font-black text-xs animate-pulse">⚡ HIỆU SUẤT TỐT NHẤT (Top 1 Tốc Độ Vàng/Giờ)</div>`);
                    else if (isSecondSpeed && !isProfitLoss) badges.push(`<div class="bg-blue-500/20 border border-blue-500 text-blue-300 px-2 py-1 rounded-lg text-center font-black text-xs">🥈 HIỆU QUẢ NHÌ (Top 2 Tốc Độ)</div>`);

                    if (isBestGold) badges.push(`<div class="bg-amber-500/20 border border-amber-500 text-amber-300 px-2 py-1 rounded-lg text-center font-black text-xs">💰 LỜI NHIỀU NHẤT</div>`);

                    if (badges.length === 0) badges.push(`<div class="bg-gray-900 border border-gray-800 px-2 py-1 rounded-lg text-center text-gray-500 text-xs">Hiệu suất bình thường</div>`);

                    let goldColor = act.gold >= 0 ? 'text-emerald-400' : 'text-rose-400';
                    let sign = act.gold >= 0 ? '+' : '-';

                    return `
                        <div class="bg-${act.color}-955/20 border border-${act.color}-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg">
                            <div class="flex items-center justify-between border-b border-gray-800 pb-2">
                                <span class="font-black text-${act.color}-300 text-sm uppercase">${act.name}</span>
                                <span class="text-gray-400 font-mono text-xs">Tổng Thời Gian: <strong class="text-white">${formatSafeMinutesText(act.mins)}</strong></span>
                            </div>

                            <div class="space-y-2 font-mono text-xs">
                                <!-- KHUNG DOANH THU ĐÃ TRỪ TIỀN VÉ CHUẨN XÁC -->
                                <div class="flex justify-between items-center bg-gray-950/95 p-3 rounded-xl border border-gray-800 shadow-inner">
                                    <span class="text-gray-300 font-bold text-xs uppercase">DOANH THU:</span>
                                    <div class="flex flex-col items-end">
                                        <strong class="${goldColor} font-black text-2xl leading-none">${sign}${Math.abs(act.gold).toFixed(1)}v</strong>
                                        <span class="${act.vnd >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold text-xs font-mono mt-1">${sign}${Math.abs(act.vnd).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                </div>

                                ${act.breakdown ? act.breakdown : ""}
                                ${act.matText ? `<div class="text-xs text-amber-400/90 italic bg-amber-955/30 px-2.5 py-1 rounded border border-amber-500/20">${act.matText}</div>` : ""}
                                ${act.extraText ? act.extraText : ""}
                                ${act.extraNP ? act.extraNP : ""}
                                ${act.speedAcc ? `<div class="flex justify-between items-center text-emerald-400 font-bold bg-emerald-955/30 px-2.5 py-1 rounded border border-emerald-500/20 text-xs">${act.speedAcc}</div>` : ""}

                                <div class="grid grid-cols-2 gap-2 mt-1">
                                    <div class="flex flex-col justify-center bg-gray-950/80 p-2 rounded-xl border border-gray-800">
                                        <span class="text-cyan-300 font-bold text-[11px]">Tốc độ Vàng/Giờ:</span>
                                        <strong class="text-cyan-300 font-black text-sm mt-0.5">${act.gPerHour.toFixed(1)}v/h</strong>
                                    </div>
                                    <div class="flex flex-col justify-center bg-gray-950/80 p-2 rounded-xl border border-gray-800">
                                        <span class="text-emerald-400 font-bold text-[11px]">Tốc độ Tiền/Giờ:</span>
                                        <strong class="text-emerald-400 font-black text-sm mt-0.5">${Math.round(act.vPerHour).toLocaleString('vi-VN')} đ/h</strong>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-1 flex flex-col gap-1.5">
                                ${badges.join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch(err) {
        console.error("Lỗi khi render phân hệ so sánh:", err);
    }
}

window.switchToOptimizationTab = switchToOptimizationTab;
window.renderOptimizationWorkspaceView = renderOptimizationWorkspaceView;
window.runActivitiesComparisonCalculation = runActivitiesComparisonCalculation;
window.toggleEventModeUI = toggleEventModeUI;
window.toggleTkCaptainInputVisibility = toggleTkCaptainInputVisibility;
window.toggleThaihuRunRadio = toggleThaihuRunRadio;

// Tổng số dòng code trong file này: 355 dòng.