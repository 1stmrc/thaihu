// Tên file: dong_co_tinh_toan_thuong_nhan_va_tang_kiem.js
// Chức năng: Động cơ toán học thuần túy - Chuyên tính toán số liệu doanh thu, chi phí vé, chế độ x3 lượt và quy đổi Ngân Phiếu cho hoạt động Thương Nhân và Tàng Kiếm.
// Con của file: index.html (Nạp cùng phân hệ So Sánh Tối Ưu).
// Danh sách tính năng của file:
//   1. [ĐÃ SỬA & KHÓA] Tính chuẩn NL Thương Nhân: 8 NL/lượt (1 acc x3 lượt = 24 NL, 60 acc x3 = 1.440 NL).
//   2. Tính toán Tàng Kiếm: Chuẩn hóa Hoàn vàng game cố định 25v/acc (L2: 200v, L3: 200v -> 400v/team), thưởng đội trưởng, NL sự kiện, trừ tiền vé.
//   3. Quy đổi Ngân Phiếu chuẩn xác: 50 Ngân Phiếu = Giá 1 Vé Vàng cộng trực tiếp vào Doanh Thu khi bật tính năng.
//   4. Đồng bộ chuẩn xác 100% giữa Lợi Nhuận Vàng, Tiền VNĐ và Tốc độ Vàng/Giờ, Tiền/Giờ.
// Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA MÃ NGUỒN NGÀY 26/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: TÍNH TOÁN SỐ LIỆU THƯƠNG NHÂN (TÙY CHỌN X3 & TÍCH HỢP NGÂN PHIẾU)
   Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA KHÔNG SỬA]
   ========================================================================== */
function tinhToanSoLieuThuongNhan(isEvent, matPrice, goldRateVND, isNganPhieu, ticketPriceRef) {
    let isTnX3 = document.getElementById('chk-opt-merchant-x3')?.checked !== false; // Mặc định tính x3 lượt
    let mGoldPerRun = parseFloat(document.getElementById('input-opt-merchant-gold-per-run')?.value) || 0;
    let mBatchAcc = parseFloat(document.getElementById('input-opt-merchant-batch-acc')?.value) || 11;
    let mBatchMins = parseFloat(document.getElementById('input-opt-merchant-batch-mins')?.value) || 45;
    let mTotalAcc = parseInt(document.getElementById('input-opt-merchant-total-acc')?.value) || 60;

    let runsMultiplier = isTnX3 ? 3 : 1;
    let mTimePerAcc = mBatchAcc > 0 ? (mBatchMins / mBatchAcc) : 4.09;
    let mTotalMins = mTotalAcc * mTimePerAcc * (runsMultiplier / 3); // Thời gian theo batch thực tế
    let mTotalHours = mTotalMins / 60;
    let mAccPerHour = mTimePerAcc > 0 ? (60 / mTimePerAcc) : 0;

    // CHUẨN XÁC: 1 LƯỢT THƯƠNG NHÂN = 8 NL (x3 lượt = 24 NL/acc)
    let mTotalMaterials = isEvent ? (mTotalAcc * 8 * runsMultiplier) : 0;
    let mMaterialGold = mTotalMaterials * matPrice;
    let mDirectGold = mTotalAcc * (mGoldPerRun * runsMultiplier);
    
    // TÍNH NGÂN PHIẾU THƯƠNG NHÂN: 1 NP / 1 Lượt / 1 Tài khoản
    let mNganPhieuCount = mTotalAcc * runsMultiplier;
    let mNganPhieuGold = 0;
    let refPrice = ticketPriceRef || 25;
    if (isNganPhieu && refPrice > 0) {
        mNganPhieuGold = mNganPhieuCount * (refPrice / 50); // 50 NP = 1 Vé
    }

    let mTotalGold = mDirectGold + mMaterialGold + mNganPhieuGold;
    let mTotalVND = Math.round((mTotalGold / 1000) * goldRateVND);
    let mGoldPerHour = mTotalHours > 0 ? (mTotalGold / mTotalHours) : 0;
    let mVndPerHour = mTotalHours > 0 ? (mTotalVND / mTotalHours) : 0;

    return {
        totalMins: mTotalMins,
        totalGold: mTotalGold,
        totalVND: mTotalVND,
        goldPerHour: mGoldPerHour,
        vndPerHour: mVndPerHour,
        accPerHour: mAccPerHour,
        materials: mTotalMaterials,
        materialGold: mMaterialGold,
        nganPhieuCount: mNganPhieuCount,
        nganPhieuGold: mNganPhieuGold,
        isX3: isTnX3
    };
}

