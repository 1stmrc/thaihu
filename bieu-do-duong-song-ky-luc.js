// Tên file: bieu-do-duong-song-ky-luc.js
// Chức năng: Đồ họa toán học SVG - Vẽ biểu đồ đường sóng Line Chart đa tuyến so sánh kỷ lục tốc độ chạy ải Thái Hư (Toàn Đội Min, Team Min, Vừa Đi, Team Max).
// Con của file: index.html (Nạp sau dong-co-bam-gio-va-ky-luc.js).
// Danh sách tính năng của file:
//   1. Tính toán tỉ lệ tọa độ Y tự động dựa trên dải thời gian min/max hợp lệ.
//   2. Định dạng chuỗi thời gian hiển thị rút gọn (MM:SS) trên các điểm nút đồ thị.
//   3. Xuất khối mã HTML/SVG biểu đồ đường sóng sắc nét, trực quan, có lưới tọa độ chuẩn.
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: TÍNH TOÁN & XUẤT BIỂU ĐỒ ĐƯỜNG SÓNG SVG LINE CHART
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
function generateLineupWaveChartSVG(stats, globalRec) {
    let teamMin = stats.fastestTime || 0;
    let teamMax = stats.slowestTime || 0;
    let globalMin = (globalRec && globalRec.globalFastest) ? globalRec.globalFastest : 0;
    let todayTime = stats.todayTime || 0;

    let formatSecsShort = (sec) => {
        if (!sec || sec < MIN_ALLOWED_FASTEST_SECONDS) return "--:--";
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    let validValues = [teamMin, teamMax, globalMin, todayTime].filter(v => v >= MIN_ALLOWED_FASTEST_SECONDS);
    let maxVal = validValues.length > 0 ? Math.max(...validValues) * 1.05 : 900;
    let minVal = validValues.length > 0 ? Math.min(...validValues) * 0.95 : 600;

    let getY = (val) => {
        if (!val || val < MIN_ALLOWED_FASTEST_SECONDS) return 135;
        let ratio = (val - minVal) / (maxVal - minVal || 1);
        return 130 - Math.round(ratio * 90);
    };

    let points = [
        { label: "Toàn Đội Min", x: 50, y: getY(globalMin), val: globalMin, color: "#f59e0b" },
        { label: "Team Min", x: 140, y: getY(teamMin), val: teamMin, color: "#10b981" },
        { label: "Vừa Đi", x: 230, y: getY(todayTime), val: todayTime, color: "#a855f7" },
        { label: "Team Max", x: 320, y: getY(teamMax), val: teamMax, color: "#f43f5e" }
    ];

    let polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    let dotsSVG = points.map(p => `
        <circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${p.color}" stroke="#ffffff" stroke-width="2"/>
        <text x="${p.x}" y="${p.y - 10}" font-size="10" font-weight="900" fill="${p.color}" text-anchor="middle">${formatSecsShort(p.val)}</text>
        <text x="${p.x}" y="155" font-size="9" font-weight="bold" fill="#9ca3af" text-anchor="middle">${p.label}</text>
    `).join('');

    return `
        <div class="bg-gray-955 p-3 rounded-xl border border-gray-800 flex flex-col justify-between h-[200px] relative">
            <div class="flex items-center justify-between text-[11px] font-bold border-b border-gray-800 pb-1">
                <span class="text-purple-300 flex items-center gap-1.5">
                    <i class="fa-solid fa-chart-line"></i> Biểu Đồ Đường Sóng Kỷ Lục (Line Chart)
                </span>
                <span class="text-[10px] text-gray-500 font-mono">(Đỉnh cao hơn = Chạy nhanh hơn)</span>
            </div>

            <svg class="w-full h-[160px]" viewBox="0 0 370 170" xmlns="http://www.w3.org/2000/svg">
                <line x1="20" y1="30" x2="350" y2="30" stroke="#374151" stroke-width="0.5" stroke-dasharray="3,3"/>
                <line x1="20" y1="65" x2="350" y2="65" stroke="#374151" stroke-width="0.5" stroke-dasharray="3,3"/>
                <line x1="20" y1="100" x2="350" y2="100" stroke="#374151" stroke-width="0.5" stroke-dasharray="3,3"/>
                <line x1="20" y1="138" x2="350" y2="138" stroke="#4b5563" stroke-width="1"/>

                <polyline fill="none" stroke="#6366f1" stroke-width="3" points="${polylinePoints}" stroke-linecap="round" stroke-linejoin="round" />
                ${dotsSVG}
            </svg>
        </div>
    `;
}

window.generateLineupWaveChartSVG = generateLineupWaveChartSVG;

// Tổng số dòng code trong file này: 78 dòng.