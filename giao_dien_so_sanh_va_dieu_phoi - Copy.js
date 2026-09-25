/* ==========================================================================
   MODULE: GIAO DIỆN SO SÁNH VÀ ĐIỀU PHỐI HOẠT ĐỘNG TỔNG HỢP
   Chức năng: Render khung nhìn Bảng Phân Tích Tối Ưu Thời Gian Trên Vàng / Tiền,
   gọi các động cơ tính toán độc lập (Thái Hư, Thương Nhân, Tàng Kiếm) và hiển thị
   chi tiết số tài khoản Max 2 / Max 3 minh bạch.
   ========================================================================== */

function injectActivitiesComparisonView() {
    let viewport = document.getElementById('active-panel-view-viewport');
    if (!viewport) return;

    // Ẩn cụm nút bong bóng nổi để tránh che khuất bảng điều khiển
    document.getElementById('floating-bubble-deo-container')?.classList.add('hidden');
    document.getElementById('floating-bubble-profit-container')?.classList.add('hidden');

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');

    viewport.innerHTML = 
        '<div class="flex-1 flex flex-col bg-gray-900 border border-gray-750 rounded-xl shadow-2xl p-3 font-sans overflow-hidden min-h-0 select-none text-xs">' +
            // THANH TIÊU ĐỀ & TOGGLES ĐIỀU KHIỂN
            '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-gray-750 shrink-0">' +
                '<div class="flex items-center gap-2 text-amber-400 font-black text-sm tracking-wide uppercase">' +
                    '<i class="fa-solid fa-scale-balanced text-base"></i>' +
                    '<span>BẢNG PHÂN TÍCH TỐI ƯU THỜI GIAN TRÊN VÀNG / TIỀN</span>' +
                '</div>' +
                '<div class="flex items-center gap-2.5 flex-wrap">' +
                    '<label class="flex items-center gap-1.5 cursor-pointer bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-700 hover:border-gray-500 transition text-[11px] font-bold text-gray-200">' +
                        '<input type="checkbox" id="chk-opt-profit-loss-toggle" onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-900 border-gray-600 text-blue-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer">' +
                        '<i class="fa-solid fa-calculator text-cyan-400"></i> Tính Lời Lỗ' +
                    '</label>' +
                    '<label class="flex items-center gap-1.5 cursor-pointer bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-700 hover:border-gray-500 transition text-[11px] font-bold text-gray-200">' +
                        '<input type="checkbox" id="chk-opt-banknote-toggle" onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-900 border-gray-600 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer">' +
                        '<i class="fa-solid fa-money-bill-transfer text-amber-400"></i> Tính Ngân Phiếu' +
                    '</label>' +
                    '<label class="flex items-center gap-1.5 cursor-pointer bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/50 hover:border-amber-400 transition text-[11px] font-bold text-amber-300">' +
                        '<input type="checkbox" id="chk-opt-event-toggle" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-900 border-amber-500 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer">' +
                        '<i class="fa-solid fa-fire-flame-curved text-amber-400"></i> Đang Có Sự Kiện' +
                    '</label>' +
                '</div>' +
            '</div>' +

            // KHU VỰC CHÍNH 3 CỘT (HOẶC 2 CỘT NẾU BẬT TÍNH LỜI LỖ)
            '<div id="comparison-cards-grid-container" class="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">' +
                // CỘT 1: ẢI THÁI HƯ
                '<div id="card-col-thai-hu" class="flex flex-col gap-2.5">' +
                    // Khung cấu hình biến số Thái Hư
                    '<div class="bg-gray-950/80 border border-purple-500/40 rounded-xl p-3 shadow-lg flex flex-col gap-2">' +
                        '<div class="flex items-center justify-between text-purple-300 font-black text-xs border-b border-gray-800 pb-1.5">' +
                            '<span class="flex items-center gap-1.5"><i class="fa-solid fa-dharmachakra"></i> 1. ẢI THÁI HƯ</span>' +
                            '<span id="lbl-thaihu-header-summary" class="text-[10px] font-mono text-purple-400 font-bold">(12 Team ~ 4 giờ 6 phút)</span>' +
                        '</div>' +
                        '<div id="opt-thaihu-run-modes-container" class="flex flex-col gap-1.5 pt-1"></div>' +
                        '<div class="grid grid-cols-3 gap-1.5 pt-1">' +
                            '<label class="flex items-center justify-center gap-1 bg-gray-900 border border-gray-800 p-1.5 rounded-lg text-[10px] font-bold text-gray-300 cursor-pointer hover:border-cyan-500/40 transition">' +
                                '<input type="checkbox" id="chk-opt-thaihu-exclude-refund" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                '<span>Bỏ Hoàn</span>' +
                            '</label>' +
                            '<label class="flex items-center justify-center gap-1 bg-gray-900 border border-gray-800 p-1.5 rounded-lg text-[10px] font-bold text-gray-300 cursor-pointer hover:border-cyan-500/40 transition">' +
                                '<input type="checkbox" id="chk-opt-thaihu-free-tickets" onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-gray-700 text-cyan-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                '<span>Free Vé</span>' +
                            '</label>' +
                            '<label class="flex items-center justify-center gap-1 bg-gray-900 border border-gray-800 p-1.5 rounded-lg text-[10px] font-bold text-gray-300 cursor-pointer hover:border-cyan-500/40 transition">' +
                                '<input type="checkbox" id="chk-opt-thaihu-add-deo" onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-gray-700 text-purple-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                '<span>+ Đoài</span>' +
                            '</label>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-2 pt-1 border-t border-gray-850">' +
                            '<span class="text-[11px] text-gray-400 font-bold">Thời Gian 1 Team (Phút):</span>' +
                            '<input type="number" id="input-opt-thaihu-mins-per-team" value="15" onchange="runActivitiesComparisonCalculation()" class="w-20 bg-gray-900 border border-gray-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500">' +
                        '</div>' +
                    '</div>' +
                    // Khung kết quả hiển thị Thái Hư
                    '<div id="result-box-thai-hu" class="bg-gray-950/80 border border-purple-500/40 rounded-xl p-3 shadow-lg flex-1 flex flex-col justify-between gap-2"></div>' +
                '</div>' +

                // CỘT 2: THƯƠNG NHÂN
                '<div id="card-col-merchant" class="flex flex-col gap-2.5">' +
                    '<div class="bg-gray-955 border border-amber-500/40 rounded-xl p-3 shadow-lg flex flex-col gap-2">' +
                        '<div class="flex items-center justify-between text-amber-400 font-black text-xs border-b border-gray-800 pb-1.5">' +
                            '<span class="flex items-center gap-1.5"><i class="fa-solid fa-gem"></i> 2. THƯƠNG NHÂN</span>' +
                            '<label class="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-amber-300">' +
                                '<input type="checkbox" id="chk-opt-merchant-x3" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-amber-500 text-amber-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                '<span>x3 Lượt</span>' +
                            '</label>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-2 pt-1">' +
                            '<span class="text-[11px] text-gray-400 font-bold">Số Vàng / 1 Lượt:</span>' +
                            '<input type="number" step="0.1" id="input-opt-merchant-gold-per-run" value="1.3" onchange="runActivitiesComparisonCalculation()" class="w-24 bg-gray-900 border border-gray-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500">' +
                        '</div>' +
                        '<div class="grid grid-cols-2 gap-2 pt-1">' +
                            '<div class="flex flex-col gap-1">' +
                                '<span class="text-[10px] text-gray-400 font-bold">Số ACC Mở (x):</span>' +
                                '<input type="number" id="input-opt-merchant-simul-acc" value="11" onchange="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-white focus:outline-none">' +
                            '</div>' +
                            '<div class="flex flex-col gap-1">' +
                                '<span class="text-[10px] text-gray-400 font-bold">Thời Gian (Phút):</span>' +
                                '<input type="number" id="input-opt-merchant-mins-block" value="11" onchange="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-cyan-300 focus:outline-none">' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-850">' +
                            '<span class="text-[11px] text-gray-400 font-bold">Tổng Số Tài Khoản:</span>' +
                            '<div class="flex items-center gap-1.5">' +
                                '<input type="number" id="input-opt-merchant-total-acc" value="64" onchange="runActivitiesComparisonCalculation()" class="w-20 bg-gray-900 border border-gray-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-white focus:outline-none">' +
                                '<span id="lbl-merchant-calc-time" class="text-[10px] font-mono text-cyan-400 font-bold">(~ 21 phút)</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div id="result-box-merchant" class="bg-gray-955 border border-amber-500/40 rounded-xl p-3 shadow-lg flex-1 flex flex-col justify-between gap-2"></div>' +
                '</div>' +

                // CỘT 3: TÀNG KIẾM
                '<div id="card-col-tang-kiem" class="flex flex-col gap-2.5">' +
                    '<div class="bg-gray-955 border border-cyan-500/40 rounded-xl p-3 shadow-lg flex flex-col gap-2">' +
                        '<div class="flex items-center justify-between text-cyan-400 font-black text-xs border-b border-gray-800 pb-1.5">' +
                            '<span class="flex items-center gap-1.5"><i class="fa-solid fa-shield-halved"></i> 3. TÀNG KIẾM</span>' +
                            '<div class="flex items-center gap-2">' +
                                '<label class="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-cyan-300">' +
                                    '<input type="checkbox" id="chk-opt-tangkiem-lead-refund" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-cyan-500 text-cyan-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                    '<span>Hoàn Đ.Trưởng</span>' +
                                '</label>' +
                                '<label class="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-cyan-300">' +
                                    '<input type="checkbox" id="chk-opt-tangkiem-x3" checked onchange="runActivitiesComparisonCalculation()" class="rounded bg-gray-800 border-cyan-500 text-cyan-500 focus:ring-0 w-3 h-3 cursor-pointer">' +
                                    '<span>x3 Lượt</span>' +
                                '</label>' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-2 pt-1">' +
                            '<span class="text-[11px] text-gray-400 font-bold">Hoàn Đ.Trưởng (1 lần/team):</span>' +
                            '<input type="number" id="input-opt-tangkiem-refund-lead-gold" value="25" onchange="runActivitiesComparisonCalculation()" class="w-20 bg-gray-900 border border-gray-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-cyan-300 focus:outline-none">' +
                        '</div>' +
                        '<div class="grid grid-cols-2 gap-2 pt-1">' +
                            '<div class="flex flex-col gap-1">' +
                                '<span class="text-[10px] text-gray-400 font-bold">Số Team Đi:</span>' +
                                '<input type="number" id="input-opt-tangkiem-teams" value="8" onchange="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-white focus:outline-none">' +
                            '</div>' +
                            '<div class="flex flex-col gap-1">' +
                                '<span class="text-[10px] text-gray-400 font-bold">Giá Vé TK (Vàng):</span>' +
                                '<input type="number" id="input-opt-tangkiem-ticket-price" value="23" onchange="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-amber-300 focus:outline-none">' +
                            '</div>' +
                        '</div>' +
                        '<div class="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-850">' +
                            '<span class="text-[11px] text-gray-400 font-bold">Thời Gian 1 Team (Phút):</span>' +
                            '<input type="number" id="input-opt-tangkiem-mins-per-team" value="45" onchange="runActivitiesComparisonCalculation()" class="w-20 bg-gray-900 border border-gray-700 rounded-lg py-1 px-2 text-center text-xs font-bold text-cyan-300 focus:outline-none">' +
                        '</div>' +
                    '</div>' +
                    '<div id="result-box-tang-kiem" class="bg-gray-955 border border-cyan-500/40 rounded-xl p-3 shadow-lg flex-1 flex flex-col justify-between gap-2"></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    runActivitiesComparisonCalculation();
}

