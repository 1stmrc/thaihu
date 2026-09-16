// Tên file: tinh-toan-toi-uu-hoat-dong.js
// Chức năng: Tab So Sánh Tối Ưu & Phân Tích Hiệu Suất - Tính toán chuyên sâu Thái Hư, Thương Nhân, Tàng Kiếm; Chế độ Tính Lời Lỗ độc lập; Đồng bộ giá Topbar Real-time; Chuẩn hóa nguyên liệu Thương Nhân (8 NL/lượt).
// Con của file: index.html

const OPT_STORAGE_KEY = 'APP_OPTIMIZATION_FORM_STATE_V3';

function saveOptimizationFormState() {
    try {
        let state = {
            isEvent: document.getElementById('chk-opt-event-toggle')?.checked || false,
            isProfitLossMode: document.getElementById('chk-opt-profit-loss-toggle')?.checked || false,
            isAddDeo: document.getElementById('chk-opt-thaihu-add-deo')?.checked || false,
            isCaptainBonusTH: document.getElementById('chk-opt-thaihu-captain-bonus')?.checked || false,
            captainBonusGoldTH: document.getElementById('input-opt-thaihu-captain-gold')?.value || "10",
            isCaptainBonusTK: document.getElementById('chk-opt-tangkiem-captain-bonus')?.checked || false,
            captainBonusGoldTK: document.getElementById('input-opt-tangkiem-captain-gold')?.value || "10",
            thaihuTeamsManual: document.getElementById('input-opt-thaihu-teams')?.value || "8",
            thaihuMins: document.getElementById('input-opt-thaihu-mins-per-team')?.value || "12",
            thaihuRunMode: document.querySelector('input[name="rad-thaihu-run-mode"]:checked')?.value || "full",
            merchantGold: document.getElementById('input-opt-merchant-gold-per-run')?.value || "1.3",
            merchantBatchAcc: document.getElementById('input-opt-merchant-batch-acc')?.value || "11",
            merchantBatchMins: document.getElementById('input-opt-merchant-batch-mins')?.value || "45",
            merchantTotalAcc: document.getElementById('input-opt-merchant-total-acc')?.value || "60",
            tangkiemTeams: document.getElementById('input-opt-tangkiem-teams')?.value || "8",
            tangkiemMins: document.getElementById('input-opt-tangkiem-mins-per-team')?.value || "15",
            tangkiemTicketPrice: document.getElementById('input-opt-tangkiem-ticket')?.value || "23",
            tangkiemX3: document.getElementById('chk-opt-tangkiem-x3')?.checked || false
        };
        localStorage.setItem(OPT_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Lỗi lưu trạng thái Tab So Sánh:", e);
    }
}

function loadOptimizationFormState() {
    try {
        let raw = localStorage.getItem(OPT_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn("Lỗi đọc trạng thái Tab So Sánh:", e);
    }
    return null;
}

function formatMinutesToHoursText(mins) {
    let m = Math.max(0, Math.round(mins));
    if (m < 60) return `${m} phút`;
    let h = Math.floor(m / 60);
    let remM = m % 60;
    return remM > 0 ? `${h} giờ ${remM} phút` : `${h} giờ`;
}

function attachTopbarRealtimeListeners() {
    const topbarInputIds = [
        'input-material-price',
        'input-ticket-price',
        'input-refund-gold',
        'input-rebate-price',
        'input-gold-rate',
        'input-gold-price-per-1k'
    ];
    topbarInputIds.forEach(id => {
        let el = document.getElementById(id);
        if (el && !el.dataset.optSyncBound) {
            el.dataset.optSyncBound = "true";
            el.addEventListener('input', () => {
                let optContainer = document.getElementById('opt-comparison-cards-container');
                if (optContainer) runActivitiesComparisonCalculation();
            });
        }
    });
}

function switchToOptimizationTab() {
    activeTeamId = "optimization_tab_active";

    let btnThaihu = document.getElementById('btn-main-tab-thaihu');
    let btnMerchant = document.getElementById('btn-main-tab-merchant');
    let btnOpt = document.getElementById('btn-main-tab-optimize');
    let btnDeo = document.getElementById('btn-main-tab-deo');
    let btnLogs = document.getElementById('btn-main-tab-logs');

    if (btnThaihu) btnThaihu.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnMerchant) btnMerchant.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnOpt) btnOpt.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white shadow border border-emerald-500 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnDeo) btnDeo.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";
    if (btnLogs) btnLogs.className = "px-3 py-1.5 rounded-lg text-xs font-black bg-gray-800/80 text-gray-300 border border-gray-700 hover:bg-gray-700 transition cursor-pointer uppercase flex items-center gap-1.5 shrink-0";

    let subNavZone = document.getElementById('sub-navbar-container-zone');
    if (subNavZone) subNavZone.classList.add('hidden');

    let fDeo = document.getElementById('floating-bubble-deo-container');
    let fProfit = document.getElementById('floating-bubble-profit-container');
    let fFail = document.getElementById('floating-failure-management-container');
    if (fDeo) fDeo.classList.add('hidden');
    if (fProfit) fProfit.classList.add('hidden');
    if (fFail) fFail.classList.add('hidden');

    renderOptimizationWorkspaceView();
}

