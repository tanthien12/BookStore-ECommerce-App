// // services/auth.service.js
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const { env } = require("../config");
// const User = require("../models/user.model");
// const Role = require("../models/role.model");

// // Tạo JWT
// function signAccessToken(payload) {
//     return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
// }
// function signRefreshToken(payload) {
//     return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
// }

// async function register({ name, email, password }) {
//     const existing = await User.findByEmail(email);
//     if (existing) {
//         const err = new Error("Email đã tồn tại.");
//         err.status = 409;
//         throw err;
//     }

//     const roleId = await Role.findIdByName("customer");
//     if (!roleId) {
//         const err = new Error("Thiếu role mặc định 'customer'. Hãy seed bảng role trước.");
//         err.status = 500;
//         throw err;
//     }

//     const passwordHash = await bcrypt.hash(password, 10);
//     const user = await User.createUser({ name, email, passwordHash, roleId });

//     const accessToken = signAccessToken({ sub: user.id, email: user.email });
//     const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

//     return { user, tokens: { accessToken, refreshToken } };
// }

// async function login({ email, password }) {
//     const existing = await User.findByEmail(email);
//     if (!existing || !existing.password_hash) {
//         const err = new Error("Email hoặc mật khẩu không đúng.");
//         err.status = 401;
//         throw err;
//     }
//     const ok = await bcrypt.compare(password, existing.password_hash);
//     if (!ok) {
//         const err = new Error("Email hoặc mật khẩu không đúng.");
//         err.status = 401;
//         throw err;
//     }

//     const user = await User.updateLastLogin(existing.id);
//     const accessToken = signAccessToken({ sub: existing.id, email: existing.email });
//     const refreshToken = signRefreshToken({ sub: existing.id, email: existing.email });

//     return { user, tokens: { accessToken, refreshToken } };
// }

// async function forgotPassword({ email }) {
//     const user = await User.findByEmail(email);
//     // Không tiết lộ user tồn tại hay không (tránh enumeration); nếu muốn có thể trả về 200 luôn
//     if (!user) return { ok: true };

//     // Tạo token ngẫu nhiên + thời hạn (vd 30 phút)
//     const token = crypto.randomBytes(32).toString("hex");
//     const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
//     await User.createResetToken({ userId: user.id, token, expiresAt });

//     // Ở môi trường thật => gửi email link reset
//     const resetLink = `${env.APP_URL}/reset-password?token=${token}`;

//     return {
//         ok: true,
//         // DEV tiện test:
//         resetLink,
//     };
// }

// async function resetPassword({ token, newPassword }) {
//     const tokenRow = await User.findResetToken(token);
//     const errMsg = "Token không hợp lệ hoặc đã hết hạn.";
//     if (!tokenRow) {
//         const err = new Error(errMsg);
//         err.status = 400;
//         throw err;
//     }
//     if (tokenRow.used_at) {
//         const err = new Error("Token đã được sử dụng.");
//         err.status = 400;
//         throw err;
//     }
//     if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
//         const err = new Error("Token đã hết hạn.");
//         err.status = 400;
//         throw err;
//     }

//     const hash = await bcrypt.hash(newPassword, 10);
//     await User.updateUserPassword(tokenRow.user_id, hash);
//     await User.markResetTokenUsed(tokenRow.id);

//     return { ok: true };
// }

// module.exports = {
//     register,
//     login,
//     forgotPassword,
//     resetPassword,
// };

// // code 2
// // services/auth.service.js
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const { env } = require("../config");
// const User = require("../models/user.model");
// const Role = require("../models/role.model");
// const { OAuth2Client } = require("google-auth-library");

// // ===== JWT helpers =====
// function signAccessToken(payload) {
//     return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
// }
// function signRefreshToken(payload) {
//     return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
// }

