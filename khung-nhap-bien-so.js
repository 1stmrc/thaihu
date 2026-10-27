// Tên file: khung-nhap-bien-so.js
// Chức năng: Ép chia đôi Header 50/50, bảo vệ bộ nhớ bền vững (khóa ưu tiên localStorage), tích hợp nút mũi tên sổ/gập (Collapse/Expand) tối ưu màn hình phụ, nút [Bật Auto-Save] liên kết file trực tiếp, liên kết Reset Ngày và đồng bộ real-time.
// Con của file: index.html (Được nạp trực tiếp vào thẻ div #injection-header-container trong index.html).
// Trạng thái: [ĐÃ NÂNG CẤP TÍNH NĂNG THU GỌN HEADER CHO MÀN HÌNH NHỎ/MÀN HÌNH PHỤ]

/* ==========================================================================
   KHỐI 1: KHỞI TẠO VÀ RENDER HEADER (HỖ TRỢ THU GỌN VÀ BẢO TOÀN DỮ LIỆU)
   ========================================================================== */
function injectHeaderComponent() {
    let container = document.getElementById('injection-header-container');
    if (!container) return;

    // 1. ĐỌC ƯU TIÊN TỪ LOCALSTORAGE TRƯỚC HẾT
    let savedMatPrice = localStorage.getItem('HEADER_MAT_PRICE') || (typeof systemDatabase !== 'undefined' && systemDatabase.materialPrice ? systemDatabase.materialPrice : "0.25");
    let savedGoldRate = localStorage.getItem('HEADER_GOLD_RATE') || (typeof systemDatabase !== 'undefined' && systemDatabase.goldRate ? systemDatabase.goldRate : "155.000");
    let savedTicketPrice = localStorage.getItem('HEADER_TICKET_PRICE') || (typeof systemDatabase !== 'undefined' && systemDatabase.ticketPrice ? systemDatabase.ticketPrice : "24");
    let savedRefundPrice = localStorage.getItem('HEADER_REFUND_PRICE') || (typeof systemDatabase !== 'undefined' && systemDatabase.refundPrice ? systemDatabase.refundPrice : "16");

    // 2. ĐỌC TRẠNG THÁI GẬP/MỞ HEADER (Mặc định: false - Mở)
    let isCollapsed = localStorage.getItem('HEADER_COLLAPSED_STATE') === 'true';

    container.innerHTML = `
        <header class="shrink-0 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-xl shadow-xl mb-2.5 z-10 select-none transition-all duration-200">
            
            <!-- THANH ĐIỀU KHIỂN THU GỌN / MỞ RỘNG HEADER -->
            <div class="flex items-center justify-between pb-1 ${isCollapsed ? '' : 'border-b border-gray-700/60 mb-2'} cursor-pointer" onclick="toggleHeaderCollapseState()" title="Nhấn để Ẩn/Hiện toàn bộ khung cấu hình biến số">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-sliders text-amber-400 text-xs"></i>
                    <span class="text-gray-300 font-bold text-xs uppercase tracking-wide">CẤU HÌNH BIẾN SỐ &amp; HỆ THỐNG</span>
                    <span id="header-mini-status-preview" class="text-[11px] text-gray-400 font-mono ${isCollapsed ? 'inline-block' : 'hidden'}">
                        (Giá NL: <b class="text-yellow-400">${savedMatPrice}</b> | 1K Vàng: <b class="text-green-400">${savedGoldRate}</b> | Vé: <b class="text-red-400">${savedTicketPrice}</b>)
                    </span>
                </div>

                <button type="button" class="bg-gray-700/80 hover:bg-gray-600 text-cyan-300 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition border border-gray-600/50">
                    <span id="header-toggle-button-text">${isCollapsed ? 'Mở Rộng' : 'Thu Gọn'}</span>
                    <i id="header-toggle-icon" class="fa-solid ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'} text-cyan-400"></i>
                </button>
            </div>

            <!-- NỘI DUNG CHÍNH (GỒM BẢNG BIẾN SỐ + CÁC NÚT BẤM) -->
            <div id="header-main-collapsible-wrapper" class="${isCollapsed ? 'hidden' : 'flex'} flex-row items-stretch justify-between gap-3 w-full">
                
                <!-- BÊN TRÁI (45% ĐỘ RỘNG): KHỐI NHẬP LIỆU CHIA LÀM 2 DÒNG -->
                <div class="w-[45%] bg-gray-955 p-3 rounded-lg border border-gray-850 flex flex-col gap-2 justify-center shrink-0">
                    <!-- Dòng 1 -->
                    <div class="flex items-center gap-2">
                        <div class="flex items-center justify-between flex-1">
                            <span class="text-gray-400 font-bold text-xs shrink-0">Giá NL:</span>
                            <input id="input-material-price" type="number" step="0.01" value="${savedMatPrice}" class="w-14 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-yellow-400 font-bold focus:outline-none focus:border-blue-500 text-center text-xs">
                        </div>
                        <div class="w-px h-4 bg-gray-800"></div>
                        <div class="flex items-center justify-between flex-1">
                            <span class="text-gray-400 font-bold text-xs shrink-0">1K Vàng:</span>
                            <input id="input-gold-rate" type="text" value="${savedGoldRate}" class="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-green-400 font-bold focus:outline-none focus:border-blue-500 text-center text-xs">
                        </div>
                    </div>
                    <!-- Dòng 2 -->
                    <div class="flex items-center gap-2">
                        <div class="flex items-center justify-between flex-1">
                            <span class="text-gray-400 font-bold text-xs shrink-0">Vé (V):</span>
                            <input id="input-ticket-price" type="number" value="${savedTicketPrice}" class="w-14 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-red-400 font-bold focus:outline-none focus:border-blue-500 text-center text-xs">
                        </div>
                        <div class="w-px h-3 bg-gray-800"></div>
                        <div class="flex items-center justify-between flex-1">
                            <span class="text-gray-400 font-bold text-xs shrink-0">Hoàn:</span>
                            <input id="input-refund-price" type="number" value="${savedRefundPrice}" class="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-orange-400 font-bold focus:outline-none focus:border-blue-500 text-center text-xs">
                        </div>
                    </div>
                </div>

                <!-- BÊN PHẢI (55% ĐỘ RỘNG): PHÓNG TO NÚT BẤM VÀ PRESET -->
                <div class="w-[55%] flex flex-col justify-between gap-2 py-0.5 items-end">
                    <!-- Hàng nút 1 -->
                    <div class="flex flex-wrap gap-1.5 justify-end w-full">
                        <button onclick="executeDailyResetPipeline()" class="bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-1.5 rounded-lg transition shadow text-xs cursor-pointer">Reset Ngày</button>
                        <button onclick="handleResetToDefaultWithLog()" class="bg-red-700 hover:bg-red-800 text-white font-black px-3.5 py-1.5 rounded-lg transition shadow text-xs cursor-pointer">Cấu Hình Gốc</button>
                        <button onclick="handleSaveTemplateWithLog()" class="bg-emerald-700 hover:bg-emerald-800 text-white font-black px-3.5 py-1.5 rounded-lg transition shadow text-xs cursor-pointer">Lưu Mẫu</button>
                        <button onclick="openSettingsModal()" class="bg-amber-600 hover:bg-amber-700 text-white font-black px-3 py-1.5 rounded-lg transition shadow text-xs cursor-pointer" title="Cài đặt hệ thống"><i class="fa-solid fa-gear"></i></button>
                    </div>
                    
                    <!-- Hàng nút 2 -->
                    <div class="flex flex-wrap gap-1.5 items-center justify-end w-full">
                        <div class="flex items-center gap-1.5 bg-purple-955/40 px-2 py-1 rounded-lg border border-purple-900/30 shrink-0">
                            <span class="text-[10px] text-purple-400 font-black uppercase shrink-0">Sơ đồ:</span>
                            <select id="preset-combo-selector" onchange="handlePresetSelectChangeWithLog(this)" class="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-yellow-400 font-bold focus:outline-none text-xs w-[110px] h-[24px] cursor-pointer"></select>
                            <button onclick="handleSavePresetWithLog()" class="bg-purple-700 hover:bg-purple-600 text-white font-black px-2 py-0.5 rounded text-[10px] h-[24px] transition cursor-pointer">LƯU</button>
                            <button onclick="handleDeletePresetWithLog()" class="bg-red-900 hover:bg-red-700 text-red-200 font-black px-2 py-0.5 rounded text-[10px] h-[24px] transition cursor-pointer">&times;</button>
                        </div>
                        
                        <!-- NÚT BẬT AUTO-SAVE GHI ĐÈ FILE TRỰC TIẾP -->
                        <button id="btn-auto-save-link" onclick="if(typeof connectAutoSaveFile==='function') connectAutoSaveFile()" class="bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-500/50 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition shadow" title="Chọn file để tự động lưu mỗi khi click chuột">
                            <i class="fa-solid fa-link text-amber-400"></i> Bật Auto-Save
                        </button>

                        <button onclick="handleExportWithLog()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg transition text-xs font-black cursor-pointer">Xuất File</button>
                        <label class="bg-gray-700 hover:bg-gray-600 text-white px-3.5 py-1.5 rounded-lg transition cursor-pointer font-black text-xs shrink-0 text-center">
                            Nạp File
                            <input type="file" id="import-state-file-controller" class="hidden" accept=".json" onclick="this.value=null" onchange="handleImportWithLog(event)">
                        </label>
                    </div>

                </div>

            </div>
        </header>
    `;

    // GẮN LISTENER TRỰC TIẾP ĐỂ LƯU TỨC THÌ
    attachHeaderInputAutoSaveListeners();
    syncSavedHeaderDataIntoSystem();
}

