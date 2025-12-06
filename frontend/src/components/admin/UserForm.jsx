

// src/components/admin/UserForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiSave, FiX, FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import summaryApi from "../../common";

/* ===== Helpers ===== */
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
const isEmail = (s) => /.+@.+\..+/.test(String(s || "").trim());

/* ===== Small UI ===== */
function Toggle({ checked, onChange, label }) {
    return (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
            <span className="font-medium text-slate-800">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                aria-pressed={checked}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-1"
                        }`}
                />
            </button>
        </div>
    );
}

/**
 * Props:
 * - mode: "create" | "edit"
 * - initialValues: null | { id, name, email, role_id, is_active, avatar_url, created_at, updated_at }
 * - onSubmit: optional callback(data) sau khi lưu thành công
 */
export default function UserForm({
    mode = "create",
    initialValues = null,
    onSubmit: onSubmitProp,
}) {
    const nav = useNavigate();

    // ===== State =====
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [roleId, setRoleId] = useState("");
    const [isActive, setIsActive] = useState(true);

    // Ảnh: URL server (cũ/đã upload) + preview blob + file gốc
    const [avatarUrl, setAvatarUrl] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [avatarFile, setAvatarFile] = useState(null);

    const [password, setPassword] = useState(""); // chỉ dùng khi create
    const [roles, setRoles] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef(null);

    // ===== Sync khi EDIT (chỉ khi id đổi) =====
    useEffect(() => {
        if (mode !== "edit" || !initialValues) return;

        setName(initialValues.name || "");
        setEmail(initialValues.email || "");
        setRoleId(
            typeof initialValues.role_id !== "undefined" && initialValues.role_id !== null
                ? String(initialValues.role_id)
                : ""
        );
        setIsActive(typeof initialValues.is_active === "boolean" ? initialValues.is_active : true);

        setAvatarFile(null);
        setAvatarUrl(initialValues.avatar_url || "");

        // reset preview khi đổi user
        if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setPreviewUrl("");
    }, [mode, initialValues?.id]);

    // Cleanup blob URL khi unmount/đổi file
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // ===== Load Roles =====
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const url = summaryApi.url(`${summaryApi.role.list}`);
                const res = await fetch(url, { headers: { Accept: "application/json", ...authHeaders() } });
                const data = await res.json();
                if (!ignore && data?.success) setRoles(Array.isArray(data.items) ? data.items : []);
            } catch (e) {
                console.error(e);
                toast.error("Không tải được danh sách vai trò");
            }
        })();
        return () => {
            ignore = true;
        };
    }, []);

    // ===== Chỉ tạo PREVIEW, không upload ở đây =====
    const handleFileChange = (file) => {
        setAvatarFile(file || null);

        if (!file) {
            if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
            setPreviewUrl("");
            return;
        }

        // tạo preview ngay
        const url = URL.createObjectURL(file);
        setPreviewUrl((prev) => {
            if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
            return url;
        });

        // ❌ KHÔNG upload tại đây — sẽ upload khi submit
    };

    // Drag & drop
    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFileChange(f);
    };

    // ===== Submit: upload ảnh (nếu có) rồi mới gọi API create/update =====
    const validate = () => {
        const e = {};
        if (!name?.trim()) e.name = "Họ tên là bắt buộc.";
        if (!email?.trim() || !isEmail(email)) e.email = "Email không hợp lệ.";
        if (!roleId) e.role = "Vui lòng chọn vai trò.";
        if (mode === "create" && !password) e.password = "Vui lòng nhập mật khẩu.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e?.preventDefault?.();
        if (!validate()) return;

        try {
            setSaving(true);

            // 1) Nếu có file ảnh mới => upload NGAY BÂY GIỜ
            let finalAvatarUrl = avatarUrl || "";
            if (avatarFile && avatarFile.size > 0 && avatarFile.type?.startsWith("image/")) {
                const MAX_MB = 3;
                if (avatarFile.size > MAX_MB * 1024 * 1024) {
                    toast.error(`Ảnh tối đa ${MAX_MB}MB`);
                    setSaving(false);
                    return;
                }

                const form = new FormData();
                form.append("file", avatarFile);

                const upRes = await fetch(summaryApi.url(summaryApi.upload.user.single), {
                    method: "POST",
                    headers: { ...authHeaders() }, // KHÔNG set Content-Type
                    body: form,
                });

                const upJson = await upRes.json().catch(() => ({}));
                if (!upRes.ok || upJson?.success === false) {
                    const msg = upJson?.message || `Upload thất bại (${upRes.status})`;
                    toast.error(msg);
                    setSaving(false);
                    return;
                }
                finalAvatarUrl = upJson?.url ?? upJson?.data?.url ?? upJson?.file?.url ?? "";
                if (!finalAvatarUrl) {
                    toast.error("Không lấy được URL ảnh sau khi upload");
                    setSaving(false);
                    return;
                }
            }

            // 2) Tạo payload
            const payload = {
                name: name.trim(),
                email: email.trim(),
                role_id: roleId, // giữ string, BE tự parse/uuid/number theo schema
                is_active: !!isActive,
                avatar_url: finalAvatarUrl || undefined,
            };

            // 3) Gọi API tạo/cập nhật user
            let res;
            if (mode === "create") {
                res = await fetch(summaryApi.url(summaryApi.user.create), {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...authHeaders() },
                    body: JSON.stringify({ ...payload, password }),
                });
            } else {
                const id = initialValues?.id;
                res = await fetch(summaryApi.url(summaryApi.user.update(id)), {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", ...authHeaders() },
                    body: JSON.stringify(payload),
                });
            }

            const data = await res.json().catch(() => ({}));
            if (!res.ok || data?.success === false) {
                throw new Error(data?.message || `Thao tác thất bại (${res.status})`);
            }

            toast.success(mode === "create" ? "Tạo người dùng thành công" : "Cập nhật thành công");

            // Dọn preview (nếu muốn “khóa” lại ảnh theo URL server)
            if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
            setPreviewUrl("");

            if (onSubmitProp) onSubmitProp(data.data);
            else nav("/admin/users");
        } catch (err) {
            console.error(err);
            toast.error(err?.message || "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    /* ===== UI — GIỮ đúng bố cục giao diện bạn đã gửi ===== */
    return (
        <div className="max-w-6xl mx-auto px-4 py-2 space-y-6">
            {/* Header card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                        <div className="text-sm text-slate-500">
                            Admin / Users / {mode === "create" ? "Create" : "Edit"}
                        </div>
                        <h2 className="text-xl font-semibold text-slate-800 mt-1">
                            {mode === "create" ? "Thêm người dùng" : "Chỉnh sửa người dùng"}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Quản lý thông tin tài khoản và quyền truy cập cho nhân sự.
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                        <Link
                            to="/admin/users"
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 hover:bg-slate-50"
                        >
                            <FiX /> Hủy
                        </Link>
                        <button
                            type="submit"
                            form="userForm"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            <FiSave /> {saving ? "Đang lưu…" : mode === "create" ? "Tạo mới" : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Body form */}
            <form id="userForm" onSubmit={handleSubmit}>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Grid: aside + main */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                        {/* LEFT PANEL (avatar + toggle + meta) */}
                        <aside className="md:col-span-4 xl:col-span-3">
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                className={`rounded-2xl border-2 border-dashed ${dragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50"
                                    } p-5 flex flex-col items-center text-center cursor-pointer`}
                                onClick={() => fileRef.current?.click()}
                            >
                                <div className="w-28 h-28 rounded-full overflow-hidden bg-white border border-slate-200 shadow-sm">
                                    {previewUrl || avatarUrl ? (
                                        <img
                                            src={previewUrl || avatarUrl} // ưu tiên preview
                                            alt="avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                                            No Avatar
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 hover:bg-slate-50"
                                >
                                    <FiUpload /> Upload photo
                                </button>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                                />

                                <div className="text-xs text-slate-500 mt-3 leading-5">
                                    Hỗ trợ *.jpeg, *.jpg, *.png, *.gif
                                    <br />
                                    Dung lượng tối đa <span className="font-medium">3 MB</span>
                                </div>
                            </div>

                            <div className="mt-4">
                                <Toggle checked={isActive} onChange={setIsActive} label="Kích hoạt tài khoản" />
                            </div>

                            <div className="mt-4 text-xs text-slate-500 space-y-1">
                                {initialValues?.created_at && (
                                    <div>Ngày tạo: {new Date(initialValues.created_at).toLocaleString()}</div>
                                )}
                                {initialValues?.updated_at && (
                                    <div>Cập nhật: {new Date(initialValues.updated_at).toLocaleString()}</div>
                                )}
                            </div>
                        </aside>

                        {/* RIGHT PANEL (fields) */}
                        <section className="md:col-span-8 xl:col-span-9">
                            {/* Section header line */}
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-slate-700">Thông tin cơ bản</h3>
                                <div className="mt-2 h-px w-full bg-slate-200" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Họ tên</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? "border-red-400" : "border-slate-300"
                                            }`}
                                    />
                                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="a@example.com"
                                        className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? "border-red-400" : "border-slate-300"
                                            }`}
                                    />
                                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                                </div>

                                {/* Password (create only) + Role */}
                                {mode === "create" ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.password ? "border-red-400" : "border-slate-300"
                                                    }`}
                                            />
                                            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1">Vai trò</label>
                                            <select
                                                value={roleId}
                                                onChange={(e) => setRoleId(e.target.value)}
                                                className={`w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.role ? "border-red-400" : "border-slate-300"
                                                    }`}
                                            >
                                                <option value="">-- Chọn vai trò --</option>
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.role_name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Vai trò</label>
                                            <select
                                                value={roleId}
                                                onChange={(e) => setRoleId(e.target.value)}
                                                className={`w-full rounded-xl border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.role ? "border-red-400" : "border-slate-300"
                                                    }`}
                                            >
                                                <option value="">-- Chọn vai trò --</option>
                                                {roles.map((r) => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.role_name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role}</p>}
                                        </div>
                                        <div /> {/* spacer giữ layout 2 cột */}
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Footer actions */}
                    <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2 bg-slate-50 rounded-b-2xl">
                        <Link
                            to="/admin/users"
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50"
                        >
                            <FiX /> Hủy
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            <FiSave /> {saving ? "Đang lưu…" : mode === "create" ? "Tạo mới" : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
