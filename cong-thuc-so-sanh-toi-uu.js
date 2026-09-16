// Tên file: cong-thuc-so-sanh-toi-uu.js
// Chức năng: Động cơ toán học thuần túy - Tính toán chi tiết doanh thu, nguyên liệu, chi phí, hoàn tiền, quẻ Đoài và Lời/Lỗ cho 3 hoạt động.
// Con của file: index.html (Nạp sau kho-luu-tru-so-sanh.js).
// Danh sách tính năng của file:
//   1. Quét tài khoản Max 2 / Max 3 thực tế từ hệ thống.
//   2. Tính toán Thái Hư chuẩn 3 lượt đi + Quẻ Đoài + Hoàn Đội Trưởng.
//   3. Tính toán Thương Nhân (Vàng + NL sự kiện + Tốc độ acc/h).
//   4. Tính toán Tàng Kiếm với giá vé riêng biệt + Hoàn Đội Trưởng x2 lượt (L1 Free).
//   5. Phân định độc lập: Top 1 Tốc Độ Vàng/Giờ & Top 1 Tổng Thu / Lời Nhất.

/* ==========================================================================
   KHỐI 1: TÍNH TOÁN ĐỘNG CƠ CỐT LÕI (CORE CALCULATION ENGINE)
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]
   ========================================================================== */
