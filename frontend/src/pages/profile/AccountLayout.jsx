// src/pages/user/AccountLayout.jsx
// One-file demo you can paste anywhere to try the UI quickly.
// - TailwindCSS required (your project already has it)
// - react-icons (Fi*) used for icons: npm i react-icons
// - react-toastify optional (already in your project)
// - summaryApi assumed at "src/common" as you designed
//
// Notes:
// • Avatar upload is ONLY sent when you hit "Lưu thay đổi" (deferred upload).
// • Replace fetch calls with your summaryApi when wiring real endpoints.
// • Keep UI style aligned with your ProductList (rounded-2xl, soft shadow, clean spacing).

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    FiUser, FiPackage, FiHeart, FiMapPin, FiGift, FiLock, FiMessageCircle, FiLogOut,
    FiChevronRight, FiUpload, FiTrash2, FiSave
} from "react-icons/fi";
import { toast } from "react-toastify";
// If your path differs, adjust this import.
import summaryApi from "../../common";

/* ================= Helpers ================ */
const getAccessToken = () => {
    let t = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!t) return null;
    try {
        const parsed = JSON.parse(t);
        if (typeof parsed === "string") t = parsed;
    } catch { }
    t = String(t).trim();
    if (!t || t === "null" || t === "undefined") return null;
    return t;
};

const authHeaders = () => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

/* ================= Sidebar & Layout ================ */
const MENU = [
    { key: "profile", label: "Tài khoản của tôi", icon: <FiUser className="shrink-0" /> },
    { key: "orders", label: "Đơn hàng của tôi", icon: <FiPackage className="shrink-0" /> },
    { key: "wishlist", label: "Sách yêu thích", icon: <FiHeart className="shrink-0" /> },
    { key: "addresses", label: "Địa chỉ giao hàng", icon: <FiMapPin className="shrink-0" /> },
    { key: "vouchers", label: "Voucher / Điểm thưởng", icon: <FiGift className="shrink-0" /> },
    { key: "security", label: "Cài đặt bảo mật", icon: <FiLock className="shrink-0" /> },
    { key: "support", label: "Hỗ trợ / Chatbot", icon: <FiMessageCircle className="shrink-0" /> },
];

function Sidebar({ active, onChange, profile }) {
    return (
        <aside className="w-full lg:w-72 shrink-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 p-2">
                    <img
                        src={profile?.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(profile?.name || "User")}
                        alt="avatar"
                        className="h-12 w-12 rounded-full object-cover border"
                    />
                    <div>
                        <div className="text-sm text-slate-500">Xin chào,</div>
                        <div className="font-semibold text-slate-800 leading-tight">{profile?.name || "Khách"}</div>
                    </div>
                </div>
                <div className="my-3 h-px bg-slate-100" />
                <nav className="space-y-1">
                    {MENU.map((m) => (
                        <button
                            key={m.key}
                            onClick={() => onChange(m.key)}
                            className={cn(
                                "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition",
                                active === m.key
                                    ? "bg-slate-900 text-white shadow"
                                    : "hover:bg-slate-50 text-slate-700"
                            )}
                        >
                            <span className="flex items-center gap-3 text-[15px]">{m.icon}{m.label}</span>
                            <FiChevronRight className={cn("text-sm transition", active === m.key && "opacity-70")} />
                        </button>
                    ))}
                    <div className="my-3 h-px bg-slate-100" />
                    <button
                        onClick={() => {
                            try {
                                localStorage.removeItem("token");
                                localStorage.removeItem("access_token");
                                toast.success("Đăng xuất thành công");
                                // window.location.href = "/"; // Opt-in: redirect home
                            } catch (e) {
                                toast.error("Không thể đăng xuất: " + e.message);
                            }
                        }}
                        className="w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                        <span className="flex items-center gap-3 text-[15px]"><FiLogOut />Đăng xuất</span>
                        <FiChevronRight className="text-sm" />
                    </button>
                </nav>
            </div>
        </aside>
    );
}

