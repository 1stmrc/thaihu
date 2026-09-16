// Tên file: quan-ly-ngan-phieu.js
// Chức năng: Quản lý Ngân Phiếu theo ID tài khoản bot - Hỗ trợ số âm nháy đỏ đậm trực quan, giới hạn Max 3.000, hover hiện nút sửa.
// Con của file: index.html (Được nạp trực tiếp qua thẻ script trong khung xương chính).

// 1. LẤY SỐ NGÂN PHIẾU GẮN VỚI TỪNG TÀI KHOẢN
function getMemberNganPhieu(memberId) {
    if (!memberId || typeof systemDatabase === 'undefined' || !systemDatabase.members) return 0;
    let m = systemDatabase.members[memberId];
    return (m && m.nganPhieu !== undefined && m.nganPhieu !== null) ? parseInt(m.nganPhieu) || 0 : 0;
}

// 2. CẬP NHẬT VÀ LƯU TRỮ VĨNH VIỄN (GIỚI HẠN TỐI ĐA 3.000 NGÂN PHIẾU)
function updateMemberNganPhieu(memberId, value) {
    if (!memberId || typeof systemDatabase === 'undefined' || !systemDatabase.members) return;
    let m = systemDatabase.members[memberId];
    if (!m) return;

    let parsedVal = parseInt(value) || 0;
    // RÀNG BUỘC TỐI ĐA 3.000 NGÂN PHIẾU (CHO PHÉP SỐ ÂM KHI TRỪ LƯỢT CHẠY)
    let cleanValue = Math.min(3000, parsedVal);
    m.nganPhieu = cleanValue;

    // Lưu ngay vào bộ nhớ cache hệ thống & LocalStorage
    if (typeof saveStateToMemoryCache === 'function') {
        saveStateToMemoryCache();
    } else {
        try {
            localStorage.setItem('SYSTEM_DATA_CACHE', JSON.stringify(systemDatabase));
        } catch (e) {}
    }

    if (typeof logUserAction === 'function') {
        logUserAction(`Đã cập nhật Ngân Phiếu cho tài khoản [ ${m.name} ]: ${cleanValue.toLocaleString('vi-VN')} Ngân Phiếu`);
    }

    if (typeof showSystemToastNotification === 'function') {
        showSystemToastNotification(`Đã lưu ${cleanValue.toLocaleString('vi-VN')} Ngân Phiếu cho [ ${m.name} ]`, "success");
    }
}

