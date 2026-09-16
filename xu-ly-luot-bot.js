// Tên file: xu-ly-luot-bot.js
// Chức năng: Bộ tính toán logic lượt đi, khấu trừ lượt, quản lý trạng thái Free, cảnh báo trạng thái tới hạn và thực thi Reset Ngày toàn hệ thống (đồng bộ Thái Hư & Thương Nhân) kèm ghi log hệ thống.
// Con của file: giao-dien-thai-hu.js (Cung cấp thuật toán tính lượt trước khi render bảng).

function evaluateLineupsDynamicCapacity() {
    if (!systemDatabase || !systemDatabase.members) return;

    if (!systemDatabase.teams) return;
    systemDatabase.teams.forEach(team => {
        if (team.type !== 'lineup') return;
        let alreadySelectedInThisTeam = [];
        
        team.memberIds.forEach((mId, idx) => {
            if (!mId) return;
            
            // FIX CHÍ MẠNG: Chỉ xóa nếu acc bị gán trùng lặp trong CÙNG một team lineup, hết lượt đi vẫn giữ nguyên vị trí!
            if (alreadySelectedInThisTeam.includes(mId)) {
                team.memberIds[idx] = ""; 
                return;
            }
            alreadySelectedInThisTeam.push(mId);
        });
    });
}

function checkTeamHasCriticalRebateMember(teamObj) {
    let isCritical = false;
    if (!teamObj || !teamObj.memberIds) return isCritical;
    teamObj.memberIds.forEach(mId => {
        let m = systemDatabase.members[mId];
        if(m && m.name) {
            if ((m.maxRuns === 2 && m.currentRuns === 1) || (m.maxRuns === 3 && m.currentRuns === 2)) { isCritical = true; }
        }
    });
    return isCritical;
}

function toggleFreeRunState(memberId, runIndex, isChecked) {
    let m = systemDatabase.members[memberId];
    if (!m) return;
    if (runIndex === 2) {
        m.freeRun2 = isChecked;
    } else if (runIndex === 3) {
        m.freeRun3 = isChecked;
    }
    if (typeof evaluateLineupsDynamicCapacity === 'function') { evaluateLineupsDynamicCapacity(); }
    refreshUserInterfaceLayout();
    if (typeof saveStateToMemoryCache === 'function') { saveStateToMemoryCache(); }
    
    // GHI LOG THAO TÁC FREERUN
    if (typeof logUserAction === 'function') {
        logUserAction(`${isChecked ? 'Bật' : 'Tắt'} Free lượt ${runIndex} cho [ ${m.name} ]`);
    }
}

function toggleSkipStatNLState(memberId, isChecked) {
    let m = systemDatabase.members[memberId];
    if (!m) return;
    m.skipStatNL = isChecked;
    if (typeof calculateRealtimeProfits === 'function') { calculateRealtimeProfits(); }
    refreshUserInterfaceLayout();
    if (typeof saveStateToMemoryCache === 'function') { saveStateToMemoryCache(); }
    
    // GHI LOG THAO TÁC
    if (typeof logUserAction === 'function') {
        logUserAction(`${isChecked ? 'Không' : 'Có'} tính NL cho tài khoản [ ${m.name} ]`);
    }
}

// --- HÀM XỬ LÝ RESET NGÀY TỔNG HỢP (THÁI HƯ & THƯƠNG NHÂN) ---
function executeDailyResetPipeline() {
    if (!confirm("Xác nhận RESET toàn bộ tiến độ ngày hôm nay (Bao gồm cả Thái Hư và Thương Nhân)?")) return;

    if (systemDatabase && systemDatabase.members) {
        Object.values(systemDatabase.members).forEach(m => {
            if (!m) return;

            // 1. Reset dữ liệu lượt Thái Hư
            m.currentRuns = 0;
            m.failures = {};

            // 2. Reset dữ liệu tiến độ & giờ Check của Thương Nhân
            m.merchantRuns = 0;
            delete m.merchantLastHour;
        });
    }

    // Cập nhật lại giao diện và bộ nhớ
    if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
    if (typeof calculateRealtimeProfits === 'function') calculateRealtimeProfits();
    if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
    if (typeof renderMerchantTableBody === 'function') renderMerchantTableBody();
    if (typeof renderMerchantCardModal === 'function') renderMerchantCardModal();
    if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();

    // GHI LOG VÀ BẬT STACK TOAST THÔNG BÁO RESET NGÀY
    if (typeof logUserAction === 'function') {
        logUserAction("Đã Reset thành công tiến độ Thái Hư và Thương Nhân!");
    }
}

// Gắn toàn bộ các alias tên hàm reset có thể có vào window để nút bấm ở bất kỳ đâu cũng kích hoạt đúng
window.executeDailyResetPipeline = executeDailyResetPipeline;
window.resetDailyRuns = executeDailyResetPipeline;
window.executeDailyReset = executeDailyResetPipeline;
window.handleDailyReset = executeDailyResetPipeline;

// Tổng số dòng code trong file này: 109 dòng.