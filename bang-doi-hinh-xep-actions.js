// Tên file: bang-doi-hinh-xep-actions.js
// Chức năng: Module chứa các hàm thao tác tiến độ và gán tài khoản cho Đội hình.
// Con của file: bang-doi-hinh-xep.js

function incrementAllLineupTeamRuns(teamId) {
    let team = systemDatabase.teams.find(t => t.id === teamId);
    if (!team || !team.memberIds) return;

    let updatedCount = 0;
    team.memberIds.forEach(mId => {
        if (!mId) return;
        let m = systemDatabase.members[mId];
        if (m && m.currentRuns < m.maxRuns) {
            m.currentRuns += 1;
            updatedCount++;
        }
    });

    if (updatedCount > 0) {
        if (typeof evaluateLineupsDynamicCapacity === 'function') evaluateLineupsDynamicCapacity();
        if (typeof refreshUserInterfaceLayout === 'function') refreshUserInterfaceLayout();
        if (typeof saveStateToMemoryCache === 'function') saveStateToMemoryCache();
        
        if (typeof logUserAction === 'function') {
            logUserAction(`Đã +1 lượt đi cho toàn bộ [ ${team.name.toUpperCase()} ] (${updatedCount} tài khoản)`);
        }
    }
}

function handleLineupSelectChange(teamId, slotIndex, selectedMemberId) {
    if (typeof bindSelectionToLineupIndexSlot === 'function') {
        bindSelectionToLineupIndexSlot(teamId, slotIndex, selectedMemberId);
    }
    
    if (typeof logUserAction === 'function') {
        let m = systemDatabase && systemDatabase.members ? systemDatabase.members[selectedMemberId] : null;
        let teamObj = systemDatabase && systemDatabase.teams ? systemDatabase.teams.find(x => x.id === teamId) : null;
        let teamName = teamObj ? teamObj.name.toUpperCase() : "ĐỘI HÌNH XẾP";
        
        if (m && m.name) {
            logUserAction(`Gán tài khoản [ ${m.name} ] vào ${teamName} (Vị trí ${slotIndex + 1})`);
        } else {
            logUserAction(`Bỏ gán tài khoản khỏi ${teamName} (Vị trí ${slotIndex + 1})`);
        }
    }
}