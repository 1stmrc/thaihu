// Tên file: kho-luu-tru.js
// Chức năng: Quản lý bộ nhớ đệm LocalStorage (V2), bảo toàn mảng Presets, Đội Hình Xếp, lịch sử Timer Thương Nhân, cấu hình Header, Reset ngày đồng bộ an toàn cả 3 phân hệ (Thái Hư, Thương Nhân, Sát Thủ) và chống đá văng tab.
// Con của file: index.html

/* ==========================================================================
   KHỐI 1: KHỞI TẠO VÀ PHỤC HỒI HỆ THỐNG RUNTIME
   ========================================================================== */
function initSystemEngine() {
    let savedData = localStorage.getItem('V2_THAI_HU_UPGRADED_RUNTIME_DB') || localStorage.getItem('V2_THAI_HU_CUSTOM_DEFAULT_TEMPLATE') || localStorage.getItem('V2_THAI_HU_PERSIST_DB');

    if (savedData) {
        try {
            let runtimeCache = JSON.parse(savedData);
            if (runtimeCache && runtimeCache.teams && runtimeCache.members) {
                systemDatabase = runtimeCache;
                
                if (!systemDatabase.deoHistory) systemDatabase.deoHistory = [];
                if (!systemDatabase.lineupPresets) systemDatabase.lineupPresets = [];
                if (!systemDatabase.currentPresetId) systemDatabase.currentPresetId = "default_blank";

                // ĐỒNG BỘ VÀ KHÔI PHỤC DỮ LIỆU BẤM GIỜ THƯƠNG NHÂN
                if (!systemDatabase.merchantTimerDb) {
                    let rawMerchant = localStorage.getItem('SYSTEM_MERCHANT_TIMER_HISTORY_DATABASE_V1') || localStorage.getItem('SYSTEM_MERCHANT_TIMER_HISTORY_DATABASE_V2');
                    if (rawMerchant) {
                        try { systemDatabase.merchantTimerDb = JSON.parse(rawMerchant); } catch(e){}
                    }
                    if (!systemDatabase.merchantTimerDb) {
                        systemDatabase.merchantTimerDb = { dailyHistory: {}, totalAllSeconds: 0, totalAllSessions: 0 };
                    }
                } else {
                    localStorage.setItem('SYSTEM_MERCHANT_TIMER_HISTORY_DATABASE_V1', JSON.stringify(systemDatabase.merchantTimerDb));
                }

                let currentId = systemDatabase.currentPresetId;
                if (currentId !== "default_blank" && systemDatabase.lineupPresets) {
                    let preset = systemDatabase.lineupPresets.find(x => x.id === currentId);
                    let hasLineup = systemDatabase.teams.some(x => x.type === 'lineup');
                    
                    if (!hasLineup && preset && preset.setups) {
                        preset.setups.forEach(s => {
                            systemDatabase.teams.push({
                                id: 'team_' + Date.now() + Math.floor(Math.random() * 1000),
                                name: s.name,
                                type: 'lineup',
                                memberIds: [...s.memberIds]
                            });
                        });
                    }
                }

                activeTeamId = systemDatabase.teams[0]?.id || "";
                
                // ĐỒNG BỘ ƯU TIÊN BỘ NHỚ HEADER (KHÔNG GHI ĐÈ SỐ MẶC ĐỊNH LÊN HEADER)
                let sMat = localStorage.getItem('HEADER_MAT_PRICE') || systemDatabase.materialPrice || "0.25";
                let sGold = localStorage.getItem('HEADER_GOLD_RATE') || systemDatabase.goldRate || "155.000";
                let sTicket = localStorage.getItem('HEADER_TICKET_PRICE') || systemDatabase.ticketPrice || "24";
                let sRefund = localStorage.getItem('HEADER_REFUND_PRICE') || systemDatabase.refundPrice || "16";

                systemDatabase.materialPrice = sMat;
                systemDatabase.goldRate = sGold;
                systemDatabase.ticketPrice = sTicket;
                systemDatabase.refundPrice = sRefund;

                let elMat = document.getElementById('input-material-price');
                let elGold = document.getElementById('input-gold-rate');
                let elTicket = document.getElementById('input-ticket-price');
                let elRefund = document.getElementById('input-refund-price');

                if (elMat) elMat.value = sMat;
                if (elGold) elGold.value = sGold;
                if (elTicket) elTicket.value = sTicket;
                if (elRefund) elRefund.value = sRefund;
                
                if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
                if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout(); 
                
                return;
            }
        } catch(e) { 
            console.error("Lỗi khôi phục cơ sở dữ liệu:", e); 
            alert("Cảnh báo: Có lỗi khi đọc bộ nhớ! Hệ thống sẽ dừng lại để bảo vệ dữ liệu của bạn.");
            return; 
        }
    }
    
    if (typeof parseAndLoadFromPayloadTemplate === 'function') {
        parseAndLoadFromPayloadTemplate(typeof HARDCODED_FACTORY_SEED !== 'undefined' ? HARDCODED_FACTORY_SEED : []);
    }
}