// HÀM ĐIỀU PHỐI TÍNH TOÁN VÀ ĐỔ DỮ LIỆU
function runActivitiesComparisonCalculation() {
    let isProfitLossMode = document.getElementById('chk-opt-profit-loss-toggle')?.checked ?? false;
    let cardMerchant = document.getElementById('card-col-merchant');
    let gridContainer = document.getElementById('comparison-cards-grid-container');

    // Chế độ Lời Lỗ: Ẩn cột Thương Nhân, kéo rộng 2 cột Thái Hư và Tàng Kiếm
    if (isProfitLossMode) {
        if (cardMerchant) cardMerchant.classList.add('hidden');
        if (gridContainer) {
            gridContainer.classList.remove('lg:grid-cols-3');
            gridContainer.classList.add('lg:grid-cols-2');
        }
    } else {
        if (cardMerchant) cardMerchant.classList.remove('hidden');
        if (gridContainer) {
            gridContainer.classList.remove('lg:grid-cols-2');
            gridContainer.classList.add('lg:grid-cols-3');
        }
    }

    // 1. GỌI ĐỘNG CƠ TÍNH THÁI HƯ
    let th = typeof calculateThaiHuComparison === 'function' ? calculateThaiHuComparison() : null;
    if (th) {
        // Cập nhật tiêu đề tóm tắt thời gian
        let lblTHSummary = document.getElementById('lbl-thaihu-header-summary');
        if (lblTHSummary) {
            let h = Math.floor(th.totalMins / 60);
            let m = Math.round(th.totalMins % 60);
            lblTHSummary.innerText = '(' + th.thaihuTeams + ' Team ~ ' + (h > 0 ? (h + ' giờ ' + m + ' phút') : (m + ' phút')) + ')';
        }

        // Render radio chọn chế độ chạy hiển thị chi tiết số tài khoản
        renderThaiHuRunModeSelectors(th);

        // Render card kết quả của Thái Hư
        renderThaiHuResultCard(th, isProfitLossMode);
    }

    // 2. GỌI ĐỘNG CƠ TÍNH THƯƠNG NHÂN & TÀNG KIẾM
    if (typeof calculateMerchantComparison === 'function') {
        let mc = calculateMerchantComparison();
        renderMerchantResultCard(mc);
    }
    if (typeof calculateTangKiemComparison === 'function') {
        let tk = calculateTangKiemComparison();
        renderTangKiemResultCard(tk, isProfitLossMode);
    }
}

