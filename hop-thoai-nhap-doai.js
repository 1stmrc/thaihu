// Tên file: hop-thoai-nhap-doai.js
// Chức năng: Pop-up Nhập Lượng Đoài - Gom 1 dòng/ngày, có nút -1 quẻ nhanh, chống ghi đè trạng thái sự kiện, chuẩn UTF-8.
// Con của file: index.html (Được nạp trực tiếp qua thẻ script trong khung xương chính).

const QUE_DOAI_SVG_ICON = `
    <svg class="w-4 h-4 inline-block fill-current align-middle mr-1 text-purple-400 animate-pulse" viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="5" width="42" height="14" rx="2" />
        <rect x="58" y="5" width="42" height="14" rx="2" />
        <rect x="0" y="33" width="100" height="14" rx="2" />
        <rect x="0" y="61" width="100" height="14" rx="2" />
    </svg>
`;

function injectDeoCardComponent() {
    let container = document.getElementById('injection-deo-card-holder');
    if (!container) return;
    
    container.innerHTML = `
        <div id="floating-deo-card" class="bg-gray-900 border-2 border-purple-500 rounded-2xl p-4 shadow-2xl w-[calc(50vw-1rem)] md:w-85 hidden text-xs z-50">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
                <span class="font-black text-purple-400 uppercase tracking-wider flex items-center gap-1 text-xs">
                    ${QUE_DOAI_SVG_ICON} NHẬP LƯỢNG ĐOÀI
                </span>
                <button onclick="toggleFloatingDeoCard()" class="text-gray-400 hover:text-white font-bold text-base cursor-pointer">&times;</button>
            </div>
            <div class="grid grid-cols-2 gap-2 bg-gray-955 p-2 rounded-xl border border-gray-800 mb-2">
                <div>
                    <label class="block text-[10px] text-gray-400 mb-0.5 font-bold">Giá Đoài Nay:</label>
                    <input id="input-current-deo-price" type="number" value="25" class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-purple-300 font-bold text-center focus:outline-none" onchange="handleDeoPriceChange(this.value)" oninput="forceUpdateEventLabelRealtime(); calculateRealtimeProfits();">
                </div>
                <div>
                    <label class="block text-[10px] text-gray-400 mb-0.5 font-bold">Số Lượng Thêm:</label>
                    <input id="input-deo-amount-increment" type="number" min="1" value="1" class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white font-bold text-center focus:outline-none">
                </div>
            </div>
            <button onclick="commitQuayDoaiEntryWithLog()" class="w-full bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black py-2 rounded-xl text-xs transition shadow flex items-center justify-center gap-1 mb-2 cursor-pointer">
                <i class="fa-solid fa-check"></i> Lưu Lượng Quẻ Nhập
            </button>
            <div class="space-y-1.5 font-bold text-[11px] text-gray-300 max-h-36 overflow-y-auto pr-1 custom-scrollbar" id="deo-history-ledger-container"></div>
            <div class="space-y-1 mt-2 pt-2 border-t border-gray-800 text-[11px] text-gray-400 font-bold">
                <div class="flex justify-between"><span>Hôm nay:</span><span id="display-deo-today" class="text-purple-300">0 Quẻ</span></div>
                <div class="flex justify-between"><span>Tháng này:</span><span id="display-deo-month" class="text-cyan-300">0 Quẻ</span></div>
                <div class="flex justify-between items-center p-1.5 bg-purple-950/30 rounded border border-purple-900/40 mt-1">
                    <span id="lbl-event-range" class="text-[11px] font-bold text-gray-300">Sự Kiện: <span class="text-gray-500 font-normal">(Chưa cài)</span></span>
                    <span id="display-deo-event" class="text-yellow-400 font-bold">0 Quẻ</span>
                </div>
            </div>
        </div>
    `;

    fixDeoFloatingButtonIcon();
    forceUpdateEventLabelRealtime();
    setupMutationWatcher();
}

function fixDeoFloatingButtonIcon() {
    let buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.innerText.includes('Nhập Đoài') && !btn.closest('#floating-deo-card')) {
            btn.innerHTML = `${QUE_DOAI_SVG_ICON} Nhập Đoài`;
        }
    });
}