/* ==========================================================================
   KHỐI 2: HÀM ĐIỀU KHIỂN BẬT / TẮT (TOGGLE) THU GỌN HEADER
   ========================================================================== */
function toggleHeaderCollapseState() {
    let contentWrapper = document.getElementById('header-main-collapsible-wrapper');
    let toggleBtnText = document.getElementById('header-toggle-button-text');
    let toggleIcon = document.getElementById('header-toggle-icon');
    let preview = document.getElementById('header-mini-status-preview');

    if (!contentWrapper || !toggleBtnText || !toggleIcon) return;

    let isHidden = contentWrapper.classList.toggle('hidden');
    if (!isHidden) {
        contentWrapper.classList.add('flex');
    } else {
        contentWrapper.classList.remove('flex');
    }

    // Cập nhật text & icon
    if (isHidden) {
        toggleBtnText.textContent = "Mở Rộng";
        toggleIcon.className = "fa-solid fa-chevron-down text-cyan-400";
        if (preview) preview.classList.remove('hidden');
        localStorage.setItem('HEADER_COLLAPSED_STATE', 'true');
    } else {
        toggleBtnText.textContent = "Thu Gọn";
        toggleIcon.className = "fa-solid fa-chevron-up text-cyan-400";
        if (preview) preview.classList.add('hidden');
        localStorage.setItem('HEADER_COLLAPSED_STATE', 'false');
    }
}

