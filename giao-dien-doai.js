// Tên file: giao-dien-doai.js
// Chức năng: Giao diện Bảng Thống Kê Đoài - Nổi bật "Hôm nay", quy đổi Vàng & VNĐ, cố định khung và chỉ cuộn bảng bên trong.
// Con của file: index.html (Được nạp trực tiếp qua thẻ script trong khung xương chính).

function renderDeoManagementView() {
    let viewport = document.getElementById('active-panel-view-viewport') || document.getElementById('team-content-container') || document.getElementById('main-workspace-body');
    if (!viewport) return;

    if (typeof deduplicateDeoHistory === 'function') {
        deduplicateDeoHistory();
    }

    let todayStr = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD

    let goldRateInput = document.getElementById('input-gold-price-per-1k') || document.querySelector('input[placeholder*="155.000"]');
    let goldRateVND = parseFloat(goldRateInput ? goldRateInput.value : 155000) || 155000;

    let lineupTeamsTotal = 9;
    if (typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
        let lTeams = systemDatabase.teams.filter(t => t.type === 'lineup');
        if (lTeams.length > 0) lineupTeamsTotal = lTeams.length;
    }

    let totalAllDeo = 0;
    let totalAllTeamsRun = 0;
    let totalAllGoldValue = 0;

    let trRows = "";
    if (!systemDatabase || !systemDatabase.deoHistory || systemDatabase.deoHistory.length === 0) {
        trRows = `<tr><td colspan="6" class="text-gray-500 text-center py-8 italic text-sm">Chưa có lịch sử quẻ Đoài nào được lưu.</td></tr>`;
    } else {
        let sortedHistory = systemDatabase.deoHistory.slice().sort((a, b) => b.date.localeCompare(a.date));

        sortedHistory.forEach((x) => {
            totalAllDeo += x.count;
            totalAllTeamsRun += lineupTeamsTotal;
            totalAllGoldValue += x.goldValue;

            let isToday = (x.date === todayStr);

            let rowStyle = isToday 
                ? "bg-purple-950/60 border-2 border-purple-500 shadow-xl font-bold" 
                : "hover:bg-gray-800/40 transition border-b border-gray-800";

            let dateDisplay = isToday 
                ? `<div class="inline-flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-400 px-3 py-1 rounded-lg text-emerald-300 font-black tracking-wide shadow-md animate-pulse">
                        <i class="fa-solid fa-star text-amber-400 text-xs"></i> Hôm nay (${x.date})
                   </div>` 
                : `<span class="text-gray-300 font-mono font-semibold">${x.date}</span>`;

            let goldVal = x.goldValue || (x.count * x.price);
            let vndVal = Math.round((goldVal / 1000) * goldRateVND);
            let vndFormatted = vndVal.toLocaleString('vi-VN') + ' đ';

            let teamPerDeoRatio = x.count > 0 ? (lineupTeamsTotal / x.count).toFixed(1) : 0;
            let ratioHtml = x.count > 0 
                ? `<div class="inline-block bg-amber-950/60 border border-amber-500/50 px-2.5 py-1 rounded-lg text-amber-300 font-bold font-mono">
                        1 Đoài / ${teamPerDeoRatio} Đội
                   </div>` 
                : `<span class="text-gray-600 font-mono">-</span>`;

            trRows += `
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
                </tr>`;
        });
    }

    let globalRatioStr = totalAllDeo > 0 
        ? `1 Đoài / ${(totalAllTeamsRun / totalAllDeo).toFixed(1)} Đội (Trung bình: ${((totalAllDeo / totalAllTeamsRun) * 100).toFixed(1)}%)` 
        : `Chưa có dữ liệu`;

    let totalAllVND = Math.round((totalAllGoldValue / 1000) * goldRateVND);
    let totalAllVNDFormatted = totalAllVND.toLocaleString('vi-VN') + ' đ';

    viewport.innerHTML = `
        <div class="w-full h-full flex flex-col gap-3 p-4 bg-gray-900 border border-purple-500/60 rounded-2xl shadow-2xl text-xs overflow-hidden">
            <!-- HEADER CỐ ĐỊNH -->
            <div class="flex items-center justify-between border-b border-gray-800 pb-3 flex-wrap gap-2 shrink-0">
                <span class="font-black text-purple-300 text-sm uppercase flex items-center gap-2">
                    <i class="fa-solid fa-gem text-amber-400"></i> BẢNG THỐNG KÊ & NHẬT KÝ LỊCH SỬ QUẺ ĐOÀI CHUYÊN SÂU
                </span>
                <button onclick="if(typeof switchMainSystemTab==='function') switchMainSystemTab('thai_hu_main'); else if(typeof switchToMainTeamTab==='function') switchToMainTeamTab();" class="bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold px-3.5 py-1.5 rounded-lg border border-gray-600 transition cursor-pointer text-xs flex items-center gap-1.5 shadow">
                    <i class="fa-solid fa-arrow-left"></i> Quay Lại Thái Hư
                </button>
            </div>

            <!-- TỔNG HỢP CỐ ĐỊNH -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-950 border border-gray-800 rounded-xl font-mono shrink-0">
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

            <!-- BẢNG CUỘN BÊN TRONG CỐ ĐỊNH -->
            <div class="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-950/40 no-scrollbar">
                <table class="w-full text-left border-collapse text-xs">
                    <thead class="sticky top-0 bg-gray-950 z-10 border-b border-gray-800 shadow">
                        <tr class="text-gray-400 uppercase font-bold text-[11px]">
                            <th class="p-3">NGÀY NHẬP</th>
                            <th class="p-3 text-center">TỔNG SỐ LƯỢNG</th>
                            <th class="p-3 text-center">TỶ LỆ ĐOÀI / ĐỘI</th>
                            <th class="p-3 text-center">THỜI GIÁ VÀNG</th>
                            <th class="p-3 text-center">QUY ĐỔI (VÀNG / VNĐ)</th>
                            <th class="p-3 text-center w-40">THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800">
                        ${trRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function switchToDeoManagementTab() {
    if (typeof activeTeamId !== 'undefined') activeTeamId = "deo_tab_active_special";
    renderDeoManagementView();
}

window.renderDeoManagementView = renderDeoManagementView;
window.switchToDeoManagementTab = switchToDeoManagementTab;

// Tổng số dòng code trong file này: 153 dòng.