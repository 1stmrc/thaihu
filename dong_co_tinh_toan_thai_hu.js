/* ==========================================================================
   MODULE: ĐỘNG CƠ TÍNH TOÁN ẢI THÁI HƯ (THAI HU ENGINE)
   Chức năng: Quét chi tiết tài khoản Max 2, Max 3; tính toán số lượt đi,
   bóc tách chi tiết số lượng nguyên liệu của từng nhóm (Max 2, Max 3),
   tính chi phí vé và lợi nhuận ròng.
   ========================================================================== */

function calculateThaiHuComparison() {
    let isEvent = document.getElementById('chk-opt-event-toggle')?.checked ?? true;
    let isExcludeRefund = document.getElementById('chk-opt-thaihu-exclude-refund')?.checked ?? true;
    let isFreeTickets = document.getElementById('chk-opt-thaihu-free-tickets')?.checked ?? false;
    let isAddDeo = document.getElementById('chk-opt-thaihu-add-deo')?.checked ?? false;

    // Đọc giá nguyên liệu & vé từ Topbar (xử lý cả dấu phẩy)
    let rawMatPrice = document.getElementById('input-material-price')?.value || "0.15";
    let matPrice = parseFloat(String(rawMatPrice).replace(',', '.')) || 0.15;

    let rawTicketPrice = document.getElementById('input-ticket-price')?.value || "20";
    let ticketPriceTH = parseFloat(String(rawTicketPrice).replace(',', '.')) || 20;

    let rawRebateGold = document.getElementById('input-refund-price')?.value || document.getElementById('input-refund-gold')?.value || "16";
    let rebateGoldTH = parseFloat(String(rawRebateGold).replace(',', '.')) || 16;
    
    let goldRateInput = document.getElementById('input-gold-rate');
    let rawGoldRate = goldRateInput ? String(goldRateInput.value).replace(/\./g, '').replace(/,/g, '') : "155000";
    let goldRateVND = parseFloat(rawGoldRate) || 155000;

    // Quét thành viên Max 2 và Max 3 từ DB
    let max2Count = 0;
    let max3Count = 0;

    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.values(systemDatabase.members).forEach(function(m) {
            if (!m || !m.name || String(m.name).trim() === "") return;
            let mRuns = parseInt(m.maxRuns) || 2;
            if (mRuns === 3) max3Count++;
            else max2Count++;
        });
    }

    let totalAcc = max2Count + max3Count;
    if (totalAcc === 0) {
        max2Count = 26;
        max3Count = 38;
        totalAcc = 64;
    }

    // Xác định chế độ chạy đang chọn
    let runModeRadio = document.querySelector('input[name="rad-thaihu-run-mode"]:checked');
    let runMode = runModeRadio ? runModeRadio.value : "full";

    let thaihuTeams = 8;
    let totalRunsTH = 0;
    let detailMax2Runs = 0;
    let detailMax3Runs = 0;
    let detailMax2NL = 0;
    let detailMax3NL = 0;
    let totalMaterials = 0;
    let totalTicketCost = 0;
    let totalRebateGold = 0;

    if (runMode === 'manual') {
        thaihuTeams = parseInt(document.getElementById('input-opt-thaihu-teams')?.value) || 8;
        totalRunsTH = thaihuTeams * 8;
        totalMaterials = isEvent ? (totalRunsTH * 120) : (totalRunsTH * 60);
        if (!isFreeTickets) {
            totalTicketCost = totalRunsTH * (ticketPriceTH * 2);
        }
        if (!isExcludeRefund) {
            totalRebateGold = totalRunsTH * rebateGoldTH;
        }
    } else if (runMode === 'max2_only') {
        // Dòng 2: Max 2 đi 2 lượt (72 NL/acc), Max 3 đi 1 lượt Free (24 NL/acc)
        detailMax2Runs = max2Count * 2;
        detailMax3Runs = max3Count * 1;
        totalRunsTH = detailMax2Runs + detailMax3Runs;
        thaihuTeams = Math.ceil(totalRunsTH / 8) || 8;

        detailMax2NL = isEvent ? (max2Count * 72) : (max2Count * 36);
        detailMax3NL = isEvent ? (max3Count * 24) : (max3Count * 12);
        totalMaterials = detailMax2NL + detailMax3NL;

        if (!isFreeTickets) {
            totalTicketCost = max2Count * ticketPriceTH;
        }
        if (!isExcludeRefund) {
            totalRebateGold = max2Count * rebateGoldTH;
        }
    } else {
        // Dòng 1: Full tất cả (Max 2 đi 2 lượt: 72 NL/acc; Max 3 đi 3 lượt: 120 NL/acc)
        detailMax2Runs = max2Count * 2;
        detailMax3Runs = max3Count * 3;
        totalRunsTH = detailMax2Runs + detailMax3Runs;
        thaihuTeams = Math.ceil(totalRunsTH / 8) || 8;

        detailMax2NL = isEvent ? (max2Count * 72) : (max2Count * 36);
        detailMax3NL = isEvent ? (max3Count * 120) : (max3Count * 60);
        totalMaterials = detailMax2NL + detailMax3NL;

        if (!isFreeTickets) {
            totalTicketCost = (max2Count * ticketPriceTH) + (max3Count * ticketPriceTH * 2);
        }
        if (!isExcludeRefund) {
            totalRebateGold = (max2Count + max3Count) * rebateGoldTH;
        }
    }

    let minsPerTeam = parseFloat(document.getElementById('input-opt-thaihu-mins-per-team')?.value) || 15;
    let totalMins = (thaihuTeams * minsPerTeam) + (thaihuTeams !== 1 ? (thaihuTeams - 1) * 6 : 0);
    let totalHours = totalMins / 60;

    let matRevenueGold = totalMaterials * matPrice;
    let totalIncomeGold = matRevenueGold + totalRebateGold;
    let netProfitGold = totalIncomeGold - totalTicketCost;
    let netProfitVND = (netProfitGold / 1000) * goldRateVND;

    let goldPerHour = totalHours !== 0 ? (netProfitGold / totalHours) : 0;
    let vndPerHour = totalHours !== 0 ? (netProfitVND / totalHours) : 0;

    return {
        runMode: runMode,
        max2Count: max2Count,
        max3Count: max3Count,
        totalAcc: totalAcc,
        detailMax2Runs: detailMax2Runs,
        detailMax3Runs: detailMax3Runs,
        detailMax2NL: detailMax2NL,
        detailMax3NL: detailMax3NL,
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
        isExcludeRefund: isExcludeRefund,
        isFreeTickets: isFreeTickets
    };
}

window.calculateThaiHuComparison = calculateThaiHuComparison;
