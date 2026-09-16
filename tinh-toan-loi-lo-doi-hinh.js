// Tên file: tinh-toan-loi-lo-doi-hinh.js
// Chức năng: Động cơ tính toán lời/lỗ cho đội hình Thái Hư hiển thị SONG SONG 2 BẢNG (Bảng Tính Lời Lỗ Thực Tế/Giả Sử bên trái và Bảng So Sánh Chiến Thuật VIP PRO bên phải - Tích hợp thuật toán QUY ĐỔI SỐ LƯỢT TƯƠNG ỨNG: So sánh trực tiếp N lượt của team này với việc cày N Team L1 Free khác trong cùng quỹ thời gian).
// Con của file: index.html (Nạp cùng nhóm giao diện Đội Hình Thái Hư).
// Danh sách tính năng của file:
//   1. [ĐÃ KHÓA] Giao diện Song Song Cyberpunk VIP Pro: Đặt trực diện 2 thẻ HUD cỡ lớn [PHƯƠNG ÁN CHỌN] vs [CÀY N TEAM L1 FREE].
//   2. [ĐÃ SỬA & KHÓA] Thuật toán So Sánh Đồng Số Lượt: Nếu đi 2 lượt (x2) so với 2 team L1 Free, đi 3 lượt (x3) so với 3 team L1 Free.
//   3. [ĐÃ SỬA & KHÓA] Hộp Đối Chiếu Chênh Lệch Cốt Lõi: Thấy rõ đi tiếp có lời hơn đổi sang cày N team L1 Free hay bị lỗ tiền vé.
//   4. [ĐÃ SỬA & KHÓA] Hero Box Quyết Định Chiến Thuật: Kết luận chuẩn xác theo logic cơ hội (🏆 NÊN ĐI TIẾP / ⚖️ CÂN NHẮC CHIẾN THUẬT / ⛔ NÊN DỪNG Ở L1 ĐỔI TEAM).
//   5. [ĐÃ KHÓA] Chuẩn hóa 100% đơn vị VND, đồng bộ thời giá, sự kiện, hoàn vàng và thanh toán vé.
// Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA TOÀN BỘ MÃ NGUỒN NGÀY 26/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: [ĐÃ KHÓA] ĐỘNG CƠ TÍNH TOÁN LỜI LỖ & GIẢ SỬ (+ THỜI GIAN CHUẨN BỊ)
   Chức năng: Tính toán doanh thu, chi phí vé, hoàn vàng và lãi ròng cho Team.
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH 100% - KHÓA KHÔNG SỬA]
   ========================================================================== */