function parseAndLoadFromPayloadTemplate(sourcePayload) {
    systemDatabase.teams = []; 
    systemDatabase.members = {}; 
    systemDatabase.deoHistory = []; 
    systemDatabase.lineupPresets = []; 
    systemDatabase.currentPresetId = "default_blank";
    systemDatabase.merchantTimerDb = { dailyHistory: {}, totalAllSeconds: 0, totalAllSessions: 0 };
    
    sourcePayload.forEach(t => {
        let teamId = t.id || ('team_' + Date.now() + Math.floor(Math.random() * 1000));
        let teamObj = { id: teamId, name: t.name, type: 'data', memberIds: [] };
        t.rows.forEach(r => {
            let mId = 'uid_' + Date.now() + Math.floor(Math.random() * 10000);
            systemDatabase.members[mId] = { 
                id: mId, 
                name: r.acc ? r.acc.trim() : "", 
                maxRuns: 3, 
                currentRuns: 0, 
                originalTeamId: teamId, 
                isEditing: false, 
                freeRun2: false, 
                freeRun3: false, 
                skipStatNL: false, 
                merchantRuns: 0, 
                merchantLocked: false, 
                satThuRuns: 0,
                satThuLocked: false,
                nganPhieu: 0 
            };
            teamObj.memberIds.push(mId);
        });
        while(teamObj.memberIds.length < 8) {
            let mId = 'uid_' + Date.now() + Math.floor(Math.random() * 10000);
            systemDatabase.members[mId] = { 
                id: mId, 
                name: "", 
                maxRuns: 3, 
                currentRuns: 0, 
                originalTeamId: teamId, 
                isEditing: true, 
                freeRun2: false, 
                freeRun3: false, 
                skipStatNL: false, 
                merchantRuns: 0, 
                merchantLocked: false, 
                satThuRuns: 0,
                satThuLocked: false,
                nganPhieu: 0 
            };
            teamObj.memberIds.push(mId);
        }
        systemDatabase.teams.push(teamObj);
    });
    activeTeamId = systemDatabase.teams[0]?.id || "";
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout(); 
    saveStateToMemoryCache();
}

/* ==========================================================================
   KHỐI 2: LƯU TRỮ TRẠNG THÁI & MẪU MẶC ĐỊNH
   ========================================================================== */
function getVietnamCurrentDateString() {
    return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'Asia/Ho_Chi_Minh', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    }).format(new Date());
}

