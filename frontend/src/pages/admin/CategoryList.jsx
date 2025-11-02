// src/pages/admin/CategoryList.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdSearch, MdDownload, MdAdd, MdFilterList, MdEdit, MdDelete, MdMenu } from "react-icons/md";
import summaryApi from "../../common";
import { toast } from "react-toastify";

const COL_KEY = "admin.categories.table.columns";
const INITIAL_FILTERS = {
    hasProducts: "",
    dateFrom: "",
    dateTo: "",
};

export default function CategoryList() {
    const location = useLocation();
    const navigate = useNavigate();

    // ===== query & paging =====
    const [query, setQuery] = useState(() => new URLSearchParams(location.search).get("q") || "");
    const [debouncedQ, setDebouncedQ] = useState(query.trim());
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // ===== data =====
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // ===== filters =====
    const [filters, setFilters] = useState({ ...INITIAL_FILTERS });
    const [filterDraft, setFilterDraft] = useState({ ...INITIAL_FILTERS });
    const [openFilter, setOpenFilter] = useState(false);
    const filterBtnRef = useRef(null);
    const filterMenuRef = useRef(null);

    // ===== columns toggle (localStorage) =====
    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved ? JSON.parse(saved) : { image: true, name: true, description: true, slug: true, products: true };
    });
    useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

    // ===== dropdown toggle columns =====
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
            )
                setOpenColMenu(false);
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

    // ===== filter dropdown outside close =====
    useEffect(() => {
        if (!openFilter) return undefined;
        const onClickOutside = (e) => {
            if (
                filterMenuRef.current &&
                !filterMenuRef.current.contains(e.target) &&
                filterBtnRef.current &&
                !filterBtnRef.current.contains(e.target)
            )
                setOpenFilter(false);
        };
        const onEsc = (e) => {
            if (e.key === "Escape") setOpenFilter(false);
        };
        window.addEventListener("click", onClickOutside);
        window.addEventListener("keydown", onEsc);
        return () => {
            window.removeEventListener("click", onClickOutside);
            window.removeEventListener("keydown", onEsc);
        };
    }, [openFilter]);

    useEffect(() => {
        if (openFilter) setFilterDraft({ ...filters });
    }, [openFilter, filters]);

    // ===== debounce search =====
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(query.trim()), 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Sync from URL -> input
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlQuery = params.get("q") || "";
        setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
    }, [location.search]);

    // Sync input -> URL (replace)
    useEffect(() => {
        const trimmed = query.trim();
        const params = new URLSearchParams(location.search);
        const current = params.get("q") || "";
        if (trimmed === current) return;
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
        navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" }, { replace: true });
    }, [query, location.pathname, location.search, navigate]);

    // Cross-page admin search events
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const handler = (event) => {
            const nextValue = typeof event?.detail?.query === "string" ? event.detail.query : "";
            setQuery(nextValue);
        };
        window.addEventListener("admin:search", handler);
        return () => window.removeEventListener("admin:search", handler);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        window.dispatchEvent(new CustomEvent("admin:search:reflect", { detail: { query } }));
    }, [query]);

    // Reset page on filters or debounced search changes
    useEffect(() => {
        setPage(1);
    }, [debouncedQ, filters.hasProducts, filters.dateFrom, filters.dateTo]);

    // ===== fetch list =====
    useEffect(() => {
        let ignore = false;
        const ctrl = new AbortController();
        (async () => {
            try {
                setLoading(true);
                const url = new URL(summaryApi.url(summaryApi.category.list));
                if (debouncedQ) url.searchParams.set("q", debouncedQ);
                url.searchParams.set("page", String(page));
                url.searchParams.set("limit", String(pageSize));
                url.searchParams.set("sort", "newest");

                const res = await fetch(url.toString(), { signal: ctrl.signal });
                if (!res.ok) throw new Error(`Fetch categories failed: ${res.status}`);
                const data = await res.json();
                if (!ignore) {
                    setItems(Array.isArray(data.items) ? data.items : []);
                    setTotal(data.total ?? data?.meta?.total ?? data?.count ?? 0);
                }
            } catch (e) {
                if (e.name !== "AbortError") {
                    console.error(e);
                    toast.error(e.message || "Không tải được danh mục");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
            ctrl.abort();
        };
    }, [debouncedQ, page]);

    // Áp dụng lọc local (trên trang hiện tại)
    const visibleItems = useMemo(() => {
        const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
        const to = filters.dateTo ? new Date(filters.dateTo) : null;
        if (to) to.setHours(23, 59, 59, 999);
        return items.filter((c) => {
            const count = c.productsCount ?? c.products_count ?? c.products?.length ?? 0;
            if (filters.hasProducts === "with" && Number(count) <= 0) return false;
            if (filters.hasProducts === "without" && Number(count) > 0) return false;

            if ((from || to) && c.created_at) {
                const created = new Date(c.created_at);
                if (from && created < from) return false;
                if (to && created > to) return false;
            }
            return true;
        });
    }, [items, filters]);

    const hasLocalFilters = Boolean(filters.hasProducts || filters.dateFrom || filters.dateTo);
    const columnCount = 1 + Object.values(showCols).filter(Boolean).length + 1; // select + visible cols + actions

    // ===== selection =====
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const headerCbRef = useRef(null);

    useEffect(() => {
        setSelectedIds(new Set());
    }, [items, filters.hasProducts, filters.dateFrom, filters.dateTo]);

    useEffect(() => {
        const allIdsOnPage = visibleItems.map((c) => c.id);
        const checkedCount = allIdsOnPage.filter((id) => selectedIds.has(id)).length;
        if (headerCbRef.current) {
            headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < visibleItems.length;
            headerCbRef.current.checked = checkedCount === visibleItems.length && visibleItems.length > 0;
        }
    }, [visibleItems, selectedIds]);

    const toggleSelectAllOnPage = (e) => {
        const checked = e.target.checked;
        const idsOnPage = visibleItems.map((c) => c.id);
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

    // ===== delete single =====
    const handleDelete = async (id) => {
        if (!confirm("Bạn chắc chắn muốn xóa danh mục này?")) return;
        try {
            const res = await fetch(summaryApi.url(summaryApi.category.delete(id)), { method: "DELETE" });
            if (!res.ok) {
                const j = await res.json().catch(() => null);
                throw new Error(j?.message || `Xóa thất bại (${res.status})`);
            }
            toast.success("Đã xóa danh mục");
            setItems((prev) => prev.filter((x) => x.id !== id));
            setTotal((t) => Math.max(0, t - 1));
            setSelectedIds((prev) => {
                const n = new Set(prev);
                n.delete(id);
                return n;
            });
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Lỗi xóa danh mục");
        }
    };

    // ===== bulk delete =====
    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) {
            toast.info("Chưa chọn danh mục nào.");
            return;
        }
        if (!confirm(`Xóa ${ids.length} danh mục đã chọn?`)) return;

        try {
            let okCount = 0;
            for (const id of ids) {
                const res = await fetch(summaryApi.url(summaryApi.category.delete(id)), { method: "DELETE" });
                if (res.ok) okCount++;
            }
            toast.success(`Đã xóa ${okCount}/${ids.length} danh mục`);
            setItems((prev) => prev.filter((x) => !selectedIds.has(x.id)));
            setTotal((t) => Math.max(0, t - okCount));
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            toast.error("Có lỗi khi xóa hàng loạt");
        }
    };

    // ===== export CSV (theo bộ lọc hiện tại) =====
    const handleExportCsv = async () => {
        try {
            const url = new URL(summaryApi.url(summaryApi.category.list));
            if (debouncedQ) url.searchParams.set("q", debouncedQ);
            url.searchParams.set("page", "1");
            url.searchParams.set("limit", "5000");
            url.searchParams.set("sort", "newest");

            const res = await fetch(url.toString());
            if (!res.ok) throw new Error(`Export failed: ${res.status}`);
            const data = await res.json();
            const rows = (Array.isArray(data.items) ? data.items : []).filter((c) => {
                const count = c.productsCount ?? c.products_count ?? c.products?.length ?? 0;
                if (filters.hasProducts === "with" && Number(count) <= 0) return false;
                if (filters.hasProducts === "without" && Number(count) > 0) return false;
                if ((filters.dateFrom || filters.dateTo) && c.created_at) {
                    const created = new Date(c.created_at);
                    const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
                    const to = filters.dateTo ? new Date(filters.dateTo) : null;
                    if (from && created < from) return false;
                    if (to) {
                        to.setHours(23, 59, 59, 999);
                        if (created > to) return false;
                    }
                }
                return true;
            });

            const header = ["id", "name", "slug", "description", "image_url", "created_at", "updated_at", "productsCount"];
            const esc = (v) => {
                const s = (v ?? "").toString().replace(/"/g, '""');
                return `"${s}"`;
            };
            const lines = [header.join(",")];
            for (const r of rows) {
                lines.push(
                    [
                        esc(r.id),
                        esc(r.name),
                        esc(r.slug),
                        esc(r.description || ""),
                        esc(r.image_url || ""),
                        esc(r.created_at || ""),
                        esc(r.updated_at || ""),
                        esc(r.productsCount ?? r.products_count ?? r.products?.length ?? ""),
                    ].join(",")
                );
            }
            const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `categories_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success(`Đã xuất ${rows.length} dòng CSV`);
        } catch (e) {
            console.error(e);
            toast.error(e.message || "Lỗi export CSV");
        }
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

    const activeFilterCount = useMemo(
        () => [filters.hasProducts, filters.dateFrom, filters.dateTo].filter(Boolean).length,
        [filters]
    );

    const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + visibleItems.length);

    return (
        <div className="space-y-5">
            {/* Row 1: Title + Export + Add */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Categories</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                    >
                        <MdDownload /> Export CSV
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
                        to="/admin/categories-add"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <MdAdd /> Thêm danh mục
                    </Link>
                </div>
            </div>

            {/* Row 2: Search + Filters + Column Toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MdSearch />
                    </span>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm theo tên, slug, mô tả…"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Filters */}
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
                                onSubmit={applyFilters}
                                className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-20 space-y-3"
                            >
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-600">Số lượng sản phẩm</label>
                                    <select
                                        value={filterDraft.hasProducts}
                                        onChange={(e) => setFilterDraft((prev) => ({ ...prev, hasProducts: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="with">Chỉ danh mục có sản phẩm</option>
                                        <option value="without">Chỉ danh mục trống</option>
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
                                    <button type="button" onClick={clearFilters} className="text-sm font-medium text-gray-500 hover:text-gray-700">
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
                                        <button type="submit" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
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
                            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                            title="Chọn cột hiển thị"
                            aria-expanded={openColMenu}
                        >
                            <MdMenu />
                        </button>

                        {openColMenu && (
                            <div ref={colMenuRef} className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-3 z-10">
                                <div className="font-semibold mb-2">Toggle Columns</div>
                                <div className="space-y-2">
                                    {[
                                        { key: "image", label: "Image" },
                                        { key: "name", label: "Category Name" },
                                        { key: "description", label: "Description" },
                                        { key: "slug", label: "Slug" },
                                        { key: "products", label: "Products" },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={showCols[key]}
                                                onChange={(e) => setShowCols((s) => ({ ...s, [key]: e.target.checked }))}
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
            <div className="bg-white rounded-xl shadow border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                <th className="w-12 p-0">
                                    <div className="h-12 flex items-center justify-center">
                                        <input ref={headerCbRef} type="checkbox" className="accent-blue-600" onChange={toggleSelectAllOnPage} />
                                    </div>
                                </th>
                                {showCols.image && <th className="p-3 text-left">Image</th>}
                                {showCols.name && <th className="p-3 text-left">Category Name</th>}
                                {showCols.description && <th className="p-3 text-left">Description</th>}
                                {showCols.slug && <th className="p-3 text-left">Slug</th>}
                                {showCols.products && <th className="p-3 text-left">Products</th>}
                                <th className="w-24 p-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan={columnCount} className="p-8 text-center text-gray-500">
                                        Đang tải…
                                    </td>
                                </tr>
                            ) : visibleItems.length === 0 ? (
                                <tr>
                                    <td colSpan={columnCount} className="p-8 text-center text-gray-500">
                                        Không có danh mục nào.
                                    </td>
                                </tr>
                            ) : (
                                visibleItems.map((c) => {
                                    const isChecked = selectedIds.has(c.id);
                                    const count = c.productsCount ?? c.products_count ?? c.products?.length ?? 0;
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="w-12 p-0">
                                                <div className="h-16 flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="accent-blue-600"
                                                        checked={isChecked}
                                                        onChange={() => toggleRow(c.id)}
                                                    />
                                                </div>
                                            </td>

                                            {showCols.image && (
                                                <td className="p-3">
                                                    {c.image_url ? (
                                                        <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-md object-cover border" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-md border bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                                            —
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                            {showCols.name && (
                                                <td className="p-3 align-middle">
                                                    <Link to={`/admin/categories/${c.id}`} className="font-medium hover:underline">
                                                        {c.name}
                                                    </Link>
                                                </td>
                                            )}
                                            {showCols.description && (
                                                <td className="p-3 align-middle text-gray-700">
                                                    <div className="clamp-1 max-w-[150px]" title={c.description || ""}>
                                                        {c.description || "—"}
                                                    </div>
                                                </td>
                                            )}
                                            {showCols.slug && (
                                                <td className="p-3 align-middle">
                                                    <span className="text-gray-700">{c.slug}</span>
                                                </td>
                                            )}
                                            {showCols.products && <td className="p-3 align-middle font-medium">{count}</td>}

                                            <td className="p-3 align-middle">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/admin/categories-edit/${c.id}`}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                        title="Sửa"
                                                    >
                                                        <MdEdit />
                                                    </Link>
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

                {/* Pagination footer */}
                <div className="flex flex-col gap-3 px-4 py-3 bg-white border-t text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {total > 0
                            ? hasLocalFilters
                                ? <>Đang hiển thị {visibleItems.length} danh mục trong trang hiện tại / {total}</>
                                : <>Đang hiển thị {pageStart}–{pageEnd} / {total}</>
                            : <>Không có dữ liệu</>}
                        {activeFilterCount > 0 && total > 0 && (
                            <span className="ml-2 text-xs text-gray-500">(Đang áp dụng {activeFilterCount} bộ lọc)</span>
                        )}
                        {hasLocalFilters && <div className="text-xs text-gray-400">* Bộ lọc áp dụng trên dữ liệu của trang hiện tại.</div>}
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

//code gốc
// // src/pages/admin/CategoryList.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import { Link } from "react-router-dom";
// import {
//     MdSearch, MdDownload, MdAdd, MdFilterList, MdEdit, MdDelete, MdMenu,
// } from "react-icons/md";
// import summaryApi from "../../common";
// import { toast } from "react-toastify";

// const COL_KEY = "admin.categories.table.columns";

// export default function CategoryList() {
//     // ===== query & paging =====
//     const [query, setQuery] = useState("");
//     const [page, setPage] = useState(1);
//     const pageSize = 10;
//     const [total, setTotal] = useState(0);
//     const totalPages = Math.max(1, Math.ceil(total / pageSize));

//     // ===== data =====
//     const [items, setItems] = useState([]);
//     const [loading, setLoading] = useState(false);

//     // ===== columns toggle (localStorage) =====
//     const [showCols, setShowCols] = useState(() => {
//         const saved = localStorage.getItem(COL_KEY);
//         return saved ? JSON.parse(saved)
//             : { image: true, name: true, description: true, slug: true, products: true };
//     });
//     useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

//     // ===== dropdown toggle columns =====
//     const [openColMenu, setOpenColMenu] = useState(false);
//     const colBtnRef = useRef(null);
//     const colMenuRef = useRef(null);
//     useEffect(() => {
//         function onClickOutside(e) {
//             if (
//                 openColMenu &&
//                 colMenuRef.current && !colMenuRef.current.contains(e.target) &&
//                 colBtnRef.current && !colBtnRef.current.contains(e.target)
//             ) setOpenColMenu(false);
//         }
//         function onEsc(e) { if (e.key === "Escape") setOpenColMenu(false); }
//         window.addEventListener("click", onClickOutside);
//         window.addEventListener("keydown", onEsc);
//         return () => { window.removeEventListener("click", onClickOutside); window.removeEventListener("keydown", onEsc); };
//     }, [openColMenu]);

//     // ===== debounce search =====
//     const [debouncedQ, setDebouncedQ] = useState(query);
//     useEffect(() => {
//         const t = setTimeout(() => setDebouncedQ(query.trim()), 300);
//         return () => clearTimeout(t);
//     }, [query]);
//     useEffect(() => { setPage(1); }, [debouncedQ]);

//     // ===== fetch list =====
//     useEffect(() => {
//         let ignore = false;
//         const ctrl = new AbortController();
//         (async () => {
//             try {
//                 setLoading(true);
//                 const url = new URL(summaryApi.url(summaryApi.category.list));
//                 if (debouncedQ) url.searchParams.set("q", debouncedQ);
//                 url.searchParams.set("page", String(page));
//                 url.searchParams.set("limit", String(pageSize));
//                 url.searchParams.set("sort", "newest");

//                 const res = await fetch(url.toString(), { signal: ctrl.signal });
//                 if (!res.ok) throw new Error(`Fetch categories failed: ${res.status}`);
//                 const data = await res.json();
//                 if (!ignore) {
//                     setItems(data.items || []);
//                     setTotal(data.total ?? 0);
//                 }
//             } catch (e) {
//                 if (e.name !== "AbortError") {
//                     console.error(e);
//                     toast.error(e.message || "Không tải được danh mục");
//                 }
//             } finally {
//                 if (!ignore) setLoading(false);
//             }
//         })();
//         return () => { ignore = true; ctrl.abort(); };
//     }, [debouncedQ, page]);

//     const slice = useMemo(() => items, [items]);

//     // ===== selection =====
//     const [selectedIds, setSelectedIds] = useState(() => new Set());
//     const headerCbRef = useRef(null);
//     useEffect(() => {
//         const allIdsOnPage = slice.map((c) => c.id);
//         const checkedCount = allIdsOnPage.filter((id) => selectedIds.has(id)).length;
//         if (headerCbRef.current) {
//             headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < slice.length;
//             headerCbRef.current.checked = checkedCount === slice.length && slice.length > 0;
//         }
//     }, [slice, selectedIds]);

//     const toggleSelectAllOnPage = (e) => {
//         const checked = e.target.checked;
//         const idsOnPage = slice.map((c) => c.id);
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

//     // ===== delete single =====
//     const handleDelete = async (id) => {
//         if (!confirm("Bạn chắc chắn muốn xóa danh mục này?")) return;
//         try {
//             const res = await fetch(summaryApi.url(summaryApi.category.delete(id)), { method: "DELETE" });
//             if (!res.ok) {
//                 const j = await res.json().catch(() => null);
//                 throw new Error(j?.message || `Xóa thất bại (${res.status})`);
//             }
//             toast.success("Đã xóa danh mục");
//             setItems((prev) => prev.filter((x) => x.id !== id));
//             setTotal((t) => Math.max(0, t - 1));
//             setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
//         } catch (e) {
//             console.error(e);
//             toast.error(e.message || "Lỗi xóa danh mục");
//         }
//     };

//     // ===== bulk delete (selection) =====
//     const handleBulkDelete = async () => {
//         const ids = Array.from(selectedIds);
//         if (ids.length === 0) {
//             toast.info("Chưa chọn danh mục nào.");
//             return;
//         }
//         if (!confirm(`Xóa ${ids.length} danh mục đã chọn?`)) return;

//         try {
//             // tuần tự để backend đơn giản; có thể Promise.all nếu backend chịu tải
//             let okCount = 0;
//             for (const id of ids) {
//                 const res = await fetch(summaryApi.url(summaryApi.category.delete(id)), { method: "DELETE" });
//                 if (res.ok) okCount++;
//             }
//             toast.success(`Đã xóa ${okCount}/${ids.length} danh mục`);
//             // cập nhật UI
//             setItems((prev) => prev.filter((x) => !selectedIds.has(x.id)));
//             setTotal((t) => Math.max(0, t - okCount));
//             setSelectedIds(new Set());
//         } catch (e) {
//             console.error(e);
//             toast.error("Có lỗi khi xóa hàng loạt");
//         }
//     };

//     // ===== export CSV (theo bộ lọc hiện tại) =====
//     const handleExportCsv = async () => {
//         try {
//             // Lấy TẤT CẢ theo q hiện tại (không phân trang) — limit lớn vừa phải
//             const url = new URL(summaryApi.url(summaryApi.category.list));
//             if (debouncedQ) url.searchParams.set("q", debouncedQ);
//             url.searchParams.set("page", "1");
//             url.searchParams.set("limit", "5000"); // tuỳ quy mô
//             url.searchParams.set("sort", "newest");

//             const res = await fetch(url.toString());
//             if (!res.ok) throw new Error(`Export failed: ${res.status}`);
//             const data = await res.json();
//             const rows = data.items || [];

//             // build CSV
//             const header = ["id", "name", "slug", "description", "image_url", "created_at", "updated_at", "productsCount"];
//             const esc = (v) => {
//                 const s = (v ?? "").toString().replace(/"/g, '""');
//                 return `"${s}"`;
//             };
//             const lines = [header.join(",")];
//             for (const r of rows) {
//                 lines.push([
//                     esc(r.id),
//                     esc(r.name),
//                     esc(r.slug),
//                     esc(r.description || ""),
//                     esc(r.image_url || ""),
//                     esc(r.created_at || ""),
//                     esc(r.updated_at || ""),
//                     esc(r.productsCount ?? ""),
//                 ].join(","));
//             }
//             const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
//             const a = document.createElement("a");
//             a.href = URL.createObjectURL(blob);
//             a.download = `categories_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
//             document.body.appendChild(a);
//             a.click();
//             a.remove();
//             toast.success(`Đã xuất ${rows.length} dòng CSV`);
//         } catch (e) {
//             console.error(e);
//             toast.error(e.message || "Lỗi export CSV");
//         }
//     };

//     return (
//         <div className="space-y-5">
//             {/* Row 1: Title + Export + Add */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <h1 className="text-2xl font-bold">Categories</h1>
//                 <div className="flex flex-wrap items-center gap-2">
//                     <button
//                         onClick={handleExportCsv}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                     >
//                         <MdDownload /> Export CSV
//                     </button>
//                     <button
//                         onClick={handleBulkDelete}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-50"
//                         disabled={selectedIds.size === 0}
//                         title="Xóa tất cả danh mục đã chọn"
//                     >
//                         <MdDelete /> Xóa đã chọn ({selectedIds.size})
//                     </button>
//                     <Link
//                         to="/admin/categories-add"
//                         className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
//                     >
//                         <MdAdd /> Thêm danh mục
//                     </Link>
//                 </div>
//             </div>

//             {/* Row 2: Search + Filters + Column Toggle */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <div className="relative w-full sm:w-96">
//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MdSearch /></span>
//                     <input
//                         value={query}
//                         onChange={(e) => setQuery(e.target.value)}
//                         placeholder="Tìm theo tên, slug, mô tả…"
//                         className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                 </div>

//                 <div className="flex items-center gap-2">
//                     <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
//                         <MdFilterList /> Filters
//                     </button>

//                     <div className="relative">
//                         <button
//                             ref={colBtnRef}
//                             onClick={() => setOpenColMenu(v => !v)}
//                             className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                             title="Chọn cột hiển thị"
//                             aria-expanded={openColMenu}
//                         >
//                             <MdMenu />
//                         </button>

//                         {openColMenu && (
//                             <div
//                                 ref={colMenuRef}
//                                 className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-3 z-10"
//                             >
//                                 <div className="font-semibold mb-2">Toggle Columns</div>
//                                 <div className="space-y-2">
//                                     {[
//                                         { key: "image", label: "Image" },
//                                         { key: "name", label: "Category Name" },
//                                         { key: "description", label: "Description" },
//                                         { key: "slug", label: "Slug" },
//                                         { key: "products", label: "Products" },
//                                     ].map(({ key, label }) => (
//                                         <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
//                                             <input
//                                                 type="checkbox"
//                                                 className="accent-blue-600"
//                                                 checked={showCols[key]}
//                                                 onChange={(e) => setShowCols(s => ({ ...s, [key]: e.target.checked }))}
//                                             />
//                                             <span>{label}</span>
//                                         </label>
//                                     ))}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm">
//                         <thead className="bg-gray-100 text-gray-600">
//                             <tr>
//                                 <th className="w-12 p-0">
//                                     <div className="h-12 flex items-center justify-center">
//                                         <input
//                                             ref={headerCbRef}
//                                             type="checkbox"
//                                             className="accent-blue-600"
//                                             onChange={toggleSelectAllOnPage}
//                                         />
//                                     </div>
//                                 </th>
//                                 {showCols.image && <th className="p-3 text-left">Image</th>}
//                                 {showCols.name && <th className="p-3 text-left">Category Name</th>}
//                                 {showCols.description && <th className="p-3 text-left">Description</th>}
//                                 {showCols.slug && <th className="p-3 text-left">Slug</th>}
//                                 {showCols.products && <th className="p-3 text-left">Products</th>}
//                                 <th className="w-24 p-3 text-right">Actions</th>
//                             </tr>
//                         </thead>

//                         <tbody className="divide-y">
//                             {loading ? (
//                                 <tr><td colSpan={7} className="p-8 text-center text-gray-500">Đang tải…</td></tr>
//                             ) : slice.length === 0 ? (
//                                 <tr><td colSpan={7} className="p-8 text-center text-gray-500">Không có danh mục nào.</td></tr>
//                             ) : (
//                                 slice.map((c) => {
//                                     const isChecked = selectedIds.has(c.id);
//                                     return (
//                                         <tr key={c.id} className="hover:bg-gray-50">
//                                             <td className="w-12 p-0">
//                                                 <div className="h-16 flex items-center justify-center">
//                                                     <input
//                                                         type="checkbox"
//                                                         className="accent-blue-600"
//                                                         checked={isChecked}
//                                                         onChange={() => toggleRow(c.id)}
//                                                     />
//                                                 </div>
//                                             </td>

//                                             {showCols.image && (
//                                                 <td className="p-3">
//                                                     {c.image_url ? (
//                                                         <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-md object-cover border" />
//                                                     ) : (
//                                                         <div className="w-12 h-12 rounded-md border bg-gray-100 flex items-center justify-center text-xs text-gray-500">—</div>
//                                                     )}
//                                                 </td>
//                                             )}
//                                             {showCols.name && (
//                                                 <td className="p-3 align-middle">
//                                                     <Link to={`/admin/categories/${c.id}`} className="font-medium hover:underline">
//                                                         {c.name}
//                                                     </Link>
//                                                 </td>
//                                             )}
//                                             {showCols.description && (
//                                                 <td className="p-3 align-middle text-gray-700">
//                                                     <div className="clamp-1 max-w-[150px]" title={c.description || ""}>
//                                                         {c.description || "—"}
//                                                     </div>
//                                                 </td>
//                                             )}
//                                             {showCols.slug && <td className="p-3 align-middle"><span className="text-gray-700">{c.slug}</span></td>}
//                                             {showCols.products && <td className="p-3 align-middle font-medium">{c.productsCount ?? 0}</td>}

//                                             <td className="p-3 align-middle">
//                                                 <div className="flex items-center justify-end gap-2">
//                                                     <Link
//                                                         to={`/admin/categories-edit/${c.id}`}
//                                                         className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
//                                                         title="Sửa"
//                                                     >
//                                                         <MdEdit />
//                                                     </Link>
//                                                     <button
//                                                         onClick={() => handleDelete(c.id)}
//                                                         className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
//                                                         title="Xóa"
//                                                     >
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

//                 {/* Pagination footer */}
//                 <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
//                     <div className="text-sm text-gray-600">
//                         {total > 0
//                             ? <>Đang hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}</>
//                             : <>Không có dữ liệu</>}
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <button
//                             className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
//                             onClick={() => setPage((p) => Math.max(1, p - 1))}
//                             disabled={page === 1}
//                         >←</button>
//                         <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">{page}</span>
//                         <button
//                             className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
//                             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                             disabled={page === totalPages}
//                         >→</button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
