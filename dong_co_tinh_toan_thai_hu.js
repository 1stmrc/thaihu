// Tên file: dong_co_tinh_toan_thai_hu.js
// Chức năng: Động cơ toán học chuyên biệt - Tính toán thời gian, chi phí vé, nguyên liệu sự kiện, tiền hoàn vàng và quy đổi Ngân Phiếu (4 NP/acc/lượt, 50 NP = 1 vé) cho Ải Thái Hư.
// Con của file: giao_dien_so_sanh_va_dieu_phoi.js
// Danh sách tính năng của file:
//   1. Quét dữ liệu số lượng thành viên thực tế (Max 2 & Max 3).
//   2. Chế độ 3 (Nhập thủ công): Tính chuẩn số team đi Free Lần 1 (24 NL/acc, Tiền vé = 0v, Hoàn vàng = 0v, 4 NP/acc).
//   3. Tính toán số lượng Ngân Phiếu (4 NP/acc/lượt) và quy đổi ra Vàng khi bật [Tính Ngân Phiếu] (50 NP = Giá 1 Vé).
//   4. Hỗ trợ tùy chọn Free Toàn Bộ Vé, Tỷ Lệ Đoài và Bỏ Hoàn Vàng.
//   5. Xuất chỉ số Lãi Ròng Vàng, VNĐ, Lời/Tài khoản và Tốc độ Vàng/Giờ, Tiền/Giờ.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: TÍNH TOÁN SỐ LIỆU ẢI THÁI HƯ (TÍCH HỢP NGÂN PHIẾU)
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function tinhToanSoLieuThaiHu(isEvent, isAddDeo, isFreeTicket, matPrice, ticketPriceTH, rebateGoldTH, goldRateVND, isExcludeRefund, isNganPhieu) {
    let mode = document.querySelector('input[name="rad-thaihu-run-mode"]:checked')?.value || "full";
    let singleTeamMins = parseFloat(document.getElementById('input-opt-thaihu-mins-per-team')?.value) || 15;

    let systemMax2Count = 0;
    let systemMax3Count = 0;
    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.values(systemDatabase.members).forEach(m => {
            if (!m || !m.name) return;
            if (m.maxRuns === 2) systemMax2Count++;
            else systemMax3Count++;
        });
    }
    let totalMembers = systemMax2Count + systemMax3Count;
    if (totalMembers === 0) {
        systemMax2Count = 32;
        systemMax3Count = 32;
        totalMembers = 64;
    }

    let thTeamsCount = 0;
    let thMaterials = 0;
    let thTicketCost = 0;
    let thRebateGold = 0;
    let thTotalRunsAcc = 0;

    if (mode === "full") {
        thTeamsCount = Math.ceil(((systemMax2Count * 2) + (systemMax3Count * 3)) / 8) || 11;
        thTotalRunsAcc = (systemMax2Count * 2) + (systemMax3Count * 3);
        if (isEvent) thMaterials = (systemMax2Count * (24 + 48)) + (systemMax3Count * (24 + 48 + 48));
        if (!isFreeTicket) thTicketCost = ((systemMax2Count * 1) + (systemMax3Count * 2)) * ticketPriceTH;
        if (!isExcludeRefund) thRebateGold = (systemMax2Count * rebateGoldTH) + (systemMax3Count * rebateGoldTH);
    } else if (mode === "max2_only") {
        thTeamsCount = Math.ceil(((systemMax2Count * 2) + (systemMax3Count * 1)) / 8) || 8;
        thTotalRunsAcc = (systemMax2Count * 2) + (systemMax3Count * 1);
        if (isEvent) thMaterials = (systemMax2Count * (24 + 48)) + (systemMax3Count * 24);
        if (!isFreeTicket) thTicketCost = (systemMax2Count * 1) * ticketPriceTH;
        if (!isExcludeRefund) thRebateGold = (systemMax2Count * rebateGoldTH);
    } else if (mode === "manual") {
        // CHẾ ĐỘ 3: NHẬP THỦ CÔNG SỐ TEAM (ĐI FREE LẦN 1 CHO TOÀN BỘ)
        thTeamsCount = parseFloat(document.getElementById('input-opt-thaihu-teams')?.value) || 8;
        let totalAccCount = thTeamsCount * 8;
        thTotalRunsAcc = totalAccCount * 1;
        
        // Lần 1 Free: Mỗi acc nhận đúng 24 Nguyên Liệu khi có sự kiện
        if (isEvent) {
            thMaterials = totalAccCount * 24;
        } else {
            thMaterials = 0;
        }
        
        // Đi Free lần 1: Tiền vé = 0v, Hoàn vàng = 0v
        thTicketCost = 0;
        thRebateGold = 0;
    }

    let thMaterialGold = thMaterials * matPrice;

    // TÍNH TOÁN NGÂN PHIẾU (4 NP / 1 Lượt / 1 Tài khoản)
    let thNganPhieuCount = thTotalRunsAcc * 4;
    let thNganPhieuGold = 0;
    if (isNganPhieu && ticketPriceTH > 0) {
        thNganPhieuGold = thNganPhieuCount * (ticketPriceTH / 50); // 50 NP = 1 Vé
    }
    
    // TÍNH TOÁN QUẺ ĐOÀI
    let deoGoldTotal = 0;
    let deoStr = "";
    if (isAddDeo && typeof systemDatabase !== 'undefined' && systemDatabase.deoHistory && systemDatabase.deoHistory.length > 0) {
        let totalDeoVal = 0;
        let totalRunsRecorded = systemDatabase.deoHistory.length * 8;
        systemDatabase.deoHistory.forEach(h => {
            totalDeoVal += (h.goldValue || (h.count * h.price));
        });
        let avgDeoPerRun = totalRunsRecorded > 0 ? (totalDeoVal / totalRunsRecorded) : 0;
        deoGoldTotal = thTeamsCount * avgDeoPerRun;
        deoStr = `+Đoài: ${deoGoldTotal.toFixed(1)}v (TB ${avgDeoPerRun.toFixed(2)}v/team)`;
    }

    let thTotalIncomeGold = thMaterialGold + thRebateGold + deoGoldTotal + thNganPhieuGold;
    let thProfitGold = thTotalIncomeGold - thTicketCost;
    let thProfitVND = Math.round((thProfitGold / 1000) * goldRateVND);
    let thProfitPerAcc = totalMembers > 0 ? (thProfitGold / totalMembers) : 0;

    let thTotalMins = (thTeamsCount * singleTeamMins) + (thTeamsCount > 1 ? (thTeamsCount - 1) * 6 : 0);
    let thTotalHours = thTotalMins / 60;
    let thGoldPerHour = thTotalHours > 0 ? (thTotalIncomeGold / thTotalHours) : 0;
    let thVndPerHour = thTotalHours > 0 ? (Math.round((thTotalIncomeGold / 1000) * goldRateVND) / thTotalHours) : 0;

    return {
        teams: thTeamsCount,
        teamsCount: thTeamsCount,
        totalMins: thTotalMins,
        materials: thMaterials,
        materialGold: thMaterialGold,
        rebateGold: thRebateGold,
        deoGold: deoGoldTotal,
        deoStr: deoStr,
        nganPhieuCount: thNganPhieuCount,
        nganPhieuGold: thNganPhieuGold,
        totalIncomeGold: thTotalIncomeGold,
        ticketCost: thTicketCost,
        profitGold: thProfitGold,
        profitVND: thProfitVND,
        profitPerAcc: thProfitPerAcc,
        goldPerHour: thGoldPerHour,
        vndPerHour: thVndPerHour,
        isExcludeRefund: isExcludeRefund
    };
}

window.tinhToanSoLieuThaiHu = tinhToanSoLieuThaiHu;

// Tổng số dòng code trong file này: 129 dòng.