function executeOptimizationCalculations() {
    let isEvent = document.getElementById('chk-opt-event-toggle')?.checked || false;
    let isProfitLoss = document.getElementById('chk-opt-profit-loss-toggle')?.checked || false;
    let isAddDeo = document.getElementById('chk-opt-thaihu-add-deo')?.checked || false;
    let isCaptainBonusTH = document.getElementById('chk-opt-thaihu-captain-bonus')?.checked || false;
    let captainBonusGoldTH = parseFloat(document.getElementById('input-opt-thaihu-captain-gold')?.value) || 10;
    let isCaptainBonusTK = document.getElementById('chk-opt-tangkiem-captain-bonus')?.checked || false;
    let captainBonusGoldTK = parseFloat(document.getElementById('input-opt-tangkiem-captain-gold')?.value) || 10;

    let matPrice = parseFloat(document.getElementById('input-material-price')?.value) || 0.2;
    let ticketPriceTH = parseFloat(document.getElementById('input-ticket-price')?.value) || 25;
    let rebateGoldTH = parseFloat(document.getElementById('input-refund-gold')?.value || document.getElementById('input-rebate-price')?.value) || 16;
    
    let goldRateInput = document.getElementById('input-gold-rate') || document.getElementById('input-gold-price-per-1k');
    let rawGoldRate = goldRateInput ? String(goldRateInput.value).replace(/\./g, '').replace(/,/g, '') : "155000";
    let goldRateVND = parseFloat(rawGoldRate) || 155000;

    let systemMax2Count = 0;
    let systemMax3Count = 0;
    if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.values(systemDatabase.members).forEach(m => {
            if (!m || !m.name) return;
            if (m.maxRuns === 2) systemMax2Count++;
            else systemMax3Count++;
        });
    }
    let totalScannedMembers = systemMax2Count + systemMax3Count;
    if (totalScannedMembers === 0) {
        systemMax2Count = 32;
        systemMax3Count = 32;
        totalScannedMembers = 64;
    }

    // --- 1. TÍNH THÁI HƯ ---
    let thaihuTeams = 8;
    let thaihuRunMode = document.querySelector('input[name="rad-thaihu-run-mode"]:checked')?.value || "full";
    let totalRunsTH = 0;

    if (thaihuRunMode === 'manual') {
        thaihuTeams = parseInt(document.getElementById('input-opt-thaihu-teams')?.value) || 8;
        totalRunsTH = thaihuTeams * 8;
    } else if (thaihuRunMode === 'max2_only') {
        totalRunsTH = (systemMax2Count * 2) + (systemMax3Count * 1);
        thaihuTeams = Math.ceil(totalRunsTH / 8) || 8;
    } else {
        totalRunsTH = (systemMax2Count * 2) + (systemMax3Count * 3);
        thaihuTeams = Math.ceil(totalRunsTH / 8) || 8;
    }

    let thaihuMinsPerTeam = parseFloat(document.getElementById('input-opt-thaihu-mins-per-team')?.value) || 12;
    let thaihuTotalMins = (thaihuTeams * thaihuMinsPerTeam) + (thaihuTeams > 1 ? (thaihuTeams - 1) * 6 : 0);
    let thaihuTotalHours = thaihuTotalMins / 60;

    let thMaterials = 0;
    let thTicketCost = 0;
    let thRebateGold = 0;

    if (thaihuRunMode === 'full') {
        thMaterials = isEvent ? ((systemMax2Count * (24 + 48)) + (systemMax3Count * (24 + 48 + 48))) : 0;
        thTicketCost = ((systemMax2Count * 1) + (systemMax3Count * 2)) * ticketPriceTH;
        thRebateGold = (systemMax2Count + systemMax3Count) * rebateGoldTH;
    } else if (thaihuRunMode === 'max2_only') {
        thMaterials = isEvent ? ((systemMax2Count * (24 + 48)) + (systemMax3Count * 24)) : 0;
        thTicketCost = (systemMax2Count * 1) * ticketPriceTH;
        thRebateGold = systemMax2Count * rebateGoldTH;
    } else {
        thMaterials = isEvent ? (thaihuTeams * 8 * (24 + 48 + 48)) : 0;
        thTicketCost = thaihuTeams * 8 * 2 * ticketPriceTH;
        thRebateGold = thaihuTeams * 8 * rebateGoldTH;
    }

    let deoGoldTotal = 0;
    let avgDeoRateStr = "";
    if (isAddDeo) {
        let totalDeo = 0;
        let totalGold = 0;
        let lTeamsCount = (systemDatabase && systemDatabase.teams) ? systemDatabase.teams.filter(t => t.type === 'lineup').length || 8 : 8;
        let totalTeamsRun = (systemDatabase && systemDatabase.deoHistory) ? systemDatabase.deoHistory.length * lTeamsCount : 0;

        if (systemDatabase && systemDatabase.deoHistory && systemDatabase.deoHistory.length > 0) {
            systemDatabase.deoHistory.forEach(h => {
                totalDeo += h.count;
                totalGold += (h.goldValue || (h.count * h.price));
            });
        }

        let deoGoldPerTeam = totalTeamsRun > 0 ? (totalGold / totalTeamsRun) : 32.5;
        deoGoldTotal = thaihuTeams * deoGoldPerTeam;
        avgDeoRateStr = `+Đoài: ~${deoGoldPerTeam.toFixed(1)}v/team (+${deoGoldTotal.toFixed(1)}v)`;
    }

    let thCaptainGold = isCaptainBonusTH ? (thaihuTeams * captainBonusGoldTH) : 0;
    let thMaterialGold = thMaterials * matPrice;
    let thTotalIncomeGold = thMaterialGold + thRebateGold + thCaptainGold + deoGoldTotal;
    let thProfitGold = thTotalIncomeGold - thTicketCost;
    let thProfitVND = Math.round((thProfitGold / 1000) * goldRateVND);
    let thProfitPerAcc = totalScannedMembers > 0 ? (thProfitGold / totalScannedMembers) : 0;

    let thDisplayGold = isProfitLoss ? thProfitGold : thTotalIncomeGold;
    let thDisplayVND = isProfitLoss ? thProfitVND : Math.round((thTotalIncomeGold / 1000) * goldRateVND);
    let thGoldPerHour = thaihuTotalHours > 0 ? (thDisplayGold / thaihuTotalHours) : 0;
    let thVndPerHour = thaihuTotalHours > 0 ? (thDisplayVND / thaihuTotalHours) : 0;

    // --- 2. TÍNH THƯƠNG NHÂN ---
    let mGoldPerRun = parseFloat(document.getElementById('input-opt-merchant-gold-per-run')?.value) || 1.3;
    let mBatchAcc = parseFloat(document.getElementById('input-opt-merchant-batch-acc')?.value) || 11;
    let mBatchMins = parseFloat(document.getElementById('input-opt-merchant-batch-mins')?.value) || 45;
    let mTotalAcc = parseInt(document.getElementById('input-opt-merchant-total-acc')?.value) || 64;

    let mTimePerAcc = mBatchAcc > 0 ? (mBatchMins / mBatchAcc) : 4.09;
    let mTotalMins = mTotalAcc * mTimePerAcc;
    let mTotalHours = mTotalMins / 60;
    let mAccPerHour = mTimePerAcc > 0 ? (60 / mTimePerAcc) : 0;

    let mTotalMaterials = isEvent ? (mTotalAcc * 24) : 0;
    let mMaterialGold = mTotalMaterials * matPrice;
    let mDirectGold = mTotalAcc * (mGoldPerRun * 3);
    let mTotalGold = mDirectGold + mMaterialGold;
    let mTotalVND = Math.round((mTotalGold / 1000) * goldRateVND);
    let mGoldPerHour = mTotalHours > 0 ? (mTotalGold / mTotalHours) : 0;
    let mVndPerHour = mTotalHours > 0 ? (mTotalVND / mTotalHours) : 0;

    // --- 3. TÍNH TÀNG KIẾM ---
    let isTangkiemX3 = document.getElementById('chk-opt-tangkiem-x3')?.checked || false;
    let tkTeams = parseInt(document.getElementById('input-opt-tangkiem-teams')?.value) || 1;
    let tkTicketPrice = parseFloat(document.getElementById('input-opt-tangkiem-ticket')?.value) || 23;
    let tkMinsPerTeam = parseFloat(document.getElementById('input-opt-tangkiem-mins-per-team')?.value) || 15;

    let tkTotalMins = isTangkiemX3 ? (tkTeams * ((3 * tkMinsPerTeam) + 10)) : (tkTeams * tkMinsPerTeam);
    let tkTotalHours = tkTotalMins / 60;

    let tkRunsPerTeam = isTangkiemX3 ? 3 : 1;
    let tkBossGold = tkTeams * (tkRunsPerTeam * 45);
    let tkRebateGold = isTangkiemX3 ? (tkTeams * 400) : 0;
    let tkMaterials = isEvent ? (tkTeams * 8 * (isTangkiemX3 ? (24 + 48 + 48) : 24)) : 0;
    let tkMaterialGold = tkMaterials * matPrice;
    let tkTicketCost = isTangkiemX3 ? (tkTeams * 16 * tkTicketPrice) : 0;

    let tkCaptainGold = (isCaptainBonusTK && isTangkiemX3) ? (tkTeams * 2 * captainBonusGoldTK) : 0;
    let tkTotalIncomeGold = tkBossGold + tkRebateGold + tkMaterialGold + tkCaptainGold;
    let tkProfitGold = tkTotalIncomeGold - tkTicketCost;
    let tkProfitVND = Math.round((tkProfitGold / 1000) * goldRateVND);

    let tkDisplayGold = isProfitLoss ? tkProfitGold : tkTotalIncomeGold;
    let tkDisplayVND = isProfitLoss ? tkProfitVND : Math.round((tkTotalIncomeGold / 1000) * goldRateVND);
    let tkGoldPerHour = tkTotalHours > 0 ? (tkDisplayGold / tkTotalHours) : 0;
    let tkVndPerHour = tkTotalHours > 0 ? (tkDisplayVND / tkTotalHours) : 0;

    return {
        isEvent, isProfitLoss, isAddDeo, isCaptainBonusTH, isCaptainBonusTK,
        thaihu: {
            teams: thaihuTeams, totalMins: thaihuTotalMins, displayGold: thDisplayGold,
            displayVND: thDisplayVND, gPerHour: thGoldPerHour, vPerHour: thVndPerHour,
            materials: thMaterials, materialGold: thMaterialGold, totalIncomeGold: thTotalIncomeGold,
            ticketCost: thTicketCost, profitGold: thProfitGold, profitVND: thProfitVND,
            profitPerAcc: thProfitPerAcc, captainGold: thCaptainGold, deoStr: avgDeoRateStr
        },
        merchant: {
            totalMins: mTotalMins, totalGold: mTotalGold, totalVND: mTotalVND,
            gPerHour: mGoldPerHour, vPerHour: mVndPerHour, accPerHour: mAccPerHour,
            materials: mTotalMaterials, materialGold: mMaterialGold
        },
        tangkiem: {
            teams: tkTeams, totalMins: tkTotalMins, displayGold: tkDisplayGold,
            displayVND: tkDisplayVND, gPerHour: tkGoldPerHour, vPerHour: tkVndPerHour,
            materials: tkMaterials, materialGold: tkMaterialGold, totalIncomeGold: tkTotalIncomeGold,
            ticketCost: tkTicketCost, profitGold: tkProfitGold, profitVND: tkProfitVND,
            captainGold: tkCaptainGold, isX3: isTangkiemX3
        }
    };
}

window.executeOptimizationCalculations = executeOptimizationCalculations;

// Tổng số dòng code trong file này: 220 dòng.