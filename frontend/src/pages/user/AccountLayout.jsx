// // src/pages/user/AccountLayout.jsx
// // One-file demo you can paste anywhere to try the UI quickly.
// // - TailwindCSS required (your project already has it)
// // - react-icons (Fi*) used for icons: npm i react-icons
// // - react-toastify optional (already in your project)
// // - summaryApi assumed at "src/common" as you designed
// //
// // Notes:
// // • Avatar upload is ONLY sent when you hit "Lưu thay đổi" (deferred upload).
// // • Replace fetch calls with your summaryApi when wiring real endpoints.
// // • Keep UI style aligned with your ProductList (rounded-2xl, soft shadow, clean spacing).

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//     FiUser, FiPackage, FiHeart, FiMapPin, FiGift, FiLock, FiMessageCircle, FiLogOut,
//     FiChevronRight, FiUpload, FiTrash2, FiSave
// } from "react-icons/fi";
// import { toast } from "react-toastify";
// // If your path differs, adjust this import.
// import summaryApi from "../../common";

// /* ================= Helpers ================ */
// const getAccessToken = () => {
//     let t = localStorage.getItem("token") || localStorage.getItem("access_token");
//     if (!t) return null;
//     try {
//         const parsed = JSON.parse(t);
//         if (typeof parsed === "string") t = parsed;
//     } catch { }
//     t = String(t).trim();
//     if (!t || t === "null" || t === "undefined") return null;
//     return t;
// };

// const authHeaders = () => {
//     const token = getAccessToken();
//     return token ? { Authorization: `Bearer ${token}` } : {};
// };

// function cn(...classes) {
//     return classes.filter(Boolean).join(" ");
// }

// /* ================= Sidebar & Layout ================ */
// const MENU = [
//     { key: "profile", label: "Tài khoản của tôi", icon: <FiUser className="shrink-0" /> },
//     { key: "orders", label: "Đơn hàng của tôi", icon: <FiPackage className="shrink-0" /> },
//     { key: "wishlist", label: "Sách yêu thích", icon: <FiHeart className="shrink-0" /> },
//     { key: "addresses", label: "Địa chỉ giao hàng", icon: <FiMapPin className="shrink-0" /> },
//     { key: "vouchers", label: "Voucher / Điểm thưởng", icon: <FiGift className="shrink-0" /> },
//     { key: "security", label: "Cài đặt bảo mật", icon: <FiLock className="shrink-0" /> },
//     { key: "support", label: "Hỗ trợ / Chatbot", icon: <FiMessageCircle className="shrink-0" /> },
// ];

// function Sidebar({ active, onChange, profile }) {
//     return (
//         <aside className="w-full lg:w-72 shrink-0">
//             <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
//                 <div className="flex items-center gap-3 p-2">
//                     <img
//                         src={profile?.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(profile?.name || "User")}
//                         alt="avatar"
//                         className="h-12 w-12 rounded-full object-cover border"
//                     />
//                     <div>
//                         <div className="text-sm text-slate-500">Xin chào,</div>
//                         <div className="font-semibold text-slate-800 leading-tight">{profile?.name || "Khách"}</div>
//                     </div>
//                 </div>
//                 <div className="my-3 h-px bg-slate-100" />
//                 <nav className="space-y-1">
//                     {MENU.map((m) => (
//                         <button
//                             key={m.key}
//                             onClick={() => onChange(m.key)}
//                             className={cn(
//                                 "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition",
//                                 active === m.key
//                                     ? "bg-slate-900 text-white shadow"
//                                     : "hover:bg-slate-50 text-slate-700"
//                             )}
//                         >
//                             <span className="flex items-center gap-3 text-[15px]">{m.icon}{m.label}</span>
//                             <FiChevronRight className={cn("text-sm transition", active === m.key && "opacity-70")} />
//                         </button>
//                     ))}
//                     <div className="my-3 h-px bg-slate-100" />
//                     <button
//                         onClick={() => {
//                             try {
//                                 localStorage.removeItem("token");
//                                 localStorage.removeItem("access_token");
//                                 toast.success("Đăng xuất thành công");
//                                 // window.location.href = "/"; // Opt-in: redirect home
//                             } catch (e) {
//                                 toast.error("Không thể đăng xuất: " + e.message);
//                             }
//                         }}
//                         className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50"
//                     >
//                         <span className="flex items-center gap-3 text-[15px]"><FiLogOut />Đăng xuất</span>
//                         <FiChevronRight className="text-sm" />
//                     </button>
//                 </nav>
//             </div>
//         </aside>
//     );
// }

// export default function AccountLayout() {
//     const [active, setActive] = useState("profile");
//     const [profile, setProfile] = useState({ name: "", email: "", phone: "", gender: "", birthday: "", avatarUrl: "" });

//     // Fetch initial profile
//     useEffect(() => {
//         let ignore = false;
//         (async () => {
//             try {
//                 // Example: GET /api/users/me
//                 const res = await fetch(`${summaryApi.url(summaryApi.user.me)}`, { headers: { ...authHeaders() } });
//                 if (!res.ok) throw new Error("Tải hồ sơ thất bại");
//                 const data = await res.json();
//                 if (!ignore) setProfile({
//                     name: data?.item?.name || "",
//                     email: data?.item?.email || "",
//                     phone: data?.item?.phone || "",
//                     gender: data?.item?.gender || "",
//                     birthday: data?.item?.birthday?.slice(0, 10) || "",
//                     avatarUrl: data?.item?.avatarUrl || "",
//                 });
//             } catch (e) {
//                 // Optional: ignore if unauthenticated
//             }
//         })();
//         return () => { ignore = true; };
//     }, []);

//     return (
//         <div className="container mx-auto max-w-6xl px-3 py-6">
//             <div className="flex flex-col lg:flex-row gap-4">
//                 <Sidebar active={active} onChange={setActive} profile={profile} />
//                 <main className="w-full">
//                     {active === "profile" && (
//                         <ProfileCard value={profile} onChange={setProfile} />
//                     )}
//                     {active === "orders" && (<PlaceholderCard title="Đơn hàng của tôi" subtitle="Danh sách đơn hàng sẽ hiển thị tại đây." />)}
//                     {active === "wishlist" && (<PlaceholderCard title="Sách yêu thích" subtitle="Sản phẩm đã thêm vào yêu thích sẽ hiển thị tại đây." />)}
//                     {active === "addresses" && (<PlaceholderCard title="Địa chỉ giao hàng" subtitle="Quản lý nhiều địa chỉ và đặt mặc định." />)}
//                     {active === "vouchers" && (<PlaceholderCard title="Voucher / Điểm thưởng" subtitle="Mã giảm giá và điểm thưởng của bạn." />)}
//                     {active === "security" && (<PlaceholderCard title="Cài đặt bảo mật" subtitle="Đổi mật khẩu, xem lịch sử đăng nhập." />)}
//                     {active === "support" && (<PlaceholderCard title="Hỗ trợ / Chatbot" subtitle="Đặt câu hỏi cho chatbot hoặc gửi yêu cầu hỗ trợ." />)}
//                 </main>
//             </div>
//         </div>
//     );
// }

// /* ================= Profile ================= */
// function ProfileCard({ value, onChange }) {
//     const [form, setForm] = useState(value);
//     const [file, setFile] = useState(null); // chosen avatar file (not uploaded yet)
//     const [preview, setPreview] = useState("");
//     const [saving, setSaving] = useState(false);

//     useEffect(() => setForm(value), [value]);

//     useEffect(() => {
//         if (!file) { setPreview(""); return; }
//         const url = URL.createObjectURL(file);
//         setPreview(url);
//         return () => URL.revokeObjectURL(url);
//     }, [file]);

//     const onInput = (e) => {
//         const { name, value } = e.target;
//         setForm((s) => ({ ...s, [name]: value }));
//     };

//     const handleSave = async () => {
//         try {
//             setSaving(true);

//             // 1) If new avatar selected, upload first
//             let avatarUrl = form.avatarUrl || "";
//             if (file) {
//                 const fd = new FormData();
//                 fd.append("file", file);
//                 const up = await fetch(`${summaryApi.url(summaryApi.upload.user.single)}`, {
//                     method: "POST",
//                     headers: { ...authHeaders() },
//                     body: fd,
//                 });
//                 if (!up.ok) throw new Error("Upload ảnh thất bại");
//                 const upData = await up.json(); // { success, url, fileName, bucket }
//                 avatarUrl = upData?.url || avatarUrl;
//             }

//             // 2) Save profile
//             const res = await fetch(`${summaryApi.url(summaryApi.user.updateProfile)}`, {
//                 method: "PUT",
//                 headers: { "Content-Type": "application/json", ...authHeaders() },
//                 body: JSON.stringify({
//                     name: form.name,
//                     phone: form.phone,
//                     gender: form.gender,
//                     birthday: form.birthday || null,
//                     avatarUrl,
//                 })
//             });
//             if (!res.ok) throw new Error("Cập nhật hồ sơ thất bại");
//             const data = await res.json();

//             toast.success("Đã lưu thay đổi");
//             onChange((s) => ({ ...s, ...form, avatarUrl }));
//             setFile(null);
//         } catch (e) {
//             toast.error(e.message);
//         } finally {
//             setSaving(false);
//         }
//     };

//     return (
//         <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//             <div className="mb-4">
//                 <h2 className="text-lg font-semibold text-slate-800">Tài khoản của tôi</h2>
//                 <p className="text-sm text-slate-500">Cập nhật thông tin cá nhân và ảnh đại diện.</p>
//             </div>

