/* ==========================================================================
   MODULE: GIAO DIỆN SO SÁNH VÀ ĐIỀU PHỐI HOẠT ĐỘNG TỔNG HỢP
   Chức năng: Khóa cố định 3 cột ngang không bị cuộn dọc, tích hợp động cơ
   tính toán trực tiếp cho Thương Nhân & Tàng Kiếm, hiển thị minh bạch
   số tài khoản, số lượt và số nguyên liệu cho từng kịch bản Thái Hư.
   ========================================================================== */

function switchToOptimizationTab() {
    if (typeof activeTeamId !== 'undefined') {
        activeTeamId = "optimization_tab_active";
    }

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

    document.getElementById('floating-bubble-deo-container')?.classList.add('hidden');
    document.getElementById('floating-bubble-profit-container')?.classList.add('hidden');
    document.getElementById('floating-failure-management-container')?.classList.add('hidden');

    renderOptimizationWorkspaceView();
}

function renderOptimizationWorkspaceView() {
    let viewport = document.getElementById('active-panel-view-viewport') || 
                   document.getElementById('team-content-container') || 
                   document.getElementById('main-workspace-body');
    if (!viewport) return;

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');

    viewport.innerHTML = 
        '<div class="flex-1 flex flex-col bg-gray-900 border border-gray-750 rounded-xl shadow-2xl p-2.5 font-sans overflow-hidden min-h-0 select-none text-xs">' +
            // THANH TIÊU ĐỀ & TOGGLES
            '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-750 shrink-0">' +
                '<div class="flex items-center gap-2 text-amber-400 font-black text-sm tracking-wide uppercase">' +
                    '<i class="fa-solid fa-scale-balanced text-base"></i>' +
                    '<span>BẢNG PHÂN TÍCH TỐI ƯU THỜI GIAN TRÊN VÀNG / TIỀN</span>' +
                '</div>' +
                '<div class="flex items-center gap-2 flex-wrap">' +
                    '<label class="flex items-center gap-1.5 cursor-pointer bg-gray-800/80 px-2 py-1 rounded-lg border border-gray-700 hover:border-gray-500 transition text-[11px] font-bold text-gray-200">' +
                        '<input type="checkbox" id="chk-opt-profit-loss-toggle" onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer">' +
                        '<i class="fa-solid fa-calculator text-cyan-400"></i> Tính Lời Lỗ' +
                    '</label>' +
                    '<label class="flex items-center gap-1.5 cursor-pointer bg-gray-800/80 px-2 py-1 rounded-lg border border-gray-700 hover:border-gray-500 transition text-[11px] font-bold text-gray-200">' +
                        '<input type="checkbox" id="chk-opt-banknote-toggle" onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-900 border-gray-600 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer">' +
                        '<i class="fa-solid fa-money-bill-transfer text-amber-400"></i> Tính Ngân Phiếu' +
                    '</label>' +
                    '<label class="flex items-center gap-1.5 cursor-pointer bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-500/50 hover:border-amber-400 transition text-[11px] font-bold text-amber-300">' +
                        '<input type="checkbox" id="chk-opt-event-toggle" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-900 border-amber-500 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer">' +
                        '<i class="fa-solid fa-fire-flame-curved text-amber-400"></i> Đang Có Sự Kiện' +
                    '</label>' +
                '</div>' +
            '</div>' +

            // KHÓA CỨNG 3 CỘT NGANG LIỀN NHAU (grid-cols-3)
            '<div id="comparison-cards-grid-container" class="grid grid-cols-3 gap-2.5 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">' +
                
                // CỘT 1: ẢI THÁI HƯ
                '<div id="card-col-thai-hu" class="flex flex-col gap-2 min-w-0">' +
                    '<div class="bg-gray-950/80 border border-purple-500/40 rounded-xl p-2.5 shadow-lg flex flex-col gap-1.5">' +
                        '<div class="flex items-center justify-between text-purple-300 font-black text-xs border-b border-gray-800 pb-1">' +
                            '<span class="flex items-center gap-1.5"><i class="fa-solid fa-dharmachakra"></i> 1. ẢI THÁI HƯ</span>' +
                            '<span id="lbl-thaihu-header-summary" class="text-[10px] font-mono text-purple-400 font-bold">(Đang tính...)</span>' +
                        '</div>' +

                        '<div class="space-y-1.5 text-xs font-sans pt-0.5">' +
                            '<label class="flex flex-col gap-0.5 p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-500/50 cursor-pointer transition">' +
                                '<div class="flex items-center justify-between">' +
                                    '<div class="flex items-center gap-1.5">' +
                                        '<input type="radio" name="rad-thaihu-run-mode" value="full" checked onchange="runActivitiesComparisonCalculation()" class="text-purple-600 focus:ring-0 cursor-pointer w-3.5 h-3.5">' +
                                        '<span class="font-bold text-gray-200 text-[11px]">1. Đi full tất cả tài khoản</span>' +
                                    '</div>' +
                                '</div>' +
                                '<span id="badge-thaihu-mode-full" class="text-[9.5px] font-mono text-cyan-300 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-800/80 mt-0.5">Đang quét...</span>' +
                            '</label>' +

                            '<label class="flex flex-col gap-0.5 p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-500/50 cursor-pointer transition">' +
                                '<div class="flex items-center justify-between">' +
                                    '<div class="flex items-center gap-1.5">' +
                                        '<input type="radio" name="rad-thaihu-run-mode" value="max2_only" onchange="runActivitiesComparisonCalculation()" class="text-purple-600 focus:ring-0 cursor-pointer w-3.5 h-3.5">' +
                                        '<span class="font-bold text-gray-200 text-[11px]">2. Chỉ đi full TK max 2 (Max 3 đi lượt 1)</span>' +
                                    '</div>' +
                                '</div>' +
                                '<span id="badge-thaihu-mode-max2" class="text-[9.5px] font-mono text-amber-300 bg-amber-950/70 px-1.5 py-0.5 rounded border border-amber-800/80 mt-0.5">Đang quét...</span>' +
                            '</label>' +

                            '<label class="flex items-center justify-between p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-500/50 cursor-pointer transition">' +
                                '<div class="flex items-center gap-1.5">' +
                                    '<input type="radio" name="rad-thaihu-run-mode" value="manual" onchange="runActivitiesComparisonCalculation()" class="text-purple-600 focus:ring-0 cursor-pointer w-3.5 h-3.5">' +
                                    '<span class="font-bold text-gray-200 text-[11px]">3. Nhập thủ công số lượng team</span>' +
                                '</div>' +
                                '<span class="text-[9.5px] font-mono text-gray-400 bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">Tùy chỉnh team</span>' +
                            '</label>' +
                        '</div>' +

                        '<div class="grid grid-cols-3 gap-1 pt-1">' +
                            '<label class="flex items-center justify-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded text-[10px] font-bold text-gray-300 cursor-pointer hover:border-cyan-500/40 transition">' +
                                '<input type="checkbox" id="chk-opt-thaihu-exclude-refund" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                '<span>Bỏ Hoàn</span>' +
                            '</label>' +
                            '<label class="flex items-center justify-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded text-[10px] font-bold text-gray-300 cursor-pointer hover:border-cyan-500/40 transition">' +
                                '<input type="checkbox" id="chk-opt-thaihu-free-tickets" onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                '<span>Free Vé</span>' +
                            '</label>' +
                            '<label class="flex items-center justify-center gap-1 bg-gray-900 border border-gray-800 p-1 rounded text-[10px] font-bold text-gray-300 cursor-pointer hover:border-cyan-500/40 transition">' +
                                '<input type="checkbox" id="chk-opt-thaihu-add-deo" onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                '<span>+ Đoài</span>' +
                            '</label>' +
                        '</div>' +

                        '<div class="flex items-center justify-between gap-1 pt-1 border-t border-gray-850">' +
                            '<span class="text-[10.5px] text-gray-400 font-bold">Thời Gian 1 Team (Phút):</span>' +
                            '<input type="number" id="input-opt-thaihu-mins-per-team" value="15" onchange="runActivitiesComparisonCalculation()" class="w-16 bg-gray-900 border border-gray-700 rounded py-0.5 px-1.5 text-center text-xs font-bold text-cyan-300 focus:outline-none">' +
                        '</div>' +
                    '</div>' +
                    '<div id="result-box-thai-hu" class="bg-gray-955/80 border border-purple-500/40 rounded-xl p-2.5 shadow-lg flex-1 flex flex-col justify-between gap-1.5"></div>' +
                '</div>' +

                // CỘT 2: THƯƠNG NHÂN
                '<div id="card-col-merchant" class="flex flex-col gap-2 min-w-0">' +
                    '<div class="bg-gray-955 border border-amber-500/40 rounded-xl p-2.5 shadow-lg flex flex-col gap-1.5">' +
                        '<div class="flex items-center justify-between text-amber-400 font-black text-xs border-b border-gray-800 pb-1">' +
                            '<span class="flex items-center gap-1.5"><i class="fa-solid fa-gem"></i> 2. THƯƠNG NHÂN</span>' +
                            '<label class="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-amber-300">' +
                                '<input type="checkbox" id="chk-opt-merchant-x3" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-amber-500 text-amber-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                '<span>x3 Lượt</span>' +
                            '</label>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-1 pt-0.5">' +
                            '<span class="text-[10.5px] text-gray-400 font-bold">Số Vàng / 1 Lượt:</span>' +
                            '<input type="number" step="0.1" id="input-opt-merchant-gold-per-run" value="1.3" onchange="runActivitiesComparisonCalculation()" class="w-20 bg-gray-900 border border-gray-700 rounded py-0.5 px-1.5 text-center text-xs font-bold text-amber-300 focus:outline-none">' +
                        '</div>' +
                        '<div class="grid grid-cols-2 gap-1.5 pt-0.5">' +
                            '<div class="flex flex-col gap-0.5">' +
                                '<span class="text-[9.5px] text-gray-400 font-bold">Số ACC Mở (x):</span>' +
                                '<input type="number" id="input-opt-merchant-simul-acc" value="11" onchange="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded py-0.5 px-1 text-center text-xs font-bold text-white focus:outline-none">' +
                            '</div>' +
                            '<div class="flex flex-col gap-0.5">' +
                                '<span class="text-[9.5px] text-gray-400 font-bold">Thời Gian (Phút):</span>' +
                                '<input type="number" id="input-opt-merchant-mins-block" value="11" onchange="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded py-0.5 px-1 text-center text-xs font-bold text-cyan-300 focus:outline-none">' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-1 pt-1 border-t border-gray-850">' +
                            '<span class="text-[10.5px] text-gray-400 font-bold">Tổng Số Tài Khoản:</span>' +
                            '<div class="flex items-center gap-1">' +
                                '<input type="number" id="input-opt-merchant-total-acc" value="64" onchange="runActivitiesComparisonCalculation()" class="w-16 bg-gray-900 border border-gray-700 rounded py-0.5 px-1 text-center text-xs font-bold text-white focus:outline-none">' +
                                '<span id="lbl-merchant-calc-time" class="text-[9.5px] font-mono text-cyan-400 font-bold">(~ 21 phút)</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="result-box-merchant" class="bg-gray-955 border border-amber-500/40 rounded-xl p-2.5 shadow-lg flex-1 flex flex-col justify-between gap-1.5"></div>' +
                '</div>' +

                // CỘT 3: TÀNG KIẾM
                '<div id="card-col-tang-kiem" class="flex flex-col gap-2 min-w-0">' +
                    '<div class="bg-gray-955 border border-cyan-500/40 rounded-xl p-2.5 shadow-lg flex flex-col gap-1.5">' +
                        '<div class="flex items-center justify-between text-cyan-400 font-black text-xs border-b border-gray-800 pb-1">' +
                            '<span class="flex items-center gap-1.5"><i class="fa-solid fa-shield-halved"></i> 3. TÀNG KIẾM</span>' +
                            '<div class="flex items-center gap-1.5">' +
                                '<label class="flex items-center gap-1 cursor-pointer text-[9.5px] font-bold text-cyan-300">' +
                                    '<input type="checkbox" id="chk-opt-tangkiem-lead-refund" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-cyan-500 text-cyan-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                    '<span>Hoàn ĐT</span>' +
                                '</label>' +
                                '<label class="flex items-center gap-1 cursor-pointer text-[9.5px] font-bold text-cyan-300">' +
                                    '<input type="checkbox" id="chk-opt-tangkiem-x3" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-cyan-500 text-cyan-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                    '<span>x3 Lượt</span>' +
                                '</label>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-1 pt-0.5">' +
                            '<span class="text-[10.5px] text-gray-400 font-bold">Hoàn Đ.Trưởng (1 lần/team):</span>' +
                            '<input type="number" id="input-opt-tangkiem-refund-lead-gold" value="25" onchange="runActivitiesComparisonCalculation()" class="w-16 bg-gray-900 border border-gray-700 rounded py-0.5 px-1.5 text-center text-xs font-bold text-cyan-300 focus:outline-none">' +
                        '</div>' +
                        '<div class="grid grid-cols-2 gap-1.5 pt-0.5">' +
                            '<div class="flex flex-col gap-0.5">' +
                                '<span class="text-[9.5px] text-gray-400 font-bold">Số Team Đi:</span>' +
                                '<input type="number" id="input-opt-tangkiem-teams" value="8" onchange="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded py-0.5 px-1 text-center text-xs font-bold text-white focus:outline-none">' +
                            '</div>' +
                            '<div class="flex flex-col gap-0.5">' +
                                '<span class="text-[9.5px] text-gray-400 font-bold">Giá Vé TK (Vàng):</span>' +
                                '<input type="number" id="input-opt-tangkiem-ticket-price" value="23" onchange="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded py-0.5 px-1 text-center text-xs font-bold text-amber-300 focus:outline-none">' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-1 pt-1 border-t border-gray-850">' +
                            '<span class="text-[10.5px] text-gray-400 font-bold">Thời Gian 1 Team (Phút):</span>' +
                            '<input type="number" id="input-opt-tangkiem-mins-per-team" value="45" onchange="runActivitiesComparisonCalculation()" class="w-16 bg-gray-900 border border-gray-700 rounded py-0.5 px-1.5 text-center text-xs font-bold text-cyan-300 focus:outline-none">' +
                        '</div>' +
                    '</div>' +
                    '<div id="result-box-tang-kiem" class="bg-gray-955 border border-cyan-500/40 rounded-xl p-2.5 shadow-lg flex-1 flex flex-col justify-between gap-1.5"></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    runActivitiesComparisonCalculation();
}

