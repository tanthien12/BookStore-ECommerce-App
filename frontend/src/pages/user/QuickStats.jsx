// src/pages/user/QuickStats.jsx
import React, { useEffect, useState } from "react";
import { FiPackage, FiDollarSign, FiClock } from "react-icons/fi";
import summaryApi from "../../common";
import { toast } from "react-toastify";

const token = () => localStorage.getItem("access_token") || localStorage.getItem("token");
const authHeaders = () => (token() ? { Authorization: `Bearer ${token()}` } : {});

function formatMoney(n = 0) {
    const num = typeof n === "string" ? Number(n) : n;
    return (num || 0).toLocaleString("vi-VN") + "₫";
}
function formatDate(d) {
    if (!d) return "—";
    try {
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return "—";
        return dt.toLocaleString("vi-VN", { hour12: false });
    } catch {
        return "—";
    }
}

export default function QuickStats({ initialStats }) {
    const [loading, setLoading] = useState(!initialStats);
    const [stats, setStats] = useState(
        initialStats || { total_orders: 0, total_spent: 0, last_order_at: null }
    );

    useEffect(() => {
        if (initialStats) return; // đã có từ /me, không cần fetch
        (async () => {
            try {
                setLoading(true);
                const res = await fetch(summaryApi.url(summaryApi.account?.stats || "/me/quick-stats"), {
                    headers: { ...authHeaders() },
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data?.message || "Không tải được thống kê");
                const s = data?.stats || data?.data || {};
                setStats({
                    total_orders: s?.total_orders || 0,
                    total_spent: s?.total_spent || 0,
                    last_order_at: s?.last_order_at || null,
                });
            } catch (e) {
                toast.error(e.message || "Lỗi tải thống kê");
            } finally {
                setLoading(false);
            }
        })();
    }, [initialStats]);

    const items = [
        { icon: <FiPackage className="h-5 w-5" />, label: "Tổng đơn", value: loading ? "…" : stats.total_orders },
        { icon: <FiDollarSign className="h-5 w-5" />, label: "Tổng chi", value: loading ? "…" : formatMoney(stats.total_spent) },
        { icon: <FiClock className="h-5 w-5" />, label: "Đơn gần nhất", value: loading ? "…" : formatDate(stats.last_order_at) },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {items.map((it, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center gap-3 hover:shadow-sm transition">
                    <div className="rounded-xl border bg-gray-50 p-2">{it.icon}</div>
                    <div>
                        <div className="text-xs text-gray-500">{it.label}</div>
                        <div className="text-lg font-semibold">{it.value}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