// HÀM RENDER CHỌN CHẾ ĐỘ THÁI HƯ (HIỆN RÕ SỐ ACC MAX 2 / MAX 3)
function renderThaiHuRunModeSelectors(th) {
    let holder = document.getElementById('opt-thaihu-run-modes-container');
    if (!holder) return;

    // Giữ trạng thái radio hiện tại hoặc lấy từ th.runMode
    let currentMode = th?.runMode || "full";
    let checkedRadio = document.querySelector('input[name="rad-thaihu-run-mode"]:checked');
    if (checkedRadio) currentMode = checkedRadio.value;

    let m2Count = th?.max2Count || 0;
    let m3Count = th?.max3Count || 0;

    holder.innerHTML = 
        '<div class="space-y-1.5 text-xs font-sans">' +
            // Dòng 1: Full tất cả
            '<label class="flex items-center justify-between p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-500/50 cursor-pointer transition">' +
                '<div class="flex items-center gap-2">' +
                    '<input type="radio" name="rad-thaihu-run-mode" value="full" ' + (currentMode === 'full' ? 'checked' : '') + ' onchange="runActivitiesComparisonCalculation()" class="text-purple-600 focus:ring-0 cursor-pointer w-3.5 h-3.5">' +
                    '<span class="font-bold text-gray-200 text-[11px]">1. Đi full tất cả tài khoản</span>' +
                '</div>' +
                '<span class="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">' +
                    m2Count + ' Max 2 (' + (m2Count * 2) + 'l) | ' + m3Count + ' Max 3 (' + (m3Count * 3) + 'l)' +
                '</span>' +
            '</label>' +

            // Dòng 2: Chỉ full Max 2
            '<label class="flex items-center justify-between p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-500/50 cursor-pointer transition">' +
                '<div class="flex items-center gap-2">' +
                    '<input type="radio" name="rad-thaihu-run-mode" value="max2_only" ' + (currentMode === 'max2_only' ? 'checked' : '') + ' onchange="runActivitiesComparisonCalculation()" class="text-purple-600 focus:ring-0 cursor-pointer w-3.5 h-3.5">' +
                    '<span class="font-bold text-gray-200 text-[11px]">2. Chỉ đi full TK max 2 (Max 3 đi lượt 1)</span>' +
                '</div>' +
                '<span class="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">' +
                    m2Count + ' Max 2 (' + (m2Count * 2) + 'l) | ' + m3Count + ' Max 3 (' + m3Count + 'l free)' +
                '</span>' +
            '</label>' +

            // Dòng 3: Nhập thủ công
            '<label class="flex items-center justify-between p-1.5 rounded-lg bg-gray-900 border border-gray-800 hover:border-purple-500/50 cursor-pointer transition">' +
                '<div class="flex items-center gap-2">' +
                    '<input type="radio" name="rad-thaihu-run-mode" value="manual" ' + (currentMode === 'manual' ? 'checked' : '') + ' onchange="runActivitiesComparisonCalculation()" class="text-purple-600 focus:ring-0 cursor-pointer w-3.5 h-3.5">' +
                    '<span class="font-bold text-gray-200 text-[11px]">3. Nhập thủ công số lượng team</span>' +
                '</div>' +
                '<span class="text-[10px] font-mono text-gray-400 bg-gray-950 px-2 py-0.5 rounded border border-gray-800">' +
                    'Tùy chỉnh' +
                '</span>' +
            '</label>' +
        '</div>';
}