//             <div className="flex flex-col md:flex-row gap-6">
//                 {/* Avatar */}
//                 <div className="md:w-64">
//                     <div className="relative mx-auto h-40 w-40">
//                         <img
//                             alt="avatar"
//                             className="h-40 w-40 rounded-full object-cover border"
//                             src={preview || form.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form?.name || "User")}`}
//                         />
//                         <label className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-sm shadow cursor-pointer">
//                             <FiUpload />
//                             <span>Đổi ảnh</span>
//                             <input
//                                 type="file"
//                                 accept="image/*"
//                                 className="hidden"
//                                 onChange={(e) => {
//                                     const f = e.target.files?.[0];
//                                     if (f) setFile(f);
//                                 }}
//                             />
//                         </label>
//                     </div>
//                     {file && (
//                         <button
//                             onClick={() => setFile(null)}
//                             className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
//                         >
//                             <FiTrash2 /> Bỏ chọn ảnh mới
//                         </button>
//                     )}
//                 </div>

//                 {/* Form */}
//                 <div className="flex-1">
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                         <Field label="Họ và tên">
//                             <input name="name" value={form.name || ""} onChange={onInput} className="input" placeholder="Nguyễn Văn A" />
//                         </Field>
//                         <Field label="Email">
//                             <input disabled value={value.email || ""} className="input disabled:opacity-70" />
//                         </Field>
//                         <Field label="Số điện thoại">
//                             <input name="phone" value={form.phone || ""} onChange={onInput} className="input" placeholder="09xx xxx xxx" />
//                         </Field>
//                         <Field label="Ngày sinh">
//                             <input type="date" name="birthday" value={form.birthday || ""} onChange={onInput} className="input" />
//                         </Field>
//                         <Field label="Giới tính">
//                             <select name="gender" value={form.gender || ""} onChange={onInput} className="input">
//                                 <option value="">— Chọn —</option>
//                                 <option value="male">Nam</option>
//                                 <option value="female">Nữ</option>
//                                 <option value="other">Khác</option>
//                             </select>
//                         </Field>
//                     </div>

//                     <div className="mt-6 flex items-center gap-3">
//                         <button
//                             onClick={handleSave}
//                             disabled={saving}
//                             className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white hover:opacity-95 disabled:opacity-60"
//                         >
//                             <FiSave />
//                             {saving ? "Đang lưu..." : "Lưu thay đổi"}
//                         </button>
//                         {file && <span className="text-xs text-slate-500">Ảnh mới sẽ được tải lên khi bạn bấm "Lưu thay đổi".</span>}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// function Field({ label, children }) {
//     return (
//         <label className="block">
//             <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
//             {children}
//             <style jsx>{`
//         .input { @apply w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10; }
//       `}</style>
//         </label>
//     );
// }

// /* ================= Placeholders ================= */
// function PlaceholderCard({ title, subtitle }) {
//     return (
//         <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//             <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
//             <p className="mt-1 text-slate-500">{subtitle}</p>
//             <div className="mt-6 rounded-xl border border-dashed bg-slate-50 p-6 text-slate-500">
//                 Khu vực này đang chờ kết nối API/Component chi tiết.
//             </div>
//         </div>
//     );
// }

//code 2

// frontend/src/pages/profile/AccountLayout.jsx
// import React, { createContext, useEffect, useMemo, useState } from "react";
// import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
// import { FiUser, FiPackage, FiHome, FiLock, FiTag, FiLogOut } from "react-icons/fi";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// export const AccountContext = createContext({ user: null, setUser: () => { } });

// const getToken = () => {
//     let t = localStorage.getItem("access_token") || localStorage.getItem("token");
//     if (!t) return null;
//     try { const p = JSON.parse(t); if (typeof p === "string") t = p; } catch { }
//     t = String(t || "").trim();
//     return t && t !== "null" && t !== "undefined" ? t : null;
// };

// const authHeaders = () => {
//     const token = getToken();
//     return token ? { Authorization: `Bearer ${token}` } : {};
// };

// export default function AccountLayout() {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [loading, setLoading] = useState(true);
//     const [user, setUser] = useState(() => {
//         try {
//             const raw = localStorage.getItem("user");
//             return raw ? JSON.parse(raw) : null;
//         } catch { return null; }
//     });

//     // Nếu chưa có token → ép login
//     useEffect(() => {
//         const token = getToken();
//         if (!token) {
//             navigate("/login", { replace: true, state: { from: location.pathname } });
//         }
//     }, [location.pathname, navigate]);

//     // Đồng bộ thông tin /me khi vào trang account
//     useEffect(() => {
//         let mounted = true;
//         (async () => {
//             try {
//                 setLoading(true);
//                 const res = await fetch(summaryApi.url(summaryApi.auth.me), {
//                     headers: { "Accept": "application/json", ...authHeaders() },
//                     credentials: "include",
//                 });
//                 const data = await res.json().catch(() => ({}));
//                 if (!res.ok || !data?.success) {
//                     throw new Error(data?.message || "Không lấy được thông tin tài khoản");
//                 }
//                 if (!mounted) return;
//                 setUser(data.user || data.data || null);
//                 if (data.user || data.data) {
//                     localStorage.setItem("user", JSON.stringify(data.user || data.data));
//                 }
//             } catch (e) {
//                 // Token hết hạn / invalid → quay về login
//                 console.warn(e);
//                 toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
//                 navigate("/login", { replace: true, state: { from: "/account" } });
//             } finally {
//                 mounted && setLoading(false);
//             }
//         })();
//         return () => { mounted = false; };
//     }, [navigate]);

