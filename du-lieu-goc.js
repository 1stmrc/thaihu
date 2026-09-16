// Tên file: du-lieu-goc.js
// Chức năng: Lưu trữ dữ liệu hạt giống (Seed dữ liệu) mặc định và bảng màu định danh hệ thống cho các nhóm tài khoản.
// Con của file: index.html (Nạp đầu tiên trong nhóm phân hệ Dữ liệu gốc).
// Danh sách tính năng của file:
//   1. Khởi tạo hằng số HARDCODED_FACTORY_SEED chứa danh sách đội hình, tài khoản và presets mặc định sạch chuẩn.
//   2. Cung cấp bảng tra cứu mã màu TEAM_COLOR_MAP định danh trực quan cho từng team (A, B, C, D, E, G, H).
// Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - KHÓA MÃ NGUỒN NGÀY 17/08/2026 - KHÔNG TỰ Ý XÓA SỬA]

/* ==========================================================================
   KHỐI 1: DỮ LIỆU HẠT GIỐNG HỆ THỐNG (HARDCODED FACTORY SEED)
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
const HARDCODED_FACTORY_SEED = [
    {
        "id": "1",
        "name": "Team a",
        "presets": [],
        "rows": [
            { "stt": 2, "acc": "A.01 dgc", "merchant": 3, "thaituhu": 0, "skip": true, "skipTime": "3h36", "charName": "1stmrc", "level": 83 },
            { "stt": 3, "acc": "A.02 5d", "merchant": 3, "thaituhu": 0, "skip": true, "skipTime": "3h34", "charName": "1stmrcee", "level": 84 },
            { "stt": 1, "acc": "A.03 nmd", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "ngoctrambinhphuoc", "level": 85 },
            { "stt": 4, "acc": "A.09 cs_", "merchant": 3, "thaituhu": 0, "skip": true, "skipTime": "3h33", "charName": "anhthợ mũ bpx", "level": 84 },
            { "stt": 5, "acc": "A.13 nmk_4", "merchant": 3, "thaituhu": 0, "skip": true, "skipTime": "3h35", "charName": "VDkso1sever", "level": 85 },
            { "stt": 6, "acc": "A.18 cbb longca6", "merchant": 3, "thaituhu": 0, "skip": true, "skipTime": "3h34", "charName": "thiên tội", "level": 84 },
            { "stt": 7, "acc": "A.19 vdk 2002kiemtay_4", "merchant": 3, "thaituhu": 0, "skip": true, "skipTime": "3h37", "charName": "succana", "level": 84 },
            { "stt": 8, "acc": "A.24 tld Ditrongcay43", "merchant": 3, "thaituhu": 0, "skip": true, "skipTime": "3h37", "charName": "quang trung 043", "level": 77 }
        ]
    },
    {
        "id": "1775509566713",
        "name": "team b",
        "presets": [
            {
                "name": "1",
                "order": [
                    "B.01 dgc tieungaogiangho201099",
                    "B.03 nmd giaphuc12",
                    "B.11 cs",
                    "B.12 cbq_4",
                    "B.13 nmk duytoan1001",
                    "B.19 vdk Dinhthanhnien27",
                    "B.24 tld Jx8888",
                    "B.23 hatieuanh dgt 77"
                ]
            }
        ],
        "rows": [
            { "stt": 1, "acc": "B.01 dgc tieungaogiangho201099", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 2, "acc": "B.03 nmd giaphuc12", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 3, "acc": "B.11 cs", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 4, "acc": "B.12 cbq_4", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 5, "acc": "B.13 nmk duytoan1001", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 6, "acc": "B.19 vdk Dinhthanhnien27", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 77 },
            { "stt": 7, "acc": "B.23 hatieuanh dgt 77", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 77 },
            { "stt": 8, "acc": "B.24 tld Jx8888", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 77 }
        ]
    },
    {
        "id": "1775509574469",
        "name": "team c",
        "presets": [
            {
                "name": "1",
                "order": [
                    "C.01 dgc gacons",
                    "C.03 nmd Anhvubn91",
                    "C.10 cs_4",
                    "C.13 nmk thubunbo2001",
                    "C.18 cbb anhvusctn113",
                    "C.19 vdk Huynhdore1403",
                    "C.23 dgt votinhvangem24",
                    "C.24 tld Ditrongcay43"
                ]
            }
        ],
        "rows": [
            { "stt": 1, "acc": "C.01 dgc gacons", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 2, "acc": "C.03 nmd Anhvubn91", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 77 },
            { "stt": 3, "acc": "C.10 cs_4", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 4, "acc": "C.13 nmk thubunbo2001", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 5, "acc": "C.18 cbb anhvusctn113", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 6, "acc": "C.19 vdk Huynhdore1403", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 7, "acc": "C.23 dgt votinhvangem24", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 77 },
            { "stt": 8, "acc": "C.25 vdb saxukemon2", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 77 }
        ]
    },
    {
        "id": "1776630168200",
        "name": "team d",
        "presets": [
            {
                "name": "1",
                "order": [
                    "D.02 5d baoboi2021",
                    "D.03 nmd bachungsv13",
                    "D.13 nmk Nmkvip03",
                    "D.17 cs",
                    "D.18 cbb Jx2cbb1102",
                    "D.19 vdk tri0301",
                    "D.22 minhnt89 tlt 77",
                    "D.saxukemon2 vdk 76"
                ]
            }
        ],
        "rows": [
            { "stt": 1, "acc": "D.03 nmd bachungsv13", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 2, "acc": "D.13 nmk Nmkvip03", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 77 },
            { "stt": 3, "acc": "D.17 cs", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 4, "acc": "D.18 cbb Jx2cbb1102", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 77 },
            { "stt": 5, "acc": "D.19 vdk tri0301", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 6, "acc": "D.22 tlt Gtsa4992", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 7, "acc": "D.25 vdb Thiencd2412", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 8, "acc": "D.26 tlq Zzolo2019", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 }
        ]
    },
    {
        "id": "1776917946765",
        "name": "team e",
        "presets": [
            {
                "name": "1",
                "order": [
                    "E.01dgc Fackson222",
                    "E.02 5d mapgianxao",
                    "E.03 nmd vtdacc2",
                    "E.09 cs saxukemon1",
                    "E.13 nmk song5 s16",
                    "E.14 dmc_4",
                    "E.19vdk mrbun01",
                    "E.22 tlt Gtsa4992"
                ]
            }
        ],
        "rows": [
            { "stt": 1, "acc": "E.01dgc Fackson222", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 2, "acc": "E.02 5d mapgianxao", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 3, "acc": "E.03 nmd vtdacc2", "merchant": 0, "thaituhu": 0, "skip": true, "skipTime": "17h36", "charName": "", "level": 77 },
            { "stt": 4, "acc": "E.09 cs saxukemon1", "merchant": 0, "thaituhu": 0, "skip": true, "skipTime": "17h36", "charName": "", "level": 80 },
            { "stt": 5, "acc": "E.13 nmk song5 s16", "merchant": 0, "thaituhu": 0, "skip": true, "skipTime": "17h36", "charName": "", "level": 77 },
            { "stt": 6, "acc": "E.14 dmc_4", "merchant": 0, "thaituhu": 0, "skip": true, "skipTime": "17h36", "charName": "", "level": 80 },
            { "stt": 7, "acc": "E.19vdk mrbun01", "merchant": 0, "thaituhu": 0, "skip": true, "skipTime": "17h36", "charName": "", "level": 80 },
            { "stt": 8, "acc": "E.22 minhnt89 tlt 77", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 77 }
        ]
    },
    {
        "id": "1779605132756",
        "name": "team G",
        "presets": [],
        "rows": [
            { "stt": 1, "acc": "G.15 dmc", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 },
            { "stt": 2, "acc": "G.02 5d baoboi2021", "merchant": 0, "thaituhu": 0, "skip": false, "skipTime": "", "charName": "", "level": 80 }
        ]
    }
];

/* ==========================================================================
   KHỐI 2: BẢNG MÀU ĐỊNH DANH TEAM (TEAM COLOR MAP)
   Trạng thái: [ĐÃ CHẠY ỔN ĐỊNH - NGÀY SỬA: 17/08/2026 - KHÔNG ĐƯỢC XÓA SỬA]
   ========================================================================== */
const TEAM_COLOR_MAP = {
    "team a": "bg-emerald-500/15 border-emerald-500 text-emerald-300",
    "team b": "bg-blue-500/15 border-blue-500 text-blue-300",
    "team c": "bg-amber-500/15 border-amber-500 text-amber-300",
    "team d": "bg-purple-500/15 border-purple-500 text-purple-300",
    "team e": "bg-rose-500/15 border-rose-500 text-rose-300",
    "team g": "bg-yellow-500/15 border-yellow-500 text-yellow-300",
    "team h": "bg-cyan-500/15 border-cyan-500 text-cyan-300"
};

window.HARDCODED_FACTORY_SEED = HARDCODED_FACTORY_SEED;
window.TEAM_COLOR_MAP = TEAM_COLOR_MAP;

// Tổng số dòng code trong file này: 175 dòng.