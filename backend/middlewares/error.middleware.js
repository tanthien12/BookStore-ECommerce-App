// middlewares/error.middleware.js
function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const payload = {
        message: err.message || "Lỗi máy chủ",
        error: true,
        success: false,
    };
    if (process.env.NODE_ENV !== "production" && err.stack) {
        payload.stack = err.stack;
    }
    return res.status(status).json(payload);
}

module.exports = { errorHandler };
