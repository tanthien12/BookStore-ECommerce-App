
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    MdSearch, MdDownload, MdAdd, MdFilterList, MdMenu,
    MdVisibility, MdEdit, MdDelete,
} from "react-icons/md";

// ===== Mock data (sau thay bằng API thật) =====
const MOCK_ORDERS = [
    {
        id: "ODR-10001",
        customer: { name: "Nguyễn Văn A", email: "a.nguyen@example.com" },
        itemsCount: 3,
        total: 589000,
        status: "Pending",
        created_at: "2025-09-01T10:20:00Z",
    },
    {
        id: "ODR-10002",
        customer: { name: "Trần B", email: "tranb@example.com" },
        itemsCount: 2,
        total: 410000,
        status: "Processing",
        created_at: "2025-09-02T08:45:00Z",
    },
    {
        id: "ODR-10003",
        customer: { name: "Lê C", email: "lec@example.com" },
        itemsCount: 5,
        total: 1250000,
        status: "Completed",
        created_at: "2025-09-03T12:10:00Z",
    },
    {
        id: "ODR-10004",
        customer: { name: "Phạm D", email: "pham.d@example.com" },
        itemsCount: 1,
        total: 199000,
        status: "Canceled",
        created_at: "2025-09-04T09:05:00Z",
    },
];

const toVND = (n) => n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
const dateVN = (iso) => {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch { return "-"; }
};

const STATUS_BADGE = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Processing: "bg-blue-100 text-blue-700 border-blue-200",
    Shipped: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Canceled: "bg-red-100 text-red-700 border-red-200",
};

const COL_KEY = "admin.orders.table.columns.v2";

export default function OrderList() {
    // tìm kiếm & phân trang
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 7;

    // Toggle Columns (nhớ bằng localStorage)
    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved
            ? JSON.parse(saved)
            : { orderId: true, customer: true, items: true, total: true, createdAt: true, status: true };
    });
    useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

    // Dropdown Toggle Columns
    const [openColMenu, setOpenColMenu] = useState(false);
    const colBtnRef = useRef(null);
    const colMenuRef = useRef(null);
    useEffect(() => {
        function onClickOutside(e) {
            if (!openColMenu) return;
            if (
                colMenuRef.current && !colMenuRef.current.contains(e.target) &&
                colBtnRef.current && !colBtnRef.current.contains(e.target)
            ) setOpenColMenu(false);
        }
        function onEsc(e) { if (e.key === "Escape") setOpenColMenu(false); }
        window.addEventListener("click", onClickOutside);
        window.addEventListener("keydown", onEsc);
        return () => { window.removeEventListener("click", onClickOutside); window.removeEventListener("keydown", onEsc); };
    }, [openColMenu]);

    // Filter
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return MOCK_ORDERS;
        return MOCK_ORDERS.filter((o) =>
            o.id.toLowerCase().includes(q) ||
            o.customer.name.toLowerCase().includes(q) ||
            o.customer.email.toLowerCase().includes(q) ||
            o.status.toLowerCase().includes(q)
        );
    }, [query]);

    // Pagination
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);
    useEffect(() => setPage(1), [query]);

    // Select all theo trang + indeterminate
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const headerCbRef = useRef(null);
    useEffect(() => {
        const idsOnPage = list.map((o) => o.id);
        const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
        if (headerCbRef.current) {
            headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
            headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
        }
    }, [list, selectedIds]);

    const toggleSelectAllOnPage = (e) => {
        const checked = e.target.checked;
        const idsOnPage = list.map((o) => o.id);
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

    const handleDelete = (id) => {
        if (confirm("Bạn chắc chắn muốn xóa đơn hàng này?")) {
            console.log("Delete order:", id);
            // TODO: API delete -> reload
            setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }
    };

    return (
        <div className="space-y-5">
            {/* Hàng 1: Title + Export + Add */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Orders</h1>
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                        <MdDownload /> Export
                    </button>
                    <Link
                        to="/admin/orders/create"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <MdAdd /> Tạo đơn
                    </Link>
                </div>
            </div>

            {/* Hàng 2: Search + Filters + Toggle Columns */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MdSearch /></span>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm theo mã đơn, khách hàng, trạng thái…"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                        <MdFilterList /> Filters
                    </button>

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
                                        { key: "orderId", label: "Order ID" },
                                        { key: "customer", label: "Customer" },
                                        { key: "items", label: "Items" },
                                        { key: "total", label: "Total" },
                                        { key: "createdAt", label: "Created At" },
                                        { key: "status", label: "Status" },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="accent-blue-600"
                                                checked={showCols[key]}
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

            {/* Bảng */}
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
                                {showCols.orderId && <th className="p-3 text-left">Mã đơn hàng</th>}
                                {showCols.customer && <th className="p-3 text-left">Khách hàng</th>}
                                {showCols.items && <th className="p-3 text-left">Số lượng</th>}
                                {showCols.total && <th className="p-3 text-left">Giá trị</th>}
                                {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
                                {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
                                <th className="w-28 p-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {list.map((o) => {
                                const checked = selectedIds.has(o.id);
                                return (
                                    <tr key={o.id} className="hover:bg-gray-50">
                                        {/* checkbox row */}
                                        <td className="w-12 p-0">
                                            <div className="h-16 flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="accent-blue-600"
                                                    checked={checked}
                                                    onChange={() => toggleRow(o.id)}
                                                />
                                            </div>
                                        </td>

                                        {showCols.orderId && (
                                            <td className="p-3 align-middle">
                                                <Link to={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                                                    {o.id}
                                                </Link>
                                            </td>
                                        )}

                                        {showCols.customer && (
                                            <td className="p-3 align-middle">
                                                <div className="font-medium">{o.customer.name}</div>
                                                <div className="text-xs text-gray-500">{o.customer.email}</div>
                                            </td>
                                        )}

                                        {showCols.items && (
                                            <td className="p-3 align-middle">{o.itemsCount}</td>
                                        )}

                                        {showCols.total && (
                                            <td className="p-3 align-middle font-medium">{toVND(o.total)}</td>
                                        )}

                                        {showCols.createdAt && (
                                            <td className="p-3 align-middle">{dateVN(o.created_at)}</td>
                                        )}

                                        {showCols.status && (
                                            <td className="p-3 align-middle">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${STATUS_BADGE[o.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                                                    {o.status}
                                                </span>
                                            </td>
                                        )}

                                        <td className="p-3 align-middle">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/orders/${o.id}`}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                    title="Xem chi tiết"
                                                >
                                                    <MdVisibility />
                                                </Link>
                                                <Link
                                                    to={`/admin/orders/${o.id}/edit`}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                    title="Sửa"
                                                >
                                                    <MdEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(o.id)}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
                                                    title="Xóa"
                                                >
                                                    <MdDelete />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {list.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">Không có đơn hàng nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
                    <div className="text-sm text-gray-500">
                        Đang hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >←</button>
                        <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">{page}</span>
                        <button
                            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >→</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
