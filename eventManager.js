/**
 * Tên file: eventManager.js
 * Chức năng: Mô-đun Quản lý Sự kiện Độc lập & Lịch sử Sự Kiện (GMT+7)
 * Đảm bảo: Hết hạn ngắt nguyên liệu, thêm sự kiện mới tự động đẩy sự kiện cũ xuống danh sách
 */

const EventManager = {
    STORAGE_KEY: 'SYSTEM_EVENTS_REGISTRY',

    // Khởi tạo hoặc nạp dữ liệu sự kiện từ LocalStorage
    getData() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
            try {
                let parsed = JSON.parse(raw);
                let evList = parsed.events || parsed.list || [];
                let actId = parsed.activeEventId || parsed.activeId || (evList[0] ? evList[0].id : "sk_thang_10_2026");
                
                // Đồng bộ 2 chiều cả events và list để không bao giờ bị rỗng
                return {
                    activeEventId: actId,
                    activeId: actId,
                    events: evList,
                    list: evList
                };
            } catch (e) {
                console.error("Lỗi đọc EventManager:", e);
            }
        }

        // Mặc định khởi tạo nếu chưa có dữ liệu trong máy
        const defaultEvents = [
            {
                id: "sk_thang_10_2026",
                name: "sự kiện tháng 10",
                startDate: "2026-10-01",
                endDate: "2026-10-31"
            },
            {
                id: "sk_thang_8_2026",
                name: "sự kiện tháng 8",
                startDate: "2026-08-01",
                endDate: "2026-08-31"
            }
        ];

        const initialData = {
            activeEventId: "sk_thang_10_2026",
            activeId: "sk_thang_10_2026",
            events: defaultEvents,
            list: defaultEvents
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
        return initialData;
    },

    saveData(data) {
        // Luôn giữ đồng bộ cả events lẫn list
        let cleanData = {
            activeEventId: data.activeEventId || data.activeId,
            activeId: data.activeEventId || data.activeId,
            events: data.events || data.list || [],
            list: data.events || data.list || []
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanData));
    },

    // Lấy sự kiện đang được áp dụng
    getActiveEvent() {
        const data = this.getData();
        const activeId = data.activeEventId || data.activeId;
        return data.events.find(e => e.id === activeId) || data.events[0] || null;
    },

    // Kiểm tra sự kiện hiện tại có đang chạy hay không (chuẩn ngày GMT+7)
    isEventCurrentlyActiveGMT7() {
        const currentEvent = this.getActiveEvent();
        if (!currentEvent || !currentEvent.startDate || !currentEvent.endDate) {
            return false;
        }

        const now = new Date();
        const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        const gmt7Ms = utcMs + (3600000 * 7);
        const todayMs = new Date(gmt7Ms).setHours(0, 0, 0, 0);

        const startMs = new Date(currentEvent.startDate).setHours(0, 0, 0, 0);
        const endMs = new Date(currentEvent.endDate).setHours(23, 59, 59, 999);

        return todayMs >= startMs && todayMs <= endMs;
    },

    // Lưu hoặc thêm mới sự kiện từ màn hình cài đặt
    saveOrUpdateEvent(name, startDate, endDate) {
        const data = this.getData();
        const cleanName = (name || '').trim();
        if (!cleanName) return;

        let event = data.events.find(e => e.name.toLowerCase() === cleanName.toLowerCase());
        let targetId = "";

        if (event) {
            event.startDate = startDate;
            event.endDate = endDate;
            targetId = event.id;
        } else {
            targetId = 'sk_' + Date.now();
            const newEvent = {
                id: targetId,
                name: cleanName,
                startDate: startDate,
                endDate: endDate
            };
            // Đưa sự kiện mới lên đầu bảng, tự động đẩy sự kiện cũ xuống danh sách bên dưới
            data.events.unshift(newEvent);
        }

        data.activeEventId = targetId;
        data.activeId = targetId;
        this.saveData(data);

        // ĐỒNG BỘ TRIỆT ĐỂ: Ghi đè vào các biến cũ để hệ thống không bị quay lại tháng 8
        localStorage.setItem('EVENT_NAME', cleanName);
        if (startDate) localStorage.setItem('EVENT_START_DATE', startDate);
        if (endDate) localStorage.setItem('EVENT_END_DATE', endDate);

        if (typeof systemDatabase !== 'undefined') {
            systemDatabase.eventName = cleanName;
            systemDatabase.eventStartDate = startDate;
            systemDatabase.eventEndDate = endDate;
            if (!systemDatabase.eventConfig) systemDatabase.eventConfig = {};
            systemDatabase.eventConfig.eventName = cleanName;
            systemDatabase.eventConfig.startDate = startDate;
            systemDatabase.eventConfig.endDate = endDate;
        }

        return targetId;
    },

    // Đổi sự kiện đang chọn từ danh sách lịch sử
    setActiveEvent(eventId) {
        const data = this.getData();
        const ev = data.events.find(e => e.id === eventId);
        if (ev) {
            data.activeEventId = eventId;
            data.activeId = eventId;
            this.saveData(data);

            // Đồng bộ sang bộ nhớ cũ
            localStorage.setItem('EVENT_NAME', ev.name);
            localStorage.setItem('EVENT_START_DATE', ev.startDate);
            localStorage.setItem('EVENT_END_DATE', ev.endDate);

            if (typeof systemDatabase !== 'undefined') {
                systemDatabase.eventName = ev.name;
                systemDatabase.eventStartDate = ev.startDate;
                systemDatabase.eventEndDate = ev.endDate;
            }
        }
    }
};

window.EventManager = EventManager;