function toggleFloatingDeoCard() {
    let card = document.getElementById('floating-deo-card');
    if (card) {
        let isHidden = card.classList.contains('hidden');
        if (isHidden) {
            forceUpdateEventLabelRealtime();
            if (typeof deduplicateDeoHistory === 'function') deduplicateDeoHistory();
            renderDeoHistoryLedger();
            updateDeoStatisticsDisplays();
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    }
}

// HÀM ÉP CẬP NHẬT DÒNG TÊN SỰ KIỆN VÀ TRẠNG THÁI HẾT HẠN
function forceUpdateEventLabelRealtime() {
    fixDeoFloatingButtonIcon();

    let eventName = localStorage.getItem('EVENT_NAME') || "";
    let startDate = localStorage.getItem('EVENT_START_DATE') || null;
    let endDate = localStorage.getItem('EVENT_END_DATE') || null;

    if (typeof systemDatabase !== 'undefined' && systemDatabase) {
        eventName = eventName || systemDatabase.eventName || systemDatabase.eventConfig?.eventName || "";
        startDate = startDate || systemDatabase.eventStartDate || systemDatabase.eventConfig?.startDate;
        endDate = endDate || systemDatabase.eventEndDate || systemDatabase.eventConfig?.endDate;
    }

    let dateInputs = document.querySelectorAll('#settings-modal input[type="date"], input[type="date"]');
    if (dateInputs.length >= 2) {
        if (dateInputs[0].value) startDate = dateInputs[0].value;
        if (dateInputs[1].value) endDate = dateInputs[1].value;
    }

    let nameInput = document.getElementById('input-event-name-custom');
    if (nameInput && nameInput.value) eventName = nameInput.value.trim();

    let rangeLabel = document.getElementById('lbl-event-range');

    if (rangeLabel && startDate && endDate) {
        let now = new Date();
        let todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        let endMs = new Date(endDate).setHours(23, 59, 59, 999);

        let eventTitleShow = eventName ? eventName : "Sự Kiện";
        let newContent = "";

        if (todayMs > endMs) {
            newContent = `Sự Kiện: <span class="text-amber-300 font-bold">${eventTitleShow}</span> <span class="text-rose-400 font-bold text-[10px]">(đã hết hạn)</span>`;
        } else {
            newContent = `Sự Kiện: <span class="text-amber-300 font-bold">${eventTitleShow}</span>`;
        }

        if (rangeLabel.innerHTML !== newContent) {
            rangeLabel.innerHTML = newContent;
        }
    }
}

let isUpdatingSelf = false;
function setupMutationWatcher() {
    let rangeLabel = document.getElementById('lbl-event-range');
    if (!rangeLabel) return;

    let observer = new MutationObserver(() => {
        if (isUpdatingSelf) return;
        if (rangeLabel.innerText.includes('(Chưa cài)')) {
            isUpdatingSelf = true;
            forceUpdateEventLabelRealtime();
            isUpdatingSelf = false;
        }
    });

    observer.observe(rangeLabel, { childList: true, characterData: true, subtree: true });
}

function handleDeoPriceChange(val) {
    if (typeof logUserAction === 'function') {
        logUserAction(`Đã cập nhật Giá Đoài hôm nay: ${val}v`);
    }
}

function commitQuayDoaiEntryWithLog() {
    let amountEl = document.getElementById('input-deo-amount-increment');
    let priceEl = document.getElementById('input-current-deo-price');
    let amount = amountEl ? amountEl.value : 1;
    let price = priceEl ? priceEl.value : 25;

    if (typeof commitQuayDoaiEntry === 'function') {
        commitQuayDoaiEntry();
    }

    forceUpdateEventLabelRealtime();

    if (typeof logUserAction === 'function') {
        logUserAction(`Nhập thêm +${amount} quẻ Đoài (Giá: ${price}v/quẻ)`);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectDeoCardComponent);
} else {
    injectDeoCardComponent();
}

setInterval(() => {
    forceUpdateEventLabelRealtime();
}, 500);

// Tổng số dòng code trong file này: 165 dòng.