export default function AccountLayout() {
    const [active, setActive] = useState("profile");
    const [profile, setProfile] = useState({ name: "", email: "", phone: "", gender: "", birthday: "", avatarUrl: "" });

    // Fetch initial profile
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                // Example: GET /api/users/me
                const res = await fetch(`${summaryApi.url(summaryApi.user.me)}`, { headers: { ...authHeaders() } });
                if (!res.ok) throw new Error("Tải hồ sơ thất bại");
                const data = await res.json();
                if (!ignore) setProfile({
                    name: data?.item?.name || "",
                    email: data?.item?.email || "",
                    phone: data?.item?.phone || "",
                    gender: data?.item?.gender || "",
                    birthday: data?.item?.birthday?.slice(0, 10) || "",
                    avatarUrl: data?.item?.avatarUrl || "",
                });
            } catch (e) {
                // Optional: ignore if unauthenticated
            }
        })();
        return () => { ignore = true; };
    }, []);

    return (
        <div className="container mx-auto max-w-6xl px-3 py-6">
            <div className="flex flex-col lg:flex-row gap-4">
                <Sidebar active={active} onChange={setActive} profile={profile} />
                <main className="w-full">
                    {active === "profile" && (
                        <ProfileCard value={profile} onChange={setProfile} />
                    )}
                    {active === "orders" && (<PlaceholderCard title="Đơn hàng của tôi" subtitle="Danh sách đơn hàng sẽ hiển thị tại đây." />)}
                    {active === "wishlist" && (<PlaceholderCard title="Sách yêu thích" subtitle="Sản phẩm đã thêm vào yêu thích sẽ hiển thị tại đây." />)}
                    {active === "addresses" && (<PlaceholderCard title="Địa chỉ giao hàng" subtitle="Quản lý nhiều địa chỉ và đặt mặc định." />)}
                    {active === "vouchers" && (<PlaceholderCard title="Voucher / Điểm thưởng" subtitle="Mã giảm giá và điểm thưởng của bạn." />)}
                    {active === "security" && (<PlaceholderCard title="Cài đặt bảo mật" subtitle="Đổi mật khẩu, xem lịch sử đăng nhập." />)}
                    {active === "support" && (<PlaceholderCard title="Hỗ trợ / Chatbot" subtitle="Đặt câu hỏi cho chatbot hoặc gửi yêu cầu hỗ trợ." />)}
                </main>
            </div>
        </div>
    );
}

/* ================= Profile ================= */
function ProfileCard({ value, onChange }) {
    const [form, setForm] = useState(value);
    const [file, setFile] = useState(null); // chosen avatar file (not uploaded yet)
    const [preview, setPreview] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => setForm(value), [value]);

    useEffect(() => {
        if (!file) { setPreview(""); return; }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const onInput = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // 1) If new avatar selected, upload first
            let avatarUrl = form.avatarUrl || "";
            if (file) {
                const fd = new FormData();
                fd.append("file", file);
                const up = await fetch(`${summaryApi.url(summaryApi.upload.user.single)}`, {
                    method: "POST",
                    headers: { ...authHeaders() },
                    body: fd,
                });
                if (!up.ok) throw new Error("Upload ảnh thất bại");
                const upData = await up.json(); // { success, url, fileName, bucket }
                avatarUrl = upData?.url || avatarUrl;
            }

            // 2) Save profile
            const res = await fetch(`${summaryApi.url(summaryApi.user.updateProfile)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({
                    name: form.name,
                    phone: form.phone,
                    gender: form.gender,
                    birthday: form.birthday || null,
                    avatarUrl,
                })
            });
            if (!res.ok) throw new Error("Cập nhật hồ sơ thất bại");
            const data = await res.json();

            toast.success("Đã lưu thay đổi");
            onChange((s) => ({ ...s, ...form, avatarUrl }));
            setFile(null);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Tài khoản của tôi</h2>
                <p className="text-sm text-slate-500">Cập nhật thông tin cá nhân và ảnh đại diện.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="md:w-64">
                    <div className="relative mx-auto h-40 w-40">
                        <img
                            alt="avatar"
                            className="h-40 w-40 rounded-full object-cover border"
                            src={preview || form.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(form?.name || "User")}`}
                        />
                        <label className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1 text-sm shadow cursor-pointer">
                            <FiUpload />
                            <span>Đổi ảnh</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) setFile(f);
                                }}
                            />
                        </label>
                    </div>
                    {file && (
                        <button
                            onClick={() => setFile(null)}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        >
                            <FiTrash2 /> Bỏ chọn ảnh mới
                        </button>
                    )}
                </div>

                {/* Form */}
                <div className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Họ và tên">
                            <input name="name" value={form.name || ""} onChange={onInput} className="input" placeholder="Nguyễn Văn A" />
                        </Field>
                        <Field label="Email">
                            <input disabled value={value.email || ""} className="input disabled:opacity-70" />
                        </Field>
                        <Field label="Số điện thoại">
                            <input name="phone" value={form.phone || ""} onChange={onInput} className="input" placeholder="09xx xxx xxx" />
                        </Field>
                        <Field label="Ngày sinh">
                            <input type="date" name="birthday" value={form.birthday || ""} onChange={onInput} className="input" />
                        </Field>
                        <Field label="Giới tính">
                            <select name="gender" value={form.gender || ""} onChange={onInput} className="input">
                                <option value="">— Chọn —</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </Field>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-white hover:opacity-95 disabled:opacity-60"
                        >
                            <FiSave />
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                        {file && <span className="text-xs text-slate-500">Ảnh mới sẽ được tải lên khi bạn bấm "Lưu thay đổi".</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
            {children}
            <style jsx>{`
        .input { @apply w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-900/10; }
      `}</style>
        </label>
    );
}

/* ================= Placeholders ================= */
function PlaceholderCard({ title, subtitle }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <p className="mt-1 text-slate-500">{subtitle}</p>
            <div className="mt-6 rounded-xl border border-dashed bg-slate-50 p-6 text-slate-500">
                Khu vực này đang chờ kết nối API/Component chi tiết.
            </div>
        </div>
    );
}
