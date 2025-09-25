// src/pages/admin/DashboardAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    MdAttachMoney, MdShoppingCart, MdGroup, MdBook, MdTrendingUp, MdRateReview, MdArrowForward,
} from "react-icons/md";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
    BarChart, Bar, CartesianGrid, Legend,
} from "recharts";

const USE_MOCK = true;

// ====== Utils ======
const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const formatVND = (v) => VND.format(v ?? 0);
const formatShort = (n) => {
    if (n == null) return "0";
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}t`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return `${n}`;
};

const STATUS_META = {
    pending: { label: "Chờ xử lý", badge: "bg-amber-100 text-amber-700", color: "#F59E0B" },
    paid: { label: "Đã thanh toán", badge: "bg-emerald-100 text-emerald-700", color: "#10B981" },
    processing: { label: "Đang xử lý", badge: "bg-blue-100 text-blue-700", color: "#3B82F6" },
    shipped: { label: "Đã gửi", badge: "bg-indigo-100 text-indigo-700", color: "#6366F1" },
    delivered: { label: "Đã giao", badge: "bg-cyan-100 text-cyan-700", color: "#0EA5E9" },
    cancelled: { label: "Đã hủy", badge: "bg-rose-100 text-rose-700", color: "#EF4444" },
};

// ====== Mock data ======
const mock = {
    revenueByDay: [
        { d: "01", amount: 3200000 }, { d: "02", amount: 5400000 }, { d: "03", amount: 2100000 },
        { d: "04", amount: 7200000 }, { d: "05", amount: 3500000 }, { d: "06", amount: 9100000 },
        { d: "07", amount: 6100000 }, { d: "08", amount: 4500000 }, { d: "09", amount: 10300000 },
        { d: "10", amount: 8200000 }, { d: "11", amount: 5900000 }, { d: "12", amount: 7800000 },
        { d: "13", amount: 6600000 }, { d: "14", amount: 9900000 },
    ],
    orderStatusDist: [
        { name: "pending", value: 18 }, { name: "paid", value: 42 }, { name: "processing", value: 12 },
        { name: "shipped", value: 9 }, { name: "delivered", value: 27 }, { name: "cancelled", value: 4 },
    ],
    topBooks: [
        { title: "Clean Code", qty: 120 }, { title: "You Don't Know JS", qty: 95 },
        { title: "Grokking Algorithms", qty: 84 }, { title: "Designing Data-Intensive Apps", qty: 72 },
        { title: "Refactoring", qty: 61 }, { title: "The Pragmatic Programmer", qty: 55 },
    ],
    recentOrders: [
        { code: "ORD-230915-0012", customer: { name: "Nguyễn An", email: "an.nguyen@example.com" }, value: 1540000, createdAt: "2025-09-24 10:12", status: "paid" },
        { code: "ORD-230915-0013", customer: { name: "Trần Bình", email: "binh.tran@example.com" }, value: 298000, createdAt: "2025-09-24 10:27", status: "pending" },
        { code: "ORD-230915-0014", customer: { name: "Lê Chi", email: "chi.le@example.com" }, value: 820000, createdAt: "2025-09-24 11:02", status: "processing" },
        { code: "ORD-230915-0015", customer: { name: "Phạm Dương", email: "duong.pham@example.com" }, value: 2190000, createdAt: "2025-09-24 11:20", status: "delivered" },
    ],
    recentReviews: [
        { user: "Trọng H.", book: "Clean Code", rating: 5, content: "Rất hữu ích cho dev!", when: "2 giờ trước" },
        { user: "Lan P.", book: "Refactoring", rating: 4, content: "Nội dung chất lượng.", when: "5 giờ trước" },
        { user: "Duy K.", book: "DDIA", rating: 5, content: "Sách hay, đáng mua.", when: "hôm qua" },
    ],
    lowStockCount: 8,
    newCustomers: 12,
};

// ====== Data hook ======
function useDashboardData() {
    const [data, setData] = useState({ ...mock });
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        let ok = true;
        if (!USE_MOCK) {
            (async () => {
                try {
                    setLoading(true);
                    // const res = await fetch("/api/admin/dashboard?range=month");
                    // if (!res.ok) throw new Error("Network error");
                    // const json = await res.json();
                    if (ok) setData({ ...mock });
                } catch (e) {
                    if (ok) setError(e.message || "Đã có lỗi xảy ra");
                } finally {
                    if (ok) setLoading(false);
                }
            })();
        }
        return () => { ok = false; };
    }, []);

    return { data, loading, error };
}

// ====== Small primitives ======
function Card({ children, className = "" }) {
    // FORCED WHITE BG IN DARK MODE
    return (
        <div className={`rounded-2xl border border-slate-200/70 bg-white dark:bg-white shadow-sm p-5 ${className}`}>
            {children}
        </div>
    );
}

function StatCard({ title, value, icon, foot }) {
    return (
        <Card>
            <div className="flex items-start gap-4">
                {/* bubble icon cũng sáng ở dark mode */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-100" aria-hidden>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="text-slate-500 text-sm">{title}</div>
                    <div className="text-2xl font-semibold mt-1">{value}</div>
                    {foot && <div className="text-xs text-slate-500 mt-2">{foot}</div>}
                </div>
            </div>
        </Card>
    );
}

function StatusBadge({ status }) {
    const meta = STATUS_META[status] ?? { label: status, badge: "bg-slate-100 text-slate-700" };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${meta.badge}`}>{meta.label}</span>;
}