// 3. TẠO GIAO DIỆN Ô NGÂN PHIẾU GẮN THEO ID TÀI KHOẢN (SỐ ÂM NHÁY ĐỎ ĐẬM)
function renderNganPhieuCellComponent(memberId) {
    if (!memberId) {
        return `<div class="text-gray-600 text-center font-mono text-[11px]">-</div>`;
    }

    let currentNP = getMemberNganPhieu(memberId);
    let isNegative = currentNP < 0;
    let displayVal = currentNP.toLocaleString('vi-VN');

    // NẾU ÂM: NHÁY ĐỎ ĐẬM TRỰC TIẾP TRÊN CHỮ, KHÔNG DÙNG NỀN LINE
    let textStyleClass = isNegative 
        ? "text-rose-500 font-black animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" 
        : "text-amber-300 font-bold";
    let borderClass = isNegative ? "border-rose-500/70" : "border-gray-700 group-hover/np:border-amber-400/80";

    return `
        <div class="relative group/np flex items-center justify-center w-[75px] mx-auto" onmousedown="event.stopPropagation()">
            <!-- HIỂN THỊ MẶC ĐỊNH (TĨNH) - HOVER VÀO HIỆN NÚT SỬA -->
            <div id="np-display-tag-${memberId}" class="flex items-center justify-between px-1.5 py-1 bg-gray-900 border ${borderClass} rounded-lg font-mono text-xs transition-all w-full shadow-inner">
                <span class="truncate flex-1 text-center ${textStyleClass}">${displayVal}</span>
                <button type="button" onclick="enableNganPhieuInlineEdit('${memberId}')" class="hidden group-hover/np:flex text-gray-400 hover:text-amber-300 text-[10px] p-0.5 cursor-pointer leading-none transition" title="Sửa Ngân Phiếu (Tối đa 3.000)">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
            </div>

            <!-- KHUNG NHẬP XUẤT HIỆN KHI BẤM SỬA -->
            <div id="np-edit-box-${memberId}" class="hidden flex items-center gap-0.5 w-full">
                <input 
                    id="np-input-edit-${memberId}" 
                    type="number" 
                    max="3000"
                    value="${currentNP}"
                    class="w-full px-1 py-0.5 bg-gray-950 border border-amber-400 rounded-md text-amber-300 font-mono font-black text-xs text-center focus:outline-none focus:ring-1 focus:ring-amber-300 shadow [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onkeydown="if(event.key==='Enter'){ confirmSaveNganPhieu('${memberId}'); } else if(event.key==='Escape'){ cancelNganPhieuEdit('${memberId}'); }"
                />
                <button type="button" onclick="confirmSaveNganPhieu('${memberId}')" class="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-1.5 py-1 text-[10px] font-bold cursor-pointer shrink-0" title="Lưu">
                    <i class="fa-solid fa-check"></i>
                </button>
            </div>
        </div>
    `;
}

// Bật chế độ chỉnh sửa ô Input
function enableNganPhieuInlineEdit(memberId) {
    let tag = document.getElementById(`np-display-tag-${memberId}`);
    let box = document.getElementById(`np-edit-box-${memberId}`);
    let input = document.getElementById(`np-input-edit-${memberId}`);
    if (tag && box && input) {
        tag.classList.add('hidden');
        box.classList.remove('hidden');
        input.focus();
        input.select();
    }
}

// Hủy thao tác sửa
function cancelNganPhieuEdit(memberId) {
    let tag = document.getElementById(`np-display-tag-${memberId}`);
    let box = document.getElementById(`np-edit-box-${memberId}`);
    let input = document.getElementById(`np-input-edit-${memberId}`);
    if (tag && box && input) {
        input.value = getMemberNganPhieu(memberId);
        box.classList.add('hidden');
        tag.classList.remove('hidden');
    }
}

// Xác nhận lưu giá trị
function confirmSaveNganPhieu(memberId) {
    let input = document.getElementById(`np-input-edit-${memberId}`);
    if (!input) return;

    let val = input.value;
    updateMemberNganPhieu(memberId, val);

    let tag = document.getElementById(`np-display-tag-${memberId}`);
    let box = document.getElementById(`np-edit-box-${memberId}`);
    if (tag && box) {
        let cleanVal = Math.min(3000, parseInt(val) || 0);
        let spanEl = tag.querySelector('span');
        if (spanEl) {
            spanEl.innerText = cleanVal.toLocaleString('vi-VN');
            if (cleanVal < 0) {
                spanEl.className = "truncate flex-1 text-center text-rose-500 font-black animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]";
            } else {
                spanEl.className = "truncate flex-1 text-center text-amber-300 font-bold";
            }
        }
        input.value = cleanVal;
        box.classList.add('hidden');
        tag.classList.remove('hidden');
    }
}

// Export ra window toàn cục
window.getMemberNganPhieu = getMemberNganPhieu;
window.updateMemberNganPhieu = updateMemberNganPhieu;
window.renderNganPhieuCellComponent = renderNganPhieuCellComponent;
window.enableNganPhieuInlineEdit = enableNganPhieuInlineEdit;
window.cancelNganPhieuEdit = cancelNganPhieuEdit;
window.confirmSaveNganPhieu = confirmSaveNganPhieu;

// Tổng số dòng code trong file này: 135 dòng.