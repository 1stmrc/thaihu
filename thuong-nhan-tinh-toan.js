// Tên file: thuong-nhan-tinh-toan.js
// Chức năng: Động cơ tính toán độc lập cho Thương Nhân (quét 64 acc từ 8 Data Team, lọc acc khóa, tính lượt, vàng hoàn, NL sự kiện).

window.isMerchantExcludeRefund = (typeof window.isMerchantExcludeRefund !== 'undefined') ? window.isMerchantExcludeRefund : true;

function calculateMerchantMetricsData() {
    let matInputEl = document.getElementById('input-material-price');
    let matPrice = (matInputEl && matInputEl.value !== "") 
        ? (parseFloat(matInputEl.value) || 0) 
        : ((typeof systemDatabase !== 'undefined' && systemDatabase.materialPrice) ? parseFloat(systemDatabase.materialPrice) : 0.3);
    
    let goldInputEl = document.getElementById('input-gold-rate');
    let rawVal = goldInputEl ? goldInputEl.value : "";
    let goldRateVnd = 155000;

    if (rawVal) {
        let cleanVal = parseFloat(rawVal.replace(/\./g, "").replace(/,/g, ""));
        if (!isNaN(cleanVal) && cleanVal > 0) {
            goldRateVnd = cleanVal;
        }
    } else if (typeof systemDatabase !== 'undefined' && systemDatabase.goldRate) {
        let cleanVal = parseFloat(String(systemDatabase.goldRate).replace(/\./g, "").replace(/,/g, ""));
        if (!isNaN(cleanVal) && cleanVal > 0) {
            goldRateVnd = cleanVal;
        }
    }

    let isEventMode = false;
    if (typeof isEventCurrentlyActiveGMT7 === 'function') {
        isEventMode = isEventCurrentlyActiveGMT7();
    } else {
        let startDate = localStorage.getItem('EVENT_START_DATE') || (typeof systemDatabase !== 'undefined' && systemDatabase.eventStartDate);
        let endDate = localStorage.getItem('EVENT_END_DATE') || (typeof systemDatabase !== 'undefined' && systemDatabase.eventEndDate);
        if (startDate && endDate) {
            let now = new Date();
            let utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
            let gmt7Ms = utcMs + (3600000 * 7);
            let todayMs = new Date(gmt7Ms).setHours(0, 0, 0, 0);
            let startMs = new Date(startDate).setHours(0, 0, 0, 0);
            let endMs = new Date(endDate).setHours(23, 59, 59, 999);
            if (todayMs >= startMs && todayMs <= endMs) isEventMode = true;
        }
    }

    let totalActiveAccounts = 0;
    let completedAccounts = 0;
    let unfinishedAccounts = 0;
    let totalRuns = 0;

    let memberMap = new Map();

    if (typeof systemDatabase !== 'undefined' && systemDatabase.teams) {
        let dataTeams = systemDatabase.teams.filter(t => t.type === 'data' || (!t.type && t.memberIds));
        if (dataTeams.length === 0) {
            dataTeams = systemDatabase.teams.filter(t => t.type !== 'lineup');
        }

        dataTeams.forEach(t => {
            (t.memberIds || []).forEach(mId => {
                if (!mId || memberMap.has(mId)) return;
                let m = (systemDatabase.members && systemDatabase.members[mId]) ? systemDatabase.members[mId] : { id: mId, merchantRuns: 0, merchantLocked: false };
                memberMap.set(mId, m);
            });
        });
    }

    if (memberMap.size === 0 && typeof systemDatabase !== 'undefined' && systemDatabase.members) {
        Object.entries(systemDatabase.members).forEach(([mId, m]) => {
            if (m) memberMap.set(mId, m);
        });
    }

    memberMap.forEach(m => {
        let isLocked = (m.merchantLocked === true || m.merchantLocked === "true");
        if (isLocked) return;

        totalActiveAccounts++;
        let runs = parseInt(m.merchantRuns) || 0;
        if (runs >= 3) {
            completedAccounts++;
        } else {
            unfinishedAccounts++;
        }
        totalRuns += runs;
    });

    let directGold = window.isMerchantExcludeRefund ? 0 : (totalRuns * 1.2);
    let totalMaterials = isEventMode ? (totalRuns * 8) : 0;
    let materialGold = totalMaterials * matPrice;
    let totalGold = directGold + materialGold;
    let totalVnd = goldRateVnd > 0 ? (totalGold / 1000) * goldRateVnd : 0;

    return {
        totalActiveAccounts,
        completedAccounts,
        unfinishedAccounts,
        totalRuns,
        isEventMode,
        directGold,
        totalMaterials,
        materialGold,
        totalGold,
        totalVnd
    };
}

window.calculateMerchantMetricsData = calculateMerchantMetricsData;
