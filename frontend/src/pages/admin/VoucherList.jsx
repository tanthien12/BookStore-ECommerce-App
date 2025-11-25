// src/pages/admin/VoucherList.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    MdSearch,
    MdAdd,
    MdFilterList,
    MdEdit,
    MdDelete,
    MdMenu,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import summaryApi, { authHeaders } from "../../common";

// Helpers
const toVND = (n) =>
    (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

function dateVN(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleString("vi-VN");
    } catch {
        return "-";
    }
}

const COL_KEY = "admin.coupons.table.columns";

export default function VoucherList() {
    const nav = useNavigate();

    // Search + Filters
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [openFilter, setOpenFilter] = useState(false);
    const filterBtnRef = useRef(null);
    const filterMenuRef = useRef(null);
    const [filterDraft, setFilterDraft] = useState({ status: "" });

    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 7;
    const [total, setTotal] = useState(0);

    // Column chooser
    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved
            ? JSON.parse(saved)
            : {
                code: true,
                type: true,
                value: true,
                minOrder: true,
                usage: true,
                time: true,
                status: true,
            };
    });
    useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

    const [openColMenu, setOpenColMenu] = useState(false);
    const colBtnRef = useRef(null);
    const colMenuRef = useRef(null);

    useEffect(() => {
        if (!openFilter) return undefined;
        const onClickOutside = (e) => {
            if (
                filterMenuRef.current &&
                !filterMenuRef.current.contains(e.target) &&
                filterBtnRef.current &&
                !filterBtnRef.current.contains(e.target)
            ) {
                setOpenFilter(false);
            }
        };
        const onEsc = (e) => e.key === "Escape" && setOpenFilter(false);
        window.addEventListener("click", onClickOutside);
        window.addEventListener("keydown", onEsc);
        return () => {
            window.removeEventListener("click", onClickOutside);
            window.removeEventListener("keydown", onEsc);
        };
    }, [openFilter]);

    useEffect(() => {
        if (openFilter) setFilterDraft({ status: statusFilter });
    }, [openFilter, statusFilter]);

    useEffect(() => {
        function onClickOutside(e) {
            if (
                openColMenu &&
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

    const applyFilters = (e) => {
        e.preventDefault();
        setStatusFilter(filterDraft.status || "");
        setOpenFilter(false);
    };
    const clearFilters = () => {
        setStatusFilter("");
        setFilterDraft({ status: "" });
        setOpenFilter(false);
    };

    const activeFilterCount = useMemo(() => (statusFilter ? 1 : 0), [statusFilter]);

    // Data
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (query.trim()) params.set("search", query.trim());
            if (statusFilter) params.set("status", statusFilter);
            params.set("page", String(page));
            params.set("limit", String(pageSize));
            params.set("sort", "newest");

            const baseUrl = summaryApi.url(summaryApi.coupon.list);
            const url = `${baseUrl}?${params.toString()}`;

            const res = await fetch(url, {
                method: "GET",
                headers: { ...authHeaders() },
                credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.ok === false) throw new Error(data.message || "Không tải được danh sách coupon");

            const nextItems = Array.isArray(data.items)
                ? data.items
                : Array.isArray(data.data)
                    ? data.data
                    : [];

            setItems(nextItems);
            setTotal(
                Number(
                    data.total ??
                    data?.meta?.total ??
                    data?.count ??
                    nextItems.length
                ) || 0
            );
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Không tải được danh sách coupon");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, page]);

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        setPage(1);
        await loadCoupons();
    };

    // Selection
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const headerCbRef = useRef(null);

    // reset selection khi đổi trang/filters
    useEffect(() => {
        setSelectedIds(new Set());
    }, [items, statusFilter, page, query]);

    useEffect(() => {
        const idsOnPage = items.map((c) => c.id);
        const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
        if (headerCbRef.current) {
            headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
            headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
        }
    }, [items, selectedIds]);

    const toggleSelectAllOnPage = (e) => {
        const checked = e.target.checked;
        const idsOnPage = items.map((c) => c.id);
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
        if (!window.confirm("Bạn chắc chắn muốn xoá coupon này?")) return;
        try {
            const url = summaryApi.url(summaryApi.coupon.delete(id));
            const res = await fetch(url, {
                method: "DELETE",
                headers: { ...authHeaders() },
                credentials: "include",
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.ok === false) throw new Error(data.message || "Xoá coupon thất bại");
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Xoá coupon thất bại");
            return;
        }
        toast.success("Đã xoá coupon");
        // reload trang hiện tại (có thể trống thì tự lùi về page-1)
        const remain = items.length - 1;
        if (remain === 0 && page > 1) {
            setPage((p) => Math.max(1, p - 1));
        } else {
            loadCoupons();
        }
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) {
            toast.info("Chưa chọn coupon nào.");
            return;
        }
        if (!window.confirm(`Xoá ${ids.length} coupon đã chọn?`)) return;
        try {
            let ok = 0;
            for (const id of ids) {
                const url = summaryApi.url(summaryApi.coupon.delete(id));
                const res = await fetch(url, {
                    method: "DELETE",
                    headers: { ...authHeaders() },
                    credentials: "include",
                });
                if (res.ok) ok++;
            }
            toast.success(`Đã xoá ${ok}/${ids.length} coupon`);
            // reload để đảm bảo total chính xác
            const after = items.length - ok;
            if (after <= 0 && page > 1) setPage((p) => Math.max(1, p - 1));
            else loadCoupons();
        } catch (e) {
            console.error(e);
            toast.error("Có lỗi khi xoá hàng loạt");
        }
    };

    // Status badge
    const now = new Date();
    const computeStatusBadge = (c) => {
        const start = c.start_date ? new Date(c.start_date) : null;
        const end = c.end_date ? new Date(c.end_date) : null;
        const outOfUsage =
            c.usage_limit !== null && c.usage_limit !== undefined && c.times_used >= c.usage_limit;

        if (!c.is_active) return <span className="px-2 py-1 text-xs rounded bg-gray-200">Inactive</span>;
        if (outOfUsage)
            return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Hết lượt</span>;
        if (end && end < now)
            return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">Expired</span>;
        if (start && start > now)
            return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">Upcoming</span>;
        return <span className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">Active</span>;
    };

    const columnCount =
        1 + // checkbox
        (showCols.code ? 1 : 0) +
        (showCols.type ? 1 : 0) +
        (showCols.value ? 1 : 0) +
        (showCols.minOrder ? 1 : 0) +
        (showCols.usage ? 1 : 0) +
        (showCols.time ? 1 : 0) +
        (showCols.status ? 1 : 0) +
        1; // actions

    const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
    const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + items.length);

    return (
        <div className="space-y-5">
            {/* ==== Title + Add + BulkDelete ==== */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Coupons</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleBulkDelete}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-50"
                        disabled={selectedIds.size === 0}
                        title="Xóa tất cả coupon đã chọn"
                    >
                        <MdDelete /> Xóa đã chọn ({selectedIds.size})
                    </button>

                    <button
                        onClick={() => nav("/admin/vouchers-add")}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <MdAdd /> Thêm ưu đãi
                    </button>
                </div>
            </div>

            {/* ==== Search + Filters + Column chooser ==== */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MdSearch />
                    </span>
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Tìm theo mã hoặc mô tả…"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button hidden type="submit">Search</button>
                </form>

                <div className="flex items-center gap-2">
                    {/* Filters popover (trạng thái) */}
                    <div className="relative">
                        <button
                            ref={filterBtnRef}
                            onClick={() => setOpenFilter((v) => !v)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
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
                                onSubmit={(e) => {
                                    applyFilters(e);
                                    setPage(1);
                                }}
                                className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-20 space-y-3"
                            >
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-600">Trạng thái</label>
                                    <select
                                        value={filterDraft.status}
                                        onChange={(e) => setFilterDraft((p) => ({ ...p, status: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="active">Đang kích hoạt</option>
                                        <option value="inactive">Đã tắt</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearFilters();
                                            setPage(1);
                                        }}
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

                    {/* Column chooser */}
                    <div className="relative">
                        <button
                            ref={colBtnRef}
                            onClick={() => setOpenColMenu((v) => !v)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                            title="Chọn cột hiển thị"
                            aria-expanded={openColMenu}
                        >
                            <MdMenu />
                        </button>

                        {openColMenu && (
                            <div
                                ref={colMenuRef}
                                className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-3 z-10"
                            >
                                <div className="font-medium mb-2">Toggle Columns</div>
                                <div className="space-y-2">
                                    {[
                                        { key: "code", label: "Code" },
                                        { key: "type", label: "Type" },
                                        { key: "value", label: "Value" },
                                        { key: "minOrder", label: "Min Order" },
                                        { key: "usage", label: "Used / Limit" },
                                        { key: "time", label: "Time" },
                                        { key: "status", label: "Status" },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="accent-blue-600"
                                                checked={!!showCols[key]}
                                                onChange={(e) => setShowCols((s) => ({ ...s, [key]: e.target.checked }))}
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

            {/* ==== Table ==== */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="w-12 p-0">
                                    <div className="h-12 flex items-center justify-center">
                                        <input
                                            ref={headerCbRef}
                                            type="checkbox"
                                            className="accent-blue-600"
                                            onChange={toggleSelectAllOnPage}
                                        />
                                    </div>
                                </th>
                                {showCols.code && <th className="p-3 text-left">Mã</th>}
                                {showCols.type && <th className="p-3 text-left">Loại</th>}
                                {showCols.value && <th className="p-3 text-right">Giá trị</th>}
                                {showCols.minOrder && <th className="p-3 text-right">Min đơn</th>}
                                {showCols.usage && <th className="p-3 text-right">Đã dùng / Giới hạn</th>}
                                {showCols.time && <th className="p-3 text-left">Thời gian</th>}
                                {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
                                <th className="w-24 p-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={columnCount} className="p-8 text-center text-gray-500">Đang tải…</td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={columnCount} className="p-8 text-center text-gray-500">Chưa có coupon nào.</td>
                                </tr>
                            ) : (
                                items.map((c) => {
                                    const checked = selectedIds.has(c.id);
                                    const valueCell = c.type === "percent" ? `${c.value}%` : toVND(c.value);
                                    const timeCell = (
                                        <div className="flex flex-col text-xs text-gray-600">
                                            {c.start_date && <span>Bắt đầu: {dateVN(c.start_date)}</span>}
                                            {c.end_date && <span>Kết thúc: {dateVN(c.end_date)}</span>}
                                        </div>
                                    );

                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="w-12 p-0">
                                                <div className="h-16 flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="accent-blue-600"
                                                        checked={checked}
                                                        onChange={() => toggleRow(c.id)}
                                                    />
                                                </div>
                                            </td>

                                            {showCols.code && <td className="p-3 font-medium">{c.code}</td>}
                                            {showCols.type && <td className="p-3">{c.type === "percent" ? "Phần trăm" : "Cố định"}</td>}
                                            {showCols.value && <td className="p-3 text-right">{valueCell}</td>}
                                            {showCols.minOrder && <td className="p-3 text-right">{toVND(c.min_order_value || 0)}</td>}
                                            {showCols.usage && (
                                                <td className="p-3 text-right">{c.times_used}/{c.usage_limit ?? "∞"}</td>
                                            )}
                                            {showCols.time && <td className="p-3">{timeCell}</td>}
                                            {showCols.status && <td className="p-3">{computeStatusBadge(c)}</td>}

                                            <td className="p-3 align-middle">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => nav(`/admin/vouchers-edit/${c.id}`)}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                        title="Sửa"
                                                    >
                                                        <MdEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(c.id)}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
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
                <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {total > 0 ? (
                            <>Đang hiển thị {pageStart}–{pageEnd} / {total}</>
                        ) : (
                            <>Không có dữ liệu</>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            ←
                        </button>
                        <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">{page}</span>
                        <button
                            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


// import React, { useEffect, useMemo, useState } from "react";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import { toast } from "react-toastify";
// import summaryApi, { authHeaders } from "../../common";

// import {
//     MdSearch,
//     MdDownload,
//     MdAdd,
//     MdFilterList,
//     MdEdit,
//     MdDelete,
//     MdMenu,
// } from "react-icons/md";

// function useDebounce(value, delay = 300) {
//     const [debounced, setDebounced] = useState(value);
//     useEffect(() => {
//         const t = setTimeout(() => setDebounced(value), delay);
//         return () => clearTimeout(t);
//     }, [value, delay]);
//     return debounced;
// }

// export default function VoucherList() {
//     const nav = useNavigate();
//     const [sp, setSp] = useSearchParams();

//     // Filter state
//     const [search, setSearch] = useState(sp.get("search") || "");
//     const [statusFilter, setStatusFilter] = useState(sp.get("status") || "");
//     const dSearch = useDebounce(search, 300);

//     // Data state
//     const [coupons, setCoupons] = useState([]);
//     const [loading, setLoading] = useState(false);

//     const loadCoupons = async () => {
//         try {
//             setLoading(true);
//             const params = new URLSearchParams();
//             if (dSearch) params.set("search", dSearch);
//             if (statusFilter) params.set("status", statusFilter);

//             const baseUrl = summaryApi.url(summaryApi.coupon.list);
//             const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

//             const res = await fetch(url, {
//                 method: "GET",
//                 headers: { ...authHeaders() },
//                 credentials: "include",
//             });
//             const data = await res.json().catch(() => ({}));
//             if (!res.ok || data.ok === false) {
//                 throw new Error(data.message || "Không tải được danh sách coupon");
//             }
//             setCoupons(data.data || []);
//         } catch (err) {
//             console.error(err);
//             toast.error(err.message || "Không tải được danh sách coupon");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Sync URL when filters change
//     useEffect(() => {
//         const params = new URLSearchParams();
//         if (dSearch) params.set("search", dSearch);
//         if (statusFilter) params.set("status", statusFilter);
//         setSp(params, { replace: true });
//     }, [dSearch, statusFilter, setSp]);

//     useEffect(() => {
//         loadCoupons();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [dSearch, statusFilter]);

//     const handleSearchSubmit = async (e) => {
//         e.preventDefault();
//         await loadCoupons();
//     };

//     const onDelete = async (id) => {
//         if (!window.confirm("Bạn chắc chắn muốn xoá coupon này?")) return;
//         try {
//             const url = summaryApi.url(summaryApi.coupon.delete(id));
//             const res = await fetch(url, {
//                 method: "DELETE",
//                 headers: { ...authHeaders() },
//                 credentials: "include",
//             });
//             const data = await res.json().catch(() => ({}));
//             if (!res.ok || data.ok === false) {
//                 throw new Error(data.message || "Xoá coupon thất bại");
//             }
//             toast.success("Đã xoá coupon");
//             await loadCoupons();
//         } catch (err) {
//             console.error(err);
//             toast.error(err.message || "Xoá coupon thất bại");
//         }
//     };

//     // Badge trạng thái (giống file gốc)
//     const now = new Date();
//     const computeStatusBadge = (c) => {
//         const start = c.start_date ? new Date(c.start_date) : null;
//         const end = c.end_date ? new Date(c.end_date) : null;
//         const outOfUsage =
//             c.usage_limit !== null &&
//             c.usage_limit !== undefined &&
//             c.times_used >= c.usage_limit;

//         if (!c.is_active)
//             return <span className="px-2 py-1 text-xs rounded bg-gray-200">Inactive</span>;
//         if (outOfUsage)
//             return (
//                 <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
//                     Hết lượt
//                 </span>
//             );
//         if (end && end < now)
//             return (
//                 <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700">
//                     Expired
//                 </span>
//             );
//         if (start && start > now)
//             return (
//                 <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">
//                     Upcoming
//                 </span>
//             );
//         return (
//             <span className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700">
//                 Active
//             </span>
//         );
//     };

//     return (
//         <div className="space-y-6">
//             {/* Header */}
//             <div className="flex items-center justify-between">
//                 <h1 className="text-xl font-semibold">Quản lý mã giảm giá</h1>
//                 <div className="flex items-center gap-2">
//                     {/* (tuỳ chọn) Export */}
//                     <button
//                         type="button"
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded border"
//                         onClick={() => toast.info("Chức năng Export sẽ bổ sung sau")}
//                     >
//                         <MdDownload /> Export
//                     </button>
//                     {/* Thêm mới */}
//                     <button
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded bg-black text-white"
//                         onClick={() => nav("/admin/vouchers-add")}
//                     >
//                         <MdAdd /> Thêm ưu đãi
//                     </button>
//                 </div>
//             </div>

//             {/* Bộ lọc */}
//             <div className="bg-white rounded-xl shadow p-4">
//                 <form
//                     onSubmit={handleSearchSubmit}
//                     className="flex flex-col md:flex-row gap-3 mb-4 items-stretch md:items-center"
//                 >
//                     <div className="flex items-center gap-2 flex-1">
//                         <MdFilterList className="text-gray-500" />
//                         <input
//                             className="border rounded px-3 py-2 text-sm flex-1"
//                             placeholder="Tìm theo mã hoặc mô tả..."
//                             value={search}
//                             onChange={(e) => setSearch(e.target.value)}
//                         />
//                     </div>

//                     <select
//                         className="border rounded px-3 py-2 text-sm"
//                         value={statusFilter}
//                         onChange={(e) => setStatusFilter(e.target.value)}
//                     >
//                         <option value="">Tất cả trạng thái</option>
//                         <option value="active">Đang kích hoạt</option>
//                         <option value="inactive">Đã tắt</option>
//                     </select>

//                     <button
//                         type="submit"
//                         className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium inline-flex items-center gap-2"
//                     >
//                         <MdSearch /> Lọc
//                     </button>
//                 </form>

//                 {loading ? (
//                     <div className="py-8 text-center text-sm text-gray-500">
//                         Đang tải danh sách coupon...
//                     </div>
//                 ) : coupons.length === 0 ? (
//                     <div className="py-8 text-center text-sm text-gray-500">
//                         Chưa có coupon nào.
//                     </div>
//                 ) : (
//                     <div className="overflow-x-auto">
//                         <table className="min-w-full text-sm">
//                             <thead>
//                                 <tr className="border-b">
//                                     <th className="text-left py-2 px-2">Mã</th>
//                                     <th className="text-left py-2 px-2">Loại</th>
//                                     <th className="text-right py-2 px-2">Giá trị</th>
//                                     <th className="text-right py-2 px-2">Min đơn</th>
//                                     <th className="text-right py-2 px-2">Đã dùng / Giới hạn</th>
//                                     <th className="text-left py-2 px-2">Thời gian</th>
//                                     <th className="text-left py-2 px-2">Trạng thái</th>
//                                     <th className="text-right py-2 px-2">Thao tác</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {coupons.map((c) => (
//                                     <tr key={c.id} className="border-b last:border-0">
//                                         <td className="py-2 px-2 font-semibold">{c.code}</td>
//                                         <td className="py-2 px-2">{c.type === "percent" ? "Phần trăm" : "Cố định"}</td>
//                                         <td className="py-2 px-2 text-right">
//                                             {c.type === "percent"
//                                                 ? `${c.value}%`
//                                                 : `${Number(c.value || 0).toLocaleString("vi-VN")}₫`}
//                                         </td>
//                                         <td className="py-2 px-2 text-right">
//                                             {Number(c.min_order_value || 0).toLocaleString("vi-VN")}₫
//                                         </td>
//                                         <td className="py-2 px-2 text-right">
//                                             {c.times_used}/{c.usage_limit ?? "∞"}
//                                         </td>
//                                         <td className="py-2 px-2 text-left">
//                                             <div className="flex flex-col text-xs text-gray-600">
//                                                 {c.start_date && (
//                                                     <span>Bắt đầu: {new Date(c.start_date).toLocaleString("vi-VN")}</span>
//                                                 )}
//                                                 {c.end_date && (
//                                                     <span>Kết thúc: {new Date(c.end_date).toLocaleString("vi-VN")}</span>
//                                                 )}
//                                             </div>
//                                         </td>
//                                         <td className="py-2 px-2">{computeStatusBadge(c)}</td>
//                                         <td className="py-2 px-2 text-right">
//                                             <div className="inline-flex items-center gap-2">
//                                                 <button
//                                                     className="p-2 hover:bg-gray-100 rounded"
//                                                     title="Sửa"
//                                                     onClick={() => nav(`/admin/vouchers-edit/${c.id}`)}
//                                                 >
//                                                     <MdEdit />
//                                                 </button>
//                                                 <button
//                                                     className="p-2 hover:bg-red-50 rounded text-red-600"
//                                                     title="Xoá"
//                                                     onClick={() => onDelete(c.id)}
//                                                 >
//                                                     <MdDelete />
//                                                 </button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>

//                         {/* (tuỳ chọn) khu vực menu thao tác nhanh */}
//                         <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
//                             <MdMenu />
//                             <span>Mẹo: bạn có thể lọc theo trạng thái để xem coupon sắp hết hạn.</span>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }
