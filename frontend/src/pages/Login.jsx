// // src/pages/Login.jsx
// import React, { useState } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { FiEye, FiEyeOff } from "react-icons/fi";
// import { FcGoogle } from "react-icons/fc";
// import summaryApi from "../common";

// export default function Login() {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const redirectTo = (location.state && location.state.from) || "/";

//     const [form, setForm] = useState({ email: "", password: "", remember: true });
//     const [showPwd, setShowPwd] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState("");

//     const onChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
//     };

//     const validate = () => {
//         if (!form.email.trim()) return "Vui lòng nhập email";
//         const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
//         if (!re.test(form.email)) return "Email không hợp lệ";
//         if (!form.password) return "Vui lòng nhập mật khẩu";
//         if (form.password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
//         return "";
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         const msg = validate();
//         if (msg) return setError(msg);

//         try {
//             setLoading(true);
//             setError("");
//             const res = await fetch(summaryApi.url(summaryApi.auth.login), {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 credentials: "include",
//                 body: JSON.stringify({
//                     email: form.email,
//                     password: form.password,
//                     remember: form.remember,
//                 }),
//             });
//             if (!res.ok) {
//                 const data = await res.json().catch(() => ({}));
//                 throw new Error(data?.message || "Đăng nhập thất bại");
//             }

//             navigate(redirectTo, { replace: true });
//         } catch (err) {
//             setError(err.message || "Có lỗi xảy ra");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleGoogle = () => {
//         window.location.href = "/api/auth/google";
//     };

//     return (
//         <div className="min-h-dvh w-full flex items-start justify-center bg-gray-50 px-4 pt-4 pb-8">
//             <div className="w-full max-w-sm">
//                 <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-5">
//                     <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Đăng nhập</h1>

//                     {error && (
//                         <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
//                             {error}
//                         </div>
//                     )}

//                     <form onSubmit={handleSubmit} className="space-y-3">
//                         {/* Email */}
//                         <div>
//                             <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
//                                 Email
//                             </label>
//                             <input
//                                 id="email"
//                                 name="email"
//                                 type="email"
//                                 inputMode="email"
//                                 autoComplete="email"
//                                 required
//                                 value={form.email}
//                                 onChange={onChange}
//                                 className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
//                                 placeholder="you@example.com"
//                             />
//                         </div>

//                         {/* Password */}
//                         <div>
//                             <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700">
//                                 Mật khẩu
//                             </label>
//                             <div className="relative">
//                                 <input
//                                     id="password"
//                                     name="password"
//                                     type={showPwd ? "text" : "password"}
//                                     autoComplete="current-password"
//                                     required
//                                     value={form.password}
//                                     onChange={onChange}
//                                     className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-red-500"
//                                     placeholder="••••••••"
//                                 />
//                                 <button
//                                     type="button"
//                                     aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
//                                     onClick={() => setShowPwd((s) => !s)}
//                                     className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
//                                 >
//                                     {showPwd ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
//                                 </button>
//                             </div>
//                         </div>

//                         {/* Remember + Forgot */}
//                         <div className="flex items-center justify-between text-sm mb-8">
//                             <label className="inline-flex items-center gap-2 select-none text-gray-700">
//                                 <input
//                                     type="checkbox"
//                                     name="remember"
//                                     checked={form.remember}
//                                     onChange={onChange}
//                                     className="h-4 w-4 rounded border border-gray-300"
//                                 />
//                                 Ghi nhớ đăng nhập
//                             </label>
//                             <Link to="/forgot-password" className="text-red-600 hover:underline whitespace-nowrap">
//                                 Quên mật khẩu?
//                             </Link>
//                         </div>

//                         {/* Submit */}
//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className="w-full rounded-lg py-3 text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
//                         >
//                             {loading ? (
//                                 <span className="inline-flex items-center gap-2">
//                                     <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
//                                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
//                                         <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" />
//                                     </svg>
//                                     Đang đăng nhập...
//                                 </span>
//                             ) : (
//                                 "Đăng nhập"
//                             )}
//                         </button>
//                     </form>

//                     {/* Divider */}
//                     <div className="my-3 flex items-center gap-3 text-xs text-gray-500">
//                         <div className="h-px flex-1 bg-gray-200" />
//                         <span className="whitespace-nowrap">Hoặc tiếp tục với</span>
//                         <div className="h-px flex-1 bg-gray-200" />
//                     </div>

