// services/auth.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { env } = require("../config");
const User = require("../models/user.model");
const Role = require("../models/role.model");

// Tạo JWT
function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
}
function signRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
}

async function register({ name, email, password }) {
    const existing = await User.findByEmail(email);
    if (existing) {
        const err = new Error("Email đã tồn tại.");
        err.status = 409;
        throw err;
    }

    const roleId = await Role.findIdByName("customer");
    if (!roleId) {
        const err = new Error("Thiếu role mặc định 'customer'. Hãy seed bảng role trước.");
        err.status = 500;
        throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.createUser({ name, email, passwordHash, roleId });

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

    return { user, tokens: { accessToken, refreshToken } };
}

async function login({ email, password }) {
    const existing = await User.findByEmail(email);
    if (!existing || !existing.password_hash) {
        const err = new Error("Email hoặc mật khẩu không đúng.");
        err.status = 401;
        throw err;
    }
    const ok = await bcrypt.compare(password, existing.password_hash);
    if (!ok) {
        const err = new Error("Email hoặc mật khẩu không đúng.");
        err.status = 401;
        throw err;
    }

    const user = await User.updateLastLogin(existing.id);
    const accessToken = signAccessToken({ sub: existing.id, email: existing.email });
    const refreshToken = signRefreshToken({ sub: existing.id, email: existing.email });

    return { user, tokens: { accessToken, refreshToken } };
}

async function forgotPassword({ email }) {
    const user = await User.findByEmail(email);
    // Không tiết lộ user tồn tại hay không (tránh enumeration); nếu muốn có thể trả về 200 luôn
    if (!user) return { ok: true };

    // Tạo token ngẫu nhiên + thời hạn (vd 30 phút)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await User.createResetToken({ userId: user.id, token, expiresAt });

    // Ở môi trường thật => gửi email link reset
    const resetLink = `${env.APP_URL}/reset-password?token=${token}`;

    return {
        ok: true,
        // DEV tiện test:
        resetLink,
    };
}

async function resetPassword({ token, newPassword }) {
    const tokenRow = await User.findResetToken(token);
    const errMsg = "Token không hợp lệ hoặc đã hết hạn.";
    if (!tokenRow) {
        const err = new Error(errMsg);
        err.status = 400;
        throw err;
    }
    if (tokenRow.used_at) {
        const err = new Error("Token đã được sử dụng.");
        err.status = 400;
        throw err;
    }
    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
        const err = new Error("Token đã hết hạn.");
        err.status = 400;
        throw err;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await User.updateUserPassword(tokenRow.user_id, hash);
    await User.markResetTokenUsed(tokenRow.id);

    return { ok: true };
}

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
};
