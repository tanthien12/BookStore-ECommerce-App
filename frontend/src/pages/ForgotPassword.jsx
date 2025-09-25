import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import summaryApi from "../common";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [info, setInfo] = useState("");

    const validate = () => {
        if (!email.trim()) return "Vui lòng nhập email";
        const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
        if (!re.test(email)) return "Email không hợp lệ";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const msg = validate();
        if (msg) return setError(msg);

        try {
            setLoading(true);
            setError("");
            setInfo("");
            const res = await fetch(summaryApi.url(summaryApi.auth.forgotPassword), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.message || "Không thể gửi email đặt lại mật khẩu");
            }
            setInfo("Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi.");
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-dvh w-full flex items-start justify-center bg-gray-50 px-4 pt-4 md:pt-6 pb-6">
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-5">
                    <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Quên mật khẩu</h1>

                    {error && (
                        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    {info && (
                        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                            {info}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
                                Nhập email để nhận liên kết đặt lại
                            </label>
                            <input
                                id="email"
                                name="email"
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
                    </form>

                    {/* Footer */}
                    <p className="mt-8 text-center text-sm text-gray-600">
                        Nhớ mật khẩu rồi?{" "}
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
                </div>
            </div>
        </div>
    );
}
