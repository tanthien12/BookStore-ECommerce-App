// src/pages/admin/AllProducts.jsx
import React, { useEffect, useRef, useState } from "react";
import {
    MdSearch, MdDownload, MdAdd, MdFilterList, MdEdit, MdDelete, MdMenu,
} from "react-icons/md";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import summaryApi from "../../common";

// ===== Helpers =====
const toVND = (n) =>
    (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

function stockLabel(stock) {
    if (stock === 0) return { text: "Hết hàng", color: "text-red-600" };
    if (stock <= 20) return { text: `${stock} sắp hết`, color: "text-amber-600" };
    return { text: `${stock} còn hàng`, color: "text-emerald-600" };
}
function stockBarClass(stock) {
    if (stock === 0) return "bg-red-500";
    if (stock <= 20) return "bg-amber-500";
    return "bg-emerald-500";
}
function dateVN(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
        return "-";
    }
}

const COL_KEY = "admin.products.table.columns";

export default function AllProducts() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 7;

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // toggle cột
    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved
            ? JSON.parse(saved)
            : { product: true, author: true, stock: true, price: true, createdAt: true };
    });
    useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

    // column chooser
    const [openColMenu, setOpenColMenu] = useState(false);
    const colBtnRef = useRef(null);
    const colMenuRef = useRef(null);
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

    // fetch list
    useEffect(() => {
        let ignore = false;
        const ctrl = new AbortController();

        (async () => {
            try {
                setLoading(true);
                const url = new URL(summaryApi.url(summaryApi.book.list));
                if (query.trim()) url.searchParams.set("q", query.trim());
                url.searchParams.set("page", String(page));
                url.searchParams.set("limit", String(pageSize));
                url.searchParams.set("sort", "newest");

                const res = await fetch(url.toString(), { signal: ctrl.signal });
                if (!res.ok) throw new Error(`Fetch books failed: ${res.status}`);
                const data = await res.json();
                if (ignore) return;

                setItems(data.items || []);
                setTotal(data.total ?? 0);
            } catch (e) {
                if (e.name !== "AbortError") {
                    console.error(e);
                    toast.error(e.message || "Không tải được danh sách sách");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        })();

        return () => {
            ignore = true;
            ctrl.abort();
        };
    }, [query, page]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // selection
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const headerCbRef = useRef(null);

    useEffect(() => {
        const idsOnPage = items.map((b) => b.id);
        const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
        if (headerCbRef.current) {
            headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
            headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
        }
    }, [items, selectedIds]);

    const toggleSelectAllOnPage = (e) => {
        const checked = e.target.checked;
        const idsOnPage = items.map((b) => b.id);
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

    // API delete single
    const handleDelete = async (id) => {
        if (!confirm("Bạn chắc chắn muốn xóa sách này?")) return;
        try {
            const res = await fetch(summaryApi.url(summaryApi.book.delete(id)), { method: "DELETE" });
            if (!res.ok) throw new Error(`Xóa thất bại: ${res.status}`);
            toast.success("Đã xóa sách");
            setItems((prev) => prev.filter((x) => x.id !== id));
            setTotal((t) => Math.max(0, t - 1));
            setSelectedIds((prev) => {
                const n = new Set(prev);
                n.delete(id);
                return n;
            });
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Lỗi xóa sách");
        }
    };

    // ===== bulk delete (selection) =====
    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) {
            toast.info("Chưa chọn sản phẩm nào.");
            return;
        }
        if (!confirm(`Xóa ${ids.length} sản phẩm đã chọn?`)) return;

        try {
            let okCount = 0;
            // tuần tự để backend không cần endpoint bulk
            for (const id of ids) {
                const res = await fetch(summaryApi.url(summaryApi.book.delete(id)), {
                    method: "DELETE",
                });
                if (res.ok) okCount++;
            }

            toast.success(`Đã xóa ${okCount}/${ids.length} sản phẩm`);

            // cập nhật UI
            setItems((prev) => prev.filter((x) => !selectedIds.has(x.id)));
            setTotal((t) => Math.max(0, t - okCount));
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            toast.error("Có lỗi khi xóa hàng loạt");
        }
    };


    // Export CSV
    const handleExportCSV = () => {
        if (!items.length) {
            toast.info("Không có dữ liệu để export");
            return;
        }
        const headers = ["ID", "Title", "Author", "Price", "Stock", "Created At"];
        const rows = items.map((b) => [
            b.id,
            `"${b.title.replace(/"/g, '""')}"`,
            `"${(b.author || "").replace(/"/g, '""')}"`,
            b.price,
            b.stock,
            dateVN(b.created_at),
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "products.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            {/* ==== Title + Export + Add + BulkDelete ==== */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Books</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                    >
                        <MdDownload /> Export
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-50"
                        disabled={selectedIds.size === 0}
                        title="Xóa tất cả danh mục đã chọn"
                    >
                        <MdDelete /> Xóa đã chọn ({selectedIds.size})
                    </button>
                    <Link
                        to="/admin/products-add"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <MdAdd /> Thêm sản phẩm
                    </Link>
                </div>
            </div>

            {/* ==== Search + Filters + Column chooser ==== */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MdSearch /></span>
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Tìm theo tên sách, tác giả…"
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
                                        { key: "product", label: "Product" },
                                        { key: "author", label: "Author" },
                                        { key: "stock", label: "Stock" },
                                        { key: "price", label: "Price" },
                                        { key: "createdAt", label: "Created At" },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="accent-blue-600"
                                                checked={showCols[key]}
                                                onChange={(e) =>
                                                    setShowCols((s) => ({ ...s, [key]: e.target.checked }))
                                                }
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
                                {showCols.product && <th className="p-3 text-left">Sách</th>}
                                {showCols.author && <th className="p-3 text-left">Tác giả</th>}
                                {showCols.stock && <th className="p-3 text-left">Tồn kho</th>}
                                {showCols.price && <th className="p-3 text-left">Giá</th>}
                                {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
                                <th className="w-24 p-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Đang tải…</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Không có sách nào.</td></tr>
                            ) : (
                                items.map((b) => {
                                    const s = stockLabel(b.stock);
                                    const barClass = stockBarClass(b.stock);
                                    const pct = Math.min(100, (b.stock / 50) * 100);
                                    const checked = selectedIds.has(b.id);

                                    return (
                                        <tr key={b.id} className="hover:bg-gray-50">
                                            <td className="w-12 p-0">
                                                <div className="h-16 flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="accent-blue-600"
                                                        checked={checked}
                                                        onChange={() => toggleRow(b.id)}
                                                    />
                                                </div>
                                            </td>

                                            {showCols.product && (
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={b.image_url}
                                                            alt={b.title}
                                                            className="w-12 h-12 rounded-md object-cover border"
                                                        />
                                                        <div>
                                                            <Link
                                                                to={`/admin/products/${b.id}`}
                                                                className="font-medium hover:underline"
                                                            >
                                                                {b.title}
                                                            </Link>
                                                            <div className="text-xs text-gray-400">ID: {b.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}

                                            {showCols.author && (
                                                <td className="p-3 align-middle">{b.author || "-"}</td>
                                            )}

                                            {showCols.stock && (
                                                <td className="p-3 align-middle">
                                                    <div className="min-w-[180px]">
                                                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                                            <div
                                                                className={`h-2 ${barClass}`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <div className={`mt-1 text-xs ${s.color}`}>{s.text}</div>
                                                    </div>
                                                </td>
                                            )}

                                            {showCols.price && (
                                                <td className="p-3 align-middle font-medium">
                                                    {toVND(b.price)}
                                                </td>
                                            )}
                                            {showCols.createdAt && (
                                                <td className="p-3 align-middle">{dateVN(b.created_at)}</td>
                                            )}

                                            <td className="p-3 align-middle">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/admin/products-edit/${b.id}`}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                        title="Sửa"
                                                    >
                                                        <MdEdit />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(b.id)}
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
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
                    <div className="text-sm text-gray-500">
                        {total > 0 ? (
                            <>
                                Đang hiển thị {(page - 1) * pageSize + 1}–
                                {Math.min(page * pageSize, total)} / {total}
                            </>
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