//     const onLogout = async () => {
//         try {
//             await fetch(summaryApi.url(summaryApi.auth.logout), {
//                 method: "POST",
//                 headers: { "Accept": "application/json", ...authHeaders() },
//                 credentials: "include",
//             }).catch(() => { });
//         } finally {
//             localStorage.removeItem("access_token");
//             localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             toast.success("Đã đăng xuất.");
//             navigate("/", { replace: true });
//         }
//     };

//     const ctx = useMemo(() => ({ user, setUser }), [user]);

//     return (
//         <AccountContext.Provider value={ctx}>
//             <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
//                 <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
//                     {/* SIDEBAR */}
//                     <aside className="rounded-2xl border border-gray-200 bg-white p-4 h-max">
//                         <div className="flex items-center gap-3 pb-4 border-b">
//                             <img
//                                 src={user?.avatar_url || "https://i.pravatar.cc/80"}
//                                 alt="avatar"
//                                 className="w-12 h-12 rounded-full object-cover border"
//                             />
//                             <div>
//                                 <div className="text-sm text-gray-500">Tài khoản của</div>
//                                 <div className="font-semibold text-gray-800 line-clamp-1">
//                                     {user?.name || user?.email || "Khách"}
//                                 </div>
//                             </div>
//                         </div>

//                         <nav className="mt-4 space-y-1 text-sm">
//                             <Item to="/account" icon={<FiHome />}>Tổng quan</Item>
//                             <Item to="/account/profile" icon={<FiUser />}>Hồ sơ</Item>
//                             <Item to="/account/orders" icon={<FiPackage />}>Đơn hàng</Item>
//                             {/* mở rộng */}
//                             {/* <Item to="/account/addresses" icon={<FiHome />}>Địa chỉ</Item> */}
//                             {/* <Item to="/account/security" icon={<FiLock />}>Bảo mật</Item> */}
//                             {/* <Item to="/account/vouchers" icon={<FiTag />}>Voucher của tôi</Item> */}
//                         </nav>

//                         <button
//                             onClick={onLogout}
//                             className="mt-4 inline-flex items-center gap-2 w-full justify-center rounded-xl border px-3 py-2 hover:bg-gray-50"
//                         >
//                             <FiLogOut /> Đăng xuất
//                         </button>
//                     </aside>

//                     {/* CONTENT */}
//                     <section className="min-h-[420px]">
//                         {loading ? (
//                             <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-600">
//                                 Đang tải thông tin tài khoản…
//                             </div>
//                         ) : (
//                             <Outlet />
//                         )}
//                     </section>
//                 </div>
//             </div>
//         </AccountContext.Provider>
//     );
// }

// function Item({ to, icon, children }) {
//     return (
//         <NavLink
//             to={to}
//             end
//             className={({ isActive }) =>
//                 `flex items-center gap-2 rounded-xl px-3 py-2 ${isActive
//                     ? "bg-red-50 text-red-700 font-semibold"
//                     : "hover:bg-gray-50 text-gray-700"
//                 }`
//             }
//         >
//             <span className="text-base">{icon}</span>
//             <span>{children}</span>
//         </NavLink>
//     );
// }

// // //code 3
// // src/pages/profile/AccountLayout.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { FiUser, FiLock, FiPackage, FiUpload, FiLogOut, FiChevronLeft, FiChevronRight } from "react-icons/fi";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// /* ===== Helpers ===== */
// const API = {
//     me: summaryApi.url(summaryApi?.account?.profile || "/me"),
//     meUpdate: summaryApi.url(summaryApi?.account?.update || "/me"),
//     mePassword: summaryApi.url(summaryApi?.account?.changePassword || "/me/password"),
//     myOrders: summaryApi.url(summaryApi?.account?.myOrders || "/me/orders"),
//     uploadUser: summaryApi.url(summaryApi?.upload?.user?.single || "/upload/users"),
//     logout: summaryApi.url(summaryApi?.auth?.logout || "/auth/logout"),
// };

// const getAccessToken = () => {
//     let t = localStorage.getItem("token") || localStorage.getItem("access_token");
//     if (!t) return null;
//     try {
//         const parsed = JSON.parse(t);
//         if (typeof parsed === "string") t = parsed;
//     } catch { }
//     t = String(t).trim();
//     if (!t || t === "null" || t === "undefined") return null;
//     return t;
// };
// const authHeaders = () => {
//     const token = getAccessToken();
//     return token ? { Authorization: `Bearer ${token}` } : {};
// };
// const money = (v) =>
//     (Number(v) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

