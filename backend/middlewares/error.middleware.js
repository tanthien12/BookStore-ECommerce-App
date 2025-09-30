// middlewares/error.middleware.js
function errorHandler(err, req, res, next) {
    // ===== Mapping lỗi thường gặp (đặc biệt cho upload LOCAL) =====
    // - err.code đến từ Multer hoặc lỗi bạn chủ động gán (custom)
    // - err.name === 'MulterError' với một số code đặc biệt
    const code = err.code;

    // Mặc định
    let status = err.status || 500;
    let message = err.message || "Lỗi máy chủ";

    // Ưu tiên: mapping theo code/name quen thuộc
    switch (code) {
        case "LIMIT_FILE_SIZE":         // Multer: vượt giới hạn dung lượng
            status = 413;
            message = "File quá lớn";
            break;
        case "UNSUPPORTED_MIME":        // Custom: từ fileFilter
            status = 415;
            message = "Định dạng file không hỗ trợ";
            break;
        case "UPLOAD_NO_FILE":          // Custom: không nhận được file/files
            status = 400;
            message = "Không có file được gửi lên";
            break;
        case "UPLOAD_BAD_REQUEST":      // Custom: thiếu bucket/fileName, req sai
            status = 400;
            message = "Yêu cầu không hợp lệ";
            break;
        // Một số code Multer khác có thể gặp
        case "LIMIT_PART_COUNT":
        case "LIMIT_FILE_COUNT":
        case "LIMIT_FIELD_KEY":
        case "LIMIT_FIELD_VALUE":
        case "LIMIT_FIELD_COUNT":
        case "LIMIT_UNEXPECTED_FILE":
            status = 400;
            message = "Yêu cầu upload không hợp lệ";
            break;
        default:
            break;
    }

    // Nếu Multer ném lỗi chung
    if (err.name === "MulterError" && status === 500) {
        status = 400;
        message = message || "Lỗi upload tệp tin";
    }

    // Trả payload theo format hiện tại của bạn
    const payload = {
        message,
        error: true,
        success: false,
    };

    // (Tuỳ chọn) Gửi kèm 'code' để frontend xử lý tốt hơn (không bắt buộc)
    if (code) payload.code = code;

    // Dev mode: hiển thị stack
    if (process.env.NODE_ENV !== "production" && err.stack) {
        payload.stack = err.stack;
    }

    return res.status(status).json(payload);
}

module.exports = { errorHandler };