// // Chuẩn hoá object user trả về cho FE (Header.jsx)
// function toClientUser(u) {
//     const roleSlug = (u.role_slug || "").toLowerCase() || "user";
//     return {
//         id: u.id,
//         name: u.name,
//         email: u.email,
//         avatar: u.avatar_url || null, // map -> FE đọc "avatar"
//         role: {
//             id: u.role_id,
//             name: u.role_name,
//             slug: roleSlug,
//         },
//     };
// }

// async function register({ name, email, password }) {
//     const existing = await User.findByEmail(email);
//     if (existing) {
//         const err = new Error("Email đã tồn tại.");
//         err.status = 409;
//         throw err;
//     }

//     // Role mặc định "customer"
//     const roleId = await Role.findIdByName("customer");
//     if (!roleId) {
//         const err = new Error("Thiếu role mặc định 'customer'. Hãy seed bảng role trước.");
//         err.status = 500;
//         throw err;
//     }

//     const passwordHash = await bcrypt.hash(password, 10);
//     const created = await User.createUser({ name, email, passwordHash, roleId });

//     // Lấy lại user kèm role (alias role_slug)
//     const fullUser = await User.findByIdWithRole(created.id);
//     const roleSlug = (fullUser?.role_slug || "").toLowerCase() || "customer";

//     const accessToken = signAccessToken({ sub: fullUser.id, email: fullUser.email, role: roleSlug });
//     const refreshToken = signRefreshToken({ sub: fullUser.id, email: fullUser.email, role: roleSlug });

//     return {
//         user: toClientUser(fullUser),
//         tokens: { accessToken, refreshToken },
//     };
// }

// async function login({ email, password }) {
//     // Lấy user KÈM role + password_hash để so sánh
//     const existing = await User.findByEmailWithRole(email);
//     if (!existing || !existing.password_hash) {
//         const err = new Error("Email hoặc mật khẩu không đúng.");
//         err.status = 401;
//         throw err;
//     }

//     const ok = await bcrypt.compare(password, existing.password_hash);
//     if (!ok) {
//         const err = new Error("Email hoặc mật khẩu không đúng.");
//         err.status = 401;
//         throw err;
//     }

//     // Cập nhật last_login (không cần lấy lại vì ta đã có dữ liệu để trả)
//     await User.updateLastLogin(existing.id);

//     const roleSlug = (existing.role_slug || "").toLowerCase() || "user";
//     const accessToken = signAccessToken({ sub: existing.id, email: existing.email, role: roleSlug });
//     const refreshToken = signRefreshToken({ sub: existing.id, email: existing.email, role: roleSlug });

//     return {
//         user: toClientUser(existing),
//         tokens: { accessToken, refreshToken },
//     };
// }

// async function forgotPassword({ email }) {
//     const user = await User.findByEmail(email);
//     // Không tiết lộ user tồn tại hay không
//     if (!user) return { ok: true };

//     const token = crypto.randomBytes(32).toString("hex");
//     const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
//     await User.createResetToken({ userId: user.id, token, expiresAt });

//     const resetLink = `${env.APP_URL}/reset-password?token=${token}`;
//     return { ok: true, resetLink }; // resetLink tiện dev test
// }

// async function resetPassword({ token, newPassword }) {
//     const tokenRow = await User.findResetToken(token);
//     const errMsg = "Token không hợp lệ hoặc đã hết hạn.";
//     if (!tokenRow) {
//         const err = new Error(errMsg);
//         err.status = 400;
//         throw err;
//     }
//     if (tokenRow.used_at) {
//         const err = new Error("Token đã được sử dụng.");
//         err.status = 400;
//         throw err;
//     }
//     if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
//         const err = new Error("Token đã hết hạn.");
//         err.status = 400;
//         throw err;
//     }

//     const hash = await bcrypt.hash(newPassword, 10);
//     await User.updateUserPassword(tokenRow.user_id, hash);
//     await User.markResetTokenUsed(tokenRow.id);

//     return { ok: true };
// }

// async function logout({ refreshToken, meta }) {
//     // Trường hợp stateless: không có refreshToken -> chỉ cần trả OK để FE xoá token
//     if (!refreshToken) return { ok: true };