// RENDER KẾT QUẢ THÁI HƯ
function renderThaiHuResultCard(th, isProfitLossMode) {
    let box = document.getElementById('result-box-thai-hu');
    if (!box) return;

    let h = Math.floor(th.totalMins / 60);
    let m = Math.round(th.totalMins % 60);
    let timeFormatted = h > 0 ? (h + ' giờ ' + m + ' phút') : (m + ' phút');

    let netGoldColor = th.netProfitGold >= 0 ? "text-emerald-400" : "text-rose-500";
    let signStr = th.netProfitGold >= 0 ? "+" : "";

    box.innerHTML = 
        '<div class="flex items-center justify-between border-b border-gray-800 pb-2">' +
            '<span class="text-xs font-black uppercase text-purple-300">ẢI THÁI HƯ</span>' +
            '<span class="text-[11px] text-gray-400">Tổng Thời Gian: <strong class="text-white font-mono">' + timeFormatted + '</strong></span>' +
        '</div>' +

        '<div class="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center my-auto">' +
            '<span class="text-[11px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">DOANH THU</span>' +
            '<div class="text-2xl font-black font-mono ' + netGoldColor + '">' + signStr + th.netProfitGold.toFixed(1) + 'v</div>' +
            '<div class="text-xs font-mono text-gray-400 mt-0.5">' + signStr + Math.round(th.netProfitVND).toLocaleString('vi-VN') + ' đ</div>' +
        '</div>' +

        '<div class="space-y-1.5 text-xs bg-gray-900/60 p-2.5 rounded-xl border border-gray-800 font-mono">' +
            '<div class="flex justify-between text-gray-300">' +
                '<span>Tổng Thu (NL' + (th.isExcludeRefund ? ' (Đã Bỏ Hoàn)' : '') + '):</span>' +
                '<span class="text-emerald-400 font-bold">+' + th.matRevenueGold.toFixed(1) + 'v</span>' +
            '</div>' +
            '<div class="flex justify-between text-gray-300">' +
                '<span>Tổng Chi (Tiền Vé):</span>' +
                '<span class="text-rose-400 font-bold">-' + th.totalTicketCost.toFixed(1) + 'v</span>' +
            '</div>' +
            '<div class="flex justify-between border-t border-gray-800 pt-1.5 font-bold">' +
                '<span class="text-gray-200">Lãi Ròng Hoạt Động:</span>' +
                '<span class="' + netGoldColor + '">' + signStr + th.netProfitGold.toFixed(1) + 'v</span>' +
            '</div>' +
        '</div>' +

        '<div class="bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded-lg text-center text-amber-300 font-mono text-xs italic">' +
            'Nguyên liệu: ' + th.totalMaterials.toLocaleString('vi-VN') + ' NL (~' + th.matRevenueGold.toFixed(1) + 'v)' +
        '</div>' +

        '<div class="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">' +
            '<div class="bg-gray-900 border border-gray-800 p-2 rounded-lg text-center">' +
                '<span class="text-[10px] text-gray-400 block">Tốc độ Vàng/Giờ:</span>' +
                '<strong class="' + (th.goldPerHour >= 0 ? 'text-cyan-300' : 'text-rose-400') + ' font-black">' + (th.goldPerHour >= 0 ? '+' : '') + th.goldPerHour.toFixed(1) + 'v/h</strong>' +
            '</div>' +
            '<div class="bg-gray-900 border border-gray-800 p-2 rounded-lg text-center">' +
                '<span class="text-[10px] text-gray-400 block">Tốc độ Tiền/Giờ:</span>' +
                '<strong class="' + (th.vndPerHour >= 0 ? 'text-emerald-400' : 'text-rose-400') + ' font-black">' + (th.vndPerHour >= 0 ? '+' : '') + Math.round(th.vndPerHour).toLocaleString('vi-VN') + ' đ/h</strong>' +
            '</div>' +
        '</div>';
}