function saveStateToMemoryCache() {
    let matPrice = document.getElementById('input-material-price');
    let gRate = document.getElementById('input-gold-rate');
    let tPrice = document.getElementById('input-ticket-price');
    let rPrice = document.getElementById('input-refund-price');

    if (matPrice) {
        systemDatabase.materialPrice = matPrice.value;
        localStorage.setItem('HEADER_MAT_PRICE', matPrice.value);
    }
    if (gRate) {
        systemDatabase.goldRate = gRate.value;
        localStorage.setItem('HEADER_GOLD_RATE', gRate.value);
    }
    if (tPrice) {
        systemDatabase.ticketPrice = tPrice.value;
        localStorage.setItem('HEADER_TICKET_PRICE', tPrice.value);
    }
    if (rPrice) {
        systemDatabase.refundPrice = rPrice.value;
        localStorage.setItem('HEADER_REFUND_PRICE', rPrice.value);
    }

    if (systemDatabase.merchantTimerDb) {
        localStorage.setItem('SYSTEM_MERCHANT_TIMER_HISTORY_DATABASE_V1', JSON.stringify(systemDatabase.merchantTimerDb));
    }

    // 1. Lưu bản runtime V2 đang chạy
    localStorage.setItem('V2_THAI_HU_UPGRADED_RUNTIME_DB', JSON.stringify(systemDatabase));

    // 2. Lưu snapshot riêng cho từng ngày theo giờ GMT+7 Hà Nội
    const todayStr = getVietnamCurrentDateString();
    const dailySnapshotPackage = {
        saveDate: todayStr,
        lastUpdated: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        systemDatabase: systemDatabase,
        settings: {
            materialPrice: localStorage.getItem('HEADER_MAT_PRICE') || "0.25",
            goldRate: localStorage.getItem('HEADER_GOLD_RATE') || "155.000",
            ticketPrice: localStorage.getItem('HEADER_TICKET_PRICE') || "24",
            refundPrice: localStorage.getItem('HEADER_REFUND_PRICE') || "16"
        }
    };
    localStorage.setItem('THAIHU_SNAPSHOT_' + todayStr, JSON.stringify(dailySnapshotPackage));

    // 3. Quản lý danh mục các ngày đã lưu
    let historyDays = JSON.parse(localStorage.getItem('THAIHU_HISTORY_INDEX') || '[]');
    if (!historyDays.includes(todayStr)) {
        historyDays.push(todayStr);
        localStorage.setItem('THAIHU_HISTORY_INDEX', JSON.stringify(historyDays));
    }
    localStorage.setItem('THAIHU_LAST_ACTIVE_DAY', todayStr);
}

function saveCurrentAsDefaultTemplate() { 
    let matPrice = document.getElementById('input-material-price');
    let gRate = document.getElementById('input-gold-rate');
    let tPrice = document.getElementById('input-ticket-price');
    let rPrice = document.getElementById('input-refund-price');

    if (matPrice) {
        systemDatabase.materialPrice = matPrice.value;
        localStorage.setItem('HEADER_MAT_PRICE', matPrice.value);
    }
    if (gRate) {
        systemDatabase.goldRate = gRate.value;
        localStorage.setItem('HEADER_GOLD_RATE', gRate.value);
    }
    if (tPrice) {
        systemDatabase.ticketPrice = tPrice.value;
        localStorage.setItem('HEADER_TICKET_PRICE', tPrice.value);
    }
    if (rPrice) {
        systemDatabase.refundPrice = rPrice.value;
        localStorage.setItem('HEADER_REFUND_PRICE', rPrice.value);
    }

    if (systemDatabase.merchantTimerDb) {
        localStorage.setItem('SYSTEM_MERCHANT_TIMER_HISTORY_DATABASE_V1', JSON.stringify(systemDatabase.merchantTimerDb));
    }

    localStorage.setItem('V2_THAI_HU_CUSTOM_DEFAULT_TEMPLATE', JSON.stringify(systemDatabase)); 
    localStorage.setItem('V2_THAI_HU_UPGRADED_RUNTIME_DB', JSON.stringify(systemDatabase)); 
    
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity(); 
    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout(); 
    
    alert("Đã lưu mẫu cấu hình cố định thành công!"); 
}

function resetToHardcodedDefault() {
    if (confirm("Khôi phục danh sách gốc ban đầu của hệ thống? Toàn bộ dữ liệu đang lưu sẽ bị xóa!")) {
        localStorage.removeItem('V2_THAI_HU_UPGRADED_RUNTIME_DB'); 
        localStorage.removeItem('V2_THAI_HU_CUSTOM_DEFAULT_TEMPLATE');
        localStorage.removeItem('V2_THAI_HU_PERSIST_DB');
        localStorage.removeItem('HEADER_MAT_PRICE');
        localStorage.removeItem('HEADER_GOLD_RATE');
        localStorage.removeItem('HEADER_TICKET_PRICE');
        localStorage.removeItem('HEADER_REFUND_PRICE');
        localStorage.removeItem('SYSTEM_MERCHANT_TIMER_HISTORY_DATABASE_V1');
        
        systemDatabase.deoHistory = []; 
        systemDatabase.lineupPresets = []; 
        systemDatabase.currentPresetId = "default_blank";
        systemDatabase.merchantTimerDb = { dailyHistory: {}, totalAllSeconds: 0, totalAllSessions: 0 };
        parseAndLoadFromPayloadTemplate(typeof HARDCODED_FACTORY_SEED !== 'undefined' ? HARDCODED_FACTORY_SEED : []);
    }
}

