// Tên file: tinh-toan-tai-chinh.js
// Chức năng: Xử lý logic doanh thu nền tảng - Khóa giới hạn chi phí vé tối đa (maxRuns - 1) cho mỗi account duy nhất, hỗ trợ đầy đủ các chế độ thanh toán Vé / -50 NP / -40 Xu.
// Con của file: index.html
// Trạng thái: [ĐÃ TEST HOÀN HẢO - KHÓA TOÀN BỘ MÃ NGUỒN NGÀY 26/08/2026]

function formatVNDInput(input) { 
    let numeric = input.value.replace(/\D/g, ""); 
    input.value = numeric.replace(/\B(?=(\d{3})+(?!\d))/g, "."); 
}

function getParsedVNDValue(str) { 
    return parseFloat((str || "").replace(/\./g, "")) * 1000 || 0; 
}

function calculateRealtimeProfits() {
    let materialPrice = parseFloat(document.getElementById('input-material-price')?.value) || 0;
    let goldRateVnd = getParsedVNDValue(document.getElementById('input-gold-rate')?.value);
    let ticketPrice = parseFloat(document.getElementById('input-ticket-price')?.value) || 0;
    let refundPrice = parseFloat(document.getElementById('input-refund-price')?.value) || 16; 
    
    let includeDeo = document.getElementById('checkbox-toggle-include-deo')?.checked || false;
    let excludeRefund = document.getElementById('checkbox-toggle-exclude-refund')?.checked || false;
    let excludeMaterials = document.getElementById('checkbox-toggle-exclude-materials')?.checked || false;
    
    let totalRuns = 0, rawMaterials = 0, totalTicketCostGold = 0;

    Object.keys(systemDatabase.members || {}).forEach(mId => {
        let m = systemDatabase.members[mId]; 
        if (!m || !m.name) return;
        
        let runs = parseInt(m.currentRuns) || 0;
        let max = parseInt(m.maxRuns) || 2; 
        totalRuns += runs;
        
        if (!m.skipStatNL) {
            let r1_nl = (m.failures && m.failures[1] !== undefined) ? m.failures[1].nl : 24;
            let r2_nl = (m.failures && m.failures[2] !== undefined) ? m.failures[2].nl : 48;
            let r3_nl = (m.failures && m.failures[3] !== undefined) ? m.failures[3].nl : 48;

            if (runs >= 1) rawMaterials += r1_nl; 
            if (runs >= 2) rawMaterials += r2_nl; 
            if (runs >= 3) rawMaterials += r3_nl;
        }
        
        // TÍNH TOÁN THEO CHẾ ĐỘ THANH TOÁN (TICKET / NP50 / XU40)
        let modeL2 = m.payModeL2 || (m.freeRun2 ? 'np50' : 'ticket');
        let modeL3 = m.payModeL3 || (m.freeRun3 ? 'np50' : 'ticket');

        // Lần 2 (Tối đa 1 vé cho mỗi account)
        if (runs >= 2) {
            if (modeL2 === 'ticket') { 
                let isRun2Failed = m.failures && m.failures[2] !== undefined;
                let backGold = (excludeRefund || isRun2Failed) ? 0 : refundPrice;
                totalTicketCostGold += (max === 2) ? Math.max(0, ticketPrice - backGold) : ticketPrice; 
            }
        }
        
        // Lần 3 (Chỉ account Max 3 mới có thể tốn thêm 1 vé thứ 2)
        if (runs >= 3 && max >= 3) {
            if (modeL3 === 'ticket') { 
                let isRun3Failed = m.failures && m.failures[3] !== undefined;
                let backGold = (excludeRefund || isRun3Failed) ? 0 : refundPrice;
                totalTicketCostGold += Math.max(0, ticketPrice - backGold);
            }
        }
    });

    let totalMaterials = excludeMaterials ? 0 : rawMaterials;
    let goldFromMaterials = excludeMaterials ? 0 : (totalMaterials * materialPrice);
    
    let finalNetGoldValue = goldFromMaterials - totalTicketCostGold + (includeDeo && typeof getDeoValueInTimeframe === 'function' ? getDeoValueInTimeframe('today') : 0);
    let finalNetVndValue = (finalNetGoldValue / 1000) * goldRateVnd;

    // Cập nhật giao diện
    document.querySelectorAll('[id="runtime-total-runs"]').forEach(el => el.innerText = totalRuns);
    document.querySelectorAll('[id="runtime-total-materials"]').forEach(el => el.innerText = totalMaterials + " nl");
    document.querySelectorAll('[id="runtime-total-costs"]').forEach(el => el.innerText = totalTicketCostGold.toFixed(1) + "v");
    
    let profitLabel = document.getElementById('runtime-net-profit-gold');
    if (profitLabel) {
        profitLabel.innerText = `${finalNetGoldValue >= 0 ? '+' : ''}${finalNetGoldValue.toFixed(2)} Vàng`;
        profitLabel.className = finalNetGoldValue >= 0 ? "text-base font-black text-emerald-400 block" : "text-base font-black text-rose-400 block";
    }
    let profitVndLabel = document.getElementById('runtime-net-profit-vnd');
    if (profitVndLabel) {
        profitVndLabel.innerText = `~ ${Math.round(finalNetVndValue).toLocaleString('vi-VN')} VNĐ`;
    }
}