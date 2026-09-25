/* ==========================================================================
   MODULE: ĐỘNG CƠ TÍNH TOÁN ẢI THÁI HƯ (THAI HU ENGINE)
   Chức năng: Quét chi tiết tài khoản Max 2, Max 3; tính lượt chạy, chi phí,
   doanh thu và xuất số liệu chi tiết minh bạch từng nhóm tài khoản.
   ========================================================================== */

function calculateThaiHuComparison() {
    let isEvent = document.getElementById('chk-opt-event-toggle')?.checked ?? true;
    let isProfitLoss = document.getElementById('chk-opt-profit-loss-toggle')?.checked ?? false;
    let isAddDeo = document.getElementById('chk-opt-thaihu-add-deo')?.checked ?? false;
    let isExcludeRefund = document.getElementById('chk-opt-thaihu-exclude-refund')?.checked ?? true;
    let isFreeTickets = document.getElementById('chk-opt-thaihu-free-tickets')?.checked ?? false;

    // Đọc tham số giá từ Topbar
    let matPrice = parseFloat(document.getElementById('input-material-price')?.value) || 0.15;
    let ticketPriceTH = parseFloat(document.getElementById('input-ticket-price')?.value) || 20;
    let rebateGoldTH = parseFloat(document.getElementById('input-refund-price')?.value || document.getElementById('input-refund-gold')?.value) || 16;
    
    let goldRateInput = document.getElementById('input-gold-rate');
    let rawGoldRate = goldRateInput ? String(goldRateInput.value).replace(/\./g, '').replace(/,/g, '') : "155000";
    let goldRateVND = parseFloat(rawGoldRate) || 155000;

    // Quét chính xác số tài khoản Max 2 và Max 3 từ DB
    let max2Count = 0;
    let max3Count = 0;
    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.values(systemDatabase.members).forEach(function(m) {
            if (!m || !m.name) return;
            if (m.maxRuns === 2) max2Count++;
            else max3Count++;
        });
    }

    // Nếu dữ liệu trống thì gán mặc định dự phòng chuẩn
    let totalAcc = max2Count + max3Count;
    if (totalAcc === 0) {
        max2Count = 32;
        max3Count = 32;
        totalAcc = 64;
    }

    // Xác định chế độ chạy đang chọn
    let runMode = document.querySelector('input[name="rad-thaihu-run-mode"]:checked')?.value || "full";
    let thaihuTeams = 8;
    let totalRunsTH = 0;
    let detailMax2Runs = 0;
    let detailMax3Runs = 0;

    if (runMode === 'manual') {
        thaihuTeams = parseInt(document.getElementById('input-opt-thaihu-teams')?.value) || 8;
        totalRunsTH = thaihuTeams * 8;
    } else if (runMode === 'max2_only') {
        // Dòng 2: Chỉ đi full Max 2 (đi 2 lượt), Max 3 chỉ đi lượt 1 (Free)
        detailMax2Runs = max2Count * 2;
        detailMax3Runs = max3Count * 1;
        totalRunsTH = detailMax2Runs + detailMax3Runs;
        thaihuTeams = Math.ceil(totalRunsTH / 8) || 8;
    } else {
        // Dòng 1: Đi full tất cả (Max 2 đi 2 lượt, Max 3 đi 3 lượt)
        detailMax2Runs = max2Count * 2;
        detailMax3Runs = max3Count * 3;
        totalRunsTH = detailMax2Runs + detailMax3Runs;
        thaihuTeams = Math.ceil(totalRunsTH / 8) || 8;
    }

    // Tính thời gian hoàn thành
    let minsPerTeam = parseFloat(document.getElementById('input-opt-thaihu-mins-per-team')?.value) || 15;
    let totalMins = (thaihuTeams * minsPerTeam) + (thaihuTeams > 1 ? (thaihuTeams - 1) * 6 : 0);
    let totalHours = totalMins / 60;

    // Tính toán Nguyên Liệu (L1: 24, L2: 48, L3: 48 nếu có SK; không SK chia đôi)
    let totalMaterials = 0;
    let totalTicketCost = 0;
    let totalRebateGold = 0;

    if (runMode === 'manual') {
        let accPerTeam = thaihuTeams * 8;
        totalMaterials = isEvent ? (accPerTeam * 120) : (accPerTeam * 60);
        if (!isFreeTickets) {
            totalTicketCost = accPerTeam * (ticketPriceTH * 2);
        }
        if (!isExcludeRefund) {
            totalRebateGold = accPerTeam * rebateGoldTH;
        }
    } else if (runMode === 'max2_only') {
        // Max 2 nhận 72 NL (24+48), tốn 1 vé L2
        let nlMax2 = isEvent ? (max2Count * 72) : (max2Count * 36);
        // Max 3 đi L1 nhận 24 NL, 0 vé
        let nlMax3 = isEvent ? (max3Count * 24) : (max3Count * 12);
        totalMaterials = nlMax2 + nlMax3;

        if (!isFreeTickets) {
            totalTicketCost = max2Count * ticketPriceTH; // Chỉ tốn 1 vé cho Max 2
        }
        if (!isExcludeRefund) {
            totalRebateGold = max2Count * rebateGoldTH;
        }
    } else {
        // Full tất cả: Max 2 nhận 72 NL, Max 3 nhận 120 NL
        let nlMax2 = isEvent ? (max2Count * 72) : (max2Count * 36);
        let nlMax3 = isEvent ? (max3Count * 120) : (max3Count * 60);
        totalMaterials = nlMax2 + nlMax3;

        if (!isFreeTickets) {
            totalTicketCost = (max2Count * ticketPriceTH) + (max3Count * ticketPriceTH * 2);
        }
        if (!isExcludeRefund) {
            totalRebateGold = (max2Count + max3Count) * rebateGoldTH;
        }
    }

    // Doanh thu và lợi nhuận ròng
    let matRevenueGold = totalMaterials * matPrice;
    let totalIncomeGold = matRevenueGold + totalRebateGold;
    let netProfitGold = totalIncomeGold - totalTicketCost;
    let netProfitVND = (netProfitGold / 1000) * goldRateVND;

    let goldPerHour = totalHours > 0 ? (netProfitGold / totalHours) : 0;
    let vndPerHour = totalHours > 0 ? (netProfitVND / totalHours) : 0;

    return {
        runMode: runMode,
        max2Count: max2Count,
        max3Count: max3Count,
        totalAcc: totalAcc,
        detailMax2Runs: detailMax2Runs,
        detailMax3Runs: detailMax3Runs,
        totalRunsTH: totalRunsTH,
        thaihuTeams: thaihuTeams,
        totalMins: totalMins,
        totalHours: totalHours,
        totalMaterials: totalMaterials,
        matRevenueGold: matRevenueGold,
        totalTicketCost: totalTicketCost,
        totalRebateGold: totalRebateGold,
        netProfitGold: netProfitGold,
        netProfitVND: netProfitVND,
        goldPerHour: goldPerHour,
        vndPerHour: vndPerHour,
        isExcludeRefund: isExcludeRefund
    };
}

// Xuất ra window toàn cục
window.calculateThaiHuComparison = calculateThaiHuComparison;