// --- RESET NGÀY TOÀN DIỆN: RESET THÁI HƯ + THƯƠNG NHÂN + SÁT THỦ & KHÔNG ĐÁ VĂNG TAB ---
function resetDailyRunsOnly() {
    if (confirm("Xác nhận RESET toàn bộ tiến độ ngày hôm nay (Bao gồm Thái Hư, Thương Nhân và Sát Thủ)?")) {
        // 1. Chốt sổ snapshot trước khi làm sạch
        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();

        // 2. Quét qua toàn bộ danh sách thành viên để xóa sạch lượt
        if (typeof systemDatabase !== 'undefined' && systemDatabase.members) {
            Object.keys(systemDatabase.members).forEach(id => {
                let m = systemDatabase.members[id];
                if (!m) return;

                // Reset tiến độ Thái Hư
                m.currentRuns = 0;
                m.freeRun2 = false;
                m.freeRun3 = false;
                m.failures = {};

                // Reset tiến độ Thương Nhân
                m.merchantRuns = 0;

                // Reset triệt để tiến độ & mốc giờ Sát Thủ
                m.satThuRuns = 0;
                delete m.satThuCheckTime;
                delete m.satThuTimestamp;
                delete m.satThuCompletedTimestamp;
            });
        }

        // 3. NHẬN DIỆN THÔNG MINH TAB HIỆN TẠI ĐỂ VẼ LẠI - CHỐNG BỊ ĐÁ VĂNG TAB
        let satThuView = document.getElementById('tab-content-quan-ly-sat-thu');
        let isCurrentlyAtSatThu = satThuView && !satThuView.classList.contains('hidden');

        let merchantView = document.getElementById('tab-content-quan-ly-thuong-nhan');
        let isCurrentlyAtMerchant = merchantView && !merchantView.classList.contains('hidden');

        if (isCurrentlyAtSatThu) {
            // Đang ở tab Sát Thủ: Chỉ render bảng Sát Thủ & Popup Thống Kê
            if (typeof renderSatThuTableRows === 'function') renderSatThuTableRows();
            if (typeof updateSatThuStatsDashboardUI === 'function') updateSatThuStatsDashboardUI();
        } else if (isCurrentlyAtMerchant) {
            // Đang ở tab Thương Nhân: Chỉ render bảng Thương Nhân
            if (typeof renderMerchantTableRows === 'function') renderMerchantTableRows();
        } else {
            // Chỉ render Thái Hư khi người dùng ĐANG THỰC SỰ Ở TAB THÁI HƯ
            if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
            if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
            if (typeof renderThaiHuMainView === 'function') renderThaiHuMainView();
        }

        // Luôn cập nhật Popup Thống Kê Sát Thủ nếu nó đang hiển thị
        if (typeof updateSatThuStatsDashboardUI === 'function') updateSatThuStatsDashboardUI();

        // 4. Lưu trạng thái đã reset vào bộ nhớ & tính toán lại lợi nhuận
        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
        if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
        if (typeof calculateComprehensiveProfitsRealtime === 'function') calculateComprehensiveProfitsRealtime();
    }
}

// Bổ sung hàm alias để đồng bộ với mọi nơi gọi pipeline reset
function executeDailyResetPipeline() {
    resetDailyRunsOnly();
}

/* ==========================================================================
   KHỐI 3: XUẤT NHẬP FILE CẤU HÌNH HỆ THỐNG (.JSON)
   ========================================================================== */
function exportFullConfigurationState() { 
    saveStateToMemoryCache();
    let blob = new Blob([JSON.stringify(systemDatabase, null, 2)], { type: "application/json" }); 
    let anchor = document.createElement('a'); 
    anchor.href = URL.createObjectURL(blob); 
    anchor.download = `Backup_Thai_Hu_Farm_${Date.now()}.json`; 
    anchor.click(); 
}