// RENDER KẾT QUẢ THƯƠNG NHÂN
function renderMerchantResultCard(mc) {
    let box = document.getElementById('result-box-merchant');
    if (!box || !mc) return;

    box.innerHTML = 
        '<div class="flex items-center justify-between border-b border-gray-800 pb-2">' +
            '<span class="text-xs font-black uppercase text-amber-400">CHẠY THƯƠNG NHÂN</span>' +
            '<span class="text-[11px] text-gray-400">Tổng Thời Gian: <strong class="text-white font-mono">' + mc.totalMins + ' phút</strong></span>' +
        '</div>' +

        '<div class="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center my-auto">' +
            '<span class="text-[11px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">DOANH THU</span>' +
            '<div class="text-2xl font-black font-mono text-emerald-400">+' + mc.netProfitGold.toFixed(1) + 'v</div>' +
            '<div class="text-xs font-mono text-gray-400 mt-0.5">+' + Math.round(mc.netProfitVND).toLocaleString('vi-VN') + ' đ</div>' +
        '</div>' +

        '<div class="bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded-lg text-center text-amber-300 font-mono text-xs">' +
            'Nguyên liệu: ' + mc.totalMaterials + ' NL (~' + mc.matGoldValue.toFixed(1) + 'v)' +
        '</div>' +

        '<div class="flex justify-between items-center bg-gray-900/60 p-2 rounded-lg border border-gray-800 text-xs font-mono text-gray-300">' +
            '<span>Tốc độ:</span>' +
            '<strong class="text-cyan-300">' + mc.speedAccPerHour.toFixed(1) + ' acc/h</strong>' +
        '</div>' +

        '<div class="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">' +
            '<div class="bg-gray-900 border border-gray-800 p-2 rounded-lg text-center">' +
                '<span class="text-[10px] text-gray-400 block">Tốc độ Vàng/Giờ:</span>' +
                '<strong class="text-emerald-400 font-black">+' + mc.goldPerHour.toFixed(1) + 'v/h</strong>' +
            '</div>' +
            '<div class="bg-gray-900 border border-gray-800 p-2 rounded-lg text-center">' +
                '<span class="text-[10px] text-gray-400 block">Tốc độ Tiền/Giờ:</span>' +
                '<strong class="text-emerald-400 font-black">+' + Math.round(mc.vndPerHour).toLocaleString('vi-VN') + ' đ/h</strong>' +
            '</div>' +
        '</div>' +

        '<div class="bg-emerald-950/40 border border-emerald-500/40 py-1.5 px-3 rounded-lg text-center text-emerald-400 font-black text-xs">' +
            '<i class="fa-solid fa-bolt mr-1"></i> HIỆU SUẤT TỐT NHẤT (Top 1 Tốc Độ)' +
        '</div>';
}

