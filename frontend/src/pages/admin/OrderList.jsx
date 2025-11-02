import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    MdSearch,
    MdDownload,
    MdAdd,
    MdFilterList,
    MdMenu,
    MdVisibility,
    MdEdit,
    MdDelete,
} from "react-icons/md";
import { toast } from "react-toastify";
import summaryApi, { authHeaders } from "../../common";

const toVND = (n) => (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const dateVN = (iso) => {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return "-";
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return "-";
    }
};

const STATUS_OPTIONS = [
    { value: "", label: "Tất cả" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded", label: "Refunded" },
];

const STATUS_BADGE = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    paid: "bg-sky-100 text-sky-700 border-sky-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
    delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
    refunded: "bg-purple-100 text-purple-700 border-purple-200",
};

const STATUS_LABEL = STATUS_OPTIONS.reduce((acc, cur) => {
    if (cur.value) acc[cur.value] = cur.label;
    return acc;
}, {});

const COL_KEY = "admin.orders.table.columns.v2";

const INITIAL_FILTERS = {
    status: "",
    dateFrom: "",
    dateTo: "",
};

export default function OrderList() {
    const location = useLocation();
    const navigate = useNavigate();

    const [query, setQuery] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get("q") || "";
    });
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState(() => ({ ...INITIAL_FILTERS }));
    const [filterDraft, setFilterDraft] = useState(() => ({ ...INITIAL_FILTERS }));
    const [openFilter, setOpenFilter] = useState(false);
    const filterBtnRef = useRef(null);
    const filterMenuRef = useRef(null);

    useEffect(() => {
        if (openFilter) {
            setFilterDraft({ ...filters });
        }
    }, [openFilter, filters]);

    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved
            ? JSON.parse(saved)
            : { orderId: true, customer: true, items: true, total: true, createdAt: true, status: true };
    });
    useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

    const [openColMenu, setOpenColMenu] = useState(false);
    const colBtnRef = useRef(null);
    const colMenuRef = useRef(null);

    useEffect(() => {
        if (openFilter) setOpenColMenu(false);
    }, [openFilter]);

    useEffect(() => {
        if (openColMenu) setOpenFilter(false);
    }, [openColMenu]);

    useEffect(() => {
        if (!openFilter) return undefined;

        function onClickOutside(e) {
            if (
                filterMenuRef.current &&
                !filterMenuRef.current.contains(e.target) &&
                filterBtnRef.current &&
                !filterBtnRef.current.contains(e.target)
            ) {
                setOpenFilter(false);
            }
        }
        function onEsc(e) {
            if (e.key === "Escape") setOpenFilter(false);
        }

        window.addEventListener("click", onClickOutside);
        window.addEventListener("keydown", onEsc);
        return () => {
            window.removeEventListener("click", onClickOutside);
            window.removeEventListener("keydown", onEsc);
        };
    }, [openFilter]);

    useEffect(() => {
        if (!openColMenu) return undefined;

        function onClickOutside(e) {
            if (
                colMenuRef.current &&
                !colMenuRef.current.contains(e.target) &&
                colBtnRef.current &&
                !colBtnRef.current.contains(e.target)
            ) {
                setOpenColMenu(false);
            }
        }
        function onEsc(e) {
            if (e.key === "Escape") setOpenColMenu(false);
        }

        window.addEventListener("click", onClickOutside);
        window.addEventListener("keydown", onEsc);
        return () => {
            window.removeEventListener("click", onClickOutside);
            window.removeEventListener("keydown", onEsc);
        };
    }, [openColMenu]);

    const syncQueryToUrl = useCallback(
        (value) => {
            const trimmed = value.trim();
            const params = new URLSearchParams(location.search);
            const current = params.get("q") || "";
            if (trimmed === current) return;
            if (trimmed) params.set("q", trimmed);
            else params.delete("q");
            navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
        },
        [location.pathname, location.search, navigate]
    );

    useEffect(() => {
        syncQueryToUrl(query);
    }, [query, syncQueryToUrl]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlQuery = params.get("q") || "";
        setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
    }, [location.search]);

    useEffect(() => {
        setPage(1);
    }, [query, filters.status, filters.dateFrom, filters.dateTo]);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const handler = (event) => {
            const nextValue = typeof event?.detail?.query === "string" ? event.detail.query : "";
            setQuery(nextValue);
            syncQueryToUrl(nextValue);
        };
        window.addEventListener("admin:search", handler);
        return () => window.removeEventListener("admin:search", handler);
    }, [syncQueryToUrl]);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        window.dispatchEvent(new CustomEvent("admin:search:reflect", { detail: { query } }));
    }, [query]);

    useEffect(() => {
        let ignore = false;
        const ctrl = new AbortController();

        (async () => {
            try {
                setLoading(true);
                const url = new URL(summaryApi.url(summaryApi.order.list));
                if (query.trim()) url.searchParams.set("q", query.trim());
                if (filters.status) url.searchParams.set("status", filters.status);
                if (filters.dateFrom) url.searchParams.set("from", filters.dateFrom);
                if (filters.dateTo) url.searchParams.set("to", filters.dateTo);
                url.searchParams.set("page", page);
                url.searchParams.set("limit", pageSize);

                const res = await fetch(url, {
                    headers: { Accept: "application/json", ...authHeaders() },
                    signal: ctrl.signal,
                });
                if (!res.ok) throw new Error(`Fetch orders failed: ${res.status}`);
                const json = await res.json();
                if (json && json.success === false) {
                    throw new Error(json.message || "Không tải được danh sách đơn hàng");
                }
                if (!ignore) {
                    const nextItems = json.items || [];
                    setOrders(Array.isArray(nextItems) ? nextItems : []);
                    setTotal(Number(json.total) || (Array.isArray(nextItems) ? nextItems.length : 0));
                }
            } catch (err) {
                if (err.name === "AbortError") return;
                console.error(err);
                if (!ignore) toast.error(err.message || "Không tải được danh sách đơn hàng");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();

        return () => {
            ignore = true;
            ctrl.abort();
        };
    }, [query, page, filters.status, filters.dateFrom, filters.dateTo]);

    const filteredOrders = useMemo(() => {
        const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const to = filters.dateTo ? new Date(filters.dateTo) : null;
        if (to) to.setHours(23, 59, 59, 999);
        return orders.filter((order) => {
            const placed = new Date(order.placed_at || order.created_at || 0);
            if (Number.isNaN(placed.getTime())) return true;
            if (from && placed < from) return false;
            if (to && placed > to) return false;
            return true;
        });
    }, [orders, filters.dateFrom, filters.dateTo]);

    const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / pageSize));

    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const headerCbRef = useRef(null);

    useEffect(() => {
        setSelectedIds(new Set());
    }, [orders, page, filters.status, filters.dateFrom, filters.dateTo, query]);

    useEffect(() => {
        const idsOnPage = filteredOrders.map((o) => o.id);
        const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
        if (headerCbRef.current) {
            headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
            headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
        }
    }, [filteredOrders, selectedIds]);

    const toggleSelectAllOnPage = (e) => {
        const checked = e.target.checked;
        const idsOnPage = filteredOrders.map((o) => o.id);
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) idsOnPage.forEach((id) => next.add(id));
            else idsOnPage.forEach((id) => next.delete(id));
            return next;
        });
    };

    const toggleRow = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleDelete = async (id) => {
        if (!confirm("Bạn chắc chắn muốn xóa đơn hàng này?")) return;
        try {
            const res = await fetch(summaryApi.url(summaryApi.order.delete(id)), {
                method: "DELETE",
                headers: { ...authHeaders() },
            });
            if (!res.ok) throw new Error(`Xóa thất bại: ${res.status}`);
            toast.success("Đã xóa đơn hàng");
            setOrders((prev) => prev.filter((o) => o.id !== id));
            setTotal((t) => Math.max(0, t - 1));
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (err) {
            console.error(err);
            toast.error("Có lỗi khi xóa đơn hàng");
        }
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) {
            toast.info("Chưa chọn đơn hàng nào.");
            return;
        }
        if (!confirm(`Xóa ${ids.length} đơn hàng đã chọn?`)) return;

        try {
            const results = await Promise.allSettled(
                ids.map((id) =>
                    fetch(summaryApi.url(summaryApi.order.delete(id)), {
                        method: "DELETE",
                        headers: { ...authHeaders() },
                    })
                )
            );
            const successIds = [];
            results.forEach((res, idx) => {
                if (res.status === "fulfilled" && res.value.ok) successIds.push(ids[idx]);
            });
            if (successIds.length) {
                toast.success(`Đã xóa ${successIds.length}/${ids.length} đơn hàng`);
                setOrders((prev) => prev.filter((o) => !successIds.includes(o.id)));
                setTotal((t) => Math.max(0, t - successIds.length));
            } else {
                toast.error("Không xóa được đơn hàng nào");
            }
            setSelectedIds(new Set());
        } catch (err) {
            console.error(err);
            toast.error("Có lỗi khi xóa hàng loạt");
        }
    };

    const handleExportCSV = () => {
        if (!filteredOrders.length) {
            toast.info("Không có dữ liệu để export");
            return;
        }
        const headers = [
            "ID",
            "Customer Name",
            "Customer Email",
            "Subtotal",
            "Discount",
            "Shipping Fee",
            "Grand Total",
            "Status",
            "Placed At",
        ];
        const rows = filteredOrders.map((o) => [
            o.id,
            `"${String(o.customer_name || "").replace(/"/g, '""')}"`,
            `"${String(o.customer_email || "").replace(/"/g, '""')}"`,
            Number(o.subtotal) || 0,
            Number(o.discount_total) || 0,
            Number(o.shipping_fee) || 0,
            Number(o.grand_total) || 0,
            STATUS_LABEL[o.status] || o.status || "",
            dateVN(o.placed_at || o.created_at),
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "orders.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const applyFilters = (e) => {
        e.preventDefault();
        if (filterDraft.dateFrom && filterDraft.dateTo) {
            const from = new Date(filterDraft.dateFrom);
            const to = new Date(filterDraft.dateTo);
            if (from > to) {
                toast.error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
                return;
            }
        }
        setFilters({ ...filterDraft });
        setOpenFilter(false);
    };

    const clearFilters = () => {
        setFilters({ ...INITIAL_FILTERS });
        setFilterDraft({ ...INITIAL_FILTERS });
        setOpenFilter(false);
    };

    const activeFilterCount = useMemo(() => {
        return [filters.status, filters.dateFrom, filters.dateTo].filter(Boolean).length;
    }, [filters]);

    const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + filteredOrders.length);
    const hasLocalDateFilter = Boolean(filters.dateFrom || filters.dateTo);
    const columnCount = 2 + Object.values(showCols).filter(Boolean).length;

    return (
        <div className="space-y-5">
            {/* Header actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Orders</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50"
                    >
                        <MdDownload /> Export
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                        <MdDelete /> Xóa đã chọn
                    </button>
                    <Link
                        to="/admin/orders-add"
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        <MdAdd /> Tạo đơn
                    </Link>
                </div>
            </div>

            {/* Search + Filters + Col toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MdSearch />
                    </span>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm theo mã đơn, khách hàng…"
                        className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                syncQueryToUrl(query);
                            }
                        }}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Filters */}
                    <div className="relative">
                        <button
                            ref={filterBtnRef}
                            onClick={() => setOpenFilter((v) => !v)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50"
                            aria-expanded={openFilter}
                        >
                            <MdFilterList /> Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-medium text-white">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                        {openFilter && (
                            <form
                                ref={filterMenuRef}
                                onSubmit={applyFilters}
                                className="absolute right-0 z-20 mt-2 w-72 space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
                            >
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-600">Trạng thái</label>
                                    <select
                                        value={filterDraft.status}
                                        onChange={(e) => setFilterDraft((prev) => ({ ...prev, status: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {STATUS_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-600">Từ ngày</label>
                                        <input
                                            type="date"
                                            value={filterDraft.dateFrom}
                                            onChange={(e) => setFilterDraft((prev) => ({ ...prev, dateFrom: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-600">Đến ngày</label>
                                        <input
                                            type="date"
                                            value={filterDraft.dateTo}
                                            onChange={(e) => setFilterDraft((prev) => ({ ...prev, dateTo: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                    >
                                        Xóa lọc
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setOpenFilter(false)}
                                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                                        >
                                            Đóng
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Column toggle */}
                    <div className="relative">
                        <button
                            ref={colBtnRef}
                            onClick={() => setOpenColMenu((v) => !v)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 hover:bg-gray-50"
                            aria-expanded={openColMenu}
                            title="Chọn cột hiển thị"
                        >
                            <MdMenu />
                        </button>
                        {openColMenu && (
                            <div
                                ref={colMenuRef}
                                className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
                            >
                                <div className="mb-2 text-sm font-medium text-gray-600">Cột hiển thị</div>
                                <div className="space-y-2">
                                    {[
                                        { key: "orderId", label: "Order ID" },
                                        { key: "customer", label: "Khách hàng" },
                                        { key: "items", label: "Số lượng SP" },
                                        { key: "total", label: "Giá trị" },
                                        { key: "createdAt", label: "Ngày tạo" },
                                        { key: "status", label: "Trạng thái" },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={showCols[key]}
                                                onChange={(e) => setShowCols((prev) => ({ ...prev, [key]: e.target.checked }))}
                                                className="accent-blue-600"
                                            />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="w-12 p-0">
                                    <div className="flex h-12 items-center justify-center">
                                        <input
                                            ref={headerCbRef}
                                            type="checkbox"
                                            onChange={toggleSelectAllOnPage}
                                            className="accent-blue-600"
                                        />
                                    </div>
                                </th>
                                {showCols.orderId && <th className="p-3 text-left">Mã đơn hàng</th>}
                                {showCols.customer && <th className="p-3 text-left">Khách hàng</th>}
                                {showCols.items && <th className="p-3 text-left">Số lượng SP</th>}
                                {showCols.total && <th className="p-3 text-left">Giá trị</th>}
                                {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
                                {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
                                <th className="w-28 p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={columnCount} className="p-8 text-center text-gray-500">
                                        Đang tải dữ liệu…
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={columnCount} className="p-8 text-center text-gray-500">
                                        Không có đơn hàng nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const checked = selectedIds.has(order.id);
                                    const statusKey = order.status?.toLowerCase?.() || order.status;
                                    const badge = STATUS_BADGE[statusKey] || "bg-gray-100 text-gray-700 border-gray-200";
                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="w-12 p-0">
                                                <div className="flex h-16 items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleRow(order.id)}
                                                        className="accent-blue-600"
                                                    />
                                                </div>
                                            </td>
                                            {showCols.orderId && (
                                                <td className="p-3 font-medium">
                                                    <Link to={`/admin/orders-detail/${order.id}`} className="hover:underline">
                                                        {order.id}
                                                    </Link>
                                                </td>
                                            )}
                                            {showCols.customer && (
                                                <td className="p-3">
                                                    <div className="font-medium">{order.customer_name || "-"}</div>
                                                    <div className="text-xs text-gray-500">{order.customer_email || "-"}</div>
                                                </td>
                                            )}
                                            {showCols.items && (
                                                <td className="p-3">{order.items_count ?? order.items?.length ?? "-"}</td>
                                            )}
                                            {showCols.total && (
                                                <td className="p-3 font-medium text-emerald-600">
                                                    {toVND(order.grand_total ?? order.total_amount ?? 0)}
                                                </td>
                                            )}
                                            {showCols.createdAt && (
                                                <td className="p-3">{dateVN(order.placed_at || order.created_at)}</td>
                                            )}
                                            {showCols.status && (
                                                <td className="p-3">
                                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge}`}>
                                                        {STATUS_LABEL[statusKey] || order.status || "-"}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/admin/orders-detail/${order.id}`}
                                                        className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100"
                                                        title="Xem chi tiết"
                                                    >
                                                        <MdVisibility />
                                                    </Link>
                                                    <Link
                                                        to={`/admin/orders-edit/${order.id}`}
                                                        className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100"
                                                        title="Sửa"
                                                    >
                                                        <MdEdit />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(order.id)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-red-600 hover:bg-gray-100"
                                                        title="Xóa"
                                                    >
                                                        <MdDelete />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {total > 0 ? (
                            hasLocalDateFilter ? (
                                <>Đang hiển thị {filteredOrders.length} đơn trong trang hiện tại / {total}</>
                            ) : (
                                <>Đang hiển thị {pageStart}–{pageEnd} / {total}</>
                            )
                        ) : (
                            <>Không có dữ liệu</>
                        )}
                        {activeFilterCount > 0 && total > 0 && (
                            <span className="ml-2 text-xs text-gray-500">(Đang áp dụng {activeFilterCount} bộ lọc)</span>
                        )}
                        {hasLocalDateFilter && (
                            <div className="text-xs text-gray-400">* Lọc theo ngày áp dụng trên danh sách đang hiển thị.</div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            ←
                        </button>
                        <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-white">{page}</span>
                        <button
                            className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


//code goc
// // import React, { useEffect, useMemo, useRef, useState } from "react";
// // import { Link } from "react-router-dom";
// // import {
// //     MdSearch, MdDownload, MdAdd, MdFilterList, MdMenu,
// //     MdVisibility, MdEdit, MdDelete,
// // } from "react-icons/md";

// // // ===== Mock data (sau thay bằng API thật) =====
// // const MOCK_ORDERS = [
// //     {
// //         id: "ODR-10001",
// //         customer: { name: "Nguyễn Văn A", email: "a.nguyen@example.com" },
// //         itemsCount: 3,
// //         total: 589000,
// //         status: "Pending",
// //         created_at: "2025-09-01T10:20:00Z",
// //     },
// //     {
// //         id: "ODR-10002",
// //         customer: { name: "Trần B", email: "tranb@example.com" },
// //         itemsCount: 2,
// //         total: 410000,
// //         status: "Processing",
// //         created_at: "2025-09-02T08:45:00Z",
// //     },
// //     {
// //         id: "ODR-10003",
// //         customer: { name: "Lê C", email: "lec@example.com" },
// //         itemsCount: 5,
// //         total: 1250000,
// //         status: "Completed",
// //         created_at: "2025-09-03T12:10:00Z",
// //     },
// //     {
// //         id: "ODR-10004",
// //         customer: { name: "Phạm D", email: "pham.d@example.com" },
// //         itemsCount: 1,
// //         total: 199000,
// //         status: "Canceled",
// //         created_at: "2025-09-04T09:05:00Z",
// //     },
// // ];

// // const toVND = (n) => n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
// // const dateVN = (iso) => {
// //     try {
// //         const d = new Date(iso);
// //         return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
// //     } catch { return "-"; }
// // };

// // const STATUS_BADGE = {
// //     Pending: "bg-amber-100 text-amber-700 border-amber-200",
// //     Processing: "bg-blue-100 text-blue-700 border-blue-200",
// //     Shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
// //     Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
// //     Canceled: "bg-red-100 text-red-700 border-red-200",
// // };

// // const COL_KEY = "admin.orders.table.columns.v2";

// // export default function OrderList() {
// //     // tìm kiếm & phân trang
// //     const [query, setQuery] = useState("");
// //     const [page, setPage] = useState(1);
// //     const pageSize = 7;

// //     // Toggle Columns (nhớ bằng localStorage)
// //     const [showCols, setShowCols] = useState(() => {
// //         const saved = localStorage.getItem(COL_KEY);
// //         return saved
// //             ? JSON.parse(saved)
// //             : { orderId: true, customer: true, items: true, total: true, createdAt: true, status: true };
// //     });
// //     useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

// //     // Dropdown Toggle Columns
// //     const [openColMenu, setOpenColMenu] = useState(false);
// //     const colBtnRef = useRef(null);
// //     const colMenuRef = useRef(null);
// //     useEffect(() => {
// //         function onClickOutside(e) {
// //             if (!openColMenu) return;
// //             if (
// //                 colMenuRef.current && !colMenuRef.current.contains(e.target) &&
// //                 colBtnRef.current && !colBtnRef.current.contains(e.target)
// //             ) setOpenColMenu(false);
// //         }
// //         function onEsc(e) { if (e.key === "Escape") setOpenColMenu(false); }
// //         window.addEventListener("click", onClickOutside);
// //         window.addEventListener("keydown", onEsc);
// //         return () => { window.removeEventListener("click", onClickOutside); window.removeEventListener("keydown", onEsc); };
// //     }, [openColMenu]);

// //     // Filter
// //     const filtered = useMemo(() => {
// //         const q = query.trim().toLowerCase();
// //         if (!q) return MOCK_ORDERS;
// //         return MOCK_ORDERS.filter((o) =>
// //             o.id.toLowerCase().includes(q) ||
// //             o.customer.name.toLowerCase().includes(q) ||
// //             o.customer.email.toLowerCase().includes(q) ||
// //             o.status.toLowerCase().includes(q)
// //         );
// //     }, [query]);

// //     // Pagination
// //     const total = filtered.length;
// //     const totalPages = Math.max(1, Math.ceil(total / pageSize));
// //     const list = filtered.slice((page - 1) * pageSize, page * pageSize);
// //     useEffect(() => setPage(1), [query]);

// //     // Select all theo trang + indeterminate
// //     const [selectedIds, setSelectedIds] = useState(() => new Set());
// //     const headerCbRef = useRef(null);
// //     useEffect(() => {
// //         const idsOnPage = list.map((o) => o.id);
// //         const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
// //         if (headerCbRef.current) {
// //             headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
// //             headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
// //         }
// //     }, [list, selectedIds]);

// //     const toggleSelectAllOnPage = (e) => {
// //         const checked = e.target.checked;
// //         const idsOnPage = list.map((o) => o.id);
// //         setSelectedIds((prev) => {
// //             const next = new Set(prev);
// //             if (checked) idsOnPage.forEach((id) => next.add(id));
// //             else idsOnPage.forEach((id) => next.delete(id));
// //             return next;
// //         });
// //     };
// //     const toggleRow = (id) => {
// //         setSelectedIds((prev) => {
// //             const next = new Set(prev);
// //             next.has(id) ? next.delete(id) : next.add(id);
// //             return next;
// //         });
// //     };

// //     const handleDelete = (id) => {
// //         if (confirm("Bạn chắc chắn muốn xóa đơn hàng này?")) {
// //             console.log("Delete order:", id);
// //             // TODO: API delete -> reload
// //             setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
// //         }
// //     };

// //     return (
// //         <div className="space-y-5">
// //             {/* Hàng 1: Title + Export + Add */}
// //             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
// //                 <h1 className="text-2xl font-bold">Orders</h1>
// //                 <div className="flex items-center gap-2">
// //                     <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
// //                         <MdDownload /> Export
// //                     </button>
// //                     <Link
// //                         to="/admin/orders/create"
// //                         className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
// //                     >
// //                         <MdAdd /> Tạo đơn
// //                     </Link>
// //                 </div>
// //             </div>

// //             {/* Hàng 2: Search + Filters + Toggle Columns */}
// //             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
// //                 <div className="relative w-full sm:w-96">
// //                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MdSearch /></span>
// //                     <input
// //                         value={query}
// //                         onChange={(e) => setQuery(e.target.value)}
// //                         placeholder="Tìm theo mã đơn, khách hàng, trạng thái…"
// //                         className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
// //                     />
// //                 </div>

// //                 <div className="flex items-center gap-2">
// //                     <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
// //                         <MdFilterList /> Filters
// //                     </button>

// //                     <div className="relative">
// //                         <button
// //                             ref={colBtnRef}
// //                             onClick={() => setOpenColMenu((v) => !v)}
// //                             className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
// //                             title="Chọn cột hiển thị"
// //                             aria-expanded={openColMenu}
// //                         >
// //                             <MdMenu />
// //                         </button>

// //                         {openColMenu && (
// //                             <div
// //                                 ref={colMenuRef}
// //                                 className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-3 z-10"
// //                             >
// //                                 <div className="font-medium mb-2">Toggle Columns</div>
// //                                 <div className="space-y-2">
// //                                     {[
// //                                         { key: "orderId", label: "Order ID" },
// //                                         { key: "customer", label: "Customer" },
// //                                         { key: "items", label: "Items" },
// //                                         { key: "total", label: "Total" },
// //                                         { key: "createdAt", label: "Created At" },
// //                                         { key: "status", label: "Status" },
// //                                     ].map(({ key, label }) => (
// //                                         <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
// //                                             <input
// //                                                 type="checkbox"
// //                                                 className="accent-blue-600"
// //                                                 checked={showCols[key]}
// //                                                 onChange={(e) => setShowCols((s) => ({ ...s, [key]: e.target.checked }))}
// //                                             />
// //                                             <span>{label}</span>
// //                                         </label>
// //                                     ))}
// //                                 </div>
// //                             </div>
// //                         )}
// //                     </div>
// //                 </div>
// //             </div>

// //             {/* Bảng */}
// //             <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
// //                 <div className="overflow-x-auto">
// //                     <table className="min-w-full text-sm">
// //                         <thead className="bg-gray-100 text-gray-600">
// //                             <tr>
// //                                 <th className="w-12 p-0">
// //                                     <div className="h-12 flex items-center justify-center">
// //                                         <input
// //                                             ref={headerCbRef}
// //                                             type="checkbox"
// //                                             className="accent-blue-600"
// //                                             onChange={toggleSelectAllOnPage}
// //                                         />
// //                                     </div>
// //                                 </th>
// //                                 {showCols.orderId && <th className="p-3 text-left">Mã đơn hàng</th>}
// //                                 {showCols.customer && <th className="p-3 text-left">Khách hàng</th>}
// //                                 {showCols.items && <th className="p-3 text-left">Số lượng</th>}
// //                                 {showCols.total && <th className="p-3 text-left">Giá trị</th>}
// //                                 {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
// //                                 {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
// //                                 <th className="w-28 p-3 text-right">Actions</th>
// //                             </tr>
// //                         </thead>

// //                         <tbody className="divide-y">
// //                             {list.map((o) => {
// //                                 const checked = selectedIds.has(o.id);
// //                                 return (
// //                                     <tr key={o.id} className="hover:bg-gray-50">
// //                                         {/* checkbox row */}
// //                                         <td className="w-12 p-0">
// //                                             <div className="h-16 flex items-center justify-center">
// //                                                 <input
// //                                                     type="checkbox"
// //                                                     className="accent-blue-600"
// //                                                     checked={checked}
// //                                                     onChange={() => toggleRow(o.id)}
// //                                                 />
// //                                             </div>
// //                                         </td>

// //                                         {showCols.orderId && (
// //                                             <td className="p-3 align-middle">
// //                                                 <Link to={`/admin/orders/${o.id}`} className="font-medium hover:underline">
// //                                                     {o.id}
// //                                                 </Link>
// //                                             </td>
// //                                         )}

// //                                         {showCols.customer && (
// //                                             <td className="p-3 align-middle">
// //                                                 <div className="font-medium">{o.customer.name}</div>
// //                                                 <div className="text-xs text-gray-500">{o.customer.email}</div>
// //                                             </td>
// //                                         )}

// //                                         {showCols.items && (
// //                                             <td className="p-3 align-middle">{o.itemsCount}</td>
// //                                         )}

// //                                         {showCols.total && (
// //                                             <td className="p-3 align-middle font-medium">{toVND(o.total)}</td>
// //                                         )}

// //                                         {showCols.createdAt && (
// //                                             <td className="p-3 align-middle">{dateVN(o.created_at)}</td>
// //                                         )}

// //                                         {showCols.status && (
// //                                             <td className="p-3 align-middle">
// //                                                 <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${STATUS_BADGE[o.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
// //                                                     {o.status}
// //                                                 </span>
// //                                             </td>
// //                                         )}

// //                                         <td className="p-3 align-middle">
// //                                             <div className="flex items-center justify-end gap-2">
// //                                                 <Link
// //                                                     to={`/admin/orders/${o.id}`}
// //                                                     className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
// //                                                     title="Xem chi tiết"
// //                                                 >
// //                                                     <MdVisibility />
// //                                                 </Link>
// //                                                 <Link
// //                                                     to={`/admin/orders/${o.id}/edit`}
// //                                                     className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
// //                                                     title="Sửa"
// //                                                 >
// //                                                     <MdEdit />
// //                                                 </Link>
// //                                                 <button
// //                                                     onClick={() => handleDelete(o.id)}
// //                                                     className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
// //                                                     title="Xóa"
// //                                                 >
// //                                                     <MdDelete />
// //                                                 </button>
// //                                             </div>
// //                                         </td>
// //                                     </tr>
// //                                 );
// //                             })}

// //                             {list.length === 0 && (
// //                                 <tr>
// //                                     <td colSpan={8} className="p-8 text-center text-gray-500">Không có đơn hàng nào.</td>
// //                                 </tr>
// //                             )}
// //                         </tbody>
// //                     </table>
// //                 </div>

// //                 {/* Pagination */}
// //                 <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
// //                     <div className="text-sm text-gray-500">
// //                         Đang hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
// //                     </div>
// //                     <div className="flex items-center gap-2">
// //                         <button
// //                             className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
// //                             onClick={() => setPage((p) => Math.max(1, p - 1))}
// //                             disabled={page === 1}
// //                         >←</button>
// //                         <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">{page}</span>
// //                         <button
// //                             className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
// //                             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
// //                             disabled={page === totalPages}
// //                         >→</button>
// //                     </div>
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // }

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//     MdSearch, MdDownload, MdAdd, MdFilterList, MdMenu,
//     MdVisibility, MdEdit, MdDelete,
// } from "react-icons/md";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// const toVND = (n) => (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });
// const dateVN = (iso) => {
//     try {
//         const d = new Date(iso);
//         return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
//     } catch { return "-"; }
// };

// const STATUS_BADGE = {
//     Pending: "bg-amber-100 text-amber-700 border-amber-200",
//     Processing: "bg-blue-100 text-blue-700 border-blue-200",
//     Shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
//     Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
//     Canceled: "bg-red-100 text-red-700 border-red-200",
// };

// const COL_KEY = "admin.orders.table.columns.v2";

// export default function OrderList() {
//     // state
//     const [query, setQuery] = useState("");
//     const [page, setPage] = useState(1);
//     const pageSize = 7;

//     const [orders, setOrders] = useState([]);
//     const [total, setTotal] = useState(0);
//     const [loading, setLoading] = useState(false);

//     // toggle columns
//     const [showCols, setShowCols] = useState(() => {
//         const saved = localStorage.getItem(COL_KEY);
//         return saved
//             ? JSON.parse(saved)
//             : { orderId: true, customer: true, items: true, total: true, createdAt: true, status: true };
//     });
//     useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

//     // column chooser
//     const [openColMenu, setOpenColMenu] = useState(false);
//     const colBtnRef = useRef(null);
//     const colMenuRef = useRef(null);
//     useEffect(() => {
//         function onClickOutside(e) {
//             if (!openColMenu) return;
//             if (colMenuRef.current && !colMenuRef.current.contains(e.target) &&
//                 colBtnRef.current && !colBtnRef.current.contains(e.target)) {
//                 setOpenColMenu(false);
//             }
//         }
//         function onEsc(e) { if (e.key === "Escape") setOpenColMenu(false); }
//         window.addEventListener("click", onClickOutside);
//         window.addEventListener("keydown", onEsc);
//         return () => {
//             window.removeEventListener("click", onClickOutside);
//             window.removeEventListener("keydown", onEsc);
//         };
//     }, [openColMenu]);

//     // fetch list
//     useEffect(() => {
//         let ignore = false;
//         (async () => {
//             try {
//                 setLoading(true);
//                 const url = new URL(summaryApi.url(summaryApi.order.list));
//                 if (query.trim()) url.searchParams.set("q", query.trim());
//                 url.searchParams.set("page", page);
//                 url.searchParams.set("limit", pageSize);
//                 const res = await fetch(url);
//                 if (!res.ok) throw new Error("Fetch orders failed");
//                 const json = await res.json();
//                 if (!ignore) {
//                     setOrders(json.items || []);
//                     setTotal(json.total || 0);
//                 }
//             } catch (err) {
//                 console.error(err);
//                 toast.error("Không tải được danh sách đơn hàng");
//             } finally {
//                 if (!ignore) setLoading(false);
//             }
//         })();
//         return () => { ignore = true; };
//     }, [query, page]);

//     const totalPages = Math.max(1, Math.ceil(total / pageSize));

//     // selection
//     const [selectedIds, setSelectedIds] = useState(() => new Set());
//     const headerCbRef = useRef(null);
//     useEffect(() => {
//         const idsOnPage = orders.map((o) => o.id);
//         const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
//         if (headerCbRef.current) {
//             headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
//             headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
//         }
//     }, [orders, selectedIds]);

//     const toggleSelectAllOnPage = (e) => {
//         const checked = e.target.checked;
//         const idsOnPage = orders.map((o) => o.id);
//         setSelectedIds((prev) => {
//             const next = new Set(prev);
//             if (checked) idsOnPage.forEach((id) => next.add(id));
//             else idsOnPage.forEach((id) => next.delete(id));
//             return next;
//         });
//     };
//     const toggleRow = (id) => {
//         setSelectedIds((prev) => {
//             const next = new Set(prev);
//             next.has(id) ? next.delete(id) : next.add(id);
//             return next;
//         });
//     };

//     // delete single
//     const handleDelete = async (id) => {
//         if (!confirm("Bạn chắc chắn muốn xóa đơn hàng này?")) return;
//         try {
//             const res = await fetch(summaryApi.url(summaryApi.order.delete(id)), { method: "DELETE" });
//             if (!res.ok) throw new Error(`Xóa thất bại: ${res.status}`);
//             toast.success("Đã xóa đơn hàng");
//             setOrders((prev) => prev.filter((o) => o.id !== id));
//             setTotal((t) => Math.max(0, t - 1));
//         } catch (err) {
//             console.error(err);
//             toast.error("Có lỗi khi xóa đơn hàng");
//         }
//     };

//     // bulk delete
//     const handleBulkDelete = async () => {
//         const ids = Array.from(selectedIds);
//         if (ids.length === 0) {
//             toast.info("Chưa chọn đơn hàng nào.");
//             return;
//         }
//         if (!confirm(`Xóa ${ids.length} đơn hàng đã chọn?`)) return;

//         try {
//             let okCount = 0;
//             for (const id of ids) {
//                 const res = await fetch(summaryApi.url(summaryApi.order.delete(id)), { method: "DELETE" });
//                 if (res.ok) okCount++;
//             }
//             toast.success(`Đã xóa ${okCount}/${ids.length} đơn hàng`);
//             setOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
//             setTotal((t) => Math.max(0, t - okCount));
//             setSelectedIds(new Set());
//         } catch (e) {
//             console.error(e);
//             toast.error("Có lỗi khi xóa hàng loạt");
//         }
//     };

//     // export CSV
//     const handleExportCSV = () => {
//         if (!orders.length) {
//             toast.info("Không có dữ liệu để export");
//             return;
//         }
//         const headers = ["ID", "Customer Name", "Customer Email", "Items", "Total", "Status", "Created At"];
//         const rows = orders.map((o) => [
//             o.id,
//             `"${(o.customer_name || "").replace(/"/g, '""')}"`,
//             `"${(o.customer_email || "").replace(/"/g, '""')}"`,
//             o.itemsCount ?? o.items?.length ?? 0,
//             o.total_amount,
//             o.status,
//             dateVN(o.created_at),
//         ]);
//         const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
//         const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "orders.csv";
//         a.click();
//         URL.revokeObjectURL(url);
//     };

//     return (
//         <div className="space-y-5">
//             {/* Header actions */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <h1 className="text-2xl font-bold">Orders</h1>
//                 <div className="flex items-center gap-2">
//                     <button onClick={handleExportCSV}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
//                         <MdDownload /> Export
//                     </button>
//                     <button onClick={handleBulkDelete}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-red-50 hover:bg-red-100 text-red-600">
//                         <MdDelete /> Xóa đã chọn
//                     </button>
//                     <Link
//                         to="/admin/orders-add"
//                         className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
//                     >
//                         <MdAdd /> Tạo đơn
//                     </Link>
//                 </div>
//             </div>

//             {/* Search + Filters + Col toggle */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <div className="relative w-full sm:w-96">
//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MdSearch /></span>
//                     <input
//                         value={query}
//                         onChange={(e) => setQuery(e.target.value)}
//                         placeholder="Tìm theo mã đơn, khách hàng, trạng thái…"
//                         className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
//                     />
//                 </div>

//                 <div className="flex items-center gap-2">
//                     <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:bg-gray-50">
//                         <MdFilterList /> Filters
//                     </button>
//                     {/* col toggle */}
//                     <div className="relative">
//                         <button
//                             ref={colBtnRef}
//                             onClick={() => setOpenColMenu(v => !v)}
//                             className="p-2 rounded-lg border bg-white hover:bg-gray-50"
//                             aria-expanded={openColMenu}
//                         >
//                             <MdMenu />
//                         </button>
//                         {openColMenu && (
//                             <div ref={colMenuRef}
//                                 className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-3 z-10">
//                                 <div className="font-medium mb-2">Toggle Columns</div>
//                                 {[
//                                     { key: "orderId", label: "Order ID" },
//                                     { key: "customer", label: "Customer" },
//                                     { key: "items", label: "Items" },
//                                     { key: "total", label: "Total" },
//                                     { key: "createdAt", label: "Created At" },
//                                     { key: "status", label: "Status" },
//                                 ].map(({ key, label }) => (
//                                     <label key={key} className="flex items-center gap-2 text-sm">
//                                         <input
//                                             type="checkbox"
//                                             checked={showCols[key]}
//                                             onChange={(e) => setShowCols(s => ({ ...s, [key]: e.target.checked }))}
//                                             className="accent-blue-600"
//                                         />
//                                         <span>{label}</span>
//                                     </label>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="bg-white rounded-xl shadow border overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm">
//                         <thead className="bg-gray-100 text-gray-600">
//                             <tr>
//                                 <th className="w-12 p-0">
//                                     <div className="h-12 flex items-center justify-center">
//                                         <input
//                                             ref={headerCbRef}
//                                             type="checkbox"
//                                             onChange={toggleSelectAllOnPage}
//                                             className="accent-blue-600"
//                                         />
//                                     </div>
//                                 </th>
//                                 {showCols.orderId && <th className="p-3 text-left">Mã đơn hàng</th>}
//                                 {showCols.customer && <th className="p-3 text-left">Khách hàng</th>}
//                                 {showCols.items && <th className="p-3 text-left">Số lượng</th>}
//                                 {showCols.total && <th className="p-3 text-left">Giá trị</th>}
//                                 {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
//                                 {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
//                                 <th className="w-28 p-3 text-right">Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y">
//                             {loading ? (
//                                 <tr><td colSpan={8} className="p-8 text-center">Đang tải…</td></tr>
//                             ) : orders.length === 0 ? (
//                                 <tr><td colSpan={8} className="p-8 text-center">Không có đơn hàng nào.</td></tr>
//                             ) : (
//                                 orders.map((o) => {
//                                     const checked = selectedIds.has(o.id);
//                                     return (
//                                         <tr key={o.id} className="hover:bg-gray-50">
//                                             <td className="w-12 p-0">
//                                                 <div className="h-16 flex items-center justify-center">
//                                                     <input
//                                                         type="checkbox"
//                                                         checked={checked}
//                                                         onChange={() => toggleRow(o.id)}
//                                                         className="accent-blue-600"
//                                                     />
//                                                 </div>
//                                             </td>
//                                             {showCols.orderId && (
//                                                 <td className="p-3">
//                                                     <Link to={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.id}</Link>
//                                                 </td>
//                                             )}
//                                             {showCols.customer && (
//                                                 <td className="p-3">
//                                                     <div className="font-medium">{o.customer_name}</div>
//                                                     <div className="text-xs text-gray-500">{o.customer_email}</div>
//                                                 </td>
//                                             )}
//                                             {showCols.items && (
//                                                 <td className="p-3">{o.itemsCount ?? o.items?.length ?? 0}</td>
//                                             )}
//                                             {showCols.total && (
//                                                 <td className="p-3 font-medium">{toVND(o.total_amount)}</td>
//                                             )}
//                                             {showCols.createdAt && (
//                                                 <td className="p-3">{dateVN(o.created_at)}</td>
//                                             )}
//                                             {showCols.status && (
//                                                 <td className="p-3">
//                                                     <span className={`px-2 py-0.5 rounded-full border text-xs ${STATUS_BADGE[o.status] || ""}`}>
//                                                         {o.status}
//                                                     </span>
//                                                 </td>
//                                             )}
//                                             <td className="p-3 text-right">
//                                                 <div className="flex items-center justify-end gap-2">
//                                                     <Link to={`/admin/orders/${o.id}`} className="w-9 h-9 flex items-center justify-center border rounded-md hover:bg-gray-100">
//                                                         <MdVisibility />
//                                                     </Link>
//                                                     <Link to={`/admin/orders/${o.id}/edit`} className="w-9 h-9 flex items-center justify-center border rounded-md hover:bg-gray-100">
//                                                         <MdEdit />
//                                                     </Link>
//                                                     <button onClick={() => handleDelete(o.id)}
//                                                         className="w-9 h-9 flex items-center justify-center border rounded-md hover:bg-gray-100 text-red-600">
//                                                         <MdDelete />
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     );
//                                 })
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* pagination */}
//                 <div className="flex items-center justify-between px-4 py-3 border-t">
//                     <div className="text-sm text-gray-500">
//                         {total > 0 ? (
//                             <>Đang hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}</>
//                         ) : <>Không có dữ liệu</>}
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <button
//                             className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
//                             onClick={() => setPage(p => Math.max(1, p - 1))}
//                             disabled={page === 1}
//                         >←</button>
//                         <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">{page}</span>
//                         <button
//                             className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
//                             onClick={() => setPage(p => Math.min(totalPages, p + 1))}
//                             disabled={page === totalPages}
//                         >→</button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
