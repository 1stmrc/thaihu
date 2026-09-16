// Tên file: bang-doi-hinh-xep-cascade-dropdown.js
// Chức năng: Module quản lý hiển thị và tương tác Dropdown chọn tài khoản nhiều tầng.
// Con của file: bang-doi-hinh-xep.js

function toggleCustomCascadeDropdown(e, key) {
    e.stopPropagation();
    let menu = document.getElementById(`cascade_dropdown_${key}`);
    let allMenus = document.querySelectorAll('.cascade-menu-root');
    allMenus.forEach(m => {
        if (m !== menu) m.classList.add('hidden');
    });
    if (menu) menu.classList.toggle('hidden');
}

function selectMemberFromCascade(teamId, slotIndex, selectedMemberId) {
    let allMenus = document.querySelectorAll('.cascade-menu-root');
    allMenus.forEach(m => m.classList.add('hidden'));

    if (typeof handleLineupSelectChange === 'function') {
        handleLineupSelectChange(teamId, slotIndex, selectedMemberId);
    }
}

// Bắt sự kiện click toàn cục để tự ẩn menu cascade khi bấm ra ngoài
document.addEventListener('click', () => {
    let allMenus = document.querySelectorAll('.cascade-menu-root');
    allMenus.forEach(m => m.classList.add('hidden'));
});