//     // Nếu dự án chưa lưu refresh token trong DB, phần dưới vẫn an toàn (try/catch)
//     try {
//         // Xác thực refreshToken để lấy userId (sub)
//         const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
//         const userId = payload?.sub;

//         // Nếu có cơ chế lưu refresh token, hãy revoke theo token hash
//         // (tùy bạn hiện đang lưu ở đâu: bảng user_refresh_tokens,…)
//         // Ta hash token để không lưu thô vào DB:
//         const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

//         // Gợi ý API trong model (tuỳ bạn hiện thực trong User model):
//         // - User.revokeRefreshTokenByHash(hash, userId, meta)
//         // Nếu chưa có, có thể bỏ qua không lỗi.
//         if (typeof User.revokeRefreshTokenByHash === "function") {
//             await User.revokeRefreshTokenByHash(tokenHash, userId, meta);
//         }
//     } catch (e) {
//         // Token không hợp lệ/hết hạn -> vẫn coi như đã đăng xuất (idempotent)
//     }

//     return { ok: true };
// }


// module.exports = {
//     register,
//     login,
//     forgotPassword,
//     resetPassword,
//     logout,
// };

// Code 3
// services/auth.service.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { env } = require("../config");
const User = require("../models/user.model");
const Role = require("../models/role.model");
const { OAuth2Client } = require("google-auth-library");

// ===== JWT helpers =====
function signAccessToken(payload) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES });
}
function signRefreshToken(payload) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES });
}

// Chuẩn hoá object user trả về cho FE (Header.jsx)
function toClientUser(u) {
    const roleSlug = (u.role_slug || "").toLowerCase() || "user";
    return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar_url || null, // FE đọc "avatar"
        role: {
            id: u.role_id,
            name: u.role_name,
            slug: roleSlug,
        },
    };
}

