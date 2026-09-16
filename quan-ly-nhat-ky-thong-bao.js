// Tên file: quan-ly-nhat-ky-thong-bao.js
// Chức năng: Trung tâm ghi chép nhật ký hành động (Log), lưu bền vững 500 Log qua F5/File JSON, Toast Notification & cố định khung chỉ cuộn bên trong bảng.
// Con của file: index.html (Nạp trước script.js).

let systemActivityLogs = [];
let isLogTabActive = false;

function loadPersistedLogsState() {
    try {
        if (typeof systemDatabase !== 'undefined' && systemDatabase.activityLogs && Array.isArray(systemDatabase.activityLogs)) {
            systemActivityLogs = systemDatabase.activityLogs;
        } else {
            let localData = localStorage.getItem('APP_SYSTEM_ACTIVITY_LOGS');
            if (localData) {
                systemActivityLogs = JSON.parse(localData);
            }
        }
    } catch (err) {
        console.warn("Lỗi nạp nhật ký lịch sử:", err);
    }
}

function persistLogsState() {
    try {
        if (systemActivityLogs.length > 500) {
            systemActivityLogs = systemActivityLogs.slice(0, 500);
        }
        localStorage.setItem('APP_SYSTEM_ACTIVITY_LOGS', JSON.stringify(systemActivityLogs));
        
        if (typeof systemDatabase !== 'undefined') {
            systemDatabase.activityLogs = systemActivityLogs;
        }
    } catch (err) {
        console.warn("Lỗi lưu nhật ký lịch sử:", err);
    }
}

function logUserAction(actionMessage, type = 'info') {
    let timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    let fullDate = new Date().toLocaleString('vi-VN');

    let logItem = {
        id: Date.now() + Math.random().toString(36).substr(2, 4),
        time: timestamp,
        fullDate: fullDate,
        message: actionMessage,
        type: type
    };

    systemActivityLogs.unshift(logItem);
    persistLogsState();

    if (isLogTabActive) {
        renderLogTableBody();
    }

    pushStackToastNotification(actionMessage);
}

function pushStackToastNotification(message) {
    let container = document.getElementById('global-toast-stack-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'global-toast-stack-container';
        container.className = "fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center gap-1.5 z-[9999] pointer-events-none";
        document.body.appendChild(container);
    }

    let toast = document.createElement('div');
    toast.className = "toast-item transition-all duration-300 transform scale-95 opacity-0 bg-rose-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-2xl flex items-center gap-2 border border-rose-400/50 pointer-events-auto min-w-[220px] justify-center";
    toast.innerHTML = `<i class="fa-solid fa-circle-exclamation text-rose-200"></i> <span>${message}</span>`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('scale-95', 'opacity-0');
        toast.classList.add('scale-100', 'opacity-100');
        updateToastStackStyles();
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'scale-90', '-translate-y-2');
        setTimeout(() => {
            toast.remove();
            updateToastStackStyles();
        }, 300);
    }, 3500);

    updateToastStackStyles();
}

function updateToastStackStyles() {
    let container = document.getElementById('global-toast-stack-container');
    if (!container) return;

    let toasts = Array.from(container.children);
    
    while (toasts.length > 2) {
        let oldest = toasts.shift();
        oldest.remove();
    }

    toasts.forEach((t, idx) => {
        let isLatest = idx === toasts.length - 1;
        if (isLatest) {
            t.className = "toast-item transition-all duration-300 bg-rose-600 text-white font-black px-4 py-2 rounded-xl text-xs shadow-2xl flex items-center gap-2 border border-rose-400/60 min-w-[220px] justify-center scale-100 opacity-100 animate-pulse";
        } else {
            t.className = "toast-item transition-all duration-300 bg-gray-850/95 text-gray-300 font-medium px-3.5 py-1.5 rounded-lg text-[11px] shadow-md flex items-center gap-2 border border-gray-700/60 min-w-[200px] justify-center scale-95 opacity-75";
        }
    });
}

function switchToActivityLogTab() {
    isLogTabActive = true;

    let viewport = document.getElementById('active-panel-view-viewport');
    if (viewport) {
        Array.from(viewport.children).forEach(child => child.classList.add('hidden'));
    }

    let subNavbar = document.getElementById('sub-navbar-container-zone');
    if (subNavbar) subNavbar.classList.add('hidden');

    initLogViewport();
    let logPanel = document.getElementById('tab-content-lich-su-hanh-dong');
    if (logPanel) {
        logPanel.classList.remove('hidden');
        renderLogTableBody();
    }
}