function renderOptimizationWorkspaceView() {
    let viewport = document.getElementById('active-panel-view-viewport') || 
                   document.getElementById('team-content-container') || 
                   document.getElementById('main-workspace-body');
    if (!viewport) return;

    attachTopbarRealtimeListeners();
    let saved = loadOptimizationFormState();

    let lineupCount = saved ? saved.tangkiemTeams : ((typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.filter(t => t.type === 'lineup').length : 8);
    let dataMemberCount = saved ? saved.merchantTotalAcc : ((typeof systemDatabase !== 'undefined' && systemDatabase.members) ? Object.keys(systemDatabase.members).length : 60);
    let isEventChecked = saved ? (saved.isEvent === true) : false;
    let isProfitLossChecked = saved ? (saved.isProfitLossMode === true) : false;
    let isTangkiemX3Checked = saved ? (saved.tangkiemX3 === true) : false;
    let isTkCaptainBonusChecked = saved ? (saved.isCaptainBonusTK === true) : false;
    let tkCaptainBonusGoldVal = saved ? saved.captainBonusGoldTK : "10";
    let merchantGoldVal = saved ? saved.merchantGold : "0.1";
    let merchantBatchAccVal = saved ? saved.merchantBatchAcc : "11";
    let merchantBatchMinsVal = saved ? saved.merchantBatchMins : "45";
    let tangkiemMinsVal = saved ? saved.tangkiemMins : "15";
    let tangkiemTicketVal = saved ? saved.tangkiemTicketPrice : "23";

    viewport.innerHTML = `
        <div class="w-full h-full flex flex-col gap-3 p-3.5 bg-gray-900 border border-emerald-500/60 rounded-2xl shadow-2xl text-xs overflow-hidden">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2 flex-wrap gap-2 shrink-0">
                <span class="font-bold text-emerald-300/90 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    <i class="fa-solid fa-scale-balanced text-amber-400"></i> BẢNG PHÂN TÍCH TỐI ƯU THỜI GIAN TRÊN VÀNG / TIỀN
                </span>
                
                <div class="flex items-center gap-2.5">
                    <label class="flex items-center gap-1.5 cursor-pointer bg-gray-955 px-2.5 py-1 rounded-lg border border-gray-700 hover:border-cyan-500 transition select-none shadow">
                        <input id="chk-opt-profit-loss-toggle" type="checkbox" ${isProfitLossChecked ? 'checked' : ''} onchange="runActivitiesComparisonCalculation()" class="accent-cyan-400 cursor-pointer w-3.5 h-3.5">
                        <span class="text-[11px] font-bold text-cyan-300 flex items-center gap-1"><i class="fa-solid fa-calculator"></i> Tính Lời Lỗ</span>
                    </label>

                    <label class="flex items-center gap-1.5 cursor-pointer bg-gray-955 px-2.5 py-1 rounded-lg border border-gray-700 hover:border-amber-500 transition select-none shadow">
                        <input id="chk-opt-event-toggle" type="checkbox" ${isEventChecked ? 'checked' : ''} onchange="toggleEventModeUI()" class="accent-amber-400 cursor-pointer w-3.5 h-3.5">
                        <span class="text-[11px] font-bold text-amber-400 flex items-center gap-1"><i class="fa-solid fa-fire"></i> Đang Có Sự Kiện</span>
                    </label>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 shrink-0">
                <div id="opt-thaihu-input-card" class="bg-gray-955 p-3 rounded-xl border border-purple-500/50 flex flex-col gap-2 shadow-inner">
                </div>

                <div class="bg-gray-955 p-3 rounded-xl border border-amber-500/50 flex flex-col gap-2 shadow-inner">
                    <div class="flex items-center justify-between border-b border-gray-800 pb-1">
                        <span class="font-black text-amber-300 uppercase text-[11px] flex items-center gap-1 whitespace-nowrap"><i class="fa-solid fa-gem text-amber-400"></i> 2. THƯƠNG NHÂN</span>
                        <span class="text-[9px] bg-amber-900/60 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">x3 Lượt (8 NL/lượt)</span>
                    </div>
                    <div>
                        <label class="text-gray-400 text-[10px] block font-bold mb-0.5">Số Vàng / 1 Lượt:</label>
                        <input id="input-opt-merchant-gold-per-run" type="number" min="0" step="0.1" value="${merchantGoldVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-amber-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-500">
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <div>
                            <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Số ACC Mở (x):</label>
                            <input id="input-opt-merchant-batch-acc" type="number" min="1" value="${merchantBatchAccVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-500">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Thời Gian (Phút):</label>
                            <input id="input-opt-merchant-batch-mins" type="number" min="0.5" step="0.5" value="${merchantBatchMinsVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-amber-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-500">
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-0.5">
                            <label class="text-gray-400 text-[10px] font-bold">Tổng Số Tài Khoản:</label>
                            <span id="opt-merchant-calculated-time-badge" class="text-[9px] text-cyan-300 font-mono font-bold">~ 0 phút</span>
                        </div>
                        <input id="input-opt-merchant-total-acc" type="number" min="1" value="${dataMemberCount}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-500">
                    </div>
                </div>

                <div class="bg-gray-955 p-3 rounded-xl border border-cyan-500/50 flex flex-col gap-2 shadow-inner">
                    <div class="flex items-center justify-between border-b border-gray-800 pb-1 flex-nowrap">
                        <span class="font-black text-cyan-300 uppercase text-[11px] flex items-center gap-1 whitespace-nowrap"><i class="fa-solid fa-shield-halved text-cyan-400"></i> 3. TÀNG KIẾM</span>
                        <div class="flex items-center gap-1.5 flex-nowrap">
                            <label class="flex items-center gap-1 cursor-pointer bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40 select-none whitespace-nowrap">
                                <input id="chk-opt-tangkiem-captain-bonus" type="checkbox" ${isTkCaptainBonusChecked ? 'checked' : ''} onchange="toggleTkCaptainInputVisibility()" class="accent-cyan-400 cursor-pointer w-3 h-3">
                                <span class="text-[9px] font-black text-amber-300">Hoàn Đ.Trưởng</span>
                            </label>
                            <label class="flex items-center gap-1 cursor-pointer bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40 select-none whitespace-nowrap">
                                <input id="chk-opt-tangkiem-x3" type="checkbox" ${isTangkiemX3Checked ? 'checked' : ''} onchange="runActivitiesComparisonCalculation()" class="accent-cyan-400 cursor-pointer w-3 h-3">
                                <span class="text-[9px] font-black text-cyan-300">x3 Lượt</span>
                            </label>
                        </div>
                    </div>
                    <div id="opt-tk-captain-input-box" class="${isTkCaptainBonusChecked ? '' : 'hidden'} flex items-center justify-between bg-gray-900 px-2 py-1 rounded border border-gray-800">
                        <span class="text-gray-400 text-[10px] font-bold">Hoàn Đ.Trưởng (1 lần/team):</span>
                        <input id="input-opt-tangkiem-captain-gold" type="number" min="0" step="1" value="${tkCaptainBonusGoldVal}" oninput="runActivitiesComparisonCalculation()" class="w-16 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-amber-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-cyan-500" title="Vàng hoàn cho đội trưởng mỗi 1 lần đi (x3 sẽ x2 lần vì lần 1 free)">
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                        <div>
                            <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Số Team Đi:</label>
                            <input id="input-opt-tangkiem-teams" type="number" min="1" value="${lineupCount}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-cyan-500">
                        </div>
                        <div>
                            <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Giá Vé TK (Vàng):</label>
                            <input id="input-opt-tangkiem-ticket" type="number" min="1" step="1" value="${tangkiemTicketVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-yellow-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-cyan-500" title="Giá vé đi Tàng Kiếm">
                        </div>
                    </div>
                    <div>
                        <label class="text-gray-400 text-[10px] block font-bold mb-0.5">Thời Gian 1 Team (Phút):</label>
                        <input id="input-opt-tangkiem-mins-per-team" type="number" min="1" step="0.5" value="${tangkiemMinsVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-cyan-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-cyan-500">
                    </div>
                </div>
            </div>

            <div id="opt-comparison-cards-container" class="flex-1 overflow-y-auto custom-scrollbar p-1">
            </div>
        </div>
    `;

    toggleEventModeUI();
}

function toggleEventModeUI() {
    let card = document.getElementById('opt-thaihu-input-card');
    if (!card) return;

    let saved = loadOptimizationFormState();
    let isAddDeoChecked = saved ? (saved.isAddDeo === true) : false;
    let isCaptainBonusTHChecked = saved ? (saved.isCaptainBonusTH === true) : false;
    let captainBonusGoldVal = saved ? saved.captainBonusGoldTH : "10";
    let thaihuTeamsVal = saved ? saved.thaihuTeamsManual : ((typeof systemDatabase !== 'undefined' && systemDatabase.teams) ? systemDatabase.teams.filter(t => t.type === 'lineup').length : 8);
    let thaihuMinsVal = saved ? saved.thaihuMins : "12";
    let thaihuRunMode = saved ? saved.thaihuRunMode : "full";

    card.innerHTML = `
        <div class="flex items-center justify-between border-b border-gray-800 pb-1 flex-nowrap">
            <span class="font-black text-purple-300 uppercase text-[11px] flex items-center gap-1 whitespace-nowrap shrink-0">
                <i class="fa-solid fa-dice-d20 text-purple-400"></i> 1. ẢI THÁI HƯ
            </span>
            <div class="flex items-center gap-1.5 flex-nowrap">
                <label class="flex items-center gap-1 cursor-pointer bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/40 select-none whitespace-nowrap">
                    <input id="chk-opt-thaihu-add-deo" type="checkbox" ${isAddDeoChecked ? 'checked' : ''} onchange="runActivitiesComparisonCalculation()" class="accent-purple-400 cursor-pointer w-3 h-3">
                    <span class="text-[9px] font-black text-purple-300">+ Tỷ Lệ Đoài</span>
                </label>
                <label class="flex items-center gap-1 cursor-pointer bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/40 select-none whitespace-nowrap" title="Thưởng / Hoàn vàng cho Đội Trưởng">
                    <input id="chk-opt-thaihu-captain-bonus" type="checkbox" ${isCaptainBonusTHChecked ? 'checked' : ''} onchange="toggleCaptainInputVisibility()" class="accent-purple-400 cursor-pointer w-3 h-3">
                    <span class="text-[9px] font-black text-amber-300">Hoàn Đ.Trưởng</span>
                </label>
            </div>
        </div>

        <div id="opt-captain-input-box" class="${isCaptainBonusTHChecked ? '' : 'hidden'} flex items-center justify-between bg-gray-900 px-2 py-1 rounded border border-gray-800">
            <span class="text-gray-400 text-[10px] font-bold">Vàng Đội Trưởng / Team:</span>
            <input id="input-opt-thaihu-captain-gold" type="number" min="0" step="1" value="${captainBonusGoldVal}" oninput="runActivitiesComparisonCalculation()" class="w-16 bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-amber-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-amber-500">
        </div>

        <div class="flex flex-col gap-1 bg-gray-900 p-1.5 rounded-lg border border-gray-800 text-[10px]">
            <label class="flex items-center gap-1.5 cursor-pointer font-bold text-gray-200">
                <input type="radio" name="rad-thaihu-run-mode" value="full" ${thaihuRunMode === 'full' ? 'checked' : ''} onchange="toggleThaihuRunRadio()" class="accent-purple-400">
                <span>1. Đi full tất cả tài khoản (Max 2 & Max 3)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer font-bold text-gray-300">
                <input type="radio" name="rad-thaihu-run-mode" value="max2_only" ${thaihuRunMode === 'max2_only' ? 'checked' : ''} onchange="toggleThaihuRunRadio()" class="accent-purple-400">
                <span>2. Chỉ đi full TK max 2 (Max 3 đi lượt 1)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer font-bold text-gray-300">
                <input type="radio" name="rad-thaihu-run-mode" value="manual" ${thaihuRunMode === 'manual' ? 'checked' : ''} onchange="toggleThaihuRunRadio()" class="accent-purple-400">
                <span>3. Nhập thủ công số lượng team</span>
            </label>
        </div>

        <div id="opt-thaihu-manual-box" class="${thaihuRunMode === 'manual' ? '' : 'hidden'}">
            <label class="text-gray-400 text-[9px] block font-bold mb-0.5">Nhập số team thủ công:</label>
            <input id="input-opt-thaihu-teams" type="number" min="1" value="${thaihuTeamsVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-purple-500">
        </div>

        <div>
            <div class="flex justify-between items-center text-[10px] mb-0.5">
                <span class="text-gray-400 font-bold">Thời gian 1 Team (Phút):</span>
                <span id="opt-thaihu-calculated-time-badge" class="text-purple-300 font-mono font-bold">~ 0 phút</span>
            </div>
            <input id="input-opt-thaihu-mins-per-team" type="number" min="1" step="0.5" value="${thaihuMinsVal}" oninput="runActivitiesComparisonCalculation()" class="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-purple-300 font-mono font-bold text-xs text-center focus:outline-none focus:border-purple-500">
        </div>
    `;

    runActivitiesComparisonCalculation();
}

function toggleCaptainInputVisibility() {
    let isChecked = document.getElementById('chk-opt-thaihu-captain-bonus')?.checked || false;
    let box = document.getElementById('opt-captain-input-box');
    if (box) {
        if (isChecked) box.classList.remove('hidden');
        else box.classList.add('hidden');
    }
    runActivitiesComparisonCalculation();
}

function toggleTkCaptainInputVisibility() {
    let isChecked = document.getElementById('chk-opt-tangkiem-captain-bonus')?.checked || false;
    let box = document.getElementById('opt-tk-captain-input-box');
    if (box) {
        if (isChecked) box.classList.remove('hidden');
        else box.classList.add('hidden');
    }
    runActivitiesComparisonCalculation();
}

function toggleThaihuRunRadio() {
    let mode = document.querySelector('input[name="rad-thaihu-run-mode"]:checked')?.value || "full";
    let box = document.getElementById('opt-thaihu-manual-box');
    if (box) {
        if (mode === 'manual') box.classList.remove('hidden');
        else box.classList.add('hidden');
    }
    runActivitiesComparisonCalculation();
}

function runActivitiesComparisonCalculation() {
    let container = document.getElementById('opt-comparison-cards-container');
    if (!container) return;

    saveOptimizationFormState();

    let isEvent = document.getElementById('chk-opt-event-toggle')?.checked || false;
    let isProfitLoss = document.getElementById('chk-opt-profit-loss-toggle')?.checked || false;
    let isAddDeo = document.getElementById('chk-opt-thaihu-add-deo')?.checked || false;
    let isCaptainBonusTH = document.getElementById('chk-opt-thaihu-captain-bonus')?.checked || false;
    let captainBonusGoldTH = parseFloat(document.getElementById('input-opt-thaihu-captain-gold')?.value) || 10;
    let isCaptainBonusTK = document.getElementById('chk-opt-tangkiem-captain-bonus')?.checked || false;
    let captainBonusGoldTK = parseFloat(document.getElementById('input-opt-tangkiem-captain-gold')?.value) || 10;

    let matPrice = parseFloat(document.getElementById('input-material-price')?.value) || 0.15;
    let ticketPriceTH = parseFloat(document.getElementById('input-ticket-price')?.value) || 24;
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
        systemMax2Count = 30;
        systemMax3Count = 30;
        totalScannedMembers = 60;
    }

    // --- 1. THÁI HƯ ---
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

    let thTimeBadge = document.getElementById('opt-thaihu-calculated-time-badge');
    if (thTimeBadge) {
        thTimeBadge.innerText = `(${thaihuTeams} Team ~ ${formatMinutesToHoursText(thaihuTotalMins)} hoàn thành)`;
    }

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

    // --- 2. THƯƠNG NHÂN (CHUẨN 8 NL/LƯỢT = 24 NL/ACC X3) ---
    let mGoldPerRun = parseFloat(document.getElementById('input-opt-merchant-gold-per-run')?.value) || 0;
    let mBatchAcc = parseFloat(document.getElementById('input-opt-merchant-batch-acc')?.value) || 11;
    let mBatchMins = parseFloat(document.getElementById('input-opt-merchant-batch-mins')?.value) || 45;
    let mTotalAcc = parseInt(document.getElementById('input-opt-merchant-total-acc')?.value) || 60;

    let mTimePerAcc = mBatchAcc > 0 ? (mBatchMins / mBatchAcc) : 4.09;
    let mTotalMins = mTotalAcc * mTimePerAcc;
    let mTotalHours = mTotalMins / 60;
    let mAccPerHour = mTimePerAcc > 0 ? (60 / mTimePerAcc) : 0;

    let mTimeBadge = document.getElementById('opt-merchant-calculated-time-badge');
    if (mTimeBadge) {
        mTimeBadge.innerText = `(~ ${formatMinutesToHoursText(mTotalMins)} hoàn thành)`;
    }

    // CHUẨN XÁC: 60 acc x 3 lượt x 8 NL = 1.440 NL
    let mTotalMaterials = isEvent ? (mTotalAcc * 24) : 0;
    let mMaterialGold = mTotalMaterials * matPrice;
    let mDirectGold = mTotalAcc * (mGoldPerRun * 3);
    let mTotalGold = mDirectGold + mMaterialGold;
    let mTotalVND = Math.round((mTotalGold / 1000) * goldRateVND);
    let mGoldPerHour = mTotalHours > 0 ? (mTotalGold / mTotalHours) : 0;
    let mVndPerHour = mTotalHours > 0 ? (mTotalVND / mTotalHours) : 0;

    // --- 3. TÀNG KIẾM ---
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

    let activities = [];

    if (!isProfitLoss) {
        activities = [
            { 
                key: "thaihu", name: "Ải Thái Hư", color: "purple", mins: thaihuTotalMins, 
                gold: thDisplayGold, vnd: thDisplayVND, gPerHour: thGoldPerHour, vPerHour: thVndPerHour,
                matText: isEvent ? `Nguyên liệu: <b>${thMaterials.toLocaleString('vi-VN')} NL</b> (~${thMaterialGold.toFixed(1)}v)` : "",
                extraText: (isAddDeo || isCaptainBonusTH) ? `<div class="text-[10px] text-purple-300 font-bold bg-purple-950/40 p-1 rounded border border-purple-500/30">${avgDeoRateStr} ${isCaptainBonusTH ? `| +Đ.Trưởng: ${thCaptainGold}v` : ''}</div>` : ""
            },
            { 
                key: "merchant", name: "Chạy Thương Nhân", color: "amber", mins: mTotalMins, 
                gold: mTotalGold, vnd: mTotalVND, gPerHour: mGoldPerHour, vPerHour: mVndPerHour,
                speedAcc: `Tốc độ: <b>${mAccPerHour.toFixed(1)} acc/h</b>`,
                matText: isEvent ? `Nguyên liệu: <b>${mTotalMaterials.toLocaleString('vi-VN')} NL</b> (~${mMaterialGold.toFixed(1)}v)` : ""
            },
            { 
                key: "tangkiem", name: "Tàng Kiếm", color: "cyan", mins: tkTotalMins, 
                gold: tkDisplayGold, vnd: tkDisplayVND, gPerHour: tkGoldPerHour, vPerHour: tkVndPerHour,
                matText: isEvent ? `Nguyên liệu: <b>${tkMaterials.toLocaleString('vi-VN')} NL</b> (~${tkMaterialGold.toFixed(1)}v)` : "",
                extraText: isCaptainBonusTK ? `<div class="text-[10px] text-cyan-300 font-bold bg-cyan-950/40 p-1 rounded border border-cyan-500/30">+Đ.Trưởng: ${tkCaptainGold}v (${isTangkiemX3 ? 'x2 lượt' : '0v - L1 Free'})</div>` : ""
            }
        ];
    } else {
        activities = [
            { 
                key: "thaihu", name: "Ải Thái Hư (Lời / Lỗ)", color: "purple", mins: thaihuTotalMins, 
                gold: thProfitGold, vnd: thProfitVND, gPerHour: thGoldPerHour, vPerHour: thVndPerHour,
                breakdown: `
                    <div class="space-y-1.5 bg-gray-955/80 p-3 rounded-xl border border-purple-500/40 text-xs font-mono">
                        <div class="flex justify-between text-gray-300"><span>Tổng Thu (NL+Hoàn+Đ.Trưởng+Đoài):</span><b class="text-yellow-300 font-bold">+${thTotalIncomeGold.toFixed(1)}v</b></div>
                        <div class="flex justify-between text-gray-300"><span>Tổng Chi (Tiền Vé):</span><b class="text-rose-400 font-bold">-${thTicketCost.toFixed(1)}v</b></div>
                        <div class="flex justify-between border-t border-gray-800 pt-1.5 text-sm font-black ${thProfitPerAcc >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                            <span>Lời / 1 Tài Khoản:</span><b>~ ${thProfitPerAcc >= 0 ? '+' : ''}${thProfitPerAcc.toFixed(2)}v/acc</b>
                        </div>
                    </div>
                `
            },
            { 
                key: "tangkiem", name: "Tàng Kiếm (Lời / Lỗ)", color: "cyan", mins: tkTotalMins, 
                gold: tkProfitGold, vnd: tkProfitVND, gPerHour: tkGoldPerHour, vPerHour: tkVndPerHour,
                breakdown: `
                    <div class="space-y-1.5 bg-gray-955/80 p-3 rounded-xl border border-cyan-500/40 text-xs font-mono">
                        <div class="flex justify-between text-gray-300"><span>Tổng Thu (Boss+Hoàn+NL+Đ.Trưởng):</span><b class="text-yellow-300 font-bold">+${tkTotalIncomeGold.toFixed(1)}v</b></div>
                        <div class="flex justify-between text-gray-300"><span>Tổng Chi (Tiền Vé TK):</span><b class="text-rose-400 font-bold">-${tkTicketCost.toFixed(1)}v</b></div>
                        <div class="flex justify-between border-t border-gray-800 pt-1.5 text-sm font-black ${tkProfitGold >= 0 ? 'text-cyan-300' : 'text-rose-400'}">
                            <span>Lãi Ròng Hoạt Động:</span><b>${tkProfitGold >= 0 ? '+' : ''}${tkProfitGold.toFixed(1)}v</b>
                        </div>
                    </div>
                `
            }
        ];
    }

    let bestBySpeed = [...activities].sort((a, b) => b.gPerHour - a.gPerHour)[0];
    let secondBySpeed = [...activities].sort((a, b) => b.gPerHour - a.gPerHour)[1];
    let bestByTotalGold = [...activities].sort((a, b) => b.gold - a.gold)[0];

    let gridColsClass = isProfitLoss ? "grid grid-cols-1 md:grid-cols-2 gap-3.5" : "grid grid-cols-1 md:grid-cols-3 gap-2.5";

    container.innerHTML = `
        <div class="${gridColsClass}">
            ${activities.map(act => {
                let isBestSpeed = act.key === bestBySpeed?.key && act.gPerHour > 0;
                let isSecondSpeed = act.key === secondBySpeed?.key && act.gPerHour > 0 && !isBestSpeed;
                let isBestGold = act.key === bestByTotalGold?.key && act.gold > 0;

                let badges = [];
                if (isBestSpeed) badges.push(`<div class="bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-2 py-1 rounded-lg text-center font-black text-xs animate-pulse">⚡ HIỆU SUẤT TỐT NHẤT (Top 1 Tốc Độ Vàng/Giờ)</div>`);
                else if (isSecondSpeed && !isProfitLoss) badges.push(`<div class="bg-blue-500/20 border border-blue-500 text-blue-300 px-2 py-1 rounded-lg text-center font-black text-xs">🥈 HIỆU QUẢ NHÌ (Top 2 Tốc Độ)</div>`);

                if (isBestGold) badges.push(`<div class="bg-amber-500/20 border border-amber-500 text-amber-300 px-2 py-1 rounded-lg text-center font-black text-xs">💰 ${isProfitLoss ? 'LỜI NHIỀU NHẤT' : 'KIẾM NHIỀU VÀNG / TIỀN NHẤT'}</div>`);

                if (badges.length === 0) badges.push(`<div class="bg-gray-900 border border-gray-800 px-2 py-1 rounded-lg text-center text-gray-500 text-xs">Hiệu suất bình thường</div>`);

                let goldColor = act.gold >= 0 ? (isProfitLoss ? 'text-emerald-400' : 'text-yellow-300') : 'text-rose-400';
                let profitFontSize = isProfitLoss ? 'text-2xl' : 'text-lg';

                return `
                    <div class="bg-${act.color}-955/20 border border-${act.color}-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg">
                        <div class="flex items-center justify-between border-b border-gray-800 pb-2">
                            <span class="font-black text-${act.color}-300 text-sm uppercase">${act.name}</span>
                            <span class="text-gray-400 font-mono text-xs">Tổng Thời Gian: <strong class="text-white">${formatMinutesToHoursText(act.mins)}</strong></span>
                        </div>

                        <div class="space-y-2 font-mono text-xs">
                            <div class="flex justify-between items-center bg-gray-950/90 p-2.5 rounded-xl border border-gray-800">
                                <span class="text-gray-300 font-bold text-xs">${isProfitLoss ? 'LỢI NHUẬN VÀNG RÒNG:' : 'TỔNG VÀNG THU:'}</span>
                                <strong class="${goldColor} font-black ${profitFontSize}">${act.gold >= 0 ? '+' : '-'}${Math.abs(act.gold).toFixed(1)}v</strong>
                            </div>

                            ${act.matText ? `<div class="text-xs text-amber-400/90 italic bg-amber-950/30 px-2.5 py-1 rounded border border-amber-500/20">${act.matText}</div>` : ""}
                            ${act.extraText ? act.extraText : ""}
                            ${act.breakdown ? act.breakdown : ""}

                            <div class="flex justify-between items-center px-1">
                                <span class="text-gray-400">${isProfitLoss ? 'Lợi Nhuận VNĐ:' : 'Quy Đổi VNĐ:'}</span>
                                <strong class="${act.vnd >= 0 ? 'text-gray-100' : 'text-rose-400'} font-bold text-sm">${act.vnd.toLocaleString('vi-VN')} đ</strong>
                            </div>

                            ${act.speedAcc ? `<div class="flex justify-between items-center text-emerald-400 font-bold bg-emerald-950/30 px-2.5 py-1 rounded border border-emerald-500/20 text-xs">${act.speedAcc}</div>` : ""}

                            <div class="grid grid-cols-2 gap-2 mt-1">
                                <div class="flex flex-col justify-center bg-gray-950/80 p-2 rounded-xl border border-gray-800">
                                    <span class="text-cyan-300 font-bold text-[11px]">Tốc độ Vàng/Giờ:</span>
                                    <strong class="text-cyan-300 font-black text-sm mt-0.5">${act.gPerHour.toFixed(1)}v/h</strong>
                                </div>
                                <div class="flex flex-col justify-center bg-gray-950/80 p-2 rounded-xl border border-gray-800">
                                    <span class="text-emerald-400 font-bold text-[11px]">Tốc độ Tiền/Giờ:</span>
                                    <strong class="text-emerald-400 font-black text-sm mt-0.5">${Math.round(act.vPerHour).toLocaleString('vi-VN')} đ/h</strong>
                                </div>
                            </div>
                        </div>

                        <div class="pt-1 flex flex-col gap-1.5">
                            ${badges.join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

window.switchToOptimizationTab = switchToOptimizationTab;
window.renderOptimizationWorkspaceView = renderOptimizationWorkspaceView;
window.runActivitiesComparisonCalculation = runActivitiesComparisonCalculation;
window.toggleEventModeUI = toggleEventModeUI;
window.toggleCaptainInputVisibility = toggleCaptainInputVisibility;
window.toggleTkCaptainInputVisibility = toggleTkCaptainInputVisibility;
window.toggleThaihuRunRadio = toggleThaihuRunRadio;
window.saveOptimizationFormState = saveOptimizationFormState;
window.loadOptimizationFormState = loadOptimizationFormState;
window.formatMinutesToHoursText = formatMinutesToHoursText;