/**
 * Mô-đun Quản lý Sự kiện Độc lập
 */
const EventManager = {
    STORAGE_KEY: 'SYSTEM_EVENTS_REGISTRY',

    // Khởi tạo hoặc nạp dữ liệu sự kiện từ LocalStorage
    getData() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
            try { return JSON.parse(raw); } catch (e) { console.error(e); }
        }
        return {
            activeEventId: "sk_thang_10_2026",
            events: [
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
            ]
        };
    },

    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },

    // Lấy sự kiện đang được chọn/áp dụng
    getActiveEvent() {
        const data = this.getData();
        return data.events.find(e => e.id === data.activeEventId) || null;
    },

    // Kiểm tra sự kiện hiện tại có đang trong thời gian diễn ra (chuẩn GMT+7) hay không
    isEventCurrentlyActiveGMT7() {
        const currentEvent = this.getActiveEvent();
        if (!currentEvent || !currentEvent.startDate || !currentEvent.endDate) {
            return false;
        }

        // Lấy thời điểm hiện tại quy đổi về 00:00:00 ngày hôm nay GMT+7
        const now = new Date();
        const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
        const gmt7Ms = utcMs + (3600000 * 7);
        const todayMs = new Date(gmt7Ms).setHours(0, 0, 0, 0);

        const startMs = new Date(currentEvent.startDate).setHours(0, 0, 0, 0);
        const endMs = new Date(currentEvent.endDate).setHours(23, 59, 59, 999);

        return todayMs >= startMs && todayMs <= endMs;
    },

    // Lưu hoặc thêm mới sự kiện từ cài đặt
    saveOrUpdateEvent(name, startDate, endDate) {
        const data = this.getData();
        const cleanName = name.trim();
        
        // Kiểm tra xem sự kiện đã tồn tại theo tên chưa
        let event = data.events.find(e => e.name.toLowerCase() === cleanName.toLowerCase());
        if (event) {
            event.startDate = startDate;
            event.endDate = endDate;
            data.activeEventId = event.id;
        } else {
            const newId = 'sk_' + Date.now();
            const newEvent = {
                id: newId,
                name: cleanName,
                startDate: startDate,
                endDate: endDate
            };
            // Đưa sự kiện mới nhất lên đầu danh sách
            data.events.unshift(newEvent);
            data.activeEventId = newId;
        }

        this.saveData(data);
        return data.activeEventId;
    },

    // Đổi sự kiện đang chọn áp dụng
    setActiveEvent(eventId) {
        const data = this.getData();
        if (data.events.some(e => e.id === eventId)) {
            data.activeEventId = eventId;
            this.saveData(data);
        }
    }
};

// Đảm bảo truy cập toàn cục
window.EventManager = EventManager;