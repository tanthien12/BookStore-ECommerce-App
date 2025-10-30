// backend/middlewares/sse.middleware.js
module.exports = function sseHeaders(req, res, next) {
    const origin = req.headers.origin || "*";

    // CORS for SSE
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    // nếu có compression middleware -> tắt cho route này
    res.setHeader("x-no-compression", "1");

    res.flushHeaders?.(); // quan trọng để flush ngay
    next();
};