// ĐỘNG CƠ TÍNH THƯƠNG NHÂN ĐỘC LẬP
function calculateMerchantDirectData() {
    let isEvent = document.getElementById('chk-opt-event-toggle')?.checked ?? true;
    let isTnX3 = document.getElementById('chk-opt-merchant-x3')?.checked ?? true;
    let goldPerRun = parseFloat(document.getElementById('input-opt-merchant-gold-per-run')?.value) || 1.3;
    let simulAcc = parseFloat(document.getElementById('input-opt-merchant-simul-acc')?.value) || 11;
    let minsBlock = parseFloat(document.getElementById('input-opt-merchant-mins-block')?.value) || 11;
    let totalAcc = parseInt(document.getElementById('input-opt-merchant-total-acc')?.value) || 64;

    let rawMatPrice = document.getElementById('input-material-price')?.value || "0.15";
    let matPrice = parseFloat(String(rawMatPrice).replace(',', '.')) || 0.15;
    let goldRateInput = document.getElementById('input-gold-rate');
    let rawGoldRate = goldRateInput ? String(goldRateInput.value).replace(/\./g, '').replace(/,/g, '') : "155000";
    let goldRateVND = parseFloat(rawGoldRate) || 155000;

    let runsMultiplier = isTnX3 ? 3 : 1;
    let totalMaterials = isEvent ? (totalAcc * 8 * runsMultiplier) : 0;
    let matGoldValue = totalMaterials * matPrice;
    let directGold = totalAcc * goldPerRun * runsMultiplier;
    let totalIncomeGold = matGoldValue + directGold;
    let totalVND = (totalIncomeGold / 1000) * goldRateVND;

    let speedAccPerHour = simulAcc !== 0 ? ((simulAcc / minsBlock) * 60) : 60.0;
    let totalHours = speedAccPerHour !== 0 ? (totalAcc / speedAccPerHour) * (isTnX3 ? 1 : 0.333) : 0.355;
    let totalMins = Math.round(totalHours * 60) || 21;

    let lblTime = document.getElementById('lbl-merchant-calc-time');
    if (lblTime) lblTime.innerText = `(~ ${totalMins} phút)`;

    let goldPerHour = totalHours !== 0 ? (totalIncomeGold / totalHours) : 0;
    let vndPerHour = totalHours !== 0 ? (totalVND / totalHours) : 0;

    return {
        totalMins: totalMins,
        totalMaterials: totalMaterials,
        matGoldValue: matGoldValue,
        netProfitGold: totalIncomeGold,
        netProfitVND: totalVND,
        speedAccPerHour: speedAccPerHour,
        goldPerHour: goldPerHour,
        vndPerHour: vndPerHour
    };
}

