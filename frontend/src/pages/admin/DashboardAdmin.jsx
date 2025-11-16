// src/pages/admin/DashboardAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    MdAttachMoney,
    MdShoppingCart,
    MdGroup,
    MdBook,
    MdTrendingUp,
    MdTrendingDown,
    MdRepeat,
    MdAccessTime,
    MdRateReview,
    MdArrowForward,
    MdWarningAmber,
    MdInsights,
    MdBarChart,
} from "react-icons/md";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    CartesianGrid,
    Legend,
    AreaChart,
    Area,
} from "recharts";
import summaryApi, { authHeaders } from "../../common";

const USE_MOCK = false;

const RANGE_OPTIONS = [
    { value: "7d", label: "7 ngày" },
    { value: "30d", label: "30 ngày" },
    { value: "90d", label: "90 ngày" },
    { value: "365d", label: "12 tháng" },
    { value: "month", label: "Tháng này" },
];

// ====== Utils ======
const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const INTL_NUMBER = new Intl.NumberFormat("vi-VN");

const formatVND = (v) => VND.format(v ?? 0);
const formatNumber = (v) => INTL_NUMBER.format(Math.round(v ?? 0));
const formatShort = (n) => {
    if (n == null) return "0";
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}t`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return `${n}`;
};

const clamp = (value, min, max) => {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
};

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
const RELATIVE_TIME_UNITS = [
    { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
    { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
    { unit: "day", ms: 24 * 60 * 60 * 1000 },
    { unit: "hour", ms: 60 * 60 * 1000 },
    { unit: "minute", ms: 60 * 1000 },
];

const toNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

const round = (value, digits = 2) => {
    if (!Number.isFinite(value)) return 0;
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
};

const formatPercent = (value) => `${round(value ?? 0, 1)}%`;

const formatDurationHours = (hours) => {
    if (!Number.isFinite(hours) || hours <= 0) return "<1 giờ";
    if (hours >= 48) return `${round(hours / 24, 1)} ngày`;
    if (hours >= 24) return `${round(hours / 24, 1)} ngày`;
    if (hours >= 1) return `${round(hours, 1)} giờ`;
    return `${round(hours * 60, 0)} phút`;
};

const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
};

const relativeTimeFromNow = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const diff = date.getTime() - Date.now();
    for (const { unit, ms } of RELATIVE_TIME_UNITS) {
        const amount = diff / ms;
        if (Math.abs(amount) >= 1) {
            return RELATIVE_TIME_FORMATTER.format(Math.round(amount), unit);
        }
    }
    return RELATIVE_TIME_FORMATTER.format(Math.round(diff / 1000), "second");
};

const METRIC_EMPTY = { current: 0, previous: 0, delta: 0, deltaPercent: null };

const EMPTY_STATE = {
    range: { startDate: "", endDate: "", previousStart: "", previousEnd: "", label: "" },
    summary: {
        revenue: { ...METRIC_EMPTY },
        orders: { ...METRIC_EMPTY },
        avgOrderValue: { ...METRIC_EMPTY },
        netRevenue: { ...METRIC_EMPTY },
        repeatCustomerRate: { ...METRIC_EMPTY },
        fulfillmentTimeHours: { ...METRIC_EMPTY },
    },
    revenueByDay: [],
    previousRevenueByDay: [],
    orderStatusDist: [],
    topBooks: [],
    lowStockCount: 0,
    newCustomers: 0,
    alerts: [],
    recentOrders: [],
    recentReviews: [],
    product: {
        topCategories: [],
        topAuthors: [],
        inventoryVelocity: [],
        slowMovers: [],
    },
    customers: {
        cohorts: [],
        inactiveCustomers: 0,
        repeatCustomers: 0,
        atRiskCustomers: [],
    },
    campaigns: {
        summary: { flashsaleRevenue: 0, couponRevenue: 0, campaignRevenue: 0 },
        flashsales: [],
        coupons: [],
    },

};

const STATUS_META = {
    pending: { label: "Chờ xử lý", badge: "bg-amber-100 text-amber-700", color: "#F59E0B" },
    paid: { label: "Đã thanh toán", badge: "bg-emerald-100 text-emerald-700", color: "#10B981" },
    processing: { label: "Đang xử lý", badge: "bg-blue-100 text-blue-700", color: "#3B82F6" },
    shipped: { label: "Đã gửi", badge: "bg-indigo-100 text-indigo-700", color: "#6366F1" },
    delivered: { label: "Đã giao", badge: "bg-cyan-100 text-cyan-700", color: "#0EA5E9" },
    cancelled: { label: "Đã hủy", badge: "bg-rose-100 text-rose-700", color: "#EF4444" },
    refunded: { label: "Hoàn tiền", badge: "bg-purple-100 text-purple-700", color: "#8B5CF6" },
};

// ===== Normalizers =====
const normalizeMetric = (metric = {}) => ({
    current: toNumber(metric.current),
    previous: toNumber(metric.previous),
    delta: toNumber(metric.delta),
    deltaPercent:
        metric.deltaPercent == null || Number.isNaN(metric.deltaPercent)
            ? null
            : toNumber(metric.deltaPercent),
});

const normalizeOverview = (payload = {}) => {
    const normalized = { ...EMPTY_STATE };
    if (payload.range) {
        normalized.range = {
            startDate: payload.range.startDate || payload.range.start || "",
            endDate: payload.range.endDate || payload.range.end || "",
            previousStart: payload.range.previousStart || "",
            previousEnd: payload.range.previousEnd || "",
            label: payload.range.label || "",
        };
    }

    normalized.summary = {
        revenue: normalizeMetric(payload.summary?.revenue),
        orders: normalizeMetric(payload.summary?.orders),
        avgOrderValue: normalizeMetric(payload.summary?.avgOrderValue),
        netRevenue: normalizeMetric(payload.summary?.netRevenue),
        repeatCustomerRate: normalizeMetric(payload.summary?.repeatCustomerRate),
        fulfillmentTimeHours: normalizeMetric(payload.summary?.fulfillmentTimeHours),
    };

    normalized.revenueByDay = Array.isArray(payload.revenueByDay)
        ? payload.revenueByDay.map((item) => ({
            day: item?.day ?? item?.d ?? "",
            revenue: toNumber(item?.revenue ?? item?.amount),
            refunded: toNumber(item?.refunded),
            orders: toNumber(item?.orders),
        }))
        : [];

    normalized.previousRevenueByDay = Array.isArray(payload.previousRevenueByDay)
        ? payload.previousRevenueByDay.map((item) => ({
            day: item?.day ?? item?.d ?? "",
            revenue: toNumber(item?.revenue ?? item?.amount),
            refunded: toNumber(item?.refunded),
            orders: toNumber(item?.orders),
        }))
        : [];

    normalized.orderStatusDist = Array.isArray(payload.orderStatusDist)
        ? payload.orderStatusDist.map((item) => ({
            name: item?.name ?? item?.status ?? "",
            value: toNumber(item?.value ?? item?.count),
        }))
        : [];

    normalized.topBooks = Array.isArray(payload.topBooks)
        ? payload.topBooks.map((item) => ({
            title: item?.title ?? item?.name ?? "",
            qty: toNumber(item?.qty ?? item?.quantity),
        }))
        : [];

    normalized.lowStockCount = toNumber(payload.lowStockCount);
    normalized.newCustomers = toNumber(payload.newCustomers);

    normalized.alerts = Array.isArray(payload.alerts)
        ? payload.alerts.map((alert) => ({
            type: alert?.type ?? "",
            label: alert?.label ?? "",
            count: toNumber(alert?.count),
            severity: alert?.severity ?? "info",
            href: alert?.href ?? "",
        }))
        : [];

    normalized.recentOrders = Array.isArray(payload.recentOrders)
        ? payload.recentOrders.map((item) => {
            const created = item?.createdAt ?? item?.created_at ?? item?.placed_at;
            return {
                code: item?.code ?? item?.id ?? "",
                customer: {
                    name: item?.customer?.name ?? item?.customer_name ?? "Khách hàng",
                    email: item?.customer?.email ?? item?.customer_email ?? "",
                },
                value: toNumber(item?.value ?? item?.grand_total),
                createdAt: formatDateTime(created),
                status: item?.status ?? "pending",
            };
        })
        : [];

    normalized.recentReviews = Array.isArray(payload.recentReviews)
        ? payload.recentReviews.map((item) => {
            const created = item?.createdAt ?? item?.created_at;
            const when = relativeTimeFromNow(created) || formatDateTime(created);
            const rating = clamp(Math.round(toNumber(item?.rating)), 0, 5);
            return {
                user: item?.user ?? item?.user_name ?? "Ẩn danh",
                book: item?.book ?? item?.book_title ?? "",
                rating,
                content: item?.content ?? "",
                when,
            };
        })
        : [];

    return normalized;
};

const normalizeProduct = (payload = {}) => ({
    topCategories: Array.isArray(payload.topCategories)
        ? payload.topCategories.map((item) => ({
            name: item?.name ?? "",
            qty: toNumber(item?.qty ?? item?.quantity),
        }))
        : [],
    topAuthors: Array.isArray(payload.topAuthors)
        ? payload.topAuthors.map((item) => ({
            author: item?.author ?? "",
            qty: toNumber(item?.qty ?? item?.quantity),
            revenue: toNumber(item?.revenue),
        }))
        : [],
    inventoryVelocity: Array.isArray(payload.inventoryVelocity)
        ? payload.inventoryVelocity.map((item) => ({
            id: item?.id,
            title: item?.title ?? "",
            stock: toNumber(item?.stock),
            sold: toNumber(item?.sold),
            velocity: round(toNumber(item?.velocity), 3),
        }))
        : [],
    slowMovers: Array.isArray(payload.slowMovers)
        ? payload.slowMovers.map((item) => ({
            id: item?.id,
            title: item?.title ?? "",
            stock: toNumber(item?.stock),
            sold: toNumber(item?.sold),
        }))
        : [],
});

const normalizeCustomers = (payload = {}) => ({
    cohorts: Array.isArray(payload.cohorts)
        ? payload.cohorts.map((item) => ({
            month: item?.month ?? "",
            newCustomers: toNumber(item?.newCustomers ?? item?.new_customers),
            repeatCustomers: toNumber(item?.repeatCustomers ?? item?.repeat_customers),
        }))
        : [],
    inactiveCustomers: toNumber(payload.inactiveCustomers ?? payload.inactive_customers),
    repeatCustomers: toNumber(payload.repeatCustomers ?? payload.repeat_customers),
    atRiskCustomers: Array.isArray(payload.atRiskCustomers)
        ? payload.atRiskCustomers.map((item) => ({
            id: item?.id,
            name: item?.name ?? "",
            email: item?.email ?? "",
            lastOrderAt: formatDateTime(item?.lastOrderAt ?? item?.last_order_at),
            totalOrders: toNumber(item?.totalOrders ?? item?.total_orders),
        }))
        : [],
});

const normalizeCampaigns = (payload = {}) => ({
    summary: {
        flashsaleRevenue: toNumber(payload.summary?.flashsaleRevenue),
        couponRevenue: toNumber(payload.summary?.couponRevenue),
        campaignRevenue: toNumber(payload.summary?.campaignRevenue),
    },
    flashsales: Array.isArray(payload.flashsales)
        ? payload.flashsales.map(f => ({
            ...f,
            totalQuantity: toNumber(f.totalQuantity),
            soldQuantity: toNumber(f.soldQuantity),
            revenue: toNumber(f.revenue),
            soldRate: toNumber(f.soldRate),
        }))
        : [],
    coupons: Array.isArray(payload.coupons)
        ? payload.coupons.map(c => ({
            ...c,
            uses: toNumber(c.uses),
            revenue: toNumber(c.revenue),
        }))
        : [],
});

const normalizeDashboardPayload = ({ overview, product, customers, campaigns }) => {
    const base = normalizeOverview(overview);
    const productData = normalizeProduct(product);
    const customerData = normalizeCustomers(customers);
    const campaignData = normalizeCampaigns(campaigns);

    return {
        ...base,
        product: productData,
        customers: customerData,
        campaigns: campaignData,
    };
};



// ====== Mock data ======
// const mock = {
//     range: {
//         startDate: "2025-09-01",
//         endDate: "2025-09-14",
//         previousStart: "2025-08-18",
//         previousEnd: "2025-08-31",
//         label: "2025-09-01 → 2025-09-14",
//     },
//     summary: {
//         revenue: { current: 112_000_000, previous: 98_000_000, delta: 14_000_000, deltaPercent: 14.3 },
//         orders: { current: 420, previous: 360, delta: 60, deltaPercent: 16.7 },
//         avgOrderValue: { current: 267_000, previous: 272_000, delta: -5_000, deltaPercent: -1.8 },
//         netRevenue: { current: 105_000_000, previous: 94_000_000, delta: 11_000_000, deltaPercent: 11.7 },
//         repeatCustomerRate: { current: 42, previous: 38, delta: 4, deltaPercent: 10.5 },
//         fulfillmentTimeHours: { current: 32, previous: 36, delta: -4, deltaPercent: -11.1 },
//     },
//     revenueByDay: Array.from({ length: 14 }).map((_, idx) => ({
//         day: `${(idx + 1).toString().padStart(2, "0")}`,
//         revenue: 4_000_000 + Math.random() * 6_000_000,
//         orders: 20 + Math.floor(Math.random() * 40),
//         refunded: Math.random() * 500_000,
//     })),
//     previousRevenueByDay: Array.from({ length: 14 }).map((_, idx) => ({
//         day: `${(idx + 1).toString().padStart(2, "0")}`,
//         revenue: 3_500_000 + Math.random() * 5_000_000,
//         orders: 18 + Math.floor(Math.random() * 30),
//         refunded: Math.random() * 300_000,
//     })),
//     orderStatusDist: [
//         { name: "pending", value: 28 },
//         { name: "paid", value: 120 },
//         { name: "processing", value: 96 },
//         { name: "shipped", value: 64 },
//         { name: "delivered", value: 112 },
//         { name: "cancelled", value: 18 },
//     ],
//     topBooks: [
//         { title: "Clean Code", qty: 120 },
//         { title: "You Don't Know JS", qty: 95 },
//         { title: "Grokking Algorithms", qty: 84 },
//         { title: "Designing Data-Intensive Apps", qty: 72 },
//         { title: "Refactoring", qty: 61 },
//         { title: "The Pragmatic Programmer", qty: 55 },
//     ],
//     lowStockCount: 8,
//     newCustomers: 42,
//     alerts: [
//         {
//             type: "pending_orders",
//             label: "Đơn hàng chờ xử lý",
//             count: 12,
//             severity: "warning",
//             href: "/admin/orders?status=pending",
//         },
//         {
//             type: "low_stock",
//             label: "Sản phẩm sắp hết hàng",
//             count: 8,
//             severity: "danger",
//             href: "/admin/books?filter=low-stock",
//         },
//     ],
//     recentOrders: [
//         {
//             code: "ORD-230915-0012",
//             customer: { name: "Nguyễn An", email: "an.nguyen@example.com" },
//             value: 1_540_000,
//             createdAt: "2025-09-14 10:12",
//             status: "paid",
//         },
//         {
//             code: "ORD-230915-0013",
//             customer: { name: "Trần Bình", email: "binh.tran@example.com" },
//             value: 298_000,
//             createdAt: "2025-09-14 10:27",
//             status: "pending",
//         },
//         {
//             code: "ORD-230915-0014",
//             customer: { name: "Lê Chi", email: "chi.le@example.com" },
//             value: 820_000,
//             createdAt: "2025-09-14 11:02",
//             status: "processing",
//         },
//         {
//             code: "ORD-230915-0015",
//             customer: { name: "Phạm Dương", email: "duong.pham@example.com" },
//             value: 2_190_000,
//             createdAt: "2025-09-14 11:20",
//             status: "delivered",
//         },
//     ],
//     recentReviews: [
//         { user: "Trọng H.", book: "Clean Code", rating: 5, content: "Rất hữu ích cho dev!", when: "2 giờ trước" },
//         { user: "Lan P.", book: "Refactoring", rating: 4, content: "Nội dung chất lượng.", when: "5 giờ trước" },
//         { user: "Duy K.", book: "DDIA", rating: 5, content: "Sách hay, đáng mua.", when: "hôm qua" },
//     ],
//     product: {
//         topCategories: [
//             { name: "Công nghệ", qty: 240 },
//             { name: "Kinh doanh", qty: 132 },
//             { name: "Thiếu nhi", qty: 88 },
//             { name: "Khoa học", qty: 76 },
//             { name: "Văn học", qty: 70 },
//         ],
//         topAuthors: [
//             { author: "Robert C. Martin", qty: 120, revenue: 8_400_000 },
//             { author: "Martin Fowler", qty: 95, revenue: 7_200_000 },
//             { author: "Kyle Simpson", qty: 84, revenue: 6_100_000 },
//         ],
//         inventoryVelocity: [
//             { id: "1", title: "Clean Code", stock: 12, sold: 120, velocity: 0.91 },
//             { id: "2", title: "Refactoring", stock: 20, sold: 61, velocity: 0.75 },
//             { id: "3", title: "You Don't Know JS", stock: 18, sold: 95, velocity: 0.84 },
//         ],
//         slowMovers: [
//             { id: "10", title: "Sách kỹ năng mềm", stock: 42, sold: 2 },
//             { id: "11", title: "Tiểu thuyết A", stock: 35, sold: 1 },
//         ],
//     },
//     customers: {
//         cohorts: [
//             { month: "2025-04", newCustomers: 120, repeatCustomers: 86 },
//             { month: "2025-05", newCustomers: 132, repeatCustomers: 90 },
//             { month: "2025-06", newCustomers: 140, repeatCustomers: 102 },
//             { month: "2025-07", newCustomers: 150, repeatCustomers: 120 },
//             { month: "2025-08", newCustomers: 168, repeatCustomers: 135 },
//             { month: "2025-09", newCustomers: 142, repeatCustomers: 148 },
//         ],
//         inactiveCustomers: 420,
//         repeatCustomers: 148,
//         atRiskCustomers: [
//             {
//                 id: "u1",
//                 name: "Hoàng Minh",
//                 email: "minh@example.com",
//                 lastOrderAt: "2025-07-12 09:24",
//                 totalOrders: 3,
//             },
//             {
//                 id: "u2",
//                 name: "Thu Trang",
//                 email: "trang@example.com",
//                 lastOrderAt: "2025-07-02 14:10",
//                 totalOrders: 4,
//             },
//         ],
//     },
// };

// ====== Data hook ======
function useDashboardData(range) {
    const [data, setData] = useState(() => (USE_MOCK ? { ...mock } : { ...EMPTY_STATE }));
    const [loading, setLoading] = useState(!USE_MOCK);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;

        if (!USE_MOCK) {
            (async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const buildUrl = (path) => {
                        const params = new URLSearchParams();
                        if (range) params.set("range", range);
                        const qs = params.toString();
                        const finalPath = qs ? `${path}?${qs}` : path;
                        return summaryApi.url(finalPath);
                    };

                    const commonOptions = {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            ...authHeaders(),
                        },
                        credentials: "include",
                    };

                    const request = async (path) => {
                        const response = await fetch(buildUrl(path), commonOptions);
                        const json = await response
                            .json()
                            .catch(() => ({ message: "Không thể đọc dữ liệu" }));
                        if (!response.ok) {
                            const message =
                                json?.message || json?.error || "Không thể tải dữ liệu";
                            throw new Error(message);
                        }
                        return json?.data ?? json;
                    };

                    const [overview, product, customers, campaigns] = await Promise.all([
                        request(summaryApi.dashboard.adminOverview),
                        request(summaryApi.dashboard.productAnalytics),
                        request(summaryApi.dashboard.customerAnalytics),
                        request(summaryApi.dashboard.campaignAnalytics),
                    ]);

                    if (active) {
                        setData(
                            normalizeDashboardPayload({
                                overview,
                                product,
                                customers,
                                campaigns,
                            })
                        );
                    }
                } catch (e) {
                    if (active) setError(e.message || "Đã có lỗi xảy ra");
                } finally {
                    if (active) setLoading(false);
                }
            })();
        }

        return () => {
            active = false;
        };
    }, [range]);

    return { data: data ?? EMPTY_STATE, loading, error };
}

// ====== Small primitives ======
function Card({ children, className = "" }) {
    return (
        <div
            className={`rounded-2xl border border-slate-200/70 bg-white dark:bg-white shadow-sm p-5 ${className}`}
        >
            {children}
        </div>
    );
}

function LoadingSkeleton({ className = "" }) {
    return (
        <div
            className={`animate-pulse bg-slate-100 rounded-xl ${className}`}
            role="status"
            aria-label="Đang tải"
        />
    );
}

function Empty({ label = "Không có dữ liệu" }) {
    return (
        <div className="text-sm text-slate-500 text-center py-8">{label}</div>
    );
}

function StatusBadge({ status }) {
    const meta =
        STATUS_META[status] ?? {
            label: status,
            badge: "bg-slate-100 text-slate-700",
        };
    return (
        <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${meta.badge}`}
        >
            {meta.label}
        </span>
    );
}