function initLogViewport() {
    let viewport = document.getElementById('active-panel-view-viewport');
    if (!viewport) return;

    let logPanel = document.getElementById('tab-content-lich-su-hanh-dong');
    if (!logPanel) {
        logPanel = document.createElement('div');
        logPanel.id = 'tab-content-lich-su-hanh-dong';
        // Khung cố định chiều cao, chia flex theo chiều dọc và triệt tiêu scroll ngoài
        logPanel.className = "w-full h-full flex flex-col gap-3 text-gray-200 overflow-hidden";

        logPanel.innerHTML = `
            <div class="flex items-center justify-between pb-2 border-b border-gray-700/70 shrink-0">
                <span class="text-cyan-400 font-black text-sm uppercase flex items-center gap-2">
                    <i class="fa-solid fa-list-check"></i> Nhật Ký Thao Tác Hệ Thống (<span id="logs-count-badge">0</span>/500)
                </span>
                <button onclick="clearAllLogsHistory()" class="bg-gray-800 hover:bg-rose-600 text-rose-400 hover:text-white font-bold px-3 py-1.5 rounded-lg border border-gray-700 transition text-xs cursor-pointer shadow">
                    <i class="fa-solid fa-trash-can mr-1"></i> Xóa Lịch Sử
                </button>
            </div>

            <!-- BẢNG CUỘN NỘI BỘ BÊN TRONG CỐ ĐỊNH -->
            <div class="flex-1 min-h-0 overflow-y-auto bg-gray-900/80 rounded-xl border border-gray-800 p-2 custom-scrollbar">
                <table class="w-full text-left text-xs border-collapse table-fixed">
                    <thead class="sticky top-0 bg-gray-900 z-10 shadow border-b border-gray-800">
                        <tr class="text-gray-400 uppercase text-[11px] font-bold">
                            <th class="p-2 w-24 text-center">THỜI GIAN</th>
                            <th class="p-2">NỘI DUNG HÀNH ĐỘNG</th>
                            <th class="p-2 w-40 text-center">NGÀY GIỜ CHI TIẾT</th>
                        </tr>
                    </thead>
                    <tbody id="system-logs-table-body" class="divide-y divide-gray-800/40"></tbody>
                </table>
            </div>
        `;
        viewport.appendChild(logPanel);
    }
}

function renderLogTableBody() {
    loadPersistedLogsState();
    let tbody = document.getElementById('system-logs-table-body');
    let countBadge = document.getElementById('logs-count-badge');
    
    if (countBadge) countBadge.innerText = systemActivityLogs.length;
    if (!tbody) return;

    if (systemActivityLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-8 text-gray-500 italic">Chưa có hành động nào được ghi nhận.</td></tr>`;
        return;
    }

    tbody.innerHTML = systemActivityLogs.map((item, idx) => `
        <tr class="hover:bg-gray-800/40 transition ${idx === 0 ? 'bg-rose-950/20' : ''}">
            <td class="p-2.5 text-center font-mono font-bold ${idx === 0 ? 'text-rose-400' : 'text-cyan-400'} bg-gray-955/50 rounded">${item.time}</td>
            <td class="p-2.5 font-bold ${idx === 0 ? 'text-white' : 'text-gray-200'} truncate" title="${item.message}">${item.message}</td>
            <td class="p-2.5 text-center text-gray-500 font-mono text-[11px]">${item.fullDate}</td>
        </tr>
    `).join('');
}

function clearAllLogsHistory() {
    if (confirm("Bạn có chắc chắn muốn xóa sạch toàn bộ lịch sử hành động?")) {
        systemActivityLogs = [];
        persistLogsState();
        renderLogTableBody();
        pushStackToastNotification("Đã xóa sạch lịch sử nhật ký!");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadPersistedLogsState();
    if (systemActivityLogs.length === 0) {
        logUserAction("Hệ thống đã khởi chạy và sẵn sàng ghi nhận thao tác.");
    }
});

window.switchToActivityLogTab = switchToActivityLogTab;
window.logUserAction = logUserAction;

// Tổng số dòng code trong file này: 185 dòng.