// ĐỘNG CƠ TÍNH TÀNG KIẾM ĐỘC LẬP
function calculateTangKiemDirectData() {
    let isEvent = document.getElementById('chk-opt-event-toggle')?.checked ?? true;
    let isCaptainBonusTK = document.getElementById('chk-opt-tangkiem-lead-refund')?.checked ?? true;
    let isTangkiemX3 = document.getElementById('chk-opt-tangkiem-x3')?.checked ?? true;
    let captainBonusGoldTK = parseFloat(document.getElementById('input-opt-tangkiem-refund-lead-gold')?.value) || 25;
    let tkTeams = parseInt(document.getElementById('input-opt-tangkiem-teams')?.value) || 8;
    let tkTicketPrice = parseFloat(document.getElementById('input-opt-tangkiem-ticket-price')?.value) || 23;
    let tkMinsPerTeam = parseFloat(document.getElementById('input-opt-tangkiem-mins-per-team')?.value) || 45;

    let rawMatPrice = document.getElementById('input-material-price')?.value || "0.15";
    let matPrice = parseFloat(String(rawMatPrice).replace(',', '.')) || 0.15;
    let goldRateInput = document.getElementById('input-gold-rate');
    let rawGoldRate = goldRateInput ? String(goldRateInput.value).replace(/\./g, '').replace(/,/g, '') : "155000";
    let goldRateVND = parseFloat(rawGoldRate) || 155000;

    let tkTotalMins = isTangkiemX3 ? (tkTeams * ((3 * tkMinsPerTeam) + 10)) : (tkTeams * tkMinsPerTeam);
    let tkTotalHours = tkTotalMins / 60;

    let tkRebateGold = isTangkiemX3 ? (tkTeams * 400) : 0;
    let tkCaptainGold = (isCaptainBonusTK && isTangkiemX3) ? (tkTeams * 2 * captainBonusGoldTK) : 0;
    let tkMaterials = isEvent ? (tkTeams * 8 * (isTangkiemX3 ? (24 + 48 + 48) : 24)) : 0;
    let tkMaterialGold = tkMaterials * matPrice;
    let tkTicketCost = isTangkiemX3 ? (tkTeams * 16 * tkTicketPrice) : 0;

    let tkTotalIncomeGold = tkRebateGold + tkCaptainGold + tkMaterialGold;
    let tkProfitGold = tkTotalIncomeGold - tkTicketCost;
    let tkProfitVND = (tkProfitGold / 1000) * goldRateVND;

    let tkGoldPerHour = tkTotalHours !== 0 ? (tkProfitGold / tkTotalHours) : 0;
    let tkVndPerHour = tkTotalHours !== 0 ? (tkProfitVND / tkTotalHours) : 0;

    return {
        totalMins: tkTotalMins,
        totalMaterials: tkMaterials,
        matGoldValue: tkMaterialGold,
        leadRefundGold: tkCaptainGold,
        totalIncomeGold: tkTotalIncomeGold,
        totalTicketCost: tkTicketCost,
        netProfitGold: tkProfitGold,
        netProfitVND: tkProfitVND,
        goldPerHour: tkGoldPerHour,
        vndPerHour: tkVndPerHour
    };
}