function Empty({ label = "Không có dữ liệu" }) {
    return <div className="text-sm text-slate-500 text-center py-8">{label}</div>;
}

function LoadingSkeleton({ className = "" }) {
    return <div className={`animate-pulse bg-slate-100 rounded-xl ${className}`} role="status" aria-label="Đang tải" />;
}

// ====== Charts ======
function RevenueLineChart({ data }) {
    if (!data?.length) return <Card className="h-[360px]"><Empty label="Chưa có doanh thu" /></Card>;
    return (
        <Card className="h-[360px]">
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold flex items-center gap-2"><MdTrendingUp /> Doanh thu theo ngày</div>
                <div className="text-xs text-slate-500">Tháng hiện tại</div>
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="d" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`} width={40} />
                        <Tooltip
                            formatter={(v) => [formatVND(v), "Doanh thu"]}
                            labelFormatter={(l) => `Ngày ${l}`}
                            contentStyle={{ borderRadius: 12 }}
                        />
                        <Line type="monotone" dataKey="amount" stroke="#0EA5E9" strokeWidth={3} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function OrderStatusPieChart({ data }) {
    if (!data?.length) return <Card className="h-[360px]"><Empty label="Chưa có đơn hàng" /></Card>;
    const withMeta = data.map((x) => ({ ...x, label: STATUS_META[x.name]?.label ?? x.name, color: STATUS_META[x.name]?.color }));
    return (
        <Card className="h-[360px]">
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Tỷ lệ đơn theo trạng thái</div>
                <div className="text-xs text-slate-500">30 ngày gần đây</div>
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={withMeta} dataKey="value" nameKey="label" innerRadius={70} outerRadius={110} paddingAngle={2}>
                            {withMeta.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ borderRadius: 12 }} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function TopBooksBar({ data }) {
    if (!data?.length) return <Card className="h-[360px]"><Empty label="Chưa có dữ liệu sách" /></Card>;
    return (
        <Card className="h-[440px]">
            <div className="font-semibold mb-4">Top sách bán chạy</div>
            <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: 12 }} />
                        <Bar dataKey="qty" radius={[8, 8, 0, 0]} fill="#3B82F6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}



// ====== Tables ======
function RecentOrdersTable({ rows }) {
    if (!rows?.length) return <Card><Empty label="Chưa có đơn hàng gần đây" /></Card>;
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Đơn hàng gần nhất</div>
                <button className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1" aria-label="Xem tất cả đơn hàng">
                    Xem tất cả <MdArrowForward />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                        <tr>
                            <th className="py-2 pr-4">Mã đơn</th>
                            <th className="py-2 pr-4">Khách hàng</th>
                            <th className="py-2 pr-4">Giá trị</th>
                            <th className="py-2 pr-4">Ngày tạo</th>
                            <th className="py-2">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.code} className="border-t border-slate-100">
                                <td className="py-2 pr-4 font-medium">{r.code}</td>
                                <td className="py-2 pr-4">
                                    <div className="font-medium">{r.customer.name}</div>
                                    <div className="text-slate-500">{r.customer.email}</div>
                                </td>
                                <td className="py-2 pr-4">{formatVND(r.value)}</td>
                                <td className="py-2 pr-4">{r.createdAt}</td>
                                <td className="py-2"><StatusBadge status={r.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function RecentReviews({ rows }) {
    if (!rows?.length) return <Card><Empty label="Chưa có đánh giá" /></Card>;
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold flex items-center gap-2"><MdRateReview /> Đánh giá gần nhất</div>
            </div>
            <div className="space-y-4">
                {rows.map((r, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                        <div>
                            <div className="font-medium">{r.user}</div>
                            <div className="text-slate-500 text-sm">
                                {r.book} • {Array.from({ length: r.rating }).map((_, i) => "⭐").join("")}
                            </div>
                            <div className="text-sm mt-1">{r.content}</div>
                        </div>
                        <div className="text-xs text-slate-500">{r.when}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ====== Main Page ======
export default function DashboardAdmin() {
    const { data, loading, error } = useDashboardData();

    const revenueMonth = useMemo(
        () => (data.revenueByDay ?? []).reduce((s, i) => s + (i.amount ?? 0), 0),
        [data.revenueByDay]
    );
    const newOrders = useMemo(
        () => (data.orderStatusDist ?? []).reduce((s, i) => s + (i.value ?? 0), 0),
        [data.orderStatusDist]
    );

    if (error) {
        return (
            <div className="p-6">
                <Card>
                    <div className="text-rose-600 font-medium">Có lỗi khi tải dashboard</div>
                    <div className="text-sm text-slate-500 mt-1">{error}</div>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-white dark:bg-white">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-slate-500 mt-1">Tổng quan hoạt động cửa hàng sách</p>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <LoadingSkeleton className="h-28" />
                    <LoadingSkeleton className="h-28" />
                    <LoadingSkeleton className="h-28" />
                    <LoadingSkeleton className="h-28" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <StatCard
                        title="Doanh thu tháng"
                        value={formatVND(revenueMonth)}
                        icon={<MdAttachMoney className="text-2xl text-emerald-600" />}
                        foot="Tổng doanh thu cộng dồn theo ngày"
                    />
                    <StatCard
                        title="Đơn hàng mới"
                        value={`${newOrders} (${formatShort(newOrders)})`}
                        icon={<MdShoppingCart className="text-2xl text-sky-600" />}
                        foot="30 ngày gần đây"
                    />
                    <StatCard
                        title="Khách hàng mới"
                        value={data.newCustomers}
                        icon={<MdGroup className="text-2xl text-indigo-600" />}
                        foot="Tháng hiện tại"
                    />
                    <StatCard
                        title="Sách sắp hết"
                        value={data.lowStockCount}
                        icon={<MdBook className="text-2xl text-rose-600" />}
                        foot="Tồn kho ≤ 5"
                    />
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loading ? <LoadingSkeleton className="h-[360px]" /> : <RevenueLineChart data={data.revenueByDay} />}
                {loading ? <LoadingSkeleton className="h-[360px]" /> : <OrderStatusPieChart data={data.orderStatusDist} />}
            </div>

            {/* ===== From here downward: SINGLE COLUMN ===== */}
            <div className="grid grid-cols-1 gap-6 mt-6">
                {loading ? <LoadingSkeleton className="h-[360px]" /> : <TopBooksBar data={data.topBooks} />}
                {loading ? <LoadingSkeleton className="h-[280px]" /> : <RecentOrdersTable rows={data.recentOrders} />}
                {loading ? <LoadingSkeleton className="h-[220px]" /> : <RecentReviews rows={data.recentReviews} />}
            </div>
        </div>
    );
}