// /* ===== UI Atoms ===== */
// function TabButton({ active, icon: Icon, children, onClick }) {
//     return (
//         <button
//             onClick={onClick}
//             className={`w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition
//       ${active ? "bg-red-600 text-white shadow" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"}`}
//         >
//             <Icon className="h-4 w-4" /> {children}
//         </button>
//     );
// }

// /* ===== Main ===== */
// export default function AccountLayout() {
//     const navigate = useNavigate();
//     const [tab, setTab] = useState("profile"); // 'profile' | 'password' | 'orders'

//     // Me data
//     const [loadingMe, setLoadingMe] = useState(true);
//     const [me, setMe] = useState(null);
//     const [stats, setStats] = useState({ total_orders: 0, total_spent: 0, last_order_at: null });

//     // Profile form
//     const [name, setName] = useState("");
//     const [avatarUrl, setAvatarUrl] = useState("");
//     const [localAvatarFile, setLocalAvatarFile] = useState(null);
//     const [localAvatarPreview, setLocalAvatarPreview] = useState("");

//     // Password form
//     const [pwCur, setPwCur] = useState("");
//     const [pwNew, setPwNew] = useState("");
//     const [pwNew2, setPwNew2] = useState("");
//     const [loadingSave, setLoadingSave] = useState(false);

//     // Orders
//     const [orders, setOrders] = useState([]);
//     const [oPage, setOPage] = useState(1);
//     const [oPages, setOPages] = useState(1);
//     const [oTotal, setOTotal] = useState(0);
//     const [oLimit, setOLimit] = useState(10);
//     const [oStatus, setOStatus] = useState(""); // '', 'pending','paid','shipped','completed','canceled'
//     const [loadingOrders, setLoadingOrders] = useState(false);

//     /* ===== Load /me ===== */
//     useEffect(() => {
//         (async () => {
//             try {
//                 setLoadingMe(true);
//                 const res = await fetch(API.me, { headers: { Accept: "application/json", ...authHeaders() } });
//                 if (res.status === 401) {
//                     toast.info("Vui lòng đăng nhập lại.");
//                     return navigate("/login", { replace: true });
//                 }
//                 const data = await res.json().catch(() => ({}));
//                 if (!res.ok || !data?.success) throw new Error(data?.message || "Không lấy được thông tin tài khoản");

//                 setMe(data.user || null);
//                 setStats(data.stats || {});

//                 // seed form
//                 setName(data?.user?.name || "");
//                 setAvatarUrl(data?.user?.avatar_url || "");
//             } catch (e) {
//                 toast.error(e.message || "Lỗi tải thông tin tài khoản");
//             } finally {
//                 setLoadingMe(false);
//             }
//         })();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     /* ===== Load orders ===== */
//     const fetchOrders = async (page = oPage, limit = oLimit, status = oStatus) => {
//         try {
//             setLoadingOrders(true);
//             const url = new URL(API.myOrders);
//             url.searchParams.set("page", page);
//             url.searchParams.set("limit", limit);
//             if (status) url.searchParams.set("status", status);

//             const res = await fetch(url.toString(), { headers: { Accept: "application/json", ...authHeaders() } });
//             const data = await res.json().catch(() => ({}));
//             if (!res.ok || !data?.success) throw new Error(data?.message || "Không lấy được đơn hàng");

//             setOrders(data.items || []);
//             setOTotal(data.total || 0);
//             setOPages(data.pages || 1);
//             setOPage(data.page || page);
//             setOLimit(Number(limit));
//         } catch (e) {
//             toast.error(e.message || "Lỗi tải đơn hàng");
//         } finally {
//             setLoadingOrders(false);
//         }
//     };

//     useEffect(() => {
//         if (tab === "orders") fetchOrders(1, oLimit, oStatus);
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [tab, oLimit, oStatus]);

//     /* ===== Avatar local preview ===== */
//     const onPickAvatar = (e) => {
//         const f = e.target.files?.[0];
//         if (!f) return;
//         if (!/^image\//.test(f.type)) {
//             toast.error("Vui lòng chọn ảnh hợp lệ");
//             return;
//         }
//         setLocalAvatarFile(f);
//         const url = URL.createObjectURL(f);
//         setLocalAvatarPreview(url);
//     };

//     /* ===== Save profile ===== */
//     const onSaveProfile = async (e) => {
//         e?.preventDefault();
//         try {
//             setLoadingSave(true);

//             // 1) Nếu có chọn ảnh mới thì upload trước
//             let finalAvatarUrl = avatarUrl;
//             if (localAvatarFile) {
//                 const form = new FormData();
//                 form.append("file", localAvatarFile);
//                 const resUp = await fetch(API.uploadUser, {
//                     method: "POST",
//                     headers: { ...authHeaders() }, // KHÔNG set Content-Type khi dùng FormData
//                     body: form,
//                 });
//                 const dataUp = await resUp.json().catch(() => ({}));
//                 if (!resUp.ok || !dataUp?.success) throw new Error(dataUp?.message || "Upload ảnh thất bại");
//                 finalAvatarUrl = dataUp?.url || dataUp?.data?.url || "";
//             }