function runActivitiesComparisonCalculation() {
    let isProfitLossMode = document.getElementById('chk-opt-profit-loss-toggle')?.checked ?? false;
    let cardMerchant = document.getElementById('card-col-merchant');
    let gridContainer = document.getElementById('comparison-cards-grid-container');

    if (isProfitLossMode) {
        if (cardMerchant) cardMerchant.classList.add('hidden');
        if (gridContainer) {
            gridContainer.classList.remove('grid-cols-3');
            gridContainer.classList.add('grid-cols-2');
        }
    } else {
        if (cardMerchant) cardMerchant.classList.remove('hidden');
        if (gridContainer) {
            gridContainer.classList.remove('grid-cols-2');
            gridContainer.classList.add('grid-cols-3');
        }
    }

    // 1. TÍNH VÀ CẬP NHẬT ẢI THÁI HƯ
        let lblTHSummary = document.getElementById('lbl-thaihu-header-summary');
        if (lblTHSummary) {
            let h = Math.floor(th.totalMins / 60);
            let m = Math.round(th.totalMins % 60);
            let timeStr = h !== 0 ? (h + ' giờ ' + m + ' phút') : (m + ' phút');
            lblTHSummary.innerText = '(' + th.thaihuTeams + ' Team ~ ' + timeStr + ')';
        }

        // Cập nhật nhãn lựa chọn hiển thị rõ: Số acc, số lượt và số lượng nguyên liệu
        let badgeFull = document.getElementById('badge-thaihu-mode-full');
        if (badgeFull) {
            let nlM2Str = (th.max2Count * 72).toLocaleString('vi-VN');
            let nlM3Str = (th.max3Count * 120).toLocaleString('vi-VN');
            let totalNLStr = ((th.max2Count * 72) + (th.max3Count * 120)).toLocaleString('vi-VN');
            badgeFull.innerText = th.max2Count + ' Max 2 (' + (th.max2Count * 2) + 'l: ' + nlM2Str + ' NL) | ' + th.max3Count + ' Max 3 (' + (th.max3Count * 3) + 'l: ' + nlM3Str + ' NL) ➔ ' + totalNLStr + ' NL';
        }

        let badgeMax2 = document.getElementById('badge-thaihu-mode-max2');
        if (badgeMax2) {
            let nlM2Str = (th.max2Count * 72).toLocaleString('vi-VN');
            let nlM3FreeStr = (th.max3Count * 24).toLocaleString('vi-VN');
            let totalNLStr = ((th.max2Count * 72) + (th.max3Count * 24)).toLocaleString('vi-VN');
            badgeMax2.innerText = th.max2Count + ' Max 2 (' + (th.max2Count * 2) + 'l: ' + nlM2Str + ' NL) | ' + th.max3Count + ' Max 3 (' + th.max3Count + 'l free: ' + nlM3FreeStr + ' NL) ➔ ' + totalNLStr + ' NL';
        }

        renderThaiHuResultCard(th, isProfitLossMode);
    }

    // 2. TÍNH VÀ ĐỔ DỮ LIỆU THƯƠNG NHÂN & TÀNG KIẾM
    let mc = calculateMerchantDirectData();
    renderMerchantResultCard(mc);

    let tk = calculateTangKiemDirectData();
    renderTangKiemResultCard(tk, isProfitLossMode);
}

