// Tên file: tu-dong-luu-file.js
// Chức năng: Tự động ghi đè dữ liệu trực tiếp vào 1 file .json trên ổ cứng sau mỗi cú click chuột (File System Access API).

let autoSaveFileHandle = null;
let autoSaveDebounceTimeout = null;

// 1. Hàm chọn file lưu trữ trên máy (Chỉ cần chọn 1 lần duy nhất)
async function connectAutoSaveFile() {
    try {
        autoSaveFileHandle = await window.showSaveFilePicker({
            suggestedName: 'du_lieu_vl2_backup_goc.json',
            types: [{
                description: 'JSON Data Backup',
                accept: { 'application/json': ['.json'] }
            }]
        });

        // Ghi dữ liệu hiện tại vào file ngay lập tức
        await writeDataToFileSilent();
        updateAutoSaveButtonUI(true);
        if (typeof logUserAction === 'function') logUserAction("Đã liên kết thành công file Auto-Save trên máy tính.");
    } catch (err) {
        console.warn("Hủy chọn file auto-save:", err);
    }
}

// 2. Hàm ghi dữ liệu âm thầm vào ổ cứng
async function writeDataToFileSilent() {
    if (!autoSaveFileHandle || typeof systemDatabase === 'undefined') return;
    try {
        const writable = await autoSaveFileHandle.createWritable();
        const fullDataJSON = JSON.stringify(systemDatabase, null, 2);
        await writable.write(fullDataJSON);
        await writable.close();
    } catch (e) {
        console.error("Lỗi tự động ghi file:", e);
    }
}

// 3. Tự động lắng nghe: Bất kể click vào đâu trên web cũng tự động ghi file
document.addEventListener('click', () => {
    if (autoSaveFileHandle) {
        clearTimeout(autoSaveDebounceTimeout);
        // Trì hoãn 300ms để gom các thao tác click liên tục, tránh nghẽn máy
        autoSaveDebounceTimeout = setTimeout(writeDataToFileSilent, 300);
    }
});

// 4. Cập nhật nút trạng thái trên giao diện
function updateAutoSaveButtonUI(isConnected) {
    let btn = document.getElementById('btn-auto-save-link');
    if (btn) {
        if (isConnected) {
            btn.className = "bg-emerald-600/30 text-emerald-300 border border-emerald-500 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer";
            btn.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-400"></i> Auto-Save: BẬT`;
            btn.title = "Đang tự động ghi đè vào file mỗi khi thao tác";
        } else {
            btn.className = "bg-gray-800 hover:bg-gray-700 text-amber-300 border border-amber-500/50 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer";
            btn.innerHTML = `<i class="fa-solid fa-link text-amber-400"></i> Bật Auto-Save`;
            btn.title = "Bấm để chọn file sao lưu tự động trên máy";
        }
    }
}

window.connectAutoSaveFile = connectAutoSaveFile;