//             // 2) Gọi PUT /me
//             const res = await fetch(API.meUpdate, {
//                 method: "PUT",
//                 headers: { "Content-Type": "application/json", ...authHeaders() },
//                 body: JSON.stringify({ name, avatar_url: finalAvatarUrl }),
//             });
//             const data = await res.json().catch(() => ({}));
//             if (!res.ok || !data?.success) throw new Error(data?.message || "Cập nhật hồ sơ thất bại");

//             setMe(data.user);
//             setAvatarUrl(data?.user?.avatar_url || finalAvatarUrl || "");
//             setLocalAvatarFile(null);
//             setLocalAvatarPreview("");
//             // cập nhật localStorage để Header/ứng dụng nhất quán
//             try {
//                 localStorage.setItem("user", JSON.stringify(data.user));
//             } catch { }

//             toast.success("Đã cập nhật hồ sơ");
//         } catch (e) {
//             toast.error(e.message || "Không thể lưu thông tin");
//         } finally {
//             setLoadingSave(false);
//         }
//     };

//     /* ===== Change password ===== */
//     const onChangePassword = async (e) => {
//         e?.preventDefault();
//         if (!pwCur || !pwNew) return toast.error("Vui lòng nhập đủ mật khẩu");
//         if (pwNew.length < 6) return toast.error("Mật khẩu mới tối thiểu 6 ký tự");
//         if (pwNew !== pwNew2) return toast.error("Xác nhận mật khẩu không khớp");

//         try {
//             setLoadingSave(true);
//             const res = await fetch(API.mePassword, {
//                 method: "PUT",
//                 headers: { "Content-Type": "application/json", ...authHeaders() },
//                 body: JSON.stringify({ currentPassword: pwCur, newPassword: pwNew }),
//             });
//             const data = await res.json().catch(() => ({}));
//             if (!res.ok || !data?.success) throw new Error(data?.message || "Đổi mật khẩu thất bại");

//             setPwCur(""); setPwNew(""); setPwNew2("");
//             toast.success("Đổi mật khẩu thành công");
//         } catch (e) {
//             toast.error(e.message || "Không thể đổi mật khẩu");
//         } finally {
//             setLoadingSave(false);
//         }
//     };

//     const onLogout = async () => {
//         try {
//             await fetch(API.logout, { method: "POST", headers: { ...authHeaders() } }).catch(() => { });
//         } finally {
//             localStorage.removeItem("access_token");
//             localStorage.removeItem("token");
//             localStorage.removeItem("user");
//             toast.info("Đã đăng xuất");
//             navigate("/login", { replace: true });
//         }
//     };

//     /* ===== Render ===== */
//     return (
//         <div className="mx-auto max-w-6xl px-3 md:px-4 py-6">
//             <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
//                 {/* Sidebar */}
//                 <aside className="space-y-2">
//                     <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3">
//                         <img
//                             src={localAvatarPreview || me?.avatar_url || "https://ui-avatars.com/api/?background=random&name=" + encodeURIComponent(me?.name || "U")}
//                             alt="avatar"
//                             className="w-12 h-12 rounded-full object-cover border"
//                         />
//                         <div>
//                             <div className="font-semibold text-gray-900">{me?.name || "Tài khoản"}</div>
//                             <div className="text-xs text-gray-500">{me?.email}</div>
//                         </div>
//                     </div>

//                     <TabButton active={tab === "profile"} icon={FiUser} onClick={() => setTab("profile")}>Hồ sơ</TabButton>
//                     <TabButton active={tab === "password"} icon={FiLock} onClick={() => setTab("password")}>Đổi mật khẩu</TabButton>
//                     <TabButton active={tab === "orders"} icon={FiPackage} onClick={() => setTab("orders")}>Đơn hàng</TabButton>

//                     <button onClick={onLogout} className="w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
//                         <FiLogOut className="h-4 w-4" /> Đăng xuất
//                     </button>
//                 </aside>

//                 {/* Content */}
//                 <section>
//                     {/* Loading state for /me */}
//                     {loadingMe ? (
//                         <div className="rounded-2xl border border-gray-200 bg-white p-6">
//                             <div className="animate-pulse h-5 w-40 bg-gray-200 rounded mb-3" />
//                             <div className="animate-pulse h-4 w-72 bg-gray-200 rounded" />
//                         </div>
//                     ) : tab === "profile" ? (
//                         <div className="space-y-4">
//                             <div className="rounded-2xl border border-gray-200 bg-white p-5">
//                                 <h2 className="text-lg font-semibold mb-4">Hồ sơ cá nhân</h2>