function renderThaiHuResultCard(th, isProfitLossMode) {
    let box = document.getElementById('result-box-thai-hu');
    if (!box) return;

    let h = Math.floor(th.totalMins / 60);
    let m = Math.round(th.totalMins % 60);
    let timeFormatted = h !== 0 ? `\({h} giờ\){m} phút` : `${m} phút`;

    let netGoldColor = Math.sign(th.netProfitGold) !== -1 ? "text-emerald-400" : "text-rose-500";
    let signStr = Math.sign(th.netProfitGold) !== -1 ? "+" : "";
    let goldPerHourColor = Math.sign(th.goldPerHour) !== -1 ? 'text-cyan-300' : 'text-rose-400';
    let signGoldHour = Math.sign(th.goldPerHour) !== -1 ? '+' : '';
    let vndPerHourColor = Math.sign(th.vndPerHour) !== -1 ? 'text-emerald-400' : 'text-rose-400';
    let signVndHour = Math.sign(th.vndPerHour) !== -1 ? '+' : '';

    box.innerHTML = 
        '<div class="flex items-center justify-between border-b border-gray-800 pb-1.5">' +
            '<span class="text-xs font-black uppercase text-purple-300">ẢI THÁI HƯ</span>' +
            '<span class="text-[10.5px] text-gray-400">Tổng Thời Gian: <strong class="text-white font-mono">' + timeFormatted + '</strong></span>' +
        '</div>' +

        '<div class="bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-center my-auto">' +
            '<span class="text-[10.5px] font-bold text-gray-400 block mb-0.5 uppercase tracking-wider">DOANH THU</span>' +
            '<div class="text-xl font-black font-mono ' + netGoldColor + '">' + signStr + th.netProfitGold.toFixed(1) + 'v</div>' +
            '<div class="text-xs font-mono text-gray-400 mt-0.5">' + signStr + Math.round(th.netProfitVND).toLocaleString('vi-VN') + ' đ</div>' +
        '</div>' +

        '<div class="space-y-1 text-xs bg-gray-900/60 p-2 rounded-xl border border-gray-800 font-mono">' +
            '<div class="flex justify-between text-gray-300">' +
                '<span>Tổng Thu (' + th.totalMaterials.toLocaleString('vi-VN') + ' NL' + (th.isExcludeRefund ? ' - Bỏ Hoàn' : '') + '):</span>' +
                '<span class="text-emerald-400 font-bold">+' + th.matRevenueGold.toFixed(1) + 'v</span>' +
            '</div>' +
            '<div class="flex justify-between text-gray-300">' +
                '<span>Tổng Chi (Tiền Vé):</span>' +
                '<span class="text-rose-400 font-bold">' + (th.isFreeTickets ? '-0.0v (FREE VÉ)' : '-' + th.totalTicketCost.toFixed(1) + 'v') + '</span>' +
            '</div>' +
            '<div class="flex justify-between border-t border-gray-800 pt-1 font-bold">' +
                '<span class="text-gray-200">Lãi Ròng Hoạt Động:</span>' +
                '<span class="' + netGoldColor + '">' + signStr + th.netProfitGold.toFixed(1) + 'v</span>' +
            '</div>' +
        '</div>' +

        '<div class="bg-amber-950/30 border border-amber-500/30 px-2 py-1 rounded text-center text-amber-300 font-mono text-[11px] font-bold">' +
            'Tổng Nguyên Liệu: ' + th.totalMaterials.toLocaleString('vi-VN') + ' NL (~' + th.matRevenueGold.toFixed(1) + 'v)' +
        '</div>' +

        '<div class="grid grid-cols-2 gap-1.5 pt-0.5 font-mono text-xs">' +
            '<div class="bg-gray-900 border border-gray-800 p-1.5 rounded text-center">' +
                '<span class="text-[9.5px] text-gray-400 block">Vàng/Giờ:</span>' +
                '<strong class="' + goldPerHourColor + ' font-black text-[11px]">' + signGoldHour + th.goldPerHour.toFixed(1) + 'v/h</strong>' +
            '</div>' +
            '<div class="bg-gray-900 border border-gray-800 p-1.5 rounded text-center">' +
                '<span class="text-[9.5px] text-gray-400 block">Tiền/Giờ:</span>' +
                '<strong class="' + vndPerHourColor + ' font-black text-[11px]">' + signVndHour + Math.round(th.vndPerHour).toLocaleString('vi-VN') + ' đ/h</strong>' +
            '</div>' +
        '</div>';
}