function DeltaBadge({ metric }) {
    if (!metric || metric.deltaPercent == null) return null;
    const positive = metric.deltaPercent >= 0;
    const Icon = positive ? MdTrendingUp : MdTrendingDown;
    const tone = positive ? "text-emerald-600" : "text-rose-600";
    const bg = positive ? "bg-emerald-50" : "bg-rose-50";
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bg} ${tone}`}
        >
            <Icon aria-hidden />
            {`${positive ? "+" : ""}${round(metric.deltaPercent, 1)}%`}
        </span>
    );
}

function StatCard({ title, value, metric, icon, foot }) {
    return (
        <Card>
            <div className="flex items-start gap-4">
                <div
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-100"
                    aria-hidden
                >
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div className="text-slate-500 text-sm">{title}</div>
                        <DeltaBadge metric={metric} />
                    </div>
                    <div className="text-2xl font-semibold mt-1">{value}</div>
                    {foot && (
                        <div className="text-xs text-slate-500 mt-2">{foot}</div>
                    )}
                </div>
            </div>
        </Card>
    );
}

function RangeSelector({ value, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((opt) => {
                const active = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${active
                            ? "bg-sky-600 text-white border-sky-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                            }`}
                        type="button"
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}

// ====== Charts ======
function RevenueLineChart({ current, previous }) {
    if (!current?.length)
        return (
            <Card className="h-[360px]">
                <Empty label="Chưa có doanh thu" />
            </Card>
        );

    const previousMap = new Map(
        (previous || []).map((item) => [item.day, item.revenue])
    );
    const merged = current.map((item) => ({
        day: item.day,
        current: item.revenue,
        previous: previousMap.has(item.day)
            ? previousMap.get(item.day)
            : null,
    }));

    return (
        <Card className="h-[360px]">
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold flex items-center gap-2">
                    <MdTrendingUp /> Doanh thu theo ngày
                </div>
                <div className="text-xs text-slate-500">So sánh với kỳ trước</div>
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={merged}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis
                            tickFormatter={(v) => `${Math.round(v / 1_000_000)}tr`}
                            width={40}
                        />
                        <Tooltip
                            formatter={(v, name) => [
                                formatVND(v),
                                name === "current" ? "Kỳ hiện tại" : "Kỳ trước",
                            ]}
                            labelFormatter={(l) => `Ngày ${l}`}
                            contentStyle={{ borderRadius: 12 }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="current"
                            stroke="#0EA5E9"
                            strokeWidth={3}
                            dot={false}
                            name="Hiện tại"
                        />
                        <Line
                            type="monotone"
                            dataKey="previous"
                            stroke="#94A3B8"
                            strokeWidth={2}
                            dot={false}
                            name="Kỳ trước"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function OrderStatusPieChart({ data }) {
    if (!data?.length)
        return (
            <Card className="h-[360px]">
                <Empty label="Chưa có đơn hàng" />
            </Card>
        );
    const withMeta = data.map((x) => ({
        ...x,
        label: STATUS_META[x.name]?.label ?? x.name,
        color: STATUS_META[x.name]?.color,
    }));
    return (
        <Card className="h-[360px]">
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Tỷ lệ đơn theo trạng thái</div>
                <div className="text-xs text-slate-500">
                    Theo khoảng thời gian đã chọn
                </div>
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={withMeta}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={2}
                        >
                            {withMeta.map((entry, idx) => (
                                <Cell key={idx} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(v, n) => [v, n]}
                            contentStyle={{ borderRadius: 12 }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function BarCard({
    title,
    icon,
    data,
    dataKey = "qty",
    xKey = "name",
    emptyLabel = "Không có dữ liệu",
}) {
    if (!data?.length)
        return (
            <Card className="h-[360px]">
                <Empty label={emptyLabel} />
            </Card>
        );
    return (
        <Card className="h-[360px]">
            <div className="font-semibold flex items-center gap-2 mb-4">
                {icon} {title}
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: 12 }} />
                        <Bar
                            dataKey={dataKey}
                            radius={[8, 8, 0, 0]}
                            fill="#3B82F6"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function TopBooksBar({ data }) {
    if (!data?.length)
        return (
            <Card className="h-[440px]">
                <Empty label="Chưa có dữ liệu sách" />
            </Card>
        );
    return (
        <Card className="h-[440px]">
            <div className="font-semibold mb-4">Top sách bán chạy</div>
            <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: 12 }} />
                        <Bar
                            dataKey="qty"
                            radius={[8, 8, 0, 0]}
                            fill="#2563EB"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function CustomerCohortChart({ data }) {
    if (!data?.length)
        return (
            <Card className="h-[360px]">
                <Empty label="Chưa có dữ liệu khách hàng" />
            </Card>
        );
    return (
        <Card className="h-[360px]">
            <div className="font-semibold mb-4">Nhóm khách hàng theo tháng</div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ borderRadius: 12 }}
                            formatter={(value, name) => [
                                value,
                                name === "newCustomers"
                                    ? "Khách mới"
                                    : "Khách quay lại",
                            ]}
                        />
                        <Area
                            type="monotone"
                            dataKey="newCustomers"
                            stackId="1"
                            stroke="#0EA5E9"
                            fill="#0EA5E9"
                            fillOpacity={0.3}
                            name="Khách mới"
                        />
                        <Area
                            type="monotone"
                            dataKey="repeatCustomers"
                            stackId="1"
                            stroke="#22C55E"
                            fill="#22C55E"
                            fillOpacity={0.3}
                            name="Khách quay lại"
                        />
                        <Legend />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

// ====== Tables & lists ======
function RecentOrdersTable({ rows }) {
    if (!rows?.length)
        return (
            <Card>
                <Empty label="Chưa có đơn hàng gần đây" />
            </Card>
        );
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Đơn hàng gần nhất</div>
                <Link
                    to="/admin/orders"
                    className="text-sm text-sky-600 hover:text-sky-700 flex items-center gap-1"
                    aria-label="Xem tất cả đơn hàng"
                >
                    Xem tất cả <MdArrowForward />
                </Link>
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
                            <tr
                                key={r.code}
                                className="border-t border-slate-100"
                            >
                                <td className="py-2 pr-4 font-medium">
                                    {r.code}
                                </td>
                                <td className="py-2 pr-4">
                                    <div className="font-medium">
                                        {r.customer.name}
                                    </div>
                                    <div className="text-slate-500">
                                        {r.customer.email}
                                    </div>
                                </td>
                                <td className="py-2 pr-4">
                                    {formatVND(r.value)}
                                </td>
                                <td className="py-2 pr-4">{r.createdAt}</td>
                                <td className="py-2">
                                    <StatusBadge status={r.status} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function RecentReviews({ rows }) {
    if (!rows?.length)
        return (
            <Card>
                <Empty label="Chưa có đánh giá" />
            </Card>
        );
    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold flex items-center gap-2">
                    <MdRateReview /> Đánh giá gần nhất
                </div>
            </div>
            <div className="space-y-4">
                {rows.map((r, idx) => {
                    const safeRating = clamp(Math.round(r.rating ?? 0), 0, 5);
                    const stars =
                        safeRating > 0
                            ? "⭐".repeat(safeRating)
                            : "Chưa đánh giá";
                    return (
                        <div
                            key={idx}
                            className="flex items-start justify-between"
                        >
                            <div>
                                <div className="font-medium">{r.user}</div>
                                <div className="text-slate-500 text-sm flex items-center gap-1">
                                    <span>{r.book} •</span>
                                    <span aria-hidden="true">{stars}</span>
                                    <span className="sr-only">
                                        {safeRating} trên 5
                                    </span>
                                </div>
                                <div className="text-sm mt-1">
                                    {r.content}
                                </div>
                            </div>
                            <div className="text-xs text-slate-500">
                                {r.when}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

function InventoryVelocityTable({ rows }) {
    if (!rows?.length)
        return (
            <Card>
                <Empty label="Chưa có dữ liệu tồn kho" />
            </Card>
        );
    return (
        <Card>
            <div className="font-semibold mb-4">Tốc độ tiêu thụ tồn kho</div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500">
                        <tr>
                            <th className="py-2 pr-4">Sản phẩm</th>
                            <th className="py-2 pr-4">Đã bán</th>
                            <th className="py-2 pr-4">Tồn kho</th>
                            <th className="py-2">Tốc độ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-t border-slate-100"
                            >
                                <td className="py-2 pr-4 font-medium">
                                    {row.title}
                                </td>
                                <td className="py-2 pr-4">
                                    {formatNumber(row.sold)}
                                </td>
                                <td className="py-2 pr-4">
                                    {formatNumber(row.stock)}
                                </td>
                                <td className="py-2">
                                    {formatPercent(row.velocity * 100)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function SlowMoversList({ rows }) {
    if (!rows?.length)
        return (
            <Card>
                <Empty label="Không có sản phẩm chậm bán" />
            </Card>
        );
    return (
        <Card>
            <div className="font-semibold flex items-center gap-2 mb-4">
                <MdWarningAmber /> Sản phẩm cần thúc đẩy
            </div>
            <div className="space-y-3">
                {rows.map((row) => (
                    <div
                        key={row.id}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <div className="font-medium">{row.title}</div>
                            <div className="text-xs text-slate-500">
                                Đã bán {row.sold} • Tồn {row.stock}
                            </div>
                        </div>
                        <Link
                            to={`/admin/products-edit/${row.id}`}
                            className="text-sm text-sky-600 hover:text-sky-700"
                        >
                            Quản lý
                        </Link>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function AlertsPanel({ alerts }) {
    if (!alerts?.length) return null;
    const severityClass = {
        danger: "text-rose-600",
        warning: "text-amber-600",
        info: "text-slate-600",
    };
    return (
        <Card>
            <div className="font-semibold flex items-center gap-2 mb-4">
                <MdWarningAmber /> Cảnh báo
            </div>
            <div className="space-y-3">
                {alerts.map((alert, idx) => (
                    <div
                        key={idx}
                        className="flex items-center justify-between"
                    >
                        <div>
                            <div
                                className={`font-medium ${severityClass[alert.severity] ||
                                    "text-slate-700"
                                    }`}
                            >
                                {alert.label}
                            </div>
                            <div className="text-xs text-slate-500">
                                {formatNumber(alert.count)} mục cần xử lý
                            </div>
                        </div>
                        {alert.href ? (
                            <a
                                href={alert.href}
                                className="text-sm text-sky-600 hover:text-sky-700"
                            >
                                Đi tới
                            </a>
                        ) : null}
                    </div>
                ))}
            </div>
        </Card>
    );
}

function AtRiskCustomers({ rows }) {
    if (!rows?.length)
        return <Empty label="Không có khách hàng có nguy cơ" />;
    return (
        <div className="space-y-3">
            {rows.map((row) => (
                <div
                    key={row.id}
                    className="flex items-start justify-between"
                >
                    <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-slate-500">
                            {row.email}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            Lần cuối: {row.lastOrderAt}
                        </div>
                    </div>
                    <span className="text-xs text-slate-500">
                        {row.totalOrders} đơn
                    </span>
                </div>
            ))}
        </div>
    );
}

// hàm mới
function CampaignsPanel({ campaigns }) {
    const { summary, flashsales, coupons } = campaigns || {};
    if (!flashsales?.length && !coupons?.length) {
        return <Card><Empty label="Chưa có dữ liệu chiến dịch" /></Card>;
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="font-semibold flex items-center gap-2">
                    <MdTrendingUp /> Chiến dịch & khuyến mãi
                </div>
                <div className="text-xs text-slate-500">
                    Tổng doanh thu từ chiến dịch: <span className="font-semibold">{formatVND(summary?.campaignRevenue || 0)}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Flash sale */}
                <div>
                    <div className="text-sm font-medium mb-2">Flash sale</div>
                    {!flashsales?.length ? (
                        <Empty label="Chưa có flash sale" />
                    ) : (
                        <div className="space-y-2 text-sm">
                            {flashsales.map(fs => (
                                <div key={fs.id} className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{fs.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {formatDateTime(fs.startTime)} → {formatDateTime(fs.endTime)}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs">
                                        <div>{fs.soldQuantity}/{fs.totalQuantity} sp ({formatPercent(fs.soldRate)})</div>
                                        <div className="font-semibold">{formatVND(fs.revenue)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Coupons */}
                <div>
                    <div className="text-sm font-medium mb-2">Mã giảm giá</div>
                    {!coupons?.length ? (
                        <Empty label="Chưa có mã được dùng" />
                    ) : (
                        <div className="space-y-2 text-sm">
                            {coupons.map(c => (
                                <div key={c.id} className="flex items-center justify-between">
                                    <div>
                                        <div className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">{c.code}</div>
                                        <div className="text-xs text-slate-500 truncate max-w-[200px]">
                                            {c.description || "Không mô tả"}
                                        </div>
                                    </div>
                                    <div className="text-right text-xs">
                                        <div>{c.uses} lượt dùng</div>
                                        <div className="font-semibold">{formatVND(c.revenue)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}


// ====== Main Page ======
export default function DashboardAdmin() {
    const [range, setRange] = useState(RANGE_OPTIONS[1].value);
    const { data, loading, error } = useDashboardData(range);

    const newOrders = useMemo(
        () =>
            data.summary.orders?.current
                ? formatNumber(data.summary.orders.current)
                : "0",
        [data.summary.orders?.current]
    );
    const totalRevenue = useMemo(
        () => formatVND(data.summary.revenue?.current ?? 0),
        [data.summary.revenue?.current]
    );
    const avgOrderValue = useMemo(
        () => formatVND(data.summary.avgOrderValue?.current ?? 0),
        [data.summary.avgOrderValue?.current]
    );
    const netRevenue = useMemo(
        () => formatVND(data.summary.netRevenue?.current ?? 0),
        [data.summary.netRevenue?.current]
    );
    const repeatRate = useMemo(
        () => formatPercent(data.summary.repeatCustomerRate?.current ?? 0),
        [data.summary.repeatCustomerRate?.current]
    );
    const fulfillmentTime = useMemo(
        () =>
            formatDurationHours(
                data.summary.fulfillmentTimeHours?.current ?? 0
            ),
        [data.summary.fulfillmentTimeHours?.current]
    );

    if (error) {
        return (
            <div className="p-6">
                <Card>
                    <div className="text-rose-600 font-medium">
                        Có lỗi khi tải dashboard
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                        {error}
                    </div>
                </Card>
            </div>
        );
    }



    return (
        <div className="p-6 space-y-6 bg-white dark:bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-slate-500 mt-1">
                        Tổng quan hoạt động cửa hàng sách
                    </p>
                    {data.range?.label && (
                        <p className="text-xs text-slate-400">
                            {data.range.label}
                        </p>
                    )}
                </div>
                <RangeSelector value={range} onChange={setRange} />
            </div>

            {/* Summary stats */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <LoadingSkeleton key={idx} className="h-28" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <StatCard
                            title="Doanh thu"
                            value={totalRevenue}
                            metric={data.summary.revenue}
                            icon={
                                <MdAttachMoney className="text-2xl text-emerald-600" />
                            }
                            foot="Tổng doanh thu trong khoảng thời gian đã chọn"
                        />
                        <StatCard
                            title="Số đơn"
                            value={newOrders}
                            metric={data.summary.orders}
                            icon={
                                <MdShoppingCart className="text-2xl text-sky-600" />
                            }
                            foot="Tổng số đơn hàng"
                        />
                        <StatCard
                            title="Giá trị trung bình"
                            value={avgOrderValue}
                            metric={data.summary.avgOrderValue}
                            icon={
                                <MdInsights className="text-2xl text-indigo-600" />
                            }
                            foot="Doanh thu / đơn"
                        />
                        <StatCard
                            title="Net revenue"
                            value={netRevenue}
                            metric={data.summary.netRevenue}
                            icon={
                                <MdBarChart className="text-2xl text-purple-600" />
                            }
                            foot="Loại trừ hoàn tiền"
                        />
                        <StatCard
                            title="Tỷ lệ khách quay lại"
                            value={repeatRate}
                            metric={data.summary.repeatCustomerRate}
                            icon={
                                <MdRepeat className="text-2xl text-amber-600" />
                            }
                            foot="So với kỳ trước"
                        />
                        <StatCard
                            title="Thời gian xử lý"
                            value={fulfillmentTime}
                            metric={data.summary.fulfillmentTimeHours}
                            icon={
                                <MdAccessTime className="text-2xl text-rose-600" />
                            }
                            foot="Từ đặt hàng tới hoàn tất"
                        />
                    </div>

                    {/* Secondary stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard
                            title="Khách hàng mới"
                            value={formatNumber(data.newCustomers)}
                            metric={{ deltaPercent: null }}
                            icon={
                                <MdGroup className="text-2xl text-indigo-600" />
                            }
                            foot="Số khách đăng ký trong kỳ"
                        />
                        <StatCard
                            title="Sản phẩm sắp hết"
                            value={formatNumber(data.lowStockCount)}
                            metric={{ deltaPercent: null }}
                            icon={<MdBook className="text-2xl text-rose-600" />}
                            foot="Tồn kho ≤ 5"
                        />
                    </div>
                </>
            )}

            {/* Alerts */}
            {loading ? (
                <LoadingSkeleton className="h-40" />
            ) : (
                <AlertsPanel alerts={data.alerts} />
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loading ? (
                    <LoadingSkeleton className="h-[360px]" />
                ) : (
                    <RevenueLineChart
                        current={data.revenueByDay}
                        previous={data.previousRevenueByDay}
                    />
                )}
                {loading ? (
                    <LoadingSkeleton className="h-[360px]" />
                ) : (
                    <OrderStatusPieChart data={data.orderStatusDist} />
                )}
            </div>


            {/* Product analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loading ? (
                    <LoadingSkeleton className="h-[360px]" />
                ) : (
                    <BarCard
                        title="Bán theo danh mục"
                        icon={
                            <MdBook className="text-xl text-sky-600" />
                        }
                        data={data.product.topCategories}
                        dataKey="qty"
                        emptyLabel="Chưa có doanh thu theo danh mục"
                    />
                )}
                {loading ? (
                    <LoadingSkeleton className="h-[360px]" />
                ) : (
                    <Card className="h-[360px]">
                        <div className="font-semibold flex items-center gap-2 mb-4">
                            <MdBarChart /> Doanh thu theo tác giả
                        </div>
                        {data.product.topAuthors?.length ? (
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.product.topAuthors}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="author"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            tickFormatter={(v) =>
                                                `${Math.round(
                                                    v / 1_000_000
                                                )}tr`
                                            }
                                        />
                                        <Tooltip
                                            formatter={(v) => formatVND(v)}
                                            contentStyle={{ borderRadius: 12 }}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            radius={[8, 8, 0, 0]}
                                            fill="#14B8A6"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <Empty label="Chưa có doanh thu theo tác giả" />
                        )}
                    </Card>
                )}
            </div>

            {/* Chiến dịch & khuyến mãi */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                {loading ? (
                    <LoadingSkeleton className="h-[260px]" />
                ) : (
                    <CampaignsPanel campaigns={data.campaigns} />
                )}
                {/* bên phải có thể để thêm 1 card khác (ví dụ: “Hiệu quả voucher”) */}
            </div>


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loading ? (
                    <LoadingSkeleton className="h-[320px]" />
                ) : (
                    <InventoryVelocityTable
                        rows={data.product.inventoryVelocity}
                    />
                )}
                {loading ? (
                    <LoadingSkeleton className="h-[320px]" />
                ) : (
                    <SlowMoversList rows={data.product.slowMovers} />
                )}
            </div>

            {/* Customer analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {loading ? (
                    <LoadingSkeleton className="h-[360px]" />
                ) : (
                    <CustomerCohortChart data={data.customers.cohorts} />
                )}
                {loading ? (
                    <LoadingSkeleton className="h-[360px]" />
                ) : (
                    <Card className="h-[360px]">
                        <div className="font-semibold mb-4">
                            Tình trạng khách hàng
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-slate-50">
                                <div className="text-xs text-slate-500">
                                    Khách quay lại trong kỳ
                                </div>
                                <div className="text-2xl font-semibold mt-1">
                                    {formatNumber(
                                        data.customers.repeatCustomers
                                    )}
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50">
                                <div className="text-xs text-slate-500">
                                    Khách chưa quay lại (inactive)
                                </div>
                                <div className="text-2xl font-semibold mt-1">
                                    {formatNumber(
                                        data.customers.inactiveCustomers
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <div className="font-semibold flex items-center gap-2 mb-2">
                                <MdRepeat /> Khách hàng cần chăm sóc
                            </div>
                            <AtRiskCustomers
                                rows={data.customers.atRiskCustomers}
                            />
                        </div>
                    </Card>
                )}
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 gap-6">
                {loading ? (
                    <LoadingSkeleton className="h-[280px]" />
                ) : (
                    <RecentOrdersTable rows={data.recentOrders} />
                )}
                {loading ? (
                    <LoadingSkeleton className="h-[220px]" />
                ) : (
                    <RecentReviews rows={data.recentReviews} />
                )}
            </div>


        </div>

    );
}