//                                 <form onSubmit={onSaveProfile} className="space-y-4">
//                                     <div className="flex items-center gap-4">
//                                         <img
//                                             src={localAvatarPreview || avatarUrl || "https://ui-avatars.com/api/?background=random&name=" + encodeURIComponent(name || me?.name || "U")}
//                                             alt="preview"
//                                             className="w-16 h-16 rounded-full object-cover border"
//                                         />
//                                         <div>
//                                             <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer text-sm">
//                                                 <FiUpload /> Chọn ảnh
//                                                 <input type="file" accept="image/*" onChange={onPickAvatar} className="hidden" />
//                                             </label>
//                                             {localAvatarFile && <div className="text-xs text-gray-500 mt-1">{localAvatarFile.name}</div>}
//                                         </div>
//                                     </div>

//                                     <div>
//                                         <label className="block text-sm font-medium mb-1 text-gray-700">Họ tên</label>
//                                         <input
//                                             value={name}
//                                             onChange={(e) => setName(e.target.value)}
//                                             className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
//                                             placeholder="Nguyễn Văn A"
//                                         />
//                                     </div>

//                                     <div className="text-sm text-gray-600">
//                                         Email: <span className="font-medium">{me?.email}</span>
//                                     </div>

//                                     <div className="pt-2">
//                                         <button
//                                             type="submit"
//                                             disabled={loadingSave}
//                                             className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-white font-semibold hover:bg-red-700 disabled:opacity-70"
//                                         >
//                                             {loadingSave ? "Đang lưu..." : "Lưu thay đổi"}
//                                         </button>
//                                     </div>
//                                 </form>
//                             </div>

//                             {/* Stats */}
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                                 <div className="rounded-xl border border-gray-200 bg-white p-4">
//                                     <div className="text-sm text-gray-500">Tổng số đơn</div>
//                                     <div className="text-2xl font-bold">{stats?.total_orders || 0}</div>
//                                 </div>
//                                 <div className="rounded-xl border border-gray-200 bg-white p-4">
//                                     <div className="text-sm text-gray-500">Tổng chi tiêu</div>
//                                     <div className="text-2xl font-bold">{money(stats?.total_spent || 0)}</div>
//                                 </div>
//                                 <div className="rounded-xl border border-gray-200 bg-white p-4">
//                                     <div className="text-sm text-gray-500">Đơn gần nhất</div>
//                                     <div className="text-sm font-semibold">{stats?.last_order_at ? new Date(stats.last_order_at).toLocaleString() : "—"}</div>
//                                 </div>
//                             </div>
//                         </div>
//                     ) : tab === "password" ? (
//                         <div className="rounded-2xl border border-gray-200 bg-white p-5">
//                             <h2 className="text-lg font-semibold mb-4">Đổi mật khẩu</h2>
//                             <form onSubmit={onChangePassword} className="space-y-3">
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1 text-gray-700">Mật khẩu hiện tại</label>
//                                     <input
//                                         type="password"
//                                         value={pwCur}
//                                         onChange={(e) => setPwCur(e.target.value)}
//                                         className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
//                                         placeholder="••••••••"
//                                         autoComplete="current-password"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1 text-gray-700">Mật khẩu mới</label>
//                                     <input
//                                         type="password"
//                                         value={pwNew}
//                                         onChange={(e) => setPwNew(e.target.value)}
//                                         className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
//                                         placeholder="••••••••"
//                                         autoComplete="new-password"
//                                     />
//                                 </div>
//                                 <div>
//                                     <label className="block text-sm font-medium mb-1 text-gray-700">Xác nhận mật khẩu mới</label>
//                                     <input
//                                         type="password"
//                                         value={pwNew2}
//                                         onChange={(e) => setPwNew2(e.target.value)}
//                                         className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500"
//                                         placeholder="••••••••"
//                                         autoComplete="new-password"
//                                     />
//                                 </div>
//                                 <div className="pt-2">
//                                     <button
//                                         type="submit"
//                                         disabled={loadingSave}
//                                         className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-white font-semibold hover:bg-red-700 disabled:opacity-70"
//                                     >
//                                         {loadingSave ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
//                                     </button>
//                                 </div>
//                             </form>
//                         </div>
//                     ) : (
//                         <div className="rounded-2xl border border-gray-200 bg-white p-5">
//                             <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
//                                 <h2 className="text-lg font-semibold">Đơn hàng của tôi</h2>
//                                 <div className="flex items-center gap-2">
//                                     <select value={oStatus} onChange={(e) => setOStatus(e.target.value)} className="rounded-lg border-gray-300 text-sm">
//                                         <option value="">Tất cả trạng thái</option>
//                                         <option value="pending">Chờ xử lý</option>
//                                         <option value="paid">Đã thanh toán</option>
//                                         <option value="shipped">Đã giao cho DVVC</option>
//                                         <option value="completed">Hoàn tất</option>
//                                         <option value="canceled">Đã hủy</option>
//                                     </select>
//                                     <select value={oLimit} onChange={(e) => setOLimit(Number(e.target.value))} className="rounded-lg border-gray-300 text-sm">
//                                         {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/trang</option>)}
//                                     </select>
//                                 </div>
//                             </div>