/* ==========================================================================
   KHỐI 3: TỰ ĐỘNG BẮT SỰ KIỆN VÀ LƯU VÀO LOCALSTORAGE
   ========================================================================== */
function attachHeaderInputAutoSaveListeners() {
    let matEl = document.getElementById('input-material-price');
    let goldEl = document.getElementById('input-gold-rate');
    let ticketEl = document.getElementById('input-ticket-price');
    let refundEl = document.getElementById('input-refund-price');

    const handleUpdate = () => {
        saveHeaderInputsState();
        if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
        if (typeof runActivitiesComparisonCalculation === 'function') runActivitiesComparisonCalculation();
    };

    if (matEl) {
        matEl.addEventListener('input', handleUpdate);
        matEl.addEventListener('change', () => handleHeaderInputChangeWithLog('Giá Nguyên Liệu', matEl.value));
    }
    if (goldEl) {
        goldEl.addEventListener('input', () => {
            if (typeof formatVNDInput === 'function') formatVNDInput(goldEl);
            handleUpdate();
        });
        goldEl.addEventListener('change', () => handleHeaderInputChangeWithLog('Tỷ Giá 1K Vàng', goldEl.value));
    }
    if (ticketEl) {
        ticketEl.addEventListener('input', handleUpdate);
        ticketEl.addEventListener('change', () => handleHeaderInputChangeWithLog('Giá Vé', ticketEl.value));
    }
    if (refundEl) {
        refundEl.addEventListener('input', handleUpdate);
        refundEl.addEventListener('change', () => handleHeaderInputChangeWithLog('Tiền Hoàn Vàng', refundEl.value));
    }
}

function saveHeaderInputsState() {
    let matEl = document.getElementById('input-material-price');
    let goldEl = document.getElementById('input-gold-rate');
    let ticketEl = document.getElementById('input-ticket-price');
    let refundEl = document.getElementById('input-refund-price');

    if (matEl && matEl.value !== "") {
        localStorage.setItem('HEADER_MAT_PRICE', matEl.value);
        if (typeof systemDatabase !== 'undefined') systemDatabase.materialPrice = matEl.value;
    }
    if (goldEl && goldEl.value !== "") {
        localStorage.setItem('HEADER_GOLD_RATE', goldEl.value);
        if (typeof systemDatabase !== 'undefined') systemDatabase.goldRate = goldEl.value;
    }
    if (ticketEl && ticketEl.value !== "") {
        localStorage.setItem('HEADER_TICKET_PRICE', ticketEl.value);
        if (typeof systemDatabase !== 'undefined') systemDatabase.ticketPrice = ticketEl.value;
    }
    if (refundEl && refundEl.value !== "") {
        localStorage.setItem('HEADER_REFUND_PRICE', refundEl.value);
        if (typeof systemDatabase !== 'undefined') systemDatabase.refundPrice = refundEl.value;
    }
}