function renderMerchantResultCard(mc) {
    let box = document.getElementById('result-box-merchant');
    if (!box || !mc) return;

    box.innerHTML = 
        '<div class="flex items-center justify-between border-b border-gray-800 pb-1.5">' +
            '<span class="text-xs font-black uppercase text-amber-400">CHẠY THƯƠNG NHÂN</span>' +
            '<span class="text-[10.5px] text-gray-400">Tổng Thời Gian: <strong class="text-white font-mono">' + mc.totalMins + ' phút</strong></span>' +
        '</div>' +

        '<div class="bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-center my-auto">' +
            '<span class="text-[10.5px] font-bold text-gray-400 block mb-0.5 uppercase tracking-wider">DOANH THU</span>' +
            '<div class="text-xl font-black font-mono text-emerald-400">+' + mc.netProfitGold.toFixed(1) + 'v</div>' +
            '<div class="text-xs font-mono text-gray-400 mt-0.5">+' + Math.round(mc.netProfitVND).toLocaleString('vi-VN') + ' đ</div>' +
        '</div>' +

        '<div class="bg-amber-950/30 border border-amber-500/30 px-2 py-1 rounded text-center text-amber-300 font-mono text-[11px] font-bold">' +
            'Tổng Nguyên Liệu: ' + mc.totalMaterials.toLocaleString('vi-VN') + ' NL (~' + mc.matGoldValue.toFixed(1) + 'v)' +
        '</div>' +

        '<div class="flex justify-between items-center bg-gray-900/60 p-1.5 rounded border border-gray-800 text-[11px] font-mono text-gray-300">' +
            '<span>Tốc độ cày:</span>' +
            '<strong class="text-cyan-300">' + mc.speedAccPerHour.toFixed(1) + ' acc/h</strong>' +
        '</div>' +

        '<div class="grid grid-cols-2 gap-1.5 pt-0.5 font-mono text-xs">' +
            '<div class="bg-gray-900 border border-gray-800 p-1.5 rounded text-center">' +
                '<span class="text-[9.5px] text-gray-400 block">Vàng/Giờ:</span>' +
                '<strong class="text-emerald-400 font-black text-[11px]">+' + mc.goldPerHour.toFixed(1) + 'v/h</strong>' +
            '</div>' +
            '<div class="bg-gray-900 border border-gray-800 p-1.5 rounded text-center">' +
                '<span class="text-[9.5px] text-gray-400 block">Tiền/Giờ:</span>' +
                '<strong class="text-emerald-400 font-black text-[11px]">+' + Math.round(mc.vndPerHour).toLocaleString('vi-VN') + ' đ/h</strong>' +
            '</div>' +
        '</div>' +

        '<div class="bg-emerald-950/40 border border-emerald-500/40 py-1 px-2 rounded text-center text-emerald-400 font-black text-[11px]">' +
            '<i class="fa-solid fa-bolt mr-1"></i> HIỆU SUẤT TỐT NHẤT (Top 1 Tốc Độ)' +
        '</div>';
}