//                     {/* Social: Google only */}
//                     <div className="grid">
//                         <button
//                             type="button"
//                             onClick={handleGoogle}
//                             className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium hover:bg-gray-50"
//                         >
//                             <span className="inline-flex items-center justify-center gap-2">
//                                 <FcGoogle className="h-5 w-5" aria-hidden />
//                                 Google
//                             </span>
//                         </button>
//                     </div>

//                     {/* Footer (no terms/policy here) */}
//                     <p className="mt-5 text-center text-sm text-gray-600">
//                         Chưa có tài khoản?{" "}
//                         <Link to="/register" className="text-red-600 hover:underline">
//                             Đăng ký
//                         </Link>
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// }

// src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import summaryApi from "../common";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const redirectTo = (location.state && location.state.from) || "/";

    const [form, setForm] = useState({ email: "", password: "", remember: true });
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const validate = () => {
        if (!form.email.trim()) return "Vui lòng nhập email";
        const re = /[^@\s]+@[^@\s]+\.[^@\s]+/;
        if (!re.test(form.email)) return "Email không hợp lệ";
        if (!form.password) return "Vui lòng nhập mật khẩu";
        if (form.password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const msg = validate();
        if (msg) return setError(msg);

        try {
            setLoading(true);
            setError("");

            const res = await fetch(summaryApi.url(summaryApi.auth.login), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include", // nếu backend set cookie (refreshToken chẳng hạn)
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    remember: form.remember,
                }),
            });

            // Lấy body dù có/không có ok để hiển thị message phù hợp
            const data = await res.json().catch(() => ({}));
            // ✅ Thêm dòng này để xem dữ liệu login
            console.log("✅ Dữ liệu login trả về:", data);
            if (!res.ok) {
                throw new Error(data?.message || "Đăng nhập thất bại");
            }

            // ================================
            // ✅ LƯU TOKEN + USER CHO HEADER
            // ================================
            // Hỗ trợ nhiều kiểu response: {accessToken,user} hoặc {token,user} hoặc {data:{accessToken,user}}
            const accessToken =
                data?.accessToken ||
                data?.token ||
                data?.data?.accessToken ||
                data?.data?.token ||
                null;

            const user =
                data?.user ||
                data?.profile ||
                data?.data?.user ||
                data?.data?.profile ||
                null;

            // Chỉ định dạng object đơn giản để Header đọc ra tên + role
            if (user) {
                localStorage.setItem("user", JSON.stringify(user));
            }
            if (accessToken) {
                localStorage.setItem("access_token", accessToken);
            }

            // (tuỳ chọn) nếu muốn tách remember:
            // if (form.remember) localStorage.setItem("access_token", accessToken);
            // else sessionStorage.setItem("access_token", accessToken);

            // Điều hướng về trang trước / trang chủ
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
        <div className="min-h-dvh w-full flex items-start justify-center bg-gray-50 px-4 pt-4 pb-8">
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-lg p-5">
                    <h1 className="text-2xl font-bold mb-4 text-center text-gray-800">Đăng nhập</h1>

                    {error && (
                        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
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
                                    autoComplete="current-password"
                                    required
                                    value={form.password}
                                    onChange={onChange}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    onClick={() => setShowPwd((s) => !s)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100"
                                >
                                    {showPwd ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember + Forgot */}
                        <div className="flex items-center justify-between text-sm mb-8">
                            <label className="inline-flex items-center gap-2 select-none text-gray-700">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={form.remember}
                                    onChange={onChange}
                                    className="h-4 w-4 rounded border border-gray-300"
                                />
                                Ghi nhớ đăng nhập
                            </label>
                            <Link to="/forgot-password" className="text-red-600 hover:underline whitespace-nowrap">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg py-3 text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" />
                                    </svg>
                                    Đang đăng nhập...
                                </span>
                            ) : (
                                "Đăng nhập"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-3 flex items-center gap-3 text-xs text-gray-500">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="whitespace-nowrap">Hoặc tiếp tục với</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    {/* Social: Google only */}
                    <div className="grid">
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
                    <p className="mt-5 text-center text-sm text-gray-600">
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
