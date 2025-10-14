// controllers/auth.controller.js
const { z } = require("zod");
const AuthService = require("../services/auth.service");

// Schemas
const RegisterSchema = z.object({
    name: z.string().min(1, "Tên không được để trống"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

const LoginSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

const ForgotSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
});

const ResetSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

const LogoutSchema = z.object({
    // Cho phép không truyền refreshToken (stateless). Nếu có, ta sẽ revoke (stateful).
    refreshToken: z.string().min(1).optional(),
});


async function register(req, res, next) {
    try {
        const data = RegisterSchema.parse(req.body);
        const result = await AuthService.register(data);
        res.status(201).json({
            message: "Đăng ký thành công",
            data: result,
            error: false,
            success: true,
        });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const data = LoginSchema.parse(req.body);
        const result = await AuthService.login(data);
        res.json({
            message: "Đăng nhập thành công",
            data: result,
            error: false,
            success: true,
        });
    } catch (err) {
        next(err);
    }
}

async function forgotPassword(req, res, next) {
    try {
        const data = ForgotSchema.parse(req.body);
        const result = await AuthService.forgotPassword(data);
        res.json({
            message: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.",
            data: result, // Dev có resetLink để test
            error: false,
            success: true,
        });
    } catch (err) {
        next(err);
    }
}

async function resetPassword(req, res, next) {
    try {
        const data = ResetSchema.parse(req.body);
        await AuthService.resetPassword(data);
        res.json({
            message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
            error: false,
            success: true,
        });
    } catch (err) {
        next(err);
    }
}

async function logout(req, res, next) {
    try {
        const { refreshToken } = LogoutSchema.parse(req.body ?? {});
        await AuthService.logout({
            refreshToken,
            meta: {
                ip: req.ip,
                ua: req.get("user-agent") || "",
            },
        });
        res.json({
            message: "Đăng xuất thành công",
            error: false,
            success: true,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    register,
    login,
    forgotPassword,
    resetPassword,
    logout
};