// ====== Local Register/Login/Forgot/Reset/Logout ======
async function register({ name, email, password }) {
    const existing = await User.findByEmail(email);
    if (existing) {
        const err = new Error("Email đã tồn tại.");
        err.status = 409;
        throw err;
    }

    // Role mặc định "customer"
    const roleId = await Role.findIdByName("customer");
    if (!roleId) {
        const err = new Error("Thiếu role mặc định 'customer'. Hãy seed bảng role trước.");
        err.status = 500;
        throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await User.createUser({ name, email, passwordHash, roleId });

    // Lấy lại user kèm role (alias role_slug)
    const fullUser = await User.findByIdWithRole(created.id);
    const roleSlug = (fullUser?.role_slug || "").toLowerCase() || "customer";

    const accessToken = signAccessToken({ sub: fullUser.id, email: fullUser.email, role: roleSlug });
    const refreshToken = signRefreshToken({ sub: fullUser.id, email: fullUser.email, role: roleSlug });

    return {
        user: toClientUser(fullUser),
        tokens: { accessToken, refreshToken },
    };
}

async function login({ email, password }) {
    // Lấy user KÈM role + password_hash để so sánh
    const existing = await User.findByEmailWithRole(email);
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

    // Cập nhật last_login (không cần lấy lại vì ta đã có dữ liệu để trả)
    await User.updateLastLogin(existing.id);

    const roleSlug = (existing.role_slug || "").toLowerCase() || "user";
    const accessToken = signAccessToken({ sub: existing.id, email: existing.email, role: roleSlug });
    const refreshToken = signRefreshToken({ sub: existing.id, email: existing.email, role: roleSlug });

    return {
        user: toClientUser(existing),
        tokens: { accessToken, refreshToken },
    };
}

async function forgotPassword({ email }) {
    const user = await User.findByEmail(email);
    // Không tiết lộ user tồn tại hay không
    if (!user) return { ok: true };

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút
    await User.createResetToken({ userId: user.id, token, expiresAt });

    const resetLink = `${env.APP_URL}/reset-password?token=${token}`;
    return { ok: true, resetLink }; // resetLink tiện dev test
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

async function logout({ refreshToken, meta }) {
    // Trường hợp stateless: không có refreshToken -> chỉ cần trả OK để FE xoá token
    if (!refreshToken) return { ok: true };

    // Nếu dự án chưa lưu refresh token trong DB, phần dưới vẫn an toàn (try/catch)
    try {
        // Xác thực refreshToken để lấy userId (sub)
        const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
        const userId = payload?.sub;

        // Nếu có cơ chế lưu refresh token, hãy revoke theo token hash
        // (tùy bạn hiện đang lưu ở đâu: bảng user_refresh_tokens,…)
        // Ta hash token để không lưu thô vào DB:
        const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        // Gợi ý API trong model (tuỳ bạn hiện thực trong User model):
        // - User.revokeRefreshTokenByHash(hash, userId, meta)
        // Nếu chưa có, có thể bỏ qua không lỗi.
        if (typeof User.revokeRefreshTokenByHash === "function") {
            await User.revokeRefreshTokenByHash(tokenHash, userId, meta);
        }
    } catch (e) {
        // Token không hợp lệ/hết hạn -> vẫn coi như đã đăng xuất (idempotent)
    }

    return { ok: true };
}

// ====== Google Login ======
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Xử lý đăng nhập bằng Google ID Token
 * @param {{ id_token: string }} param0
 * @returns {{ user: any, tokens: { accessToken: string, refreshToken: string } }}
 */
async function googleLogin({ id_token }) {
    if (!id_token) {
        const err = new Error("Thiếu id_token từ Google.");
        err.status = 400;
        throw err;
    }

    // Verify với Google
    const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const googleId = payload?.sub;
    const email = payload?.email;
    const emailVerified = payload?.email_verified;
    const name = payload?.name || payload?.given_name || "Người dùng";
    const picture = payload?.picture;

    if (!email || !emailVerified) {
        const err = new Error("Email Google chưa được xác minh hoặc không hợp lệ.");
        err.status = 403;
        throw err;
    }

    // 1) ưu tiên theo google_id
    let user = await User.findByGoogleId(googleId);

    // 2) nếu chưa có -> kiểm tra trùng email
    if (!user) {
        const existedByEmail = await User.findByEmail(email);
        if (existedByEmail && existedByEmail.provider !== "google") {
            const err = new Error(
                "Email này đã tồn tại dưới tài khoản local. Vui lòng đăng nhập local và liên kết Google."
            );
            err.status = 409;
            throw err;
        }

        if (existedByEmail && existedByEmail.provider === "google") {
            user = existedByEmail;
        } else {
            const roleId = await Role.findIdByName("customer");
            if (!roleId) {
                const err = new Error("Thiếu role mặc định 'customer'. Hãy seed bảng role trước.");
                err.status = 500;
                throw err;
            }
            user = await User.createByGoogle({
                name,
                email,
                google_id: googleId,
                avatar_url: picture,
                role_id: roleId,
            });
        }
    } else {
        // cập nhật avatar nếu có
        if (picture) await User.updateAvatar(user.id, picture);
    }

    // Lấy lại user kèm role để toClientUser() có role_name/role_slug
    const fullUser = await User.findByIdWithRole(user.id);

    // cập nhật last_login
    await User.updateLastLogin(user.id);

    const roleSlug = (fullUser?.role_slug || "").toLowerCase() || "customer";
    const accessToken = signAccessToken({ sub: fullUser.id, email: fullUser.email, role: roleSlug });
    const refreshToken = signRefreshToken({ sub: fullUser.id, email: fullUser.email, role: roleSlug });

    return {
        user: toClientUser(fullUser),
        tokens: { accessToken, refreshToken },
    };
}

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    logout,

    // Google
    googleLogin,

    // Export thêm nếu nơi khác cần dùng (tuỳ chọn)
    // signAccessToken,
    // signRefreshToken,
};
