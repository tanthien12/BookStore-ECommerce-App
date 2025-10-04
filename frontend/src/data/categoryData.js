export const CATEGORIES = [
    {
        id: "trong-nuoc",
        label: "Sách Trong Nước",
        icon: "📚",
        columns: [
            { title: "VĂN HỌC", items: ["Tiểu Thuyết", "Truyện Ngắn - Tản Văn", "Light Novel", "Ngôn Tình"] },
            { title: "SÁCH THIẾU NHI", items: ["Manga-Comic", "Kiến Thức Bách Khoa", "Sách Tranh", "Ngôn Tình"] },
            { title: "KINH TẾ", items: ["Nhân Vật - Bài Học Kinh Doanh", "Quản Trị - Lãnh Đạo", "Marketing - Bán Hàng", "Phân Tích Kinh Tế"] },
            { title: "TÂM LÝ - KỸ NĂNG SỐNG", items: ["Kỹ Năng Sống", "Rèn Luyện Nhân Cách", "Tâm Lý", "Sách Cho Tuổi Mới Lớn"] },
            { title: "NUÔI DẠY CON", items: ["Cẩm Nang Làm Cha Mẹ", "Phương Pháp Giáo Dục Trẻ", "Phát Triển Trí Tuệ Cho Trẻ", "Phát Triển Kỹ Năng Cho Trẻ"] },
            { title: "LỊCH SỬ - HỒI KÝ", items: ["Câu Chuyện Cuộc Đời", "Chính Trị", "Kinh Tế", "Nghệ Thuật - Giải Trí"] },
            { title: "GIÁO KHOA - THAM KHẢO", items: ["Sách Giáo Khoa", "Sách Tham Khảo", "Luyện Thi THPT Quốc Gia", "Mẫu Giáo"] },
            { title: "SÁCH HỌC NGOẠI NGỮ", items: ["Tiếng Anh", "Tiếng Nhật", "Tiếng Hoa", "Tiếng Hàn"] },
        ],
    },
    { id: "foreign", label: "FOREIGN BOOKS", icon: "🌍", columns: [] },

    { id: "sgk-2025", label: "Sách Giáo Khoa 2025", icon: "📘", columns: [] },

];

export const slugify = (s = "") =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");