// RENDER KẾT QUẢ TÀNG KIẾM
function renderTangKiemResultCard(tk, isProfitLossMode) {
    let box = document.getElementById('result-box-tang-kiem');
    if (!box || !tk) return;

    let h = Math.floor(tk.totalMins / 60);
    let m = Math.round(tk.totalMins % 60);
    let timeFormatted = h > 0 ? (h + ' giờ ' + m + ' phút') : (m + ' phút');

    let netGoldColor = tk.netProfitGold >= 0 ? "text-emerald-400" : "text-rose-500";
    let signStr = tk.netProfitGold >= 0 ? "+" : "";

    box.innerHTML = 
        '<div class="flex items-center justify-between border-b border-gray-800 pb-2">' +
            '<span class="text-xs font-black uppercase text-cyan-400">TÀNG KIẾM</span>' +
            '<span class="text-[11px] text-gray-400">Tổng Thời Gian: <strong class="text-white font-mono">' + timeFormatted + '</strong></span>' +
        '</div>' +

        '<div class="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center my-auto">' +
            '<span class="text-[11px] font-bold text-gray-400 block mb-1 uppercase tracking-wider">DOANH THU</span>' +
            '<div class="text-2xl font-black font-mono ' + netGoldColor + '">' + signStr + tk.netProfitGold.toFixed(1) + 'v</div>' +
            '<div class="text-xs font-mono text-gray-400 mt-0.5">' + signStr + Math.round(tk.netProfitVND).toLocaleString('vi-VN') + ' đ</div>' +
        '</div>' +

        '<div class="space-y-1.5 text-xs bg-gray-900/60 p-2.5 rounded-xl border border-gray-800 font-mono">' +
            '<div class="flex justify-between text-gray-300">' +
                '<span>Tổng Thu (Hoàn+NL+Đ.Trưởng):</span>' +
                '<span class="text-emerald-400 font-bold">+' + tk.totalIncomeGold.toFixed(1) + 'v</span>' +
            '</div>' +
            '<div class="flex justify-between text-gray-300">' +
                '<span>Tổng Chi (Tiền Vé TK):</span>' +
                '<span class="text-rose-400 font-bold">-' + tk.totalTicketCost.toFixed(1) + 'v</span>' +
            '</div>' +
            '<div class="flex justify-between border-t border-gray-800 pt-1.5 font-bold">' +
                '<span class="text-gray-200">Lãi Ròng Hoạt Động:</span>' +
                '<span class="' + netGoldColor + '">' + signStr + tk.netProfitGold.toFixed(1) + 'v</span>' +
            '</div>' +
        '</div>' +

        '<div class="bg-amber-950/30 border border-amber-500/30 px-3 py-1 rounded-lg text-center text-amber-300 font-mono text-xs">' +
            'Nguyên liệu: ' + tk.totalMaterials.toLocaleString('vi-VN') + ' NL (~' + tk.matGoldValue.toFixed(1) + 'v)' +
        '</div>' +

        '<div class="text-[11px] font-mono text-gray-400 text-center">' +
            '+Đ.Trưởng: <strong class="text-cyan-300">' + tk.leadRefundGold + 'v</strong>' +
        '</div>' +

        '<div class="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">' +
            '<div class="bg-gray-900 border border-gray-800 p-2 rounded-lg text-center">' +
                '<span class="text-[10px] text-gray-400 block">Tốc độ Vàng/Giờ:</span>' +
                '<strong class="' + (tk.goldPerHour >= 0 ? 'text-cyan-300' : 'text-rose-400') + ' font-black">' + (tk.goldPerHour >= 0 ? '+' : '') + tk.goldPerHour.toFixed(1) + 'v/h</strong>' +
            '</div>' +
            '<div class="bg-gray-900 border border-gray-800 p-2 rounded-lg text-center">' +
                '<span class="text-[10px] text-gray-400 block">Tốc độ Tiền/Giờ:</span>' +
                '<strong class="' + (tk.vndPerHour >= 0 ? 'text-emerald-400' : 'text-rose-400') + ' font-black">' + (tk.vndPerHour >= 0 ? '+' : '') + Math.round(tk.vndPerHour).toLocaleString('vi-VN') + ' đ/h</strong>' +
            '</div>' +
        '</div>' +

        '<div class="bg-blue-950/40 border border-blue-500/40 py-1.5 px-3 rounded-lg text-center text-blue-300 font-black text-xs">' +
            '<i class="fa-solid fa-medal mr-1"></i> HIỆU QUẢ NHÌ (Top 2 Tốc Độ)' +
        '</div>';
}

// Xuất các hàm ra phạm vi toàn cục window
window.injectActivitiesComparisonView = injectActivitiesComparisonView;
window.runActivitiesComparisonCalculation = runActivitiesComparisonCalculation;
window.renderThaiHuRunModeSelectors = renderThaiHuRunModeSelectors;
window.renderThaiHuResultCard = renderThaiHuResultCard;
window.renderMerchantResultCard = renderMerchantResultCard;
window.renderTangKiemResultCard = renderTangKiemResultCard;