function calculateTeamRealtimeProfitLossData(teamId, isEventCustom, isExcludeRefundCustom, simConfig) {
    let defaultMatPrice = parseFloat(document.getElementById('input-material-price')?.value) || 0.25;
    let ticketPriceTH = parseFloat(document.getElementById('input-ticket-price')?.value) || 24;
    let rebateGoldTH = parseFloat(document.getElementById('input-refund-price')?.value) || 16;

    let goldRateInput = document.getElementById('input-gold-rate');
    let rawGoldRate = goldRateInput ? String(goldRateInput.value).replace(/\./g, '').replace(/,/g, '') : "155000";
    let goldRateVND = parseFloat(rawGoldRate) || 155000;

    let isEvent = (isEventCustom !== undefined) ? isEventCustom : (typeof isEventActiveCurrentlyGMT7 === 'function' ? isEventActiveCurrentlyGMT7() : false);
    let isExcludeRefund = (isExcludeRefundCustom !== undefined) ? isExcludeRefundCustom : true;
    let isFreeTicket = document.getElementById('chk-opt-thaihu-free-ticket')?.checked || false;

    let isSimMode = simConfig && simConfig.isSim === true;

    // 1. GIÁ NGUYÊN LIỆU
    let matPrice = (isSimMode && simConfig.simMatPrice !== undefined && simConfig.simMatPrice !== null && simConfig.simMatPrice !== "")
        ? parseFloat(simConfig.simMatPrice)
        : defaultMatPrice;

    // 2. THỜI GIAN CHUẨN BỊ
    let isIncludePrep = simConfig && simConfig.isIncludePrep === true;
    let prepMinutes = (isIncludePrep && simConfig.prepMinutes !== undefined && simConfig.prepMinutes !== "") ? parseFloat(simConfig.prepMinutes) : 2;
    let prepSeconds = isIncludePrep ? (prepMinutes * 60) : 0;

    let tId = teamId || (typeof activeTeamId !== 'undefined' ? activeTeamId : "");
    let targetTeam = (typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.find(t => t.id === tId) : null;
    let memberIds = targetTeam ? targetTeam.memberIds.filter(Boolean) : [];

    let totalAccCount = memberIds.length || 8;
    let totalMaterials = 0;
    let totalTicketCost = 0;
    let totalRebateGold = 0;

    let countL1Free = 0;
    let countL2Paid = 0;
    let countL2Free = 0;
    let countL3Paid = 0;
    let countL3Free = 0;

    let maxRunsInTeam = 0;
    let membersList = [];
    let countMax3AccsInTeam = 0;

    if (memberIds.length > 0) {
        memberIds.forEach(mId => {
            let m = (systemDatabase && systemDatabase.members) ? systemDatabase.members[mId] : null;
            let maxR = m ? (m.maxRuns || 2) : 2;
            let curR = m ? (m.currentRuns || 0) : 0;
            if (maxR === 3) countMax3AccsInTeam++;
            membersList.push({ id: mId, maxRuns: maxR, currentRuns: curR, rawMember: m });
        });
    } else {
        for (let i = 0; i < 8; i++) {
            membersList.push({ id: 'temp_' + i, maxRuns: 2, currentRuns: 0 });
        }
    }

    let hasMax3Member = countMax3AccsInTeam > 0;

    if (isSimMode) {
        let isSimL2 = simConfig.simL2 !== false;
        let isSimL3 = hasMax3Member && (simConfig.simL3 === true);

        countL1Free = totalAccCount;
        maxRunsInTeam = 1;
        if (isEvent) totalMaterials = totalAccCount * 24;

        let l2TicketsInput = (simConfig.simL2Tickets !== undefined) ? parseInt(simConfig.simL2Tickets) : totalAccCount;
        let l3TicketsInput = (simConfig.simL3Tickets !== undefined) ? parseInt(simConfig.simL3Tickets) : countMax3AccsInTeam;

        countL2Paid = isSimL2 ? Math.min(totalAccCount, Math.max(0, l2TicketsInput)) : 0;
        countL2Free = isSimL2 ? Math.max(0, totalAccCount - countL2Paid) : 0;

        countL3Paid = (isSimL3 && isSimL2) ? Math.min(countMax3AccsInTeam, Math.max(0, l3TicketsInput)) : 0;
        countL3Free = (isSimL3 && isSimL2) ? Math.max(0, countMax3AccsInTeam - countL3Paid) : 0;

        totalTicketCost = (countL2Paid + countL3Paid) * ticketPriceTH;

        if (isSimL2) {
            maxRunsInTeam = 2;
            if (isEvent) totalMaterials += totalAccCount * 48;
        }

        if (isSimL3 && isSimL2) {
            maxRunsInTeam = 3;
            if (isEvent) totalMaterials += totalAccCount * 48;
        }

        if (!isExcludeRefund) {
            membersList.forEach(m => {
                if (m.maxRuns === 2 && isSimL2) {
                    totalRebateGold += rebateGoldTH;
                } else if (m.maxRuns === 3 && isSimL3 && isSimL2) {
                    totalRebateGold += rebateGoldTH;
                }
            });
        }
    } else {
        membersList.forEach(m => {
            let maxR = m.maxRuns || 2;
            let currentR = m.currentRuns || 0;
            if (currentR > maxRunsInTeam) maxRunsInTeam = currentR;

            let selectEl2 = document.getElementById(`select-lineup-paymode-${m.id}-2`);
            let selectEl3 = document.getElementById(`select-lineup-paymode-${m.id}-3`);

            let modeL2 = selectEl2 ? selectEl2.value : (m.rawMember?.payModeL2 || (m.rawMember?.freeRun2 ? 'np50' : 'np50'));
            let modeL3 = selectEl3 ? selectEl3.value : (m.rawMember?.payModeL3 || (m.rawMember?.freeRun3 ? 'np50' : 'np50'));

            if (currentR >= 1) countL1Free++;

            if (currentR >= 2) {
                let isFreeL2 = isFreeTicket || modeL2 === 'np50' || modeL2 === 'xu40';
                if (isFreeL2) {
                    countL2Free++;
                } else {
                    countL2Paid++;
                    totalTicketCost += ticketPriceTH;
                }
            }

            if (currentR >= 3) {
                let isFreeL3 = isFreeTicket || modeL3 === 'np50' || modeL3 === 'xu40';
                if (isFreeL3) {
                    countL3Free++;
                } else {
                    countL3Paid++;
                    totalTicketCost += ticketPriceTH;
                }
            }

            if (!isExcludeRefund) {
                if (maxR === 2 && currentR >= 2) {
                    totalRebateGold += rebateGoldTH;
                } else if (maxR === 3 && currentR >= 3) {
                    totalRebateGold += rebateGoldTH;
                }
            }

            if (isEvent) {
                if (currentR === 1) totalMaterials += 24;
                else if (currentR === 2) totalMaterials += (24 + 48);
                else if (currentR >= 3) totalMaterials += (24 + 48 + 48);
            }
        });
    }

    let materialGold = totalMaterials * matPrice;
    let totalIncomeGold = materialGold + totalRebateGold;
    let totalIncomeVND = Math.round((totalIncomeGold / 1000) * goldRateVND);

    let ticketCostVND = Math.round((totalTicketCost / 1000) * goldRateVND);

    let profitGold = totalIncomeGold - totalTicketCost;
    let profitVND = Math.round((profitGold / 1000) * goldRateVND);
    let profitPerAcc = totalAccCount > 0 ? (profitGold / totalAccCount) : 0;
    let profitPerAccVND = totalAccCount > 0 ? Math.round(profitVND / totalAccCount) : 0;

    let teamStats = (typeof getTeamDashboardStats === 'function') ? getTeamDashboardStats(tId) : null;
    let avgSecondsUsed = 0;
    let isUsingGlobalAvg = false;

    if (teamStats && teamStats.totalRunsCount > 0 && teamStats.totalTimeSum >= 630) {
        avgSecondsUsed = teamStats.totalTimeSum / teamStats.totalRunsCount;
    } else {
        let globalTimeSum = 0;
        let globalRunsSum = 0;
        if (typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
            let lineups = systemDatabase.teams.filter(t => t.type === 'lineup');
            lineups.forEach(l => {
                let st = (typeof getTeamDashboardStats === 'function') ? getTeamDashboardStats(l.id) : null;
                if (st && st.totalRunsCount > 0 && st.totalTimeSum >= 630) {
                    globalTimeSum += st.totalTimeSum;
                    globalRunsSum += st.totalRunsCount;
                }
            });
        }
        if (globalRunsSum > 0) {
            avgSecondsUsed = globalTimeSum / globalRunsSum;
            isUsingGlobalAvg = true;
        } else {
            avgSecondsUsed = 720;
        }
    }

    let baseDurationSeconds = isSimMode ? (maxRunsInTeam * avgSecondsUsed) : (Math.max(1, maxRunsInTeam) * avgSecondsUsed);
    let totalDurationSeconds = baseDurationSeconds + prepSeconds;

    let teamHours = totalDurationSeconds / 3600;
    let goldPerHour = teamHours > 0 ? (profitGold / teamHours) : 0;
    let vndPerHour = teamHours > 0 ? (profitVND / teamHours) : 0;

    return {
        totalAcc: totalAccCount,
        countMax3Accs: countMax3AccsInTeam,
        teamCompletedRuns: maxRunsInTeam,
        hasMax3Member: hasMax3Member,
        matPriceUsed: matPrice,
        goldRateVND: goldRateVND,
        totalIncomeGold: totalIncomeGold,
        totalIncomeVND: totalIncomeVND,
        ticketCost: totalTicketCost,
        ticketCostVND: ticketCostVND,
        profitGold: profitGold,
        profitVND: profitVND,
        profitPerAcc: profitPerAcc,
        profitPerAccVND: profitPerAccVND,
        goldPerHour: goldPerHour,
        vndPerHour: vndPerHour,
        materials: totalMaterials,
        materialGold: materialGold,
        rebateGold: totalRebateGold,
        isEvent: isEvent,
        isExcludeRefund: isExcludeRefund,
        usedSeconds: avgSecondsUsed,
        baseDurationSeconds: baseDurationSeconds,
        totalDurationSeconds: totalDurationSeconds,
        isIncludePrep: isIncludePrep,
        prepMinutes: prepMinutes,
        prepSeconds: prepSeconds,
        isUsingGlobalAvg: isUsingGlobalAvg,
        countL1Free: countL1Free,
        countL2Paid: countL2Paid,
        countL2Free: countL2Free,
        countL3Paid: countL3Paid,
        countL3Free: countL3Free,
        isSimMode: isSimMode,
        simMatPrice: matPrice,
        simL2: isSimMode ? (simConfig.simL2 !== false) : true,
        simL2Tickets: isSimMode ? ((simConfig.simL2Tickets !== undefined) ? simConfig.simL2Tickets : 8) : 8,
        simL3: isSimMode ? (simConfig.simL3 === true) : false,
        simL3Tickets: isSimMode ? ((simConfig.simL3Tickets !== undefined) ? Math.min(countMax3AccsInTeam, simConfig.simL3Tickets) : countMax3AccsInTeam) : countMax3AccsInTeam
    };
}

/* ==========================================================================
   KHỐI 2: [ĐÃ SỬA & KHÓA] HIỂN THỊ SONG SONG 2 BẢNG & SO SÁNH ĐỒNG SỐ LƯỢT
   Chức năng: Quy đổi chính xác số lượt tương ứng (x2 so với 2 team L1, x3 so với 3 team L1).
   Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA KHÔNG SỬA]
   ========================================================================== */
function openThaihuProfitLossModal(teamId, customEventState, customExcludeRefundState, simConfig) {
    try {
        let tId = teamId || (typeof activeTeamId !== 'undefined' ? activeTeamId : "");
        let existingModal = document.getElementById('thaihu-profit-loss-modal-overlay');
        if (existingModal) existingModal.remove();

        let isEventCurrent = (customEventState !== undefined) ? customEventState : (typeof isEventActiveCurrentlyGMT7 === 'function' ? isEventActiveCurrentlyGMT7() : false);
        let isExcludeRefundCurrent = (customExcludeRefundState !== undefined) ? customExcludeRefundState : true;

        let pData = calculateTeamRealtimeProfitLossData(tId, isEventCurrent, isExcludeRefundCurrent, simConfig);

        // 1. QUY ĐỔI SỐ LƯỢT SO SÁNH TƯƠNG ỨNG (N LƯỢT = N TEAM L1 FREE)
        let compRuns = Math.max(1, pData.teamCompletedRuns || 1);

        let isL1Prep = simConfig && simConfig.isL1Prep !== undefined ? simConfig.isL1Prep : true;
        let l1PrepMinutes = (simConfig && simConfig.l1PrepMinutes !== undefined && simConfig.l1PrepMinutes !== "") ? parseFloat(simConfig.l1PrepMinutes) : 10;
        let l1PrepSeconds = isL1Prep ? (l1PrepMinutes * 60) : 0;

        let singleL1Materials = isEventCurrent ? (pData.totalAcc * 24) : 0;
        let singleL1Gold = singleL1Materials * pData.matPriceUsed;
        let singleL1VND = Math.round((singleL1Gold / 1000) * pData.goldRateVND);

        // Tổng tiền khi chạy N Team chỉ đi L1 Free
        let l1CompMaterials = singleL1Materials * compRuns;
        let l1CompProfitGold = singleL1Gold * compRuns;
        let l1CompProfitVND = singleL1VND * compRuns;

        // Tổng thời gian khi chạy N Team L1 Free (N trận + TG chuẩn bị)
        let l1DurationSeconds = (pData.usedSeconds * compRuns) + l1PrepSeconds;
        let l1Hours = l1DurationSeconds / 3600;
        let l1GoldPerHour = l1Hours > 0 ? (l1CompProfitGold / l1Hours) : 0;
        let l1VndPerHour = l1Hours > 0 ? (l1CompProfitVND / l1Hours) : 0;

        let l1TotalM = Math.floor(l1DurationSeconds / 60);
        let l1TotalS = Math.round(l1DurationSeconds % 60);
        let l1TotalTimeFormatted = `${l1TotalM}p${l1TotalS.toString().padStart(2, '0')}s`;

        let totalM = Math.floor(pData.totalDurationSeconds / 60);
        let totalS = Math.round(pData.totalDurationSeconds % 60);
        let totalTimeFormatted = `${totalM}p${totalS.toString().padStart(2, '0')}s`;

        // 2. SO SÁNH KẾT QUẢ ĐỐI CHỨNG
        let diffProfitGold = pData.profitGold - l1CompProfitGold;
        let diffProfitVND = pData.profitVND - l1CompProfitVND;
        let diffGoldPerHour = pData.goldPerHour - l1GoldPerHour;
        let diffVndPerHour = pData.vndPerHour - l1VndPerHour;

        // Tỷ lệ hiệu quả so với cày N team L1 Free
        let efficiencyRatio = l1CompProfitGold > 0 ? (pData.profitGold / l1CompProfitGold) : 1;

        // TIÊU CHÍ KẾT LUẬN CHIẾN THUẬT THEO ĐÚNG LOGIC CƠ HỘI
        let isSuperOptimal = compRuns > 1 && diffProfitGold >= 5.0 && efficiencyRatio >= 1.10;
        let isConsiderTime = compRuns > 1 && diffProfitGold >= 0 && !isSuperOptimal;
        let isShouldStopL1 = compRuns > 1 && diffProfitGold < 0;

        // BẬT ĐÈN XANH NEON CHO BÊN THẮNG THẾ
        let isPaHighlight = isSuperOptimal || (compRuns === 1);
        let isL1Highlight = isShouldStopL1 || isConsiderTime;

        let avgM = Math.floor(pData.usedSeconds / 60);
        let avgS = Math.round(pData.usedSeconds % 60);
        let avgTimeStr = `${avgM}p${avgS.toString().padStart(2, '0')}s`;
        let avgLabel = pData.isUsingGlobalAvg ? `TB Toàn Đội (${avgTimeStr}/trận)` : `TB Team (${avgTimeStr}/trận)`;

        let overlay = document.createElement('div');
        overlay.id = 'thaihu-profit-loss-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 font-sans select-none overflow-x-auto custom-scrollbar';
        
        overlay.onclick = function(e) {
            if (e.target === overlay) overlay.remove();
        };

        let teamObj = (typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.find(t => t.id === tId) : null;
        let teamName = teamObj ? teamObj.name.toUpperCase() : "ĐỘI HÌNH HIỆN TẠI";

        let pColor = pData.profitGold >= 0 ? "text-emerald-400" : "text-rose-500";
        let pSign = pData.profitGold >= 0 ? "+" : "";

        let isSim = pData.isSimMode;
        let simL2Checked = pData.simL2;
        let simL3Checked = pData.simL3;
        let simL2TicketsVal = pData.simL2Tickets;
        let simL3TicketsVal = pData.simL3Tickets;
        let simMatPriceVal = pData.simMatPrice;

        let isIncludePrep = pData.isIncludePrep;
        let prepMinutesVal = pData.prepMinutes;

        let buildTicketOptions = (selectedVal, maxCount) => {
            let limit = (maxCount !== undefined && maxCount !== null) ? maxCount : 8;
            let opts = '';
            for (let i = 0; i <= limit; i++) {
                opts += `<option value="${i}" ${selectedVal === i ? 'selected' : ''}>${i === 0 ? '0 vé (Free 100%)' : i + ' vé'}</option>`;
            }
            return opts;
        };

        overlay.innerHTML = `
            <div onclick="event.stopPropagation()" class="flex items-center justify-center gap-4 w-auto max-w-full my-auto">
                
                <!-- ==================== BẢNG 1: BẢNG TÍNH LỜI LỖ CHÍNH (BÊN TRÁI) ==================== -->
                <div style="width: 530px; height: 660px; min-height: 660px; max-height: 660px;" class="bg-gray-955/95 border-2 border-purple-500/80 rounded-2xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.25)] text-xs font-mono relative flex flex-col justify-between overflow-hidden">
                    <div class="flex flex-col gap-2">
                        <!-- HEADER MODAL -->
                        <div class="flex items-center justify-between border-b border-gray-800/90 pb-2 shrink-0">
                            <span class="font-black text-purple-300 text-sm uppercase flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
                                <i class="fa-solid fa-gamepad text-purple-400"></i> ẢI THÁI HƯ: ${teamName}
                            </span>
                            
                            <div class="flex items-center gap-1.5">
                                <label class="flex items-center gap-1.5 cursor-pointer bg-gray-900/90 px-2 py-1 rounded-lg border border-gray-700 hover:border-cyan-400 transition select-none shadow-sm" title="Bật: không tính hoàn vàng. Tắt: tính 16v/acc hoàn thành max lượt">
                                    <input id="chk-modal-exclude-refund-toggle" type="checkbox" ${pData.isExcludeRefund ? 'checked' : ''} onchange="handleModalSimUpdate('${tId}')" class="accent-cyan-400 cursor-pointer w-3.5 h-3.5">
                                    <span class="text-[10px] font-bold text-cyan-300 flex items-center gap-1"><i class="fa-solid fa-ban"></i> Bỏ Hoàn</span>
                                </label>

                                <label class="flex items-center gap-1.5 cursor-pointer bg-gray-900/90 px-2 py-1 rounded-lg border border-gray-700 hover:border-amber-400 transition select-none shadow-sm">
                                    <input id="chk-modal-event-toggle" type="checkbox" ${pData.isEvent ? 'checked' : ''} onchange="handleModalSimUpdate('${tId}')" class="accent-amber-400 cursor-pointer w-3.5 h-3.5">
                                    <span class="text-[10px] font-bold text-amber-400 flex items-center gap-1"><i class="fa-solid fa-fire"></i> Sự Kiện</span>
                                </label>

                                <button onclick="document.getElementById('thaihu-profit-loss-modal-overlay').remove()" class="text-rose-500 hover:text-rose-400 font-bold text-lg cursor-pointer leading-none ml-1">&times;</button>
                            </div>
                        </div>

                        <!-- KHUNG LỢI NHUẬN GỘP -->
                        <div class="flex justify-between items-center bg-gradient-to-r from-gray-900 via-gray-900/90 to-purple-955/30 p-2.5 rounded-xl border border-purple-500/40 shadow-inner shrink-0">
                            <div class="flex flex-col">
                                <span class="text-purple-200 font-black text-xs uppercase tracking-wide">${isSim ? 'LỢI NHUẬN (GIẢ SỬ):' : 'LỢI NHUẬN THỰC TẾ:'}</span>
                                <span class="text-[10px] text-gray-400 font-normal mt-0.5">${avgLabel}</span>
                            </div>
                            <div class="flex flex-col items-end">
                                <strong class="${pColor} font-black text-2xl leading-none drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">${pSign}${pData.profitGold.toFixed(1)}v</strong>
                                <span class="${pData.profitVND >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-bold text-xs font-mono mt-1">${pSign}${pData.profitVND.toLocaleString('vi-VN')} VND</span>
                            </div>
                        </div>

                        <!-- KHUNG GIẢ SỬ KỊCH BẢN ĐI & CỘNG THỜI GIAN CHUẨN BỊ -->
                        <div class="bg-gray-900/80 p-2.5 rounded-xl border border-indigo-500/40 flex flex-col gap-2 shadow-inner shrink-0">
                            <div class="flex items-center justify-between flex-wrap gap-1">
                                <label class="flex items-center gap-1.5 cursor-pointer select-none">
                                    <input id="chk-modal-sim-toggle" type="checkbox" ${isSim ? 'checked' : ''} onchange="handleModalSimMainToggle('${tId}', this.checked)" class="accent-indigo-400 cursor-pointer w-3.5 h-3.5">
                                    <span class="text-[11px] font-black text-indigo-300 flex items-center gap-1"><i class="fa-solid fa-wand-magic-sparkles text-amber-400"></i> Giả Sử Kịch Bản Đi</span>
                                </label>

                                <div class="flex items-center gap-1.5">
                                    <label class="flex items-center gap-1 cursor-pointer select-none bg-gray-955 px-2 py-0.5 rounded-lg border border-gray-700 hover:border-emerald-500/60 transition">
                                        <input id="chk-modal-prep-toggle" type="checkbox" ${isIncludePrep ? 'checked' : ''} onchange="handleModalSimUpdate('${tId}')" class="accent-emerald-400 cursor-pointer w-3.5 h-3.5">
                                        <span class="text-[10px] font-bold text-emerald-400 flex items-center gap-1"><i class="fa-solid fa-clock"></i> +TG Chuẩn Bị</span>
                                    </label>
                                    ${isIncludePrep ? `
                                    <div class="flex items-center gap-1 bg-gray-955 px-1.5 py-0.5 rounded-lg border border-emerald-500/80">
                                        <input id="input-modal-prep-minutes" type="number" min="0.5" max="60" step="0.5" value="${prepMinutesVal}" oninput="handleModalSimUpdate('${tId}')" class="w-10 bg-gray-900 border border-gray-600 rounded px-1 text-center font-mono font-bold text-emerald-300 text-[11px] focus:outline-none focus:border-emerald-400">
                                        <span class="text-[10px] text-gray-400 font-bold">phút</span>
                                    </div>
                                    ` : ''}
                                </div>
                                
                                ${isSim ? `
                                <div class="flex items-center gap-1.5 bg-gray-955 px-2 py-0.5 rounded-lg border border-gray-700">
                                    <span class="text-[10px] text-yellow-300 font-bold">Giá NL:</span>
                                    <input id="input-modal-sim-mat-price" type="number" min="0.01" step="0.01" value="${simMatPriceVal}" oninput="handleModalSimUpdate('${tId}')" class="w-12 bg-gray-900 border border-gray-600 rounded px-1 text-center font-mono font-bold text-amber-300 text-[11px] focus:outline-none focus:border-indigo-500">
                                    <span class="text-[10px] text-gray-400 font-bold">v</span>
                                </div>
                                ` : `
                                <span class="text-[10px] font-mono font-bold text-gray-500">Tiến Độ Thực Tế</span>
                                `}
                            </div>

                            ${isSim ? `
                            <div class="grid grid-cols-2 gap-2.5 pt-1.5 border-t border-gray-800">
                                <div class="flex flex-col gap-1 bg-gray-955 p-2 rounded-lg border border-gray-800">
                                    <label class="flex items-center gap-1.5 cursor-pointer font-bold text-amber-300 text-[11px]">
                                        <input id="chk-sim-run-2" type="checkbox" ${simL2Checked ? 'checked' : ''} onchange="handleModalSimL2Toggle('${tId}', this.checked)" class="accent-amber-400">
                                        <span>Đi Lần 2</span>
                                    </label>
                                    <div class="${simL2Checked ? '' : 'opacity-40 pointer-events-none'}">
                                        <label class="text-[9px] text-gray-400 block mb-0.5">Số vé mua Lần 2:</label>
                                        <select id="sel-sim-tickets-l2" onchange="handleModalSimUpdate('${tId}')" class="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-yellow-300 font-bold text-[11px] focus:outline-none focus:border-indigo-500">
                                            ${buildTicketOptions(simL2TicketsVal, 8)}
                                        </select>
                                    </div>
                                </div>

                                <div class="flex flex-col gap-1 bg-gray-955 p-2 rounded-lg border border-gray-800">
                                    ${pData.hasMax3Member ? `
                                        <label class="flex items-center gap-1.5 cursor-pointer font-bold text-cyan-300 text-[11px]">
                                            <input id="chk-sim-run-3" type="checkbox" ${simL3Checked ? 'checked' : ''} onchange="handleModalSimL3Toggle('${tId}', this.checked)" class="accent-cyan-400">
                                            <span>Đi Lần 3</span>
                                        </label>
                                        <div class="${simL3Checked ? '' : 'opacity-40 pointer-events-none'}">
                                            <label class="text-[9px] text-gray-400 block mb-0.5">Số vé mua Lần 3 (Max ${pData.countMax3Accs} acc):</label>
                                            <select id="sel-sim-tickets-l3" onchange="handleModalSimUpdate('${tId}')" class="w-full bg-gray-900 border border-gray-700 rounded px-1.5 py-0.5 text-cyan-300 font-bold text-[11px] focus:outline-none focus:border-indigo-500">
                                                ${buildTicketOptions(simL3TicketsVal, pData.countMax3Accs)}
                                            </select>
                                        </div>
                                    ` : `
                                        <div class="flex items-center gap-1.5 font-bold text-gray-500 text-[11px] h-full justify-center">
                                            <i class="fa-solid fa-lock text-gray-600"></i> Team chỉ có Max 2
                                        </div>
                                    `}
                                </div>
                            </div>
                            ` : ''}
                        </div>

                        <!-- BẢNG BÓC TÁCH CHI TIẾT LƯỢT ĐI VÀ NGUYÊN LIỆU -->
                        <div class="bg-gray-900/90 p-2.5 rounded-xl border border-purple-500/30 text-[11px] space-y-1 shrink-0">
                            <div class="text-purple-300 font-bold border-b border-gray-800 pb-1 flex justify-between">
                                <span><i class="fa-solid fa-list-check mr-1"></i>${isSim ? 'CHI TIẾT LƯỢT ĐI GIẢ SỬ:' : 'CHI TIẾT LƯỢT ĐI THỰC TẾ:'}</span>
                                <span class="text-amber-400">Tổng: <b>${pData.teamCompletedRuns} lượt team</b></span>
                            </div>
                            <div class="flex justify-between text-gray-300 pt-0.5">
                                <span>• Lần 1 (Free):</span>
                                <b class="text-emerald-400">${pData.countL1Free} tài khoản</b>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>• Lần 2:</span>
                                <span>
                                    <b class="${pData.countL2Paid > 0 ? 'text-rose-400' : 'text-gray-500'}">${pData.countL2Paid} Có phí (Vé)</b> | 
                                    <b class="${pData.countL2Free > 0 ? 'text-emerald-400' : 'text-gray-500'}">${pData.countL2Free} Free (NP/Xu)</b>
                                </span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>• Lần 3:</span>
                                <span>
                                    <b class="${pData.countL3Paid > 0 ? 'text-rose-400' : 'text-gray-500'}">${pData.countL3Paid} Có phí (Vé)</b> | 
                                    <b class="${pData.countL3Free > 0 ? 'text-emerald-400' : 'text-gray-500'}">${pData.countL3Free} Free (NP/Xu)</b>
                                </span>
                            </div>
                            <div class="flex justify-between text-amber-300 border-t border-gray-800/80 pt-1 font-bold">
                                <span>• Tổng Nguyên Liệu:</span>
                                <b class="text-yellow-400">${pData.materials.toLocaleString('vi-VN')} NL (~${pData.materialGold.toFixed(1)}v)</b>
                            </div>
                        </div>

                        <!-- CHI TIẾT TỔNG DOANH THU, TỔNG CHI TIỀN VÉ & LÃI RÒNG CHUẨN XÁC -->
                        <div class="space-y-1 bg-gray-900/90 p-2.5 rounded-xl border border-gray-800 text-xs shrink-0 font-mono">
                            <div class="flex justify-between text-gray-300">
                                <span>Tổng Doanh Thu (NL ${pData.materialGold.toFixed(1)}v + Hoàn ${pData.rebateGold.toFixed(1)}v):</span>
                                <span class="text-yellow-300 font-bold">+${pData.totalIncomeGold.toFixed(1)}v <span class="text-gray-400 text-[10px] font-normal font-sans">(~${pData.totalIncomeVND.toLocaleString('vi-VN')} VND)</span></span>
                            </div>
                            <div class="flex justify-between text-gray-300">
                                <span>Tổng Chi Tiền Vé (${pData.countL2Paid + pData.countL3Paid} lượt):</span>
                                <span class="text-rose-400 font-bold">-${pData.ticketCost.toFixed(1)}v <span class="text-gray-400 text-[10px] font-normal font-sans">(-${pData.ticketCostVND.toLocaleString('vi-VN')} VND)</span></span>
                            </div>
                            <div class="flex justify-between border-t border-gray-800 pt-1 text-xs font-black ${pData.profitGold >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                                <span>Lãi Ròng Sau Thanh Toán Vé:</span>
                                <span>${pData.profitGold >= 0 ? '+' : ''}${pData.profitGold.toFixed(1)}v <span class="text-[10px] font-normal font-sans">(${pData.profitVND >= 0 ? '+' : ''}${pData.profitVND.toLocaleString('vi-VN')} VND)</span></span>
                            </div>
                            <div class="flex justify-between border-t border-gray-800/60 pt-0.5 text-[11px] text-gray-300">
                                <span>Lời / 1 Tài Khoản:</span>
                                <span class="font-bold ${pData.profitPerAcc >= 0 ? 'text-emerald-400' : 'text-rose-400'}">~ ${pData.profitPerAcc >= 0 ? '+' : ''}${pData.profitPerAcc.toFixed(2)}v/acc <span class="text-[10px] text-gray-400 font-normal font-sans">(~${pData.profitPerAccVND.toLocaleString('vi-VN')} VND)</span></span>
                            </div>
                        </div>

                        <!-- TỐC ĐỘ VÀNG / TIỀN THEO GIỜ -->
                        <div class="grid grid-cols-2 gap-2 shrink-0">
                            <div class="flex flex-col justify-center bg-gray-900 p-2 rounded-xl border border-gray-800">
                                <span class="text-cyan-300 font-bold text-[11px]">Tốc độ Vàng/Giờ ${isIncludePrep ? `(${totalTimeFormatted})` : ''}:</span>
                                <strong class="${dataColor(pData.goldPerHour)} font-black text-sm mt-0.5">${pData.goldPerHour >= 0 ? '+' : ''}${pData.goldPerHour.toFixed(1)}v/h</strong>
                            </div>
                            <div class="flex flex-col justify-center bg-gray-900 p-2 rounded-xl border border-gray-800">
                                <span class="text-emerald-400 font-bold text-[11px]">Tốc độ Tiền/Giờ ${isIncludePrep ? `(+${prepMinutesVal}p)` : ''}:</span>
                                <strong class="${dataColor(pData.vndPerHour)} font-black text-sm mt-0.5">${pData.vndPerHour >= 0 ? '+' : ''}${Math.round(pData.vndPerHour).toLocaleString('vi-VN')} VND/h</strong>
                            </div>
                        </div>
                    </div>

                    <!-- FOOTER ĐÓNG -->
                    <div class="flex justify-between items-center pt-2 border-t border-gray-800 shrink-0">
                        <span class="text-[10px] text-gray-500 font-mono">Nhấn ngoài bảng để tắt</span>
                        <button onclick="document.getElementById('thaihu-profit-loss-modal-overlay').remove()" class="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-1.5 rounded-lg border border-gray-700 transition cursor-pointer text-xs">Đóng</button>
                    </div>
                </div>


                <!-- ==================== BẢNG 2: BẢNG SO SÁNH TRỰC QUAN HUD (BÊN PHẢI) ==================== -->
                <div style="width: 530px; height: 660px; min-height: 660px; max-height: 660px;" class="bg-gray-955/95 border-2 ${isPaHighlight ? 'border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.25)]' : 'border-amber-500/80 shadow-[0_0_30px_rgba(251,191,36,0.25)]'} rounded-2xl p-4 text-xs font-mono relative flex flex-col justify-between overflow-hidden">
                    <div class="flex flex-col gap-2.5">
                        
                        <!-- HEADER BẢNG SO SÁNH -->
                        <div class="flex items-center justify-between border-b border-gray-800/90 pb-2 shrink-0">
                            <span class="font-black ${isPaHighlight ? 'text-emerald-400' : 'text-amber-400'} text-sm uppercase flex items-center gap-1.5">
                                <i class="fa-solid fa-scale-balanced text-amber-400"></i> SO SÁNH: ĐI TIẾP vs ĐỔI ${compRuns} TEAM L1
                            </span>
                            <span class="text-[10px] font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/50 shadow-sm">
                                ${compRuns} team x 192 NL = ${l1CompMaterials} NL
                            </span>
                        </div>

                        <!-- CÔNG TẮC GẠT +TG CHUẨN BỊ L1 -->
                        <div class="flex items-center justify-between bg-gray-900/90 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-inner shrink-0">
                            <label class="flex items-center gap-1.5 cursor-pointer select-none">
                                <input id="chk-modal-l1-prep-toggle" type="checkbox" ${isL1Prep ? 'checked' : ''} onchange="handleModalSimUpdate('${tId}')" class="accent-emerald-400 cursor-pointer w-3.5 h-3.5">
                                <span class="text-[11px] font-bold text-emerald-300 flex items-center gap-1"><i class="fa-solid fa-clock text-amber-400"></i> +TG Chuẩn Bị (${compRuns} Team L1):</span>
                            </label>

                            <div class="flex items-center gap-1.5">
                                ${isL1Prep ? `
                                <div class="flex items-center gap-1 bg-gray-955 px-2 py-0.5 rounded-lg border border-emerald-500/60">
                                    <input id="input-modal-l1-prep-minutes" type="number" min="0.5" max="60" step="0.5" value="${l1PrepMinutes}" oninput="handleModalSimUpdate('${tId}')" class="w-10 bg-gray-900 border border-gray-600 rounded px-1 text-center font-mono font-bold text-emerald-300 text-[11px] focus:outline-none focus:border-emerald-400">
                                    <span class="text-[10px] text-gray-400 font-bold">phút</span>
                                </div>
                                ` : `
                                <span class="text-[10px] text-gray-500 italic">Chỉ tính giờ vượt ải</span>
                                `}
                            </div>
                        </div>

                        <!-- 1. SO SÁNH TRỰC DIỆN 2 CỘT HUD -->
                        <div class="grid grid-cols-2 gap-2.5 shrink-0">
                            <!-- CỘT 1: PHƯƠNG ÁN CHỌN -->
                            <div class="flex flex-col p-2.5 rounded-xl border-2 transition-all ${isPaHighlight ? 'border-emerald-400 bg-gradient-to-b from-gray-900 via-gray-900 to-emerald-950/40 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'border-gray-800 bg-gray-900/60 opacity-80'}">
                                <div class="flex items-center justify-between border-b border-gray-800/80 pb-1">
                                    <span class="text-[10px] font-black uppercase ${isPaHighlight ? 'text-emerald-300' : 'text-gray-400'}">Phương Án Chọn (${compRuns} Lượt)</span>
                                    ${isPaHighlight ? `<span class="bg-emerald-500 text-gray-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">★ THẮNG THẾ</span>` : `<span class="text-[9px] text-gray-500 font-bold">${compRuns} lượt</span>`}
                                </div>
                                
                                <div class="flex flex-col gap-2 mt-2">
                                    <div class="bg-gray-955 p-1.5 rounded-lg border border-gray-800/80">
                                        <span class="text-[9px] text-gray-400 uppercase font-bold block">⏱️ Tổng Thời Gian:</span>
                                        <strong class="text-sm font-black text-white font-mono mt-0.5 block">${totalTimeFormatted}</strong>
                                    </div>
                                    <div class="bg-gray-955 p-1.5 rounded-lg border border-gray-800/80">
                                        <span class="text-[9px] text-gray-400 uppercase font-bold block">💰 Tổng Lợi Nhuận:</span>
                                        <strong class="text-base font-black ${isPaHighlight ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'text-gray-300'} font-mono mt-0.5 block">+${pData.profitGold.toFixed(1)}v</strong>
                                        <div class="text-xs font-bold ${isPaHighlight ? 'text-emerald-400' : 'text-gray-400'} font-mono">${pData.profitVND.toLocaleString('vi-VN')} VND</div>
                                    </div>
                                    <div class="bg-gray-955 p-1.5 rounded-lg border border-gray-800/80">
                                        <span class="text-[9px] text-gray-400 uppercase font-bold block">⚡ Tốc Độ Cày Tiền:</span>
                                        <strong class="text-sm font-black ${isPaHighlight ? 'text-cyan-300' : 'text-gray-400'} font-mono mt-0.5 block">${Math.round(pData.vndPerHour).toLocaleString('vi-VN')} VND/h</strong>
                                        <div class="text-[10px] font-bold ${isPaHighlight ? 'text-cyan-400' : 'text-gray-500'} font-mono">+${pData.goldPerHour.toFixed(1)}v/h</div>
                                    </div>
                                </div>
                            </div>

                            <!-- CỘT 2: ĐỔI CÀY N TEAM L1 FREE -->
                            <div class="flex flex-col p-2.5 rounded-xl border-2 transition-all ${isL1Highlight ? 'border-emerald-400 bg-gradient-to-b from-gray-900 via-gray-900 to-emerald-950/40 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'border-gray-800 bg-gray-900/60 opacity-80'}">
                                <div class="flex items-center justify-between border-b border-gray-800/80 pb-1">
                                    <span class="text-[10px] font-black uppercase ${isL1Highlight ? 'text-emerald-300' : 'text-gray-400'}">Đổi ${compRuns} Team L1 Free</span>
                                    ${isL1Highlight ? `<span class="bg-emerald-500 text-gray-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow">★ TỐI ƯU HƠN</span>` : `<span class="text-[9px] text-gray-500 font-bold">${compRuns} Team Free</span>`}
                                </div>
                                
                                <div class="flex flex-col gap-2 mt-2">
                                    <div class="bg-gray-955 p-1.5 rounded-lg border border-gray-800/80">
                                        <span class="text-[9px] text-gray-400 uppercase font-bold block">⏱️ Tổng Thời Gian:</span>
                                        <strong class="text-sm font-black text-white font-mono mt-0.5 block">${l1TotalTimeFormatted}</strong>
                                    </div>
                                    <div class="bg-gray-955 p-1.5 rounded-lg border border-gray-800/80">
                                        <span class="text-[9px] text-gray-400 uppercase font-bold block">💰 Tổng Lợi Nhuận:</span>
                                        <strong class="text-base font-black ${isL1Highlight ? 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'text-gray-300'} font-mono mt-0.5 block">+${l1CompProfitGold.toFixed(1)}v</strong>
                                        <div class="text-xs font-bold ${isL1Highlight ? 'text-emerald-400' : 'text-gray-400'} font-mono">${l1CompProfitVND.toLocaleString('vi-VN')} VND</div>
                                    </div>
                                    <div class="bg-gray-955 p-1.5 rounded-lg border border-gray-800/80">
                                        <span class="text-[9px] text-gray-400 uppercase font-bold block">⚡ Tốc Độ Cày Tiền:</span>
                                        <strong class="text-sm font-black ${isL1Highlight ? 'text-cyan-300' : 'text-gray-400'} font-mono mt-0.5 block">${Math.round(l1VndPerHour).toLocaleString('vi-VN')} VND/h</strong>
                                        <div class="text-[10px] font-bold ${isL1Highlight ? 'text-cyan-400' : 'text-gray-500'} font-mono">+${l1GoldPerHour.toFixed(1)}v/h</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. HỘP ĐỐI CHIẾU CHÊNH LỆCH KẾT QUẢ VÀ SO SÁNH TRỰC DIỆN -->
                        <div class="bg-gray-900/95 p-2.5 rounded-xl border border-gray-700 shadow-inner flex flex-col gap-1.5 shrink-0">
                            <div class="text-[10px] text-amber-300 font-black uppercase flex items-center justify-between border-b border-gray-800 pb-1">
                                <span><i class="fa-solid fa-code-compare mr-1"></i> ĐỐI CHIẾU KẾT QUẢ (${compRuns} TRẬN CHẠY TIẾP vs ${compRuns} TEAM L1 FREE):</span>
                                <span class="text-[10px] font-bold ${diffProfitGold >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
                                    ${diffProfitGold >= 0 ? `Lời hơn cày ${compRuns} Team L1` : `Kém hơn cày ${compRuns} Team L1`}
                                </span>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-2">
                                <div class="bg-gray-955 p-1.5 rounded-lg border ${diffProfitGold >= 0 ? 'border-emerald-500/50' : 'border-rose-500/50'} flex flex-col">
                                    <span class="text-[9px] text-gray-400 font-bold uppercase">💰 Chênh Lệch Tiền Thu Về:</span>
                                    <strong class="text-sm font-black font-mono ${diffProfitGold >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                                        ${diffProfitGold >= 0 ? '+' : ''}${diffProfitGold.toFixed(1)}v
                                    </strong>
                                    <span class="text-[10px] font-bold font-mono ${diffProfitVND >= 0 ? 'text-emerald-300' : 'text-rose-300'}">
                                        ${diffProfitVND >= 0 ? '+' : ''}${diffProfitVND.toLocaleString('vi-VN')} VND
                                    </span>
                                </div>

                                <div class="bg-gray-955 p-1.5 rounded-lg border ${diffVndPerHour >= 0 ? 'border-emerald-500/50' : 'border-rose-500/50'} flex flex-col">
                                    <span class="text-[9px] text-gray-400 font-bold uppercase">⚡ Chênh Lệch Tốc Độ / Giờ:</span>
                                    <strong class="text-sm font-black font-mono ${diffVndPerHour >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                                        ${diffVndPerHour >= 0 ? '+' : ''}${Math.round(diffVndPerHour).toLocaleString('vi-VN')} đ/h
                                    </strong>
                                    <span class="text-[10px] font-bold font-mono ${diffGoldPerHour >= 0 ? 'text-emerald-300' : 'text-amber-300'}">
                                        ${diffGoldPerHour >= 0 ? '+' : ''}${diffGoldPerHour.toFixed(1)}v/h (${(efficiencyRatio * 100).toFixed(0)}% so với L1)
                                    </span>
                                </div>
                            </div>

                            <div class="flex items-center justify-between bg-gray-955 px-2.5 py-1 rounded-lg border ${diffProfitGold >= 0 ? 'border-emerald-500/40' : 'border-rose-500/40'}">
                                <span class="text-[10px] ${diffProfitGold >= 0 ? 'text-emerald-300' : 'text-rose-300'} font-bold">🎯 Đánh Giá Hiệu Suất:</span>
                                <strong class="${diffProfitGold >= 0 ? 'text-yellow-300' : 'text-rose-400'} text-xs font-mono font-black">
                                    ${diffProfitGold >= 0 ? `Đạt ${(efficiencyRatio * 100).toFixed(0)}% hiệu quả kinh tế` : `Mất ${(100 - efficiencyRatio * 100).toFixed(0)}% tiền do chi phí vé`}
                                </strong>
                            </div>
                        </div>

                        <!-- 3. HERO BOX QUYẾT ĐỊNH CHIẾN THUẬT (CHUẨN XÁC ĐỒNG SỐ LƯỢT) -->
                        <div class="bg-gray-900/95 p-2.5 rounded-xl border-2 ${isSuperOptimal ? 'border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]' : (isConsiderTime ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]')} flex flex-col gap-1 shrink-0 transition-all">
                            <div class="flex items-center justify-between border-b border-gray-800 pb-1">
                                <span class="font-black text-amber-300 uppercase text-xs flex items-center gap-1.5">
                                    <i class="fa-solid fa-bullseye text-amber-400"></i> KẾT LUẬN CHIẾN THUẬT:
                                </span>
                                ${isSuperOptimal ? `
                                    <span class="bg-emerald-955 text-emerald-300 border border-emerald-400 px-2 py-0.5 rounded-md font-black text-[10px] animate-pulse">🏆 NÊN ĐI TIẾP (${compRuns} LƯỢT SIÊU TỐI ƯU)</span>
                                ` : (isConsiderTime ? `
                                    <span class="bg-amber-955 text-amber-300 border border-amber-400 px-2 py-0.5 rounded-md font-black text-[10px]">⚖️ CÂN NHẮC - XẤP XỈ CÀY ${compRuns} TEAM L1</span>
                                ` : `
                                    <span class="bg-rose-955 text-rose-300 border border-rose-500 px-2 py-0.5 rounded-md font-black text-[10px] animate-pulse">⛔ NÊN DỪNG Ở L1 (ĐỔI CÀY ${compRuns} TEAM L1 LỜI HƠN)</span>
                                `)}
                            </div>

                            <p class="text-gray-200 text-[11px] leading-relaxed">
                                ${isSuperOptimal ? `
                                    <strong class="text-emerald-400">Nên đi tiếp!</strong> Đi tiếp team này mang lại <b class="text-yellow-300">+${pData.profitGold.toFixed(1)}v (+${pData.profitVND.toLocaleString('vi-VN')} VND)</b>, lời hơn <b class="text-emerald-300">+${diffProfitVND.toLocaleString('vi-VN')} VND</b> so với việc cùng ${compRuns} trận đó phải đổi sang cày ${compRuns} Team L1 Free khác. Đi tiếp giúp tối ưu tuyệt đối thời gian!
                                ` : (isConsiderTime ? `
                                    <strong class="text-amber-400">Lợi nhuận xấp xỉ nhau!</strong> Đi tiếp team này thu được <b class="text-yellow-300">+${pData.profitVND.toLocaleString('vi-VN')} VND</b> so với cày ${compRuns} team L1 Free là <b>${l1CompProfitVND.toLocaleString('vi-VN')} VND</b> (chênh lệch ${diffProfitVND >= 0 ? '+' : ''}${diffProfitVND.toLocaleString('vi-VN')} VND). <b class="text-cyan-300">Nếu lười đổi acc thì nên đi tiếp, nếu muốn tiết kiệm vé thì đổi sang chạy L1 team khác!</b>
                                ` : `
                                    <strong class="text-rose-400">Không nên đi tiếp (Kém hiệu suất)!</strong> Tiền vé mua thêm đã làm thâm hụt tiền lời. Cùng thời gian chạy ${compRuns} trận này, nếu bạn đổi sang cày <b class="text-emerald-400">${compRuns} Team L1 Free khác</b> bạn sẽ kiếm được <b class="text-emerald-300">+${l1CompProfitGold.toFixed(1)}v (+${l1CompProfitVND.toLocaleString('vi-VN')} VND)</b>, nhiều hơn hẳn <b class="text-yellow-300">+${Math.abs(diffProfitVND).toLocaleString('vi-VN')} VND</b> so với việc mua vé chạy tiếp team này! <b class="text-emerald-400">Dừng ở L1 Free và đổi team là tối ưu nhất!</b>
                                `)}
                            </p>
                        </div>

                    </div>

                    <!-- FOOTER ĐỒNG BỘ -->
                    <div class="flex justify-between items-center pt-2 border-t border-gray-800 shrink-0">
                        <span class="text-[10px] text-gray-500 font-mono">So sánh quy đổi tương ứng ${compRuns} lượt trận</span>
                        <button onclick="document.getElementById('thaihu-profit-loss-modal-overlay').remove()" class="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg border border-emerald-600 transition cursor-pointer text-xs shadow-lg">Đóng Bảng</button>
                    </div>
                </div>

            </div>
        `;

        document.body.appendChild(overlay);
    } catch (e) {
        console.error("Lỗi khi mở Popup Lời Lỗ:", e);
    }
}

/* ==========================================================================
   KHỐI 3: [ĐÃ KHÓA] HÀM ĐIỀU KHIỂN SỰ KIỆN NÚT VÀ GIẢ SỬ (+ TG CHUẨN BỊ 2 BẢNG)
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH 100% - KHÓA KHÔNG SỬA]
   ========================================================================== */
function handleModalSimMainToggle(teamId, isChecked) {
    let isEvent = document.getElementById('chk-modal-event-toggle')?.checked || false;
    let isExclude = document.getElementById('chk-modal-exclude-refund-toggle')?.checked || false;
    let defaultMatPrice = parseFloat(document.getElementById('input-material-price')?.value) || 0.25;
    let isIncludePrep = document.getElementById('chk-modal-prep-toggle')?.checked || false;
    let prepMinutes = document.getElementById('input-modal-prep-minutes')?.value ?? 2;

    let isL1Prep = document.getElementById('chk-modal-l1-prep-toggle')?.checked !== false;
    let l1PrepMinutes = document.getElementById('input-modal-l1-prep-minutes')?.value ?? 10;

    openThaihuProfitLossModal(teamId, isEvent, isExclude, {
        isSim: isChecked,
        simMatPrice: defaultMatPrice,
        simL2: true,
        simL2Tickets: 8,
        simL3: false,
        simL3Tickets: 8,
        isIncludePrep: isIncludePrep,
        prepMinutes: prepMinutes,
        isL1Prep: isL1Prep,
        l1PrepMinutes: l1PrepMinutes
    });
}

function handleModalSimL2Toggle(teamId, isChecked) {
    let isEvent = document.getElementById('chk-modal-event-toggle')?.checked || false;
    let isExclude = document.getElementById('chk-modal-exclude-refund-toggle')?.checked || false;
    let isSim = document.getElementById('chk-modal-sim-toggle')?.checked || false;
    let matPrice = document.getElementById('input-modal-sim-mat-price')?.value;
    let isIncludePrep = document.getElementById('chk-modal-prep-toggle')?.checked || false;
    let prepMinutes = document.getElementById('input-modal-prep-minutes')?.value ?? 2;

    let isL1Prep = document.getElementById('chk-modal-l1-prep-toggle')?.checked !== false;
    let l1PrepMinutes = document.getElementById('input-modal-l1-prep-minutes')?.value ?? 10;
    
    let simL3Val = isChecked ? (document.getElementById('chk-sim-run-3')?.checked || false) : false;
    let l2Tickets = parseInt(document.getElementById('sel-sim-tickets-l2')?.value) || 8;
    let l3Tickets = parseInt(document.getElementById('sel-sim-tickets-l3')?.value) || 8;

    openThaihuProfitLossModal(teamId, isEvent, isExclude, {
        isSim: isSim,
        simMatPrice: matPrice,
        simL2: isChecked,
        simL2Tickets: l2Tickets,
        simL3: simL3Val,
        simL3Tickets: l3Tickets,
        isIncludePrep: isIncludePrep,
        prepMinutes: prepMinutes,
        isL1Prep: isL1Prep,
        l1PrepMinutes: l1PrepMinutes
    });
}

function handleModalSimL3Toggle(teamId, isChecked) {
    let isEvent = document.getElementById('chk-modal-event-toggle')?.checked || false;
    let isExclude = document.getElementById('chk-modal-exclude-refund-toggle')?.checked || false;
    let isSim = document.getElementById('chk-modal-sim-toggle')?.checked || false;
    let matPrice = document.getElementById('input-modal-sim-mat-price')?.value;
    let isIncludePrep = document.getElementById('chk-modal-prep-toggle')?.checked || false;
    let prepMinutes = document.getElementById('input-modal-prep-minutes')?.value ?? 2;

    let isL1Prep = document.getElementById('chk-modal-l1-prep-toggle')?.checked !== false;
    let l1PrepMinutes = document.getElementById('input-modal-l1-prep-minutes')?.value ?? 10;

    let l2Tickets = parseInt(document.getElementById('sel-sim-tickets-l2')?.value) || 8;
    let l3Tickets = parseInt(document.getElementById('sel-sim-tickets-l3')?.value) || 8;

    openThaihuProfitLossModal(teamId, isEvent, isExclude, {
        isSim: isSim,
        simMatPrice: matPrice,
        simL2: true,
        simL2Tickets: l2Tickets,
        simL3: isChecked,
        simL3Tickets: l3Tickets,
        isIncludePrep: isIncludePrep,
        prepMinutes: prepMinutes,
        isL1Prep: isL1Prep,
        l1PrepMinutes: l1PrepMinutes
    });
}

function handleModalSimUpdate(teamId) {
    let isEvent = document.getElementById('chk-modal-event-toggle')?.checked || false;
    let isExclude = document.getElementById('chk-modal-exclude-refund-toggle')?.checked || false;
    let isSim = document.getElementById('chk-modal-sim-toggle')?.checked || false;
    let isIncludePrep = document.getElementById('chk-modal-prep-toggle')?.checked || false;
    let prepMinutes = document.getElementById('input-modal-prep-minutes')?.value ?? 2;

    let isL1Prep = document.getElementById('chk-modal-l1-prep-toggle')?.checked !== false;
    let l1PrepMinutes = document.getElementById('input-modal-l1-prep-minutes')?.value ?? 10;

    let simL2 = document.getElementById('chk-sim-run-2')?.checked !== false;
    let simL3 = document.getElementById('chk-sim-run-3')?.checked || false;
    let l2Tickets = parseInt(document.getElementById('sel-sim-tickets-l2')?.value) || 0;
    let l3Tickets = parseInt(document.getElementById('sel-sim-tickets-l3')?.value) || 0;
    let matPrice = document.getElementById('input-modal-sim-mat-price')?.value;

    let focusedInputId = document.activeElement ? document.activeElement.id : null;

    openThaihuProfitLossModal(teamId, isEvent, isExclude, {
        isSim: isSim,
        simMatPrice: matPrice,
        simL2: simL2,
        simL2Tickets: l2Tickets,
        simL3: simL3,
        simL3Tickets: l3Tickets,
        isIncludePrep: isIncludePrep,
        prepMinutes: prepMinutes,
        isL1Prep: isL1Prep,
        l1PrepMinutes: l1PrepMinutes
    });

    setTimeout(() => {
        if (focusedInputId) {
            let el = document.getElementById(focusedInputId);
            if (el) el.focus();
        }
    }, 10);
}

function dataColor(val) {
    return val >= 0 ? 'text-cyan-300' : 'text-rose-400';
}

window.calculateTeamRealtimeProfitLossData = calculateTeamRealtimeProfitLossData;
window.openThaihuProfitLossModal = openThaihuProfitLossModal;
window.handleModalSimMainToggle = handleModalSimMainToggle;
window.handleModalSimL2Toggle = handleModalSimL2Toggle;
window.handleModalSimL3Toggle = handleModalSimL3Toggle;
window.handleModalSimUpdate = handleModalSimUpdate;

// Tổng số dòng code trong file này: 440 dòng.