//                             {loadingOrders ? (
//                                 <div className="text-gray-500 text-sm">Đang tải đơn hàng…</div>
//                             ) : !orders.length ? (
//                                 <div className="text-gray-600 text-sm">Chưa có đơn hàng nào.</div>
//                             ) : (
//                                 <>
//                                     <div className="overflow-x-auto">
//                                         <table className="w-full text-sm">
//                                             <thead className="bg-gray-50 text-gray-600">
//                                                 <tr>
//                                                     <th className="p-2 text-left">Mã đơn</th>
//                                                     <th className="p-2 text-center">Trạng thái</th>
//                                                     <th className="p-2 text-right">Tổng tiền</th>
//                                                     <th className="p-2 text-right">Phí ship</th>
//                                                     <th className="p-2 text-left">Ngày tạo</th>
//                                                 </tr>
//                                             </thead>
//                                             <tbody>
//                                                 {orders.map((o) => (
//                                                     <tr key={o.id} className="border-t">
//                                                         <td className="p-2">
//                                                             <Link to={`/admin/orders-detail/${o.id}`} className="text-red-600 hover:underline">{o.code || `#${o.id}`}</Link>
//                                                         </td>
//                                                         <td className="p-2 text-center">
//                                                             <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize">
//                                                                 {o.status}
//                                                             </span>
//                                                         </td>
//                                                         <td className="p-2 text-right">{money(o.total_amount)}</td>
//                                                         <td className="p-2 text-right">{money(o.shipping_fee)}</td>
//                                                         <td className="p-2">{o.created_at ? new Date(o.created_at).toLocaleString() : ""}</td>
//                                                     </tr>
//                                                 ))}
//                                             </tbody>
//                                         </table>
//                                     </div>

//                                     {/* Pagination */}
//                                     <div className="flex items-center justify-between mt-3">
//                                         <div className="text-sm text-gray-600">Tổng: {oTotal} đơn · Trang {oPage}/{oPages}</div>
//                                         <div className="flex items-center gap-1">
//                                             <button
//                                                 className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
//                                                 onClick={() => fetchOrders(Math.max(1, oPage - 1), oLimit, oStatus)}
//                                                 disabled={oPage <= 1}
//                                             >
//                                                 <FiChevronLeft /> Trước
//                                             </button>
//                                             <button
//                                                 className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
//                                                 onClick={() => fetchOrders(Math.min(oPages, oPage + 1), oLimit, oStatus)}
//                                                 disabled={oPage >= oPages}
//                                             >
//                                                 Sau <FiChevronRight />
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </>
//                             )}
//                         </div>
//                     )}
//                 </section>
//             </div>
//         </div>
//     );
// }

// code 4 sau
// src/pages/user/AccountLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiUser, FiPackage, FiHeart, FiMapPin, FiGift, FiLock, FiMessageCircle, FiLogOut } from "react-icons/fi";
import summaryApi from "../../common";
import { toast } from "react-toastify";

const menu = [
    { to: "/account", label: "Tài khoản của tôi", icon: FiUser, end: true },
    { to: "/account/orders", label: "Đơn hàng của tôi", icon: FiPackage },
    { to: "/account/wishlist", label: "Sách yêu thích", icon: FiHeart },
    { to: "/account/addresses", label: "Địa chỉ giao hàng", icon: FiMapPin },
    { to: "/account/vouchers", label: "Voucher / Điểm thưởng", icon: FiGift },
    { to: "/account/security", label: "Cài đặt bảo mật", icon: FiLock },
    { to: "/account/support", label: "Hỗ trợ / Chatbot", icon: FiMessageCircle },
];

const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};
const token = () => localStorage.getItem('access_token') || localStorage.getItem('token');

export default function AccountLayout() {
    const nav = useNavigate();
    const me = getUser();

    const logout = async () => {
        try {
            await fetch(summaryApi.url(summaryApi.auth.logout), { method: 'POST', headers: token() ? { Authorization: `Bearer ${token()}` } : {}, credentials: 'include' })
                .catch(() => { });
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            localStorage.removeItem('token');
            toast.info("Đã đăng xuất");
            nav("/login", { replace: true });
        }
    };

    return (
        <div className="mx-auto max-w-6xl px-3 md:px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                <aside className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <img src={me?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(me?.name || 'User')}`} alt="ava" className="w-12 h-12 rounded-full border object-cover" />
                        <div>
                            <div className="font-semibold">{me?.name || 'Tài khoản'}</div>
                            <div className="text-xs text-gray-500">{me?.email}</div>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        {menu.map(m => {
                            const Icon = m.icon;
                            return (
                                <NavLink
                                    key={m.to}
                                    to={m.to}
                                    end={m.end}
                                    className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-red-600 text-white shadow' : 'border border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <Icon className="h-4 w-4" /> {m.label}
                                </NavLink>
                            );
                        })}
                        <button onClick={logout} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm border border-gray-200 hover:bg-gray-50 mt-1">
                            <FiLogOut className="h-4 w-4" /> Đăng xuất
                        </button>
                    </nav>
                </aside>
                <section>
                    <Outlet />
                </section>
            </div>
        </div>
    );
}
