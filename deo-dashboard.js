// Tên file: deo-dashboard.js
// Chức năng: Bộ tính toán Quẻ Đoài - Nổi bật "Hôm nay" lên đầu bảng, quy đổi Vàng + VNĐ, thêm cột Tỷ Lệ Đoài/Đội & Thống kê tổng.
// Con của file: index.html (Được nạp trực tiếp qua thẻ script trong khung xương chính).

// HÀM TỰ ĐỘNG GOM NHÓM DỮ LIỆU & SẮP XẾP HÔM NAY / NGÀY MỚI NHẤT LÊN HÀNG ĐẦU TIÊN
function deduplicateDeoHistory() {
    if (!systemDatabase.deoHistory || systemDatabase.deoHistory.length === 0) return;
    let merged = {};
    systemDatabase.deoHistory.forEach(x => {
        let date = x.date;
        if (!merged[date]) {
            merged[date] = {
                id: x.id || ('deo_' + date),
                date: date,
                count: 0,
                price: x.price || 25,
                goldValue: 0
            };
        }
        merged[date].count += x.count;
        merged[date].price = x.price || 25;
        merged[date].goldValue = merged[date].count * merged[date].price;
    });

    // Sắp xếp ngày giảm dần: Ngày mới nhất / Hôm nay luôn ở trên cùng
    systemDatabase.deoHistory = Object.values(merged).sort((a, b) => b.date.localeCompare(a.date));
}

// HÀM LƯU / THÊM QUẺ ĐOÀI
function commitQuayDoaiEntry() {
    let amountInput = document.getElementById('input-deo-amount-increment');
    let priceInput = document.getElementById('input-current-deo-price');
    let count = parseInt(amountInput ? amountInput.value : 1) || 1;
    let price = parseFloat(priceInput ? priceInput.value : 25) || 25;
    
    if (count <= 0) return;
    
    let todayStr = new Date().toLocaleDateString('sv-SE'); // Định dạng YYYY-MM-DD
    
    if (!systemDatabase.deoHistory) systemDatabase.deoHistory = [];
    
    let existingEntry = systemDatabase.deoHistory.find(x => x.date === todayStr);
    
    if (existingEntry) {
        existingEntry.count += count;
        existingEntry.price = price;
        existingEntry.goldValue = existingEntry.count * existingEntry.price;
    } else {
        systemDatabase.deoHistory.push({
            id: 'deo_' + todayStr,
            date: todayStr,
            count: count,
            price: price,
            goldValue: count * price
        });
    }
    
    if (amountInput) amountInput.value = 1;
    
    deduplicateDeoHistory();
    updateDeoStatisticsDisplays();
    renderDeoHistoryLedger();
    
    if (typeof activeTeamId !== 'undefined' && activeTeamId === "deo_tab_active_special") {
        renderDeoManagementView();
    }
    
    if (typeof calculateRealtimeProfits === 'function') { calculateRealtimeProfits(); }
    if (typeof saveStateToMemoryCache === 'function') { saveStateToMemoryCache(); }
}

// HÀM GIẢM BỚT 1 QUẺ KHI BẤM NHẦM
function decrementDeoEntry(dateStr) {
    if (!systemDatabase.deoHistory) return;
    let entry = systemDatabase.deoHistory.find(x => x.date === dateStr);
    if (!entry) return;
    
    if (entry.count > 1) {
        entry.count -= 1;
        entry.goldValue = entry.count * entry.price;
    } else {
        systemDatabase.deoHistory = systemDatabase.deoHistory.filter(x => x.date !== dateStr);
    }
    
    deduplicateDeoHistory();
    updateDeoStatisticsDisplays();
    renderDeoHistoryLedger();
    
    if (typeof activeTeamId !== 'undefined' && activeTeamId === "deo_tab_active_special") {
        renderDeoManagementView();
    }
    
    if (typeof calculateRealtimeProfits === 'function') { calculateRealtimeProfits(); }
    if (typeof saveStateToMemoryCache === 'function') { saveStateToMemoryCache(); }
    
    if (typeof logUserAction === 'function') {
        logUserAction(`Đã giảm -1 quẻ Đoài ngày ${dateStr}`);
    }
}