function importFullConfigurationState(event) { 
    let file = event.target.files[0]; 
    if (!file) return; 
    
    let reader = new FileReader(); 
    reader.onload = function(e) { 
        try { 
            let parsed = JSON.parse(e.target.result); 
            if (parsed && parsed.teams && parsed.members) { 
                systemDatabase = parsed; 
                
                if (!systemDatabase.deoHistory) systemDatabase.deoHistory = [];
                if (!systemDatabase.lineupPresets) systemDatabase.lineupPresets = []; 
                if (!systemDatabase.currentPresetId) systemDatabase.currentPresetId = "default_blank"; 
                
                if (systemDatabase.merchantTimerDb) { 
                    localStorage.setItem('SYSTEM_MERCHANT_TIMER_HISTORY_DATABASE_V1', JSON.stringify(systemDatabase.merchantTimerDb)); 
                } else { 
                    systemDatabase.merchantTimerDb = { dailyHistory: {}, totalAllSeconds: 0, totalAllSessions: 0 }; 
                }

                activeTeamId = systemDatabase.teams[0]?.id || ""; 
                
                if (systemDatabase.materialPrice !== undefined) { 
                    localStorage.setItem('HEADER_MAT_PRICE', systemDatabase.materialPrice); 
                    let el = document.getElementById('input-material-price'); 
                    if (el) el.value = systemDatabase.materialPrice; 
                } 
                if (systemDatabase.goldRate !== undefined) { 
                    localStorage.setItem('HEADER_GOLD_RATE', systemDatabase.goldRate); 
                    let el = document.getElementById('input-gold-rate'); 
                    if (el) el.value = systemDatabase.goldRate; 
                } 
                if (systemDatabase.ticketPrice !== undefined) { 
                    localStorage.setItem('HEADER_TICKET_PRICE', systemDatabase.ticketPrice); 
                    let el = document.getElementById('input-ticket-price'); 
                    if (el) el.value = systemDatabase.ticketPrice; 
                } 
                if (systemDatabase.refundPrice !== undefined) { 
                    localStorage.setItem('HEADER_REFUND_PRICE', systemDatabase.refundPrice); 
                    let el = document.getElementById('input-refund-price'); 
                    if (el) el.value = systemDatabase.refundPrice; 
                } 
                
                if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity(); 
                saveStateToMemoryCache(); 
                if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout(); 
                
                alert("Đã nạp khôi phục cấu hình thành công!"); 
            } else { 
                alert("Tệp JSON không đúng định dạng của hệ thống!"); 
            } 
        } catch(err) { 
            alert("Lỗi đọc tệp JSON. Vui lòng kiểm tra lại file của bạn."); 
        } 
        event.target.value = "";
    }; 
    reader.readAsText(file); 
}

// TỰ ĐỘNG CHỐT SỔ KHI CHUYỂN QUA 00:00 GMT+7 HÀ NỘI
function checkAndAutoSnapshotEndOfDay() {
    if (typeof getVietnamCurrentDateString !== 'function') return;
    const todayStr = getVietnamCurrentDateString();
    const lastActiveDay = localStorage.getItem('THAIHU_LAST_ACTIVE_DAY');
    if (lastActiveDay && lastActiveDay !== todayStr) {
        localStorage.setItem('THAIHU_LAST_ACTIVE_DAY', todayStr);
    } else if (!lastActiveDay) {
        localStorage.setItem('THAIHU_LAST_ACTIVE_DAY', todayStr);
    }
}
setInterval(checkAndAutoSnapshotEndOfDay, 30000);
checkAndAutoSnapshotEndOfDay();

window.initSystemEngine = initSystemEngine;
window.saveStateToMemoryCache = saveStateToMemoryCache;
window.saveCurrentAsDefaultTemplate = saveCurrentAsDefaultTemplate;
window.resetToHardcodedDefault = resetToHardcodedDefault;
window.resetDailyRunsOnly = resetDailyRunsOnly;
window.executeDailyResetPipeline = executeDailyResetPipeline;
window.exportFullConfigurationState = exportFullConfigurationState;
window.importFullConfigurationState = importFullConfigurationState;
