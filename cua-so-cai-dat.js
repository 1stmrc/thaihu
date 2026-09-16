// Tên file: cua-so-cai-dat.js
// Chức năng: Khung HTML Cài Đặt Hệ Thống - Lấy kích thước chuẩn từ Hình 1 (chứa vừa 8 dòng), khóa cứng cho tất cả các Tab.
// Con của file: index.html

function injectSettingsModalComponent() {
    let container = document.getElementById('injection-settings-modal-container');
    if (!container) return;

    container.innerHTML = `
        <!-- LỚP NỀN MỜ: Tắt popup khi bấm ra khoảng trống -->
        <div id="settings-modal" onclick="handleOutsideModalClick(event)" class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 hidden font-sans">
            
            <!-- BẢNG CÀI ĐẶT: Khóa chiều cao h-[680px] chuẩn hệt Hình 1 -->
            <div onclick="event.stopPropagation()" class="bg-gray-900 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl w-full max-w-md text-xs flex flex-col justify-between h-[680px] relative select-none">
                
                <!-- HEADER CHÍNH & NỘI DUNG -->
                <div class="flex flex-col h-full overflow-hidden">
                    <div class="flex items-center justify-between border-b border-gray-800 pb-2 mb-3 shrink-0">
                        <span class="text-amber-400 font-black text-sm uppercase tracking-wider flex items-center gap-2">
                            <i class="fa-solid fa-gear text-amber-500"></i> CÀI ĐẶT HỆ THỐNG
                        </span>
                        
                        <!-- NÚT X TẮT ĐỎ RỰC -->
                        <button onclick="closeSettingsModal()" class="text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 w-7 h-7 rounded-full flex items-center justify-center font-black text-xl transition cursor-pointer leading-none">&times;</button>
                    </div>

                    <!-- THANH ĐIỀU HƯỚNG TABS -->
                    <div class="flex border-b border-gray-800 text-xs font-bold mb-3 shrink-0">
                        <button id="btn-modal-tab-runs" onclick="switchModalTab('modal-tab-runs')" class="flex-1 py-1.5 text-amber-400 border-b-2 border-amber-500 cursor-pointer text-center">Mốc Lượt</button>
                        <button id="btn-modal-tab-faction" onclick="switchModalTab('modal-tab-faction')" class="flex-1 py-1.5 text-gray-400 cursor-pointer text-center hover:text-amber-300">Môn Phái</button>
                        <button id="btn-modal-tab-colors" onclick="switchModalTab('modal-tab-colors')" class="flex-1 py-1.5 text-gray-400 cursor-pointer text-center hover:text-amber-300">Màu Đội Hình</button>
                        <button id="btn-modal-tab-event" onclick="switchModalTab('modal-tab-event')" class="flex-1 py-1.5 text-gray-400 cursor-pointer text-center hover:text-amber-300">Sự Kiện</button>
                    </div>

                    <!-- THÂN CÁC TAB NỘI DUNG (CỐ ĐỊNH CHIỀU CAO CHUẨN) -->
                    <div class="relative w-full flex-1 overflow-hidden">
                        
                        <!-- TAB 1: MỐC LƯỢT (Danh sách dài h-[480px] chứa đúng 8 dòng như Hình 1) -->
                        <div id="view-modal-tab-runs" class="modal-tab-panel flex flex-col gap-2 h-full">
                            <div class="flex items-center justify-between gap-2 shrink-0">
                                <label class="text-xs font-bold text-gray-300">Chọn Nhóm Cài Đặt Lượt:</label>
                                <select id="modal-team-filter-picker" onchange="renderModalMembersConfigRows()" class="bg-gray-800 border border-gray-700 rounded-lg p-1.5 text-xs text-amber-300 font-bold focus:outline-none w-48 shadow">
                                </select>
                            </div>
                            <div id="modal-members-config-scroll-area" class="h-[480px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar bg-gray-955 p-2 rounded-xl border border-gray-800">
                            </div>
                        </div>

                        <!-- TAB 2: MÔN PHÁI -->
                        <div id="view-modal-tab-faction" class="modal-tab-panel hidden flex flex-col gap-2 h-full">
                            <div class="flex items-center justify-between gap-2 shrink-0">
                                <label class="text-xs font-bold text-gray-300">Chọn Nhóm Cài Môn Phái:</label>
                                <select id="modal-faction-team-picker" onchange="renderModalFactionConfigRows()" class="bg-gray-800 border border-gray-700 rounded-lg p-1.5 text-xs text-amber-300 font-bold focus:outline-none w-48 shadow">
                                </select>
                            </div>
                            <div id="modal-faction-config-scroll-area" class="h-[480px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar bg-gray-955 p-2 rounded-xl border border-gray-800">
                            </div>
                        </div>

                        <!-- TAB 3: MÀU ĐỘI HÌNH -->
                        <div id="view-modal-tab-colors" class="modal-tab-panel hidden flex flex-col gap-2 h-full">
                            <div class="flex items-center justify-between gap-2 shrink-0">
                                <label class="text-xs font-bold text-gray-300">Danh Sách Nhóm Đội Hình:</label>
                            </div>
                            <div id="modal-team-colors-config-list" class="h-[480px] overflow-y-auto pr-1 flex flex-col gap-1.5 custom-scrollbar bg-gray-955 p-2 rounded-xl border border-gray-800">
                            </div>
                        </div>

                        <!-- TAB 4: SỰ KIỆN -->
                        <div id="view-modal-tab-event" class="modal-tab-panel hidden flex flex-col gap-3 h-full justify-start">
                            <div class="flex flex-col gap-1">
                                <label class="text-xs font-bold text-amber-400 flex items-center gap-1">
                                    <i class="fa-solid fa-pen-to-square"></i> Tên Sự Kiện:
                                </label>
                                <input id="input-event-name-custom" type="text" placeholder="Nhập tên sự kiện..." class="w-full bg-gray-800 border border-amber-500/50 rounded-lg px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 shadow-inner">
                            </div>

                            <div class="grid grid-cols-2 gap-2 bg-gray-955 p-3 rounded-xl border border-gray-800">
                                <div>
                                    <label class="block text-[10px] text-gray-400 mb-1 font-bold">Ngày Bắt Đầu SK:</label>
                                    <input id="input-event-start-date" type="date" class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white font-bold text-center focus:outline-none">
                                </div>
                                <div>
                                    <label class="block text-[10px] text-gray-400 mb-1 font-bold">Ngày Kết Thúc SK:</label>
                                    <input id="input-event-end-date" type="date" class="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white font-bold text-center focus:outline-none">
                                </div>
                            </div>

                            <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-200 mt-2">
                                <i class="fa-solid fa-circle-info text-amber-400 mr-1"></i> Thiết lập mốc thời gian này để hệ thống tự động lọc và tích lũy quẻ Đoài kiếm được chính xác.
                            </div>
                        </div>

                    </div>
                </div>

                <!-- FOOTER NÚT LƯU CỐ ĐỊNH Ở ĐÁY BẢNG -->
                <div class="flex justify-end gap-2 pt-2 border-t border-gray-800 shrink-0 mt-2">
                    <button onclick="closeSettingsModal()" class="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2 rounded-xl transition cursor-pointer">Đóng</button>
                    <button onclick="commitModalMaxRunBoundSettings()" class="bg-amber-600 hover:bg-amber-500 text-white font-black px-5 py-2 rounded-xl transition shadow cursor-pointer">Lưu Cấu Hình</button>
                </div>

            </div>
        </div>
    `;
}

function handleOutsideModalClick(event) {
    let modal = document.getElementById('settings-modal');
    if (event.target === modal) {
        closeSettingsModal();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSettingsModalComponent);
} else {
    injectSettingsModalComponent();
}