/* ==========================================================================
   KHỐI 2: TÍNH TOÁN SỐ LIỆU TÀNG KIẾM (HOÀN VÀNG GAME 25V/ACC & ĐỘI TRƯỞNG)
   Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA KHÔNG SỬA]
   ========================================================================== */
function tinhToanSoLieuTangKiem(isEvent, isCaptainBonusTK, captainBonusGoldTK, matPrice, goldRateVND, isNganPhieu) {
    let isTangkiemX3 = document.getElementById('chk-opt-tangkiem-x3')?.checked || false;
    let tkTeams = parseInt(document.getElementById('input-opt-tangkiem-teams')?.value) || 1;
    let tkTicketPrice = parseFloat(document.getElementById('input-opt-tangkiem-ticket')?.value) || 23;
    let tkMinsPerTeam = parseFloat(document.getElementById('input-opt-tangkiem-mins-per-team')?.value) || 45;

    let tkTotalMins = isTangkiemX3 ? (tkTeams * ((3 * tkMinsPerTeam) + 10)) : (tkTeams * tkMinsPerTeam);
    let tkTotalHours = tkTotalMins / 60;

    let tkRebateGold = isTangkiemX3 ? (tkTeams * 400) : 0;
    let tkCaptainGold = (isCaptainBonusTK && isTangkiemX3) ? (tkTeams * 2 * captainBonusGoldTK) : 0;

    let tkMaterials = isEvent ? (tkTeams * 8 * (isTangkiemX3 ? (24 + 48 + 48) : 24)) : 0;
    let tkMaterialGold = tkMaterials * matPrice;

    let tkTicketCost = isTangkiemX3 ? (tkTeams * 16 * tkTicketPrice) : 0;

    let npPerTeam = isTangkiemX3 ? (8 * 31) : (8 * 7);
    let tkNganPhieuCount = tkTeams * npPerTeam;
    let tkNganPhieuGold = 0;
    if (isNganPhieu && tkTicketPrice > 0) {
        tkNganPhieuGold = tkNganPhieuCount * (tkTicketPrice / 50);
    }

    let tkTotalIncomeGold = tkRebateGold + tkCaptainGold + tkMaterialGold + tkNganPhieuGold;
    let tkProfitGold = tkTotalIncomeGold - tkTicketCost;
    let tkProfitVND = Math.round((tkProfitGold / 1000) * goldRateVND);

    let tkGoldPerHour = tkTotalHours > 0 ? (tkProfitGold / tkTotalHours) : 0;
    let tkVndPerHour = tkTotalHours > 0 ? (tkProfitVND / tkTotalHours) : 0;

    return {
        teams: tkTeams,
        totalMins: tkTotalMins,
        materials: tkMaterials,
        materialGold: tkMaterialGold,
        ticketCost: tkTicketCost,
        rebateGold: tkRebateGold,
        captainGold: tkCaptainGold,
        nganPhieuCount: tkNganPhieuCount,
        nganPhieuGold: tkNganPhieuGold,
        totalIncomeGold: tkTotalIncomeGold,
        profitGold: tkProfitGold,
        profitVND: tkProfitVND,
        goldPerHour: tkGoldPerHour,
        vndPerHour: tkVndPerHour,
        isX3: isTangkiemX3
    };
}

window.tinhToanSoLieuThuongNhan = tinhToanSoLieuThuongNhan;
window.tinhToanSoLieuTangKiem = tinhToanSoLieuTangKiem;