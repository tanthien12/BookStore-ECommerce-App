import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import summaryApi from "../common";

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = (location.state && location.state.from) || "/login";

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirm: "",
        agree: false,
    });
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const validate = () => {
        if (!form.name.trim()) return "Vui lòng nhập họ tên";
        if (!form.email.trim()) return "Vui lòng nhập email";
        const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
        if (!re.test(form.email)) return "Email không hợp lệ";
        if (!form.password) return "Vui lòng nhập mật khẩu";
        if (form.password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
        if (form.confirm !== form.password) return "Xác nhận mật khẩu không khớp";
        if (!form.agree) return "Bạn cần đồng ý Điều khoản & Chính sách bảo mật";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const msg = validate();
        if (msg) return setError(msg);

        try {
            setLoading(true);
            setError("");
            const res = await fetch(summaryApi.url(summaryApi.auth.register), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || "Đăng ký thất bại");
            }
            // Điều hướng về trang đăng nhập sau khi đăng ký thành công
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = () => {
        window.location.href = "/api/auth/google";
    };

    return (
        <div className="min-h-dvh w-full flex items-start justify-center bg-gray-50 px-4 pt-4 md:pt-6 pb-6">
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-5">
                    <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Tạo tài khoản</h1>

                    {error && (
                        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1 text-gray-700">
                                Họ tên
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                value={form.name}
                                onChange={onChange}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                required
                                value={form.email}
                                onChange={onChange}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPwd ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={form.password}
                                    onChange={onChange}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((s) => !s)}
                                    aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                                >
                                    {showPwd ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirm" className="block text-sm font-medium mb-1 text-gray-700">
                                Xác nhận mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm"
                                    name="confirm"
                                    type={showConfirm ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={form.confirm}
                                    onChange={onChange}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((s) => !s)}
                                    aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                                >
                                    {showConfirm ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Agree terms */}
                        <label className="inline-flex items-center gap-2 text-sm select-none text-gray-700">
                            <input
                                type="checkbox"
                                name="agree"
                                checked={form.agree}
                                onChange={onChange}
                                className="h-4 w-4 rounded border border-gray-300"
                            />
                            Tôi đồng ý với{" "}
                            <Link to="/terms" className="text-red-600 hover:underline">
                                Điều khoản
                            </Link>{" "}
                            &{" "}
                            <Link to="/privacy" className="text-red-600 hover:underline">
                                Chính sách bảo mật
                            </Link>
                        </label>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg py-3 text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
                        >
                            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-4 flex items-center gap-3 text-xs text-gray-500">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="whitespace-nowrap">Hoặc tiếp tục với</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    {/* Social: Google only */}
                    <div className="grid mb-4">
                        <button
                            type="button"
                            onClick={handleGoogle}
                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium hover:bg-gray-50"
                        >
                            <span className="inline-flex items-center justify-center gap-2">
                                <FcGoogle className="h-5 w-5" aria-hidden />
                                Google
                            </span>
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-600">
                        Đã có tài khoản?{" "}
                        <Link to="/login" className="text-red-600 hover:underline">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
