import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import summaryApi from "../common";

export default function AuthRecover() {
    const [sp] = useSearchParams();
    const navigate = useNavigate();
    const token = sp.get("token") || "";

    const isResetMode = useMemo(() => !!token, [token]);

    // Forgot state
    const [email, setEmail] = useState("");

    // Reset state
    const [pw, setPw] = useState("");
    const [pw2, setPw2] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showPw2, setShowPw2] = useState(false);

    // Shared
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setError(""); // đổi mode thì clear lỗi
    }, [isResetMode]);

    const validateForgot = () => {
        if (!email.trim()) return "Vui lòng nhập email";
        const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
        if (!re.test(email)) return "Email không hợp lệ";
        return "";
    };

    const validateReset = () => {
        if (!token) return "Thiếu token";
        if (!pw || pw.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
        if (pw !== pw2) return "Xác nhận mật khẩu không khớp";
        return "";
    };

    const handleForgot = async (e) => {
        e?.preventDefault();
        const msg = validateForgot();
        if (msg) return setError(msg);

        try {
            setLoading(true);
            setError("");
            const res = await fetch(summaryApi.url(summaryApi.auth.forgotPassword), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || "Không thể gửi email đặt lại mật khẩu");
            toast.info("Nếu email tồn tại, liên kết đặt lại đã được gửi.");
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e?.preventDefault();
        const msg = validateReset();
        if (msg) return setError(msg);

        try {
            setLoading(true);
            setError("");
            const res = await fetch(summaryApi.url(summaryApi.auth.resetPassword), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: pw }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || "Đặt lại mật khẩu thất bại");
            toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập!");
            navigate("/login", { replace: true });
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-dvh w-full flex items-start justify-center bg-gray-50 px-4 pt-4 pb-8">
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-5">
                    <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">
                        {isResetMode ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
                    </h1>

                    {error && (
                        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* FORGOT MODE */}
                    {!isResetMode && (
                        <form onSubmit={handleForgot} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Nhập email để nhận liên kết đặt lại
                                </label>
                                <input
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg py-3 text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
                            >
                                {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
                            </button>

                            <p className="mt-6 text-center text-sm text-gray-600">
                                Nhớ mật khẩu?{" "}
                                <Link to="/login" className="text-red-600 hover:underline">
                                    Đăng nhập
                                </Link>
                            </p>
                            <p className="mt-2 text-center text-sm text-gray-600">
                                Chưa có tài khoản?{" "}
                                <Link to="/register" className="text-red-600 hover:underline">
                                    Đăng ký
                                </Link>
                            </p>
                        </form>
                    )}

                    {/* RESET MODE */}
                    {isResetMode && (
                        <form onSubmit={handleReset} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Mật khẩu mới
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPw ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={pw}
                                        onChange={(e) => setPw(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw((s) => !s)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                                    >
                                        {showPw ? "Ẩn" : "Hiện"}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Xác nhận mật khẩu
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPw2 ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={pw2}
                                        onChange={(e) => setPw2(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw2((s) => !s)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                                    >
                                        {showPw2 ? "Ẩn" : "Hiện"}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg py-3 text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
                            >
                                {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                            </button>

                            <p className="mt-6 text-center text-sm text-gray-600">
                                Quay lại{" "}
                                <Link to="/login" className="text-red-600 hover:underline">
                                    Đăng nhập
                                </Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