// HÀM XÓA TOÀN BỘ SỐ QUẺ CỦA 1 NGÀY
function deleteDeoEntry(dateStr) {
    if (!systemDatabase.deoHistory) return;
    if (confirm(`Xác nhận xóa toàn bộ số quẻ ngày ${dateStr}?`)) {
        systemDatabase.deoHistory = systemDatabase.deoHistory.filter(x => x.date !== dateStr);
        
        deduplicateDeoHistory();
        updateDeoStatisticsDisplays();
        renderDeoHistoryLedger();
        
        if (typeof activeTeamId !== 'undefined' && activeTeamId === "deo_tab_active_special") {
            renderDeoManagementView();
        }
        
        if (typeof calculateRealtimeProfits === 'function') { calculateRealtimeProfits(); }
        if (typeof saveStateToMemoryCache === 'function') { saveStateToMemoryCache(); }
    }
}

// HÀM RENDER LỊCH SỬ TRÊN POPUP
function renderDeoHistoryLedger() {
    let container = document.getElementById('deo-history-ledger-container');
    if (!container) return;
    
    deduplicateDeoHistory();
    
    if (!systemDatabase.deoHistory || systemDatabase.deoHistory.length === 0) {
        container.innerHTML = `<div class="text-gray-600 text-center py-2 italic text-[11px]">Chưa có lịch sử nhập quẻ.</div>`;
        return;
    }
    
    let todayStr = new Date().toLocaleDateString('sv-SE');
    let yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    let yesterdayStr = yesterdayObj.toLocaleDateString('sv-SE');
    
    let filteredHistory = systemDatabase.deoHistory.filter(x => x.date === todayStr || x.date === yesterdayStr);
    
    if (filteredHistory.length === 0) {
        container.innerHTML = `<div class="text-gray-600 text-center py-2 italic text-[11px]">Hôm nay & Hôm qua chưa nhập quẻ.</div>`;
        return;
    }
    
    let html = "";
    filteredHistory.forEach(x => {
        let isToday = x.date === todayStr;
        let dateLabel = isToday 
            ? `<span class="text-emerald-400 font-bold text-left pl-1">Hôm nay</span>` 
            : `<span class="text-amber-500 font-bold text-left pl-1">Hôm qua</span>`;
        
        html += `
            <div class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 text-[11px] mb-1.5 shadow-inner">
                <div class="truncate text-left">${dateLabel}</div>
                <span class="font-black text-purple-300 px-1">+${x.count} Đoài</span>
                <span class="text-yellow-400 font-bold font-mono text-right pr-1">${x.goldValue.toFixed(1)}v</span>
                <div class="flex items-center gap-1">
                    <button onclick="decrementDeoEntry('${x.date}')" class="bg-gray-800 hover:bg-amber-600 hover:text-white text-amber-400 px-1.5 py-0.5 rounded border border-gray-700 font-black text-[10px] cursor-pointer transition" title="Giảm 1 quẻ">-1</button>
                    <button onclick="deleteDeoEntry('${x.date}')" class="text-rose-500 hover:text-rose-400 p-1 font-bold cursor-pointer transition" title="Xóa hết ngày này">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

// HÀM RENDER BẢNG QUẢN LÝ ĐOÀI (GOM NHÓM 1 DÒNG/NGÀY, NỔI BẬT HÔM NAY Ở ĐẦU BẢNG, TỶ LỆ ĐOÀI/ĐỘI, QUY ĐỔI VÀNG & VNĐ)
function renderDeoManagementView() {
    let target = document.getElementById('team-content-container') || document.getElementById('main-workspace-body');
    if (!target) return;
    
    deduplicateDeoHistory();
    let todayStr = new Date().toLocaleDateString('sv-SE');
    
    // Đọc tỷ giá 1K Vàng sang VNĐ (Mặc định 155.000đ)
    let goldRateInput = document.getElementById('input-gold-price-per-1k') || document.querySelector('input[placeholder*="155.000"]');
    let goldRateVND = parseFloat(goldRateInput ? goldRateInput.value : 155000) || 155000;
    
    // Tính số đội xếp chạy mỗi ngày (Lineup teams)
    let lineupTeamsTotal = 9;
    if (typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
        let lTeams = systemDatabase.teams.filter(t => t.type === 'lineup');
        if (lTeams.length > 0) lineupTeamsTotal = lTeams.length;
    }

    let totalAllDeo = 0;
    let totalAllTeamsRun = 0;
    let totalAllGoldValue = 0;

    let rowsHtml = "";
    if (!systemDatabase.deoHistory || systemDatabase.deoHistory.length === 0) {
        rowsHtml = `<tr><td colspan="6" class="p-6 text-center text-gray-500 italic text-sm">Chưa có lịch sử quẻ Đoài nào được lưu.</td></tr>`;
    } else {
        systemDatabase.deoHistory.forEach((x) => {
            totalAllDeo += x.count;
            totalAllTeamsRun += lineupTeamsTotal;
            totalAllGoldValue += x.goldValue;
            
            let isToday = (x.date === todayStr);
            
            // HÀNG HÔM NAY: NỔI BẬT VIỀN TÍM VÀ NHÃN PHÁT SÁNG
            let rowStyle = isToday 
                ? "bg-purple-950/60 border-2 border-purple-500 shadow-xl font-bold" 
                : "hover:bg-gray-800/40 transition border-b border-gray-800";
            
            let dateDisplay = isToday 
                ? `<div class="inline-flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-400 px-3 py-1 rounded-lg text-emerald-300 font-black tracking-wide shadow-md animate-pulse">
                        <i class="fa-solid fa-star text-amber-400 text-xs"></i> Hôm nay (${x.date})
                   </div>` 
                : `<span class="text-gray-300 font-mono font-semibold">${x.date}</span>`;
            
            // QUY ĐỔI TIỀN VÀNG (v) VÀ TIỀN MẶT (VNĐ)
            let goldVal = x.goldValue || (x.count * x.price);
            let vndVal = Math.round((goldVal / 1000) * goldRateVND);
            let vndFormatted = vndVal.toLocaleString('vi-VN') + ' đ';

            // TÍNH TOÁN TỶ LỆ ĐOÀI / ĐỘI CHO TỪNG NGÀY
            let teamPerDeoRatio = x.count > 0 ? (lineupTeamsTotal / x.count).toFixed(1) : 0;
            let ratioHtml = x.count > 0 
                ? `<div class="inline-block bg-amber-950/60 border border-amber-500/50 px-2.5 py-1 rounded-lg text-amber-300 font-bold font-mono">
                        1 Đoài / ${teamPerDeoRatio} Đội
                   </div>` 
                : `<span class="text-gray-600 font-mono">-</span>`;

            rowsHtml += `
                <tr class="${rowStyle}">
                    <td class="p-3 text-left">${dateDisplay}</td>
                    <td class="p-3 text-center text-purple-300 font-black text-sm">+${x.count} Quẻ</td>
                    <td class="p-3 text-center">${ratioHtml}</td>
                    <td class="p-3 text-center text-yellow-400 font-mono font-bold text-xs">${x.price.toFixed(1)}v</td>
                    <td class="p-3 text-center">
                        <div class="flex flex-col items-center justify-center">
                            <span class="text-cyan-300 font-black font-mono text-sm">${goldVal.toFixed(1)}v</span>
                            <span class="text-[11px] text-emerald-400 font-bold font-mono mt-0.5">${vndFormatted}</span>
                        </div>
                    </td>
                    <td class="p-3 text-center">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="decrementDeoEntry('${x.date}')" class="bg-gray-800 hover:bg-amber-600 text-amber-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-black border border-gray-700 transition cursor-pointer shadow" title="Giảm 1 quẻ ngày này">-1 Quẻ</button>
                            <button onclick="deleteDeoEntry('${x.date}')" class="bg-rose-955 hover:bg-rose-700 text-rose-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-rose-600 transition cursor-pointer shadow" title="Xóa toàn bộ ngày này"><i class="fa-solid fa-trash-can mr-1"></i>Xóa</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }

    // TÍNH TỔNG TỶ LỆ VÀ TỔNG DOANH THU TOÀN THỜI GIAN
    let globalRatioStr = totalAllDeo > 0 
        ? `1 Đoài / ${(totalAllTeamsRun / totalAllDeo).toFixed(1)} Đội (Trung bình: ${((totalAllDeo / totalAllTeamsRun) * 100).toFixed(1)}%)` 
        : `Chưa có dữ liệu`;
    
    let totalAllVND = Math.round((totalAllGoldValue / 1000) * goldRateVND);
    let totalAllVNDFormatted = totalAllVND.toLocaleString('vi-VN') + ' đ';

    target.innerHTML = `
        <div class="p-4 bg-gray-900 border border-purple-500/60 rounded-2xl shadow-2xl text-xs space-y-4">
            <!-- THANH TIÊU ĐỀ & NÚT QUAY LẠI -->
            <div class="flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-2">
                <span class="font-black text-purple-300 text-sm uppercase flex items-center gap-2">
                    <i class="fa-solid fa-gem text-amber-400"></i> BẢNG THỐNG KÊ & NHẬT KÝ LỊCH SỬ QUẺ ĐOÀI CHUYÊN SÂU
                </span>
                <button onclick="switchToMainTeamTab()" class="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold px-3.5 py-1.5 rounded-lg border border-gray-600 transition cursor-pointer text-xs flex items-center gap-1.5 shadow">
                    <i class="fa-solid fa-arrow-left"></i> Quay Lại Thái Hư
                </button>
            </div>

            <!-- THANH TỔNG HỢP TỶ LỆ VÀ DOANH THU TOÀN THỜI GIAN -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-950 border border-gray-800 rounded-xl font-mono">
                <div class="flex flex-col justify-center">
                    <span class="text-gray-400 text-[11px]">TỶ LỆ TOÀN THỜI GIAN:</span>
                    <strong class="text-amber-400 font-black text-sm mt-0.5">${globalRatioStr}</strong>
                </div>
                <div class="flex flex-col justify-center">
                    <span class="text-gray-400 text-[11px]">TỔNG LƯỢNG QUẺ ĐÃ NHẬN:</span>
                    <strong class="text-purple-300 font-black text-sm mt-0.5">${totalAllDeo} Quẻ (${totalAllTeamsRun} Lượt Đội)</strong>
                </div>
                <div class="flex flex-col justify-center">
                    <span class="text-gray-400 text-[11px]">TỔNG GIÁ TRỊ QUY ĐỔI:</span>
                    <strong class="text-cyan-300 font-black text-sm mt-0.5">${totalAllGoldValue.toFixed(1)}v <span class="text-emerald-400 font-normal text-xs">(${totalAllVNDFormatted})</span></strong>
                </div>
            </div>

            <!-- BẢNG CHI TIẾT TỪNG NGÀY -->
            <div class="overflow-x-auto rounded-xl border border-gray-800">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="bg-gray-950 text-gray-400 uppercase font-bold text-[11px] border-b border-gray-800">
                            <th class="p-3">NGÀY NHẬP</th>
                            <th class="p-3 text-center">TỔNG SỐ LƯỢNG</th>
                            <th class="p-3 text-center">TỶ LỆ ĐOÀI / ĐỘI</th>
                            <th class="p-3 text-center">THỜI GIÁ VÀNG</th>
                            <th class="p-3 text-center">QUY ĐỔI (VÀNG / VNĐ)</th>
                            <th class="p-3 text-center w-40">THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800">
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// HÀM CHUYỂN TAB QUẢN LÝ ĐOÀI
function switchToDeoManagementTab() {
    if (typeof activeTeamId !== 'undefined') activeTeamId = "deo_tab_active_special";
    renderDeoManagementView();
}
window.switchToDeoManagementTab = switchToDeoManagementTab;
window.renderDeoManagementView = renderDeoManagementView;

function getDeoValueInTimeframe(timeframe) {
    if (!systemDatabase.deoHistory) return 0;
    let todayStr = new Date().toLocaleDateString('sv-SE');
    let currentMonthStr = todayStr.substring(0, 7);
    let filterFunc = () => true;

    if (timeframe === 'today') filterFunc = (item) => item.date === todayStr;
    else if (timeframe === 'month') filterFunc = (item) => item.date.startsWith(currentMonthStr);
    else if (timeframe === 'event') {
        let start = systemDatabase.eventStartDate ? new Date(systemDatabase.eventStartDate) : null;
        let end = systemDatabase.eventEndDate ? new Date(systemDatabase.eventEndDate) : null;
        filterFunc = (item) => {
            let d = new Date(item.date);
            return !(start && d < start) && !(end && d > end);
        };
    }
    
    let targetedHistory = systemDatabase.deoHistory.filter(filterFunc);
    if (timeframe === 'today') {
        let currentInputPrice = parseFloat(document.getElementById('input-current-deo-price')?.value) || 25;
        return targetedHistory.reduce((sum, item) => sum + (item.count * currentInputPrice), 0);
    }
    return targetedHistory.reduce((sum, item) => sum + item.goldValue, 0);
}

function updateDeoStatisticsDisplays() {
    let todayElement = document.getElementById('display-deo-today');
    let monthElement = document.getElementById('display-deo-month');
    let eventElement = document.getElementById('display-deo-event');
    
    if (!todayElement || !monthElement || !eventElement) return;

    if (!systemDatabase.deoHistory) systemDatabase.deoHistory = [];
    deduplicateDeoHistory();
    
    let todayStr = new Date().toLocaleDateString('sv-SE');
    let currentMonthStr = todayStr.substring(0, 7);
    let currentPrice = parseFloat(document.getElementById('input-current-deo-price')?.value) || 25;

    let todayRows = systemDatabase.deoHistory.filter(x => x.date === todayStr);
    let todayCount = todayRows.reduce((s, i) => s + i.count, 0);
    todayElement.innerText = `${todayCount} Quẻ (${(todayCount * currentPrice).toFixed(1)}v)`;

    let monthRows = systemDatabase.deoHistory.filter(x => x.date.startsWith(currentMonthStr));
    let monthCount = monthRows.reduce((s, i) => s + i.count, 0);
    let monthGold = monthRows.reduce((s, i) => s + i.goldValue, 0);
    monthElement.innerText = `${monthCount} Quẻ (${monthGold.toFixed(1)}v)`;

    let start = systemDatabase.eventStartDate ? new Date(systemDatabase.eventStartDate) : null;
    let end = systemDatabase.eventEndDate ? new Date(systemDatabase.eventEndDate) : null;
    let evRows = systemDatabase.deoHistory.filter(item => {
        let d = new Date(item.date);
        return !(start && d < start) && !(end && d > end);
    });
    let evCount = evRows.reduce((s, i) => s + i.count, 0);
    let evGold = evRows.reduce((s, i) => s + i.goldValue, 0);
    eventElement.innerText = `${evCount} Quẻ (${evGold.toFixed(1)}v)`;
}

// Tổng số dòng code trong file này: 298 dòng.