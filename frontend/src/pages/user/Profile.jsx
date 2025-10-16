// src/pages/user/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { FiUpload, FiMail, FiPhone, FiUser, FiCalendar } from "react-icons/fi";
import { toast } from "react-toastify";
import summaryApi from "../../common";
import QuickStats from "./QuickStats";

const getToken = () =>
    localStorage.getItem("access_token") || localStorage.getItem("token");
const authHeaders = () => {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
};

const GENDERS = [
    { value: "unspecified", label: "Không tiết lộ" },
    { value: "male", label: "Nam" },
    { value: "female", label: "Nữ" },
    { value: "other", label: "Khác" },
];

export default function Profile() {
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState(null);
    const [stats, setStats] = useState(null);

    // form state
    const [form, setForm] = useState({
        name: "",
        phone: "",
        gender: "unspecified",
        date_of_birth: "", // yyyy-mm-dd
        avatar_url: "",
    });

    // upload state
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");

    const avatarSrc = useMemo(() => {
        if (preview) return preview;
        if (form.avatar_url) return form.avatar_url;
        const fallbackName = encodeURIComponent(form.name || me?.name || "U");
        return `https://ui-avatars.com/api/?name=${fallbackName}`;
    }, [preview, form.avatar_url, form.name, me?.name]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(
                    summaryApi.url(summaryApi.account?.profile || "/me"),
                    { headers: { ...authHeaders() } }
                );
                const data = await res.json().catch(() => ({}));

                if (!res.ok || data?.success === false) {
                    throw new Error(data?.message || "Không lấy được hồ sơ");
                }

                // Chuẩn hóa payload (có thể là {user, stats})
                const u = data?.user || data?.data || data;
                setMe(u);
                setStats(data?.stats || null); // 👈 lấy stats nếu có

                setForm({
                    name: u?.name || "",
                    phone: u?.phone || "",
                    gender: u?.gender || "unspecified",
                    date_of_birth: u?.date_of_birth ? String(u.date_of_birth).slice(0, 10) : "",
                    avatar_url: u?.avatar_url || "",
                });
            } catch (e) {
                toast.error(e.message || "Lỗi tải hồ sơ");
            } finally {
                setLoading(false);
            }
        })();

        // Cleanup object URL khi unmount
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onPick = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (preview) URL.revokeObjectURL(preview);
        setFile(f);
        setPreview(URL.createObjectURL(f));
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const onSave = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            // 1) Upload avatar nếu có file
            let finalUrl = form.avatar_url;
            if (file) {
                const fd = new FormData();
                fd.append("file", file);
                const up = await fetch(summaryApi.url(summaryApi.upload.user.single), {
                    method: "POST",
                    headers: { ...authHeaders() },
                    body: fd,
                });
                const r = await up.json().catch(() => ({}));
                if (!up.ok || r?.success === false) {
                    throw new Error(r?.message || "Upload ảnh thất bại");
                }
                finalUrl = r.url || r.data?.url || r?.secure_url || "";
            }

            // 2) Lưu hồ sơ
            const body = {
                name: form.name,
                phone: form.phone || null,
                gender: form.gender || "unspecified",
                date_of_birth: form.date_of_birth || null, // yyyy-mm-dd
                avatar_url: finalUrl || null,
            };

            const res = await fetch(
                summaryApi.url(summaryApi.account?.update || "/me/profile"),
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", ...authHeaders() },
                    body: JSON.stringify(body),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.success === false) {
                throw new Error(data?.message || "Lưu thất bại");
            }

            const u = data?.user || data?.data || data;
            setMe(u);
            setForm((s) => ({ ...s, avatar_url: u?.avatar_url || finalUrl || "" }));
            setFile(null);
            if (preview) {
                URL.revokeObjectURL(preview);
                setPreview("");
            }

            // cập nhật header/khác
            localStorage.setItem("user", JSON.stringify(u));
            toast.success("Đã cập nhật hồ sơ");
        } catch (e) {
            toast.error(e.message || "Không thể lưu");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !me) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
                Đang tải…
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* 👇 Thống kê nhanh nằm ngay đầu trang Tài khoản của tôi */}
            <QuickStats initialStats={stats} />

            {/* Header card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-bold">Tài khoản của tôi</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Cập nhật thông tin cá nhân, liên hệ và ảnh đại diện
                </p>
            </div>

            {/* Main form card */}
            <form
                onSubmit={onSave}
                className="rounded-2xl border border-gray-200 bg-white p-5 grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Left: Avatar */}
                <div className="lg:col-span-1">
                    <div className="rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-4">
                        <img
                            src={avatarSrc}
                            alt="avatar"
                            className="w-28 h-28 rounded-full object-cover border"
                        />
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer text-sm">
                            <FiUpload />
                            Thay ảnh
                            <input type="file" className="hidden" accept="image/*" onChange={onPick} />
                        </label>
                        <p className="text-xs text-gray-500 text-center">
                            Hỗ trợ JPG, PNG, WEBP. Nên dùng ảnh vuông &lt; 1MB.
                        </p>
                    </div>
                </div>

                {/* Right: Fields */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Họ tên */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Họ tên
                        </label>
                        <div className="relative">
                            <input
                                name="name"
                                value={form.name}
                                onChange={onChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                                placeholder="Nguyễn Văn A"
                            />
                            <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* Email (readonly) */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Email
                        </label>
                        <div className="relative">
                            <input
                                value={me?.email || ""}
                                readOnly
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm"
                            />
                            <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* Số điện thoại */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Số điện thoại
                        </label>
                        <div className="relative">
                            <input
                                name="phone"
                                inputMode="tel"
                                value={form.phone}
                                onChange={onChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                                placeholder="09xxxxxxxx"
                            />
                            <FiPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Dùng để liên hệ giao hàng và hỗ trợ.
                        </p>
                    </div>

                    {/* Giới tính */}
                    <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Giới tính
                        </label>
                        <select
                            name="gender"
                            value={form.gender}
                            onChange={onChange}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                        >
                            {GENDERS.map((g) => (
                                <option key={g.value} value={g.value}>
                                    {g.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Ngày sinh */}
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                            Ngày sinh
                        </label>
                        <div className="relative max-w-xs">
                            <input
                                type="date"
                                name="date_of_birth"
                                value={form.date_of_birth}
                                onChange={onChange}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500"
                            />
                            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="col-span-1 md:col-span-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-white font-semibold hover:bg-red-700 disabled:opacity-70"
                        >
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