function renderTangKiemResultCard(tk, isProfitLossMode) {
    let box = document.getElementById('result-box-tang-kiem');
    if (!box || !tk) return;

    let h = Math.floor(tk.totalMins / 60);
    let m = Math.round(tk.totalMins % 60);
    let timeFormatted = h !== 0 ? `\({h} giờ\){m} phút` : `${m} phút`;

    let netGoldColor = Math.sign(tk.netProfitGold) !== -1 ? "text-emerald-400" : "text-rose-500";
    let signStr = Math.sign(tk.netProfitGold) !== -1 ? "+" : "";
    let goldPerHourColor = Math.sign(tk.goldPerHour) !== -1 ? 'text-cyan-300' : 'text-rose-400';
    let signGoldHour = Math.sign(tk.goldPerHour) !== -1 ? '+' : '';
    let vndPerHourColor = Math.sign(tk.vndPerHour) !== -1 ? 'text-emerald-400' : 'text-rose-400';
    let signVndHour = Math.sign(tk.vndPerHour) !== -1 ? '+' : '';

    box.innerHTML = 
        '<div class="flex items-center justify-between border-b border-gray-800 pb-1.5">' +
            '<span class="text-xs font-black uppercase text-cyan-400">TÀNG KIẾM</span>' +
            '<span class="text-[10.5px] text-gray-400">Tổng Thời Gian: <strong class="text-white font-mono">' + timeFormatted + '</strong></span>' +
        '</div>' +

        '<div class="bg-gray-900 border border-gray-800 rounded-xl p-2.5 text-center my-auto">' +
            '<span class="text-[10.5px] font-bold text-gray-400 block mb-0.5 uppercase tracking-wider">DOANH THU</span>' +
            '<div class="text-xl font-black font-mono ' + netGoldColor + '">' + signStr + tk.netProfitGold.toFixed(1) + 'v</div>' +
            '<div class="text-xs font-mono text-gray-400 mt-0.5">' + signStr + Math.round(tk.netProfitVND).toLocaleString('vi-VN') + ' đ</div>' +
        '</div>' +

        '<div class="space-y-1 text-xs bg-gray-900/60 p-2 rounded-xl border border-gray-800 font-mono">' +
            '<div class="flex justify-between text-gray-300">' +
                '<span>Tổng Thu (Hoàn+NL+ĐT):</span>' +
                '<span class="text-emerald-400 font-bold">+' + tk.totalIncomeGold.toFixed(1) + 'v</span>' +
            '</div>' +
            '<div class="flex justify-between text-gray-300">' +
                '<span>Tổng Chi (Tiền Vé TK):</span>' +
                '<span class="text-rose-400 font-bold">-' + tk.totalTicketCost.toFixed(1) + 'v</span>' +
            '</div>' +
            '<div class="flex justify-between border-t border-gray-800 pt-1 font-bold">' +
                '<span class="text-gray-200">Lãi Ròng Hoạt Động:</span>' +
                '<span class="' + netGoldColor + '">' + signStr + tk.netProfitGold.toFixed(1) + 'v</span>' +
            '</div>' +
        '</div>' +

        '<div class="bg-amber-950/30 border border-amber-500/30 px-2 py-1 rounded text-center text-amber-300 font-mono text-[11px] font-bold">' +
            'Tổng Nguyên Liệu: ' + tk.totalMaterials.toLocaleString('vi-VN') + ' NL (~' + tk.matGoldValue.toFixed(1) + 'v)' +
        '</div>' +

        '<div class="text-[10px] font-mono text-gray-400 text-center">' +
            '+Đ.Trưởng: <strong class="text-cyan-300">' + tk.leadRefundGold + 'v</strong>' +
        '</div>' +

        '<div class="grid grid-cols-2 gap-1.5 pt-0.5 font-mono text-xs">' +
            '<div class="bg-gray-900 border border-gray-800 p-1.5 rounded text-center">' +
                '<span class="text-[9.5px] text-gray-400 block">Vàng/Giờ:</span>' +
                '<strong class="' + goldPerHourColor + ' font-black text-[11px]">' + signGoldHour + tk.goldPerHour.toFixed(1) + 'v/h</strong>' +
            '</div>' +
            '<div class="bg-gray-900 border border-gray-800 p-1.5 rounded text-center">' +
                '<span class="text-[9.5px] text-gray-400 block">Tiền/Giờ:</span>' +
                '<strong class="' + vndPerHourColor + ' font-black text-[11px]">' + signVndHour + Math.round(tk.vndPerHour).toLocaleString('vi-VN') + ' đ/h</strong>' +
            '</div>' +
        '</div>' +

        '<div class="bg-blue-950/40 border border-blue-500/40 py-1 px-2 rounded text-center text-blue-300 font-black text-[11px]">' +
            '<i class="fa-solid fa-medal mr-1"></i> HIỆU QUẢ NHÌ (Top 2 Tốc Độ)' +
        '</div>';
}

window.switchToOptimizationTab = switchToOptimizationTab;
window.renderOptimizationWorkspaceView = renderOptimizationWorkspaceView;
window.injectActivitiesComparisonView = renderOptimizationWorkspaceView;
window.runActivitiesComparisonCalculation = runActivitiesComparisonCalculation;
window.calculateMerchantDirectData = calculateMerchantDirectData;
window.calculateTangKiemDirectData = calculateTangKiemDirectData;
window.renderThaiHuResultCard = renderThaiHuResultCard;
window.renderMerchantResultCard = renderMerchantResultCard;
window.renderTangKiemResultCard = renderTangKiemResultCard;
