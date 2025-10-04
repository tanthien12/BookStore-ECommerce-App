// src/components/admin/ViewUserDrawer.jsx
import React, { useEffect, useState, useCallback } from "react";
import { FiX } from "react-icons/fi";
import summaryApi from "../../common";

// ===== Helpers =====
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

const STATUS_BADGE = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    inactive: "bg-red-100 text-red-700 border-red-200",
};

export default function ViewUserDrawer({ open, onClose, userId }) {
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState("profile");
    const [data, setData] = useState(null);

    const handleKey = useCallback(
        (e) => {
            if (open && e.key === "Escape") onClose?.();
        },
        [open, onClose]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleKey]);

    // Load user detail
    useEffect(() => {
        if (!open || !userId) return;
        let ignore = false;

        (async () => {
            try {
                setLoading(true);
                const url = summaryApi.url(summaryApi.user.detail(userId)); // <— đồng bộ endpoint
                const res = await fetch(url, {
                    headers: { Accept: "application/json", ...authHeaders() },
                });

                if (res.status === 401) {
                    console.warn("GET /admin/users/:id -> 401 Unauthorized (thiếu token hoặc không có quyền)");
                    setData(null);
                    return;
                }
                const d = await res.json().catch(() => ({}));
                if (!ignore && d?.success) setData(d.data || null);
                else if (!ignore) setData(null);
            } catch (e) {
                console.error(e);
                if (!ignore) setData(null);
            } finally {
                if (!ignore) setLoading(false);
            }
        })();

        return () => {
            ignore = true;
        };
    }, [open, userId]);

    return (
        <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
            {/* Overlay */}
            <div
                className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl border-l border-slate-200 transform transition-transform ${open ? "translate-x-0" : "translate-x-full"
                    }`}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="font-semibold">Thông tin người dùng</div>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100"
                        onClick={onClose}
                        aria-label="Đóng"
                    >
                        <FiX />
                    </button>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="p-6 text-slate-500">Đang tải…</div>
                ) : !data ? (
                    <div className="p-6 text-slate-500">Không có dữ liệu</div>
                ) : (
                    <div className="p-4">
                        {/* Header info */}
                        <div className="flex items-center gap-4">
                            <img
                                src={data.avatar_url || "/no-avatar.png"}
                                alt="avatar"
                                className="w-14 h-14 rounded-2xl border border-slate-200 object-cover bg-slate-50"
                            />
                            <div>
                                <div className="text-lg font-semibold">{data.name}</div>
                                <div className="text-sm text-slate-600">{data.email}</div>
                                <div className="mt-1 flex items-center gap-2">
                                    {/* Role badge */}
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs border-slate-200 text-slate-700 bg-slate-50">
                                        {data.role_name || "—"}
                                    </span>
                                    {/* Status badge (đồng bộ style với UserList) */}
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${data.is_active ? STATUS_BADGE.active : STATUS_BADGE.inactive
                                            }`}
                                    >
                                        {data.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="mt-6 border-b border-slate-200">
                            <nav className="flex gap-4">
                                {[
                                    { id: "profile", label: "Profile" },
                                    { id: "addresses", label: "Địa chỉ" },
                                ].map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTab(t.id)}
                                        className={`pb-2 -mb-px border-b-2 ${tab === t.id
                                                ? "border-slate-900 text-slate-900"
                                                : "border-transparent text-slate-500 hover:text-slate-700"
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab contents */}
                        {tab === "profile" && (
                            <div className="mt-4 text-sm space-y-1">
                                <div>
                                    <span className="text-slate-500">Lần đăng nhập cuối:</span>{" "}
                                    {data.last_login_at ? new Date(data.last_login_at).toLocaleString() : "—"}
                                </div>
                                <div>
                                    <span className="text-slate-500">Ngày tạo:</span>{" "}
                                    {data.created_at ? new Date(data.created_at).toLocaleString() : "—"}
                                </div>
                                <div>
                                    <span className="text-slate-500">Cập nhật:</span>{" "}
                                    {data.updated_at ? new Date(data.updated_at).toLocaleString() : "—"}
                                </div>
                            </div>
                        )}

                        {tab === "addresses" && (
                            <div className="mt-4 space-y-3">
                                {(!data.addresses || data.addresses.length === 0) && (
                                    <div className="text-sm text-slate-500">Chưa có địa chỉ</div>
                                )}
                                {(data.addresses || []).map((a) => (
                                    <div key={a.id} className="p-3 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium">{a.address_line1}</div>
                                            {a.is_default && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs border-slate-200 text-slate-700 bg-slate-50">
                                                    Mặc định
                                                </span>
                                            )}
                                        </div>
                                        {a.address_line2 && (
                                            <div className="text-sm text-slate-600">{a.address_line2}</div>
                                        )}
                                        <div className="text-sm text-slate-600">
                                            {a.city}, {a.province} {a.postal_code || ""}
                                        </div>
                                        {a.phone && <div className="text-sm text-slate-600">📞 {a.phone}</div>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