function syncSavedHeaderDataIntoSystem() {
    let sMat = localStorage.getItem('HEADER_MAT_PRICE');
    let sGold = localStorage.getItem('HEADER_GOLD_RATE');
    let sTicket = localStorage.getItem('HEADER_TICKET_PRICE');
    let sRefund = localStorage.getItem('HEADER_REFUND_PRICE');

    let matEl = document.getElementById('input-material-price');
    let goldEl = document.getElementById('input-gold-rate');
    let ticketEl = document.getElementById('input-ticket-price');
    let refundEl = document.getElementById('input-refund-price');

    if (sMat && matEl) matEl.value = sMat;
    if (sGold && goldEl) goldEl.value = sGold;
    if (sTicket && ticketEl) ticketEl.value = sTicket;
    if (sRefund && refundEl) refundEl.value = sRefund;

    if (typeof systemDatabase !== 'undefined') {
        if (sMat) systemDatabase.materialPrice = sMat;
        if (sGold) systemDatabase.goldRate = sGold;
        if (sTicket) systemDatabase.ticketPrice = sTicket;
        if (sRefund) systemDatabase.refundPrice = sRefund;
    }
}

// LẮNG NGHE SỰ KIỆN LOAD TRANG ĐỂ ÉP PHỤC HỒI DỮ LIỆU CUỐI CÙNG
window.addEventListener('load', () => {
    setTimeout(syncSavedHeaderDataIntoSystem, 50);
});

/* ==========================================================================
   KHỐI 4: CÁC HÀM HOOK GHI LOG & ĐIỀU KHIỂN HEADER
   ========================================================================== */
function handleHeaderInputChangeWithLog(label, value) {
    saveHeaderInputsState();
    if (typeof logUserAction === 'function') {
        logUserAction(`Đã thay đổi ${label}: ${value}`);
    }
}

function handleResetToDefaultWithLog() {
    localStorage.removeItem('HEADER_MAT_PRICE');
    localStorage.removeItem('HEADER_GOLD_RATE');
    localStorage.removeItem('HEADER_TICKET_PRICE');
    localStorage.removeItem('HEADER_REFUND_PRICE');
    if (typeof resetToHardcodedDefault === 'function') resetToHardcodedDefault();
    if (typeof logUserAction === 'function') logUserAction("Đã khôi phục về Cấu Hình Gốc mặc định");
}

function handleSaveTemplateWithLog() {
    saveHeaderInputsState();
    if (typeof saveCurrentAsDefaultTemplate === 'function') saveCurrentAsDefaultTemplate();
    if (typeof logUserAction === 'function') logUserAction("Đã lưu trạng thái hiện tại làm Mẫu Mặc Định");
}

function handlePresetSelectChangeWithLog(selectEl) {
    if (typeof loadSelectedPresetStrategyPipeline === 'function') loadSelectedPresetStrategyPipeline();
    if (selectEl && selectEl.value && typeof logUserAction === 'function') {
        logUserAction(`Đã nạp Sơ đồ chiến thuật: [ ${selectEl.options[selectEl.selectedIndex].text} ]`);
    }
}

function handleSavePresetWithLog() {
    if (typeof saveCurrentLineupsAsPreset === 'function') saveCurrentLineupsAsPreset();
    if (typeof logUserAction === 'function') logUserAction("Đã lưu Sơ đồ chiến thuật mới");
}

function handleDeletePresetWithLog() {
    let selectEl = document.getElementById('preset-combo-selector');
    let presetName = selectEl && selectEl.selectedIndex >= 0 ? selectEl.options[selectEl.selectedIndex].text : "";
    if (typeof deleteCurrentSelectedPreset === 'function') deleteCurrentSelectedPreset();
    if (presetName && typeof logUserAction === 'function') logUserAction(`Đã xóa Sơ đồ chiến thuật: [ ${presetName} ]`);
}

function handleExportWithLog() {
    saveHeaderInputsState();
    if (typeof exportFullConfigurationState === 'function') exportFullConfigurationState();
    if (typeof logUserAction === 'function') logUserAction("Đã Xuất File cấu hình hệ thống (.json)");
}

function handleImportWithLog(event) {
    if (typeof importFullConfigurationState === 'function') importFullConfigurationState(event);
    if (typeof logUserAction === 'function') logUserAction("Đã Nạp File cấu hình thành công");
}

window.injectHeaderComponent = injectHeaderComponent;
window.toggleHeaderCollapseState = toggleHeaderCollapseState;
window.saveHeaderInputsState = saveHeaderInputsState;
window.syncSavedHeaderDataIntoSystem = syncSavedHeaderDataIntoSystem;
