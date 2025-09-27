// middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const { env } = require("../config");

function authGuard(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Thiếu token", error: true, success: false });
    }
    try {
        const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
        req.user = { id: payload.sub, email: payload.email };
        return next();
    } catch (err) {
        return res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn", error: true, success: false });
    }
}

module.exports = { authGuard };
