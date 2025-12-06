// src/pages/admin/AllProducts.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    MdSearch,
    MdDownload,
    MdAdd,
    MdFilterList,
    MdEdit,
    MdDelete,
    MdMenu,
} from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import summaryApi from "../../common";
// import summaryApi, { authHeaders } from "../../common";

// ===== Helpers =====
const toVND = (n) =>
    (Number(n) || 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });

// Giá hiệu lực: ưu tiên BE tính sẵn (effective_price),
// fallback active_flashsale.sale_price, cuối cùng là price
const effectivePrice = (b) => {
    if (
        b?.effective_price != null &&
        !Number.isNaN(Number(b.effective_price))
    ) {
        return Number(b.effective_price);
    }
    const sale = b?.active_flashsale;
    if (
        sale &&
        sale.sale_price != null &&
        !Number.isNaN(Number(sale.sale_price))
    ) {
        return Number(sale.sale_price);
    }
    return Number(b?.price) || 0;
};

function stockLabel(stock) {
    const s = Number(stock) || 0;
    if (s === 0) return { text: "Hết hàng", color: "text-red-600" };
    if (s <= 20) return { text: "Sắp hết", color: "text-amber-600" };
    return { text: "Còn hàng", color: "text-emerald-600" };
}
function stockBarClass(stock) {
    const s = Number(stock) || 0;
    if (s === 0) return "bg-red-500";
    if (s <= 20) return "bg-amber-500";
    return "bg-emerald-500";
}
function dateVN(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return "-";
    }
}

const COL_KEY = "admin.products.table.columns";
const INITIAL_FILTERS = {
    category: "",
    stock: "",
    priceMin: "",
    priceMax: "",
    dateFrom: "",
    dateTo: "",
};

export default function AllProducts() {
    const location = useLocation();
    const navigate = useNavigate();

    // Search query đồng bộ URL
    const [query, setQuery] = useState(
        () => new URLSearchParams(location.search).get("q") || ""
    );
    const [page, setPage] = useState(1);
    const pageSize = 7;

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // Lọc
    const [filters, setFilters] = useState({ ...INITIAL_FILTERS });
    const [filterDraft, setFilterDraft] = useState({ ...INITIAL_FILTERS });
    const [openFilter, setOpenFilter] = useState(false);
    const filterBtnRef = useRef(null);
    const filterMenuRef = useRef(null);

    // Danh mục
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [categoryLoading, setCategoryLoading] = useState(false);

    // Toggle cột
    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved
            ? JSON.parse(saved)
            : {
                product: true,
                author: true,
                stock: true,
                price: true,
                createdAt: true,
            };
    });
    useEffect(
        () => localStorage.setItem(COL_KEY, JSON.stringify(showCols)),
        [showCols]
    );

    // Column chooser popover
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

    // Filter popover
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
        if (openFilter) setFilterDraft({ ...filters });
    }, [openFilter, filters]);

    // Load categories cho filter
    useEffect(() => {
        let ignore = false;
        const ctrl = new AbortController();

        (async () => {
            try {
                setCategoryLoading(true);
                const url = new URL(summaryApi.url(summaryApi.category.list));
                url.searchParams.set("page", "1");
                url.searchParams.set("limit", "100");
                // ⚠️ FIX: backend chỉ chấp nhận name_asc/name_desc, không phải "name"
                url.searchParams.set("sort", "name_asc");
                const res = await fetch(url.toString(), { signal: ctrl.signal });
                if (!res.ok) throw new Error(`Fetch categories failed: ${res.status}`);
                const data = await res.json();
                if (ignore) return;

                // Linh hoạt cấu trúc trả về
                const items = Array.isArray(data.items)
                    ? data.items
                    : Array.isArray(data.data?.items)
                        ? data.data.items
                        : Array.isArray(data.data)
                            ? data.data
                            : [];
                setCategoryOptions(items);
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error(error);
                    toast.error(
                        "Không tải được danh mục. Vui lòng kiểm tra API /categories"
                    );
                }
            } finally {
                if (!ignore) setCategoryLoading(false);
            }
        })();

        return () => {
            ignore = true;
            ctrl.abort();
        };
    }, []);

    // Fetch danh sách sách (đã gửi filter xuống backend)
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

                if (filters.category)
                    url.searchParams.set("category_id", filters.category);
                if (filters.stock) url.searchParams.set("stock", filters.stock);
                if (filters.priceMin)
                    url.searchParams.set("min", String(filters.priceMin));
                if (filters.priceMax)
                    url.searchParams.set("max", String(filters.priceMax));
                if (filters.dateFrom)
                    url.searchParams.set("created_from", filters.dateFrom);
                if (filters.dateTo)
                    url.searchParams.set("created_to", filters.dateTo);

                const res = await fetch(url.toString(), { signal: ctrl.signal });
                if (!res.ok) throw new Error(`Fetch books failed: ${res.status}`);
                const data = await res.json();
                if (ignore) return;

                setItems(Array.isArray(data.items) ? data.items : []);
                setTotal(data.total ?? data?.meta?.total ?? data?.count ?? 0);
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
    }, [
        query,
        page,
        filters.category,
        filters.stock,
        filters.priceMin,
        filters.priceMax,
        filters.dateFrom,
        filters.dateTo,
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Reset về page 1 khi thay đổi filter hiển thị hoặc query
    useEffect(() => {
        setPage(1);
    }, [
        query,
        filters.category,
        filters.stock,
        filters.priceMin,
        filters.priceMax,
        filters.dateFrom,
        filters.dateTo,
    ]);

    // Sync query từ URL -> state
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlQuery = params.get("q") || "";
        setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
    }, [location.search]);

    // Sync state -> URL
    useEffect(() => {
        const trimmed = query.trim();
        const params = new URLSearchParams(location.search);
        const current = params.get("q") || "";
        if (trimmed === current) return;
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
        navigate(
            {
                pathname: location.pathname,
                search: params.toString() ? `?${params.toString()}` : "",
            },
            { replace: true }
        );
    }, [query, location.pathname, location.search, navigate]);

    // Broadcast & listen admin:search events (nếu có search box bên ngoài)
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const handler = (event) => {
            const nextValue =
                typeof event?.detail?.query === "string" ? event.detail.query : "";
            setQuery(nextValue);
        };
        window.addEventListener("admin:search", handler);
        return () => window.removeEventListener("admin:search", handler);
    }, []);
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        window.dispatchEvent(
            new CustomEvent("admin:search:reflect", { detail: { query } })
        );
    }, [query]);

    // ĐÃ ĐƯA FILTER XUỐNG BACKEND → ở đây visibleItems = items
    const visibleItems = useMemo(() => items, [items]);
    const hasLocalFilters = false;
    const columnCount = 1 + Object.values(showCols).filter(Boolean).length + 1;

    // Selection
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const headerCbRef = useRef(null);

    useEffect(() => {
        setSelectedIds(new Set());
    }, [
        items,
        filters.stock,
        filters.priceMin,
        filters.priceMax,
        filters.category,
        filters.dateFrom,
        filters.dateTo,
    ]);

    useEffect(() => {
        const idsOnPage = visibleItems.map((b) => b.id);
        const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
        if (headerCbRef.current) {
            headerCbRef.current.indeterminate =
                checkedCount > 0 && checkedCount < idsOnPage.length;
            headerCbRef.current.checked =
                checkedCount === idsOnPage.length && idsOnPage.length > 0;
        }
    }, [visibleItems, selectedIds]);

    const toggleSelectAllOnPage = (e) => {
        const checked = e.target.checked;
        const idsOnPage = visibleItems.map((b) => b.id);
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
            const res = await fetch(summaryApi.url(summaryApi.book.delete(id)), {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`Xóa thất bại: ${res.status}`);
            toast.success("Đã xóa sách");
            setItems((prev) => prev.filter((x) => x.id !== id));
            setTotal((t) => Math.max(0, t - 1));
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (e) {
            console.error(e);
            toast.error("Có lỗi khi xóa sách");
        }
    };

    // API bulk delete
    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) {
            toast.info("Chưa chọn sản phẩm nào.");
            return;
        }
        if (!confirm(`Xóa ${ids.length} sản phẩm đã chọn?`)) return;

        try {
            let okCount = 0;
            for (const id of ids) {
                const res = await fetch(summaryApi.url(summaryApi.book.delete(id)), {
                    method: "DELETE",
                });
                if (res.ok) okCount++;
            }

            toast.success(`Đã xóa ${okCount}/${ids.length} sản phẩm`);
            setItems((prev) => prev.filter((x) => !selectedIds.has(x.id)));
            setTotal((t) => Math.max(0, t - okCount));
            setSelectedIds(new Set());
        } catch (e) {
            console.error(e);
            toast.error("Có lỗi khi xóa hàng loạt");
        }
    };

    // Export CSV (giá dùng giá hiệu lực)
    const handleExportCSV = () => {
        if (!visibleItems.length) {
            toast.info("Không có dữ liệu để export");
            return;
        }
        const headers = [
            "ID",
            "Title",
            "Author",
            "Effective Price",
            "Base Price",
            "Stock",
            "Created At",
        ];
        const rows = visibleItems.map((b) => [
            b.id,
            `"${String(b.title || "").replace(/"/g, '""')}"`,
            `"${String(b.author || "").replace(/"/g, '""')}"`,
            effectivePrice(b),
            Number(b.price) || 0,
            Number(b.stock) || 0,
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

    const applyFilters = (e) => {
        e.preventDefault();
        if (filterDraft.priceMin && filterDraft.priceMax) {
            const min = Number(filterDraft.priceMin);
            const max = Number(filterDraft.priceMax);
            if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
                toast.error("Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa");
                return;
            }
        }

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
        () =>
            [
                filters.category,
                filters.stock,
                filters.priceMin,
                filters.priceMax,
                filters.dateFrom,
                filters.dateTo,
            ].filter(Boolean).length,
        [filters]
    );

    const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd =
        total === 0
            ? 0
            : Math.min(total, (page - 1) * pageSize + visibleItems.length);

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
                        title="Xóa tất cả sản phẩm đã chọn"
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <MdSearch />
                    </span>
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                        }}
                        placeholder="Tìm theo tên sách, tác giả…"
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
                                className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-20 space-y-3"
                            >
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-600">
                                        Danh mục
                                    </label>
                                    <select
                                        value={filterDraft.category}
                                        onChange={(e) =>
                                            setFilterDraft((prev) => ({
                                                ...prev,
                                                category: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả</option>
                                        {categoryLoading ? (
                                            <option disabled>Đang tải…</option>
                                        ) : (
                                            categoryOptions.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-600">
                                        Tồn kho
                                    </label>
                                    <select
                                        value={filterDraft.stock}
                                        onChange={(e) =>
                                            setFilterDraft((prev) => ({
                                                ...prev,
                                                stock: e.target.value,
                                            }))
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="in">Còn hàng (&gt; 20)</option>
                                        <option value="low">Sắp hết (&le; 20)</option>
                                        <option value="out">Hết hàng</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-600">
                                            Giá tối thiểu
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={filterDraft.priceMin}
                                            onChange={(e) =>
                                                setFilterDraft((prev) => ({
                                                    ...prev,
                                                    priceMin: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-600">
                                            Giá tối đa
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={filterDraft.priceMax}
                                            onChange={(e) =>
                                                setFilterDraft((prev) => ({
                                                    ...prev,
                                                    priceMax: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Lọc theo ngày tạo */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-600">
                                            Từ ngày
                                        </label>
                                        <input
                                            type="date"
                                            value={filterDraft.dateFrom}
                                            onChange={(e) =>
                                                setFilterDraft((prev) => ({
                                                    ...prev,
                                                    dateFrom: e.target.value,
                                                }))
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-600">
                                            Đến ngày
                                        </label>
                                        <input
                                            type="date"
                                            value={filterDraft.dateTo}
                                            onChange={(e) =>
                                                setFilterDraft((prev) => ({
                                                    ...prev,
                                                    dateTo: e.target.value,
                                                }))
                                            }
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
                                        { key: "product", label: "Product" },
                                        { key: "author", label: "Author" },
                                        { key: "stock", label: "Stock" },
                                        { key: "price", label: "Price" },
                                        { key: "createdAt", label: "Created At" },
                                    ].map(({ key, label }) => (
                                        <label
                                            key={key}
                                            className="flex items-center gap-2 text-sm cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                className="accent-blue-600"
                                                checked={!!showCols[key]}
                                                onChange={(e) =>
                                                    setShowCols((s) => ({
                                                        ...s,
                                                        [key]: e.target.checked,
                                                    }))
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
                                {showCols.createdAt && (
                                    <th className="p-3 text-left">Ngày tạo</th>
                                )}
                                <th className="w-24 p-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={columnCount}
                                        className="p-8 text-center text-gray-500"
                                    >
                                        Đang tải…
                                    </td>
                                </tr>
                            ) : visibleItems.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columnCount}
                                        className="p-8 text-center text-gray-500"
                                    >
                                        Không có sách nào.
                                    </td>
                                </tr>
                            ) : (
                                visibleItems.map((b) => {
                                    const checked = selectedIds.has(b.id);
                                    const base = Number(b.price) || 0;
                                    const shown = effectivePrice(b);

                                    const sale =
                                        b?.active_flashsale &&
                                        b.active_flashsale.sale_price != null;
                                    const hasSale =
                                        sale &&
                                        !Number.isNaN(
                                            Number(b.active_flashsale.sale_price)
                                        ) &&
                                        Number(b.active_flashsale.sale_price) < base;

                                    // Bar (trên) + dòng số lượng (dưới)
                                    const pct = Math.min(100, (Number(b.stock) / 50) * 100);
                                    const barClass = stockBarClass(b.stock);
                                    const s = stockLabel(b.stock);

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
                                                                to={`/admin/products-edit/${b.id}`}
                                                                className="font-medium hover:underline"
                                                            >
                                                                {b.title}
                                                            </Link>
                                                            <div className="text-xs text-gray-500">
                                                                #{b.slug || b.isbn || b.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}

                                            {showCols.author && (
                                                <td className="p-3">{b.author || "—"}</td>
                                            )}

                                            {showCols.stock && (
                                                <td className="p-3">
                                                    <div className="min-w-[180px]">
                                                        {/* Thanh trạng thái ở TRÊN */}
                                                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                                            <div
                                                                className={`h-2 ${barClass}`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        {/* Số lượng ở DƯỚI */}
                                                        <div className="mt-1 text-xs flex items-center justify-between">
                                                            <span className={`font-medium ${s.color}`}>
                                                                {s.text}
                                                            </span>
                                                            <span className="text-gray-600">
                                                                Còn: <strong>{Number(b.stock) || 0}</strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}

                                            {showCols.price && (
                                                <td className="p-3 font-medium">
                                                    <div className="flex flex-col leading-5">
                                                        <span className="text-emerald-600">
                                                            {toVND(shown)}
                                                        </span>
                                                        {hasSale && (
                                                            <span className="text-xs text-gray-500 line-through">
                                                                {toVND(base)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            )}

                                            {showCols.createdAt && (
                                                <td className="p-3">{dateVN(b.created_at)}</td>
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
                <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {total > 0 ? (
                            <>Đang hiển thị {pageStart}–{pageEnd} / {total}</>
                        ) : (
                            <>Không có dữ liệu</>
                        )}
                        {activeFilterCount > 0 && total > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                                (Đang áp dụng {activeFilterCount} bộ lọc)
                            </span>
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
                        <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">
                            {page}
                        </span>
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


//code goc
// // src/pages/admin/AllProducts.jsx
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//     MdSearch,
//     MdDownload,
//     MdAdd,
//     MdFilterList,
//     MdEdit,
//     MdDelete,
//     MdMenu,
// } from "react-icons/md";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// // ===== Helpers =====
// const toVND = (n) =>
//     (Number(n) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// // Giá hiệu lực: ưu tiên sale_price (nếu có số hợp lệ), fallback price
// const effectivePrice = (b) => {
//     const sp = b?.sale_price;
//     const hasSale =
//         sp !== null && sp !== undefined && sp !== "" && !Number.isNaN(Number(sp));
//     return hasSale ? Number(sp) : Number(b?.price) || 0;
// };

// function stockLabel(stock) {
//     const s = Number(stock) || 0;
//     if (s === 0) return { text: "Hết hàng", color: "text-red-600" };
//     if (s <= 20) return { text: "Sắp hết", color: "text-amber-600" };
//     return { text: "Còn hàng", color: "text-emerald-600" };
// }
// function stockBarClass(stock) {
//     const s = Number(stock) || 0;
//     if (s === 0) return "bg-red-500";
//     if (s <= 20) return "bg-amber-500";
//     return "bg-emerald-500";
// }
// function dateVN(iso) {
//     try {
//         const d = new Date(iso);
//         return d.toLocaleDateString("vi-VN", {
//             day: "2-digit",
//             month: "2-digit",
//             year: "numeric",
//         });
//     } catch {
//         return "-";
//     }
// }

// const COL_KEY = "admin.products.table.columns";
// const INITIAL_FILTERS = {
//     category: "",
//     stock: "",
//     priceMin: "",
//     priceMax: "",
// };

// export default function AllProducts() {
//     const location = useLocation();
//     const navigate = useNavigate();

//     // Search query đồng bộ URL
//     const [query, setQuery] = useState(
//         () => new URLSearchParams(location.search).get("q") || ""
//     );
//     const [page, setPage] = useState(1);
//     const pageSize = 7;

//     const [items, setItems] = useState([]);
//     const [total, setTotal] = useState(0);
//     const [loading, setLoading] = useState(false);

//     // Lọc
//     const [filters, setFilters] = useState({ ...INITIAL_FILTERS });
//     const [filterDraft, setFilterDraft] = useState({ ...INITIAL_FILTERS });
//     const [openFilter, setOpenFilter] = useState(false);
//     const filterBtnRef = useRef(null);
//     const filterMenuRef = useRef(null);

//     // Danh mục
//     const [categoryOptions, setCategoryOptions] = useState([]);
//     const [categoryLoading, setCategoryLoading] = useState(false);

//     // Toggle cột
//     const [showCols, setShowCols] = useState(() => {
//         const saved = localStorage.getItem(COL_KEY);
//         return saved
//             ? JSON.parse(saved)
//             : { product: true, author: true, stock: true, price: true, createdAt: true };
//     });
//     useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

//     // Column chooser popover
//     const [openColMenu, setOpenColMenu] = useState(false);
//     const colBtnRef = useRef(null);
//     const colMenuRef = useRef(null);
//     useEffect(() => {
//         function onClickOutside(e) {
//             if (
//                 openColMenu &&
//                 colMenuRef.current &&
//                 !colMenuRef.current.contains(e.target) &&
//                 colBtnRef.current &&
//                 !colBtnRef.current.contains(e.target)
//             ) {
//                 setOpenColMenu(false);
//             }
//         }
//         function onEsc(e) {
//             if (e.key === "Escape") setOpenColMenu(false);
//         }
//         window.addEventListener("click", onClickOutside);
//         window.addEventListener("keydown", onEsc);
//         return () => {
//             window.removeEventListener("click", onClickOutside);
//             window.removeEventListener("keydown", onEsc);
//         };
//     }, [openColMenu]);

//     // Filter popover
//     useEffect(() => {
//         if (!openFilter) return undefined;

//         function onClickOutside(e) {
//             if (
//                 filterMenuRef.current &&
//                 !filterMenuRef.current.contains(e.target) &&
//                 filterBtnRef.current &&
//                 !filterBtnRef.current.contains(e.target)
//             ) {
//                 setOpenFilter(false);
//             }
//         }
//         function onEsc(e) {
//             if (e.key === "Escape") setOpenFilter(false);
//         }
//         window.addEventListener("click", onClickOutside);
//         window.addEventListener("keydown", onEsc);
//         return () => {
//             window.removeEventListener("click", onClickOutside);
//             window.removeEventListener("keydown", onEsc);
//         };
//     }, [openFilter]);

//     useEffect(() => {
//         if (openFilter) setFilterDraft({ ...filters });
//     }, [openFilter, filters]);

//     // Load categories cho filter
//     useEffect(() => {
//         let ignore = false;
//         const ctrl = new AbortController();

//         (async () => {
//             try {
//                 setCategoryLoading(true);
//                 const url = new URL(summaryApi.url(summaryApi.category.list));
//                 url.searchParams.set("page", "1");
//                 url.searchParams.set("limit", "200");
//                 url.searchParams.set("sort", "name");
//                 const res = await fetch(url.toString(), { signal: ctrl.signal });
//                 if (!res.ok) throw new Error(`Fetch categories failed: ${res.status}`);
//                 const data = await res.json();
//                 if (!ignore) setCategoryOptions(Array.isArray(data.items) ? data.items : []);
//             } catch (error) {
//                 if (error.name !== "AbortError") console.error(error);
//             } finally {
//                 if (!ignore) setCategoryLoading(false);
//             }
//         })();

//         return () => {
//             ignore = true;
//             ctrl.abort();
//         };
//     }, []);

//     // Fetch danh sách sách
//     useEffect(() => {
//         let ignore = false;
//         const ctrl = new AbortController();

//         (async () => {
//             try {
//                 setLoading(true);
//                 const url = new URL(summaryApi.url(summaryApi.book.list));
//                 if (query.trim()) url.searchParams.set("q", query.trim());
//                 url.searchParams.set("page", String(page));
//                 url.searchParams.set("limit", String(pageSize));
//                 url.searchParams.set("sort", "newest");
//                 if (filters.category) url.searchParams.set("category_id", filters.category);

//                 const res = await fetch(url.toString(), { signal: ctrl.signal });
//                 if (!res.ok) throw new Error(`Fetch books failed: ${res.status}`);
//                 const data = await res.json();
//                 if (ignore) return;

//                 // BE nên trả sale_price trong list; nếu chưa, FE vẫn chạy (fallback price)
//                 setItems(Array.isArray(data.items) ? data.items : []);
//                 setTotal(data.total ?? data?.meta?.total ?? data?.count ?? 0);
//             } catch (e) {
//                 if (e.name !== "AbortError") {
//                     console.error(e);
//                     toast.error(e.message || "Không tải được danh sách sách");
//                 }
//             } finally {
//                 if (!ignore) setLoading(false);
//             }
//         })();

//         return () => {
//             ignore = true;
//             ctrl.abort();
//         };
//     }, [query, page, filters.category]);

//     const totalPages = Math.max(1, Math.ceil(total / pageSize));

//     // Reset về page 1 khi thay đổi filter hiển thị hoặc query
//     useEffect(() => {
//         setPage(1);
//     }, [query, filters.category, filters.stock, filters.priceMin, filters.priceMax]);

//     // Sync query từ URL -> state
//     useEffect(() => {
//         const params = new URLSearchParams(location.search);
//         const urlQuery = params.get("q") || "";
//         setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
//     }, [location.search]);

//     // Sync state -> URL
//     useEffect(() => {
//         const trimmed = query.trim();
//         const params = new URLSearchParams(location.search);
//         const current = params.get("q") || "";
//         if (trimmed === current) return;
//         if (trimmed) params.set("q", trimmed);
//         else params.delete("q");
//         navigate(
//             { pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" },
//             { replace: true }
//         );
//     }, [query, location.pathname, location.search, navigate]);

//     // Broadcast & listen admin:search events (nếu có search box bên ngoài)
//     useEffect(() => {
//         if (typeof window === "undefined") return undefined;
//         const handler = (event) => {
//             const nextValue = typeof event?.detail?.query === "string" ? event.detail.query : "";
//             setQuery(nextValue);
//         };
//         window.addEventListener("admin:search", handler);
//         return () => window.removeEventListener("admin:search", handler);
//     }, []);
//     useEffect(() => {
//         if (typeof window === "undefined") return undefined;
//         window.dispatchEvent(new CustomEvent("admin:search:reflect", { detail: { query } }));
//     }, [query]);

//     // Lọc local theo stock + giá hiệu lực + danh mục
//     const visibleItems = useMemo(() => {
//         return items.filter((b) => {
//             const stockNumber = Number(b.stock) || 0;
//             if (filters.stock === "out" && stockNumber > 0) return false;
//             if (filters.stock === "low" && stockNumber > 20) return false;
//             if (filters.stock === "in" && stockNumber <= 20) return false;

//             const eff = effectivePrice(b);
//             if (filters.priceMin && eff < Number(filters.priceMin)) return false;
//             if (filters.priceMax && eff > Number(filters.priceMax)) return false;

//             if (filters.category && Array.isArray(b.categories)) {
//                 const match = b.categories.some(
//                     (c) => String(c.id) === String(filters.category)
//                 );
//                 if (!match) return false;
//             } else if (filters.category && b.category_id && String(b.category_id) !== String(filters.category)) {
//                 return false;
//             }
//             return true;
//         });
//     }, [items, filters]);

//     const hasLocalFilters = Boolean(filters.stock || filters.priceMin || filters.priceMax);
//     const columnCount = 1 + Object.values(showCols).filter(Boolean).length + 1;

//     // Selection
//     const [selectedIds, setSelectedIds] = useState(() => new Set());
//     const headerCbRef = useRef(null);

//     useEffect(() => {
//         setSelectedIds(new Set());
//     }, [items, filters.stock, filters.priceMin, filters.priceMax, filters.category]);

//     useEffect(() => {
//         const idsOnPage = visibleItems.map((b) => b.id);
//         const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
//         if (headerCbRef.current) {
//             headerCbRef.current.indeterminate =
//                 checkedCount > 0 && checkedCount < idsOnPage.length;
//             headerCbRef.current.checked =
//                 checkedCount === idsOnPage.length && idsOnPage.length > 0;
//         }
//     }, [visibleItems, selectedIds]);

//     const toggleSelectAllOnPage = (e) => {
//         const checked = e.target.checked;
//         const idsOnPage = visibleItems.map((b) => b.id);
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

//     // API delete single
//     const handleDelete = async (id) => {
//         if (!confirm("Bạn chắc chắn muốn xóa sách này?")) return;
//         try {
//             const res = await fetch(summaryApi.url(summaryApi.book.delete(id)), {
//                 method: "DELETE",
//             });
//             if (!res.ok) throw new Error(`Xóa thất bại: ${res.status}`);
//             toast.success("Đã xóa sách");
//             setItems((prev) => prev.filter((x) => x.id !== id));
//             setTotal((t) => Math.max(0, t - 1));
//             setSelectedIds((prev) => {
//                 const next = new Set(prev);
//                 next.delete(id);
//                 return next;
//             });
//         } catch (e) {
//             console.error(e);
//             toast.error("Có lỗi khi xóa sách");
//         }
//     };

//     // API bulk delete
//     const handleBulkDelete = async () => {
//         const ids = Array.from(selectedIds);
//         if (ids.length === 0) {
//             toast.info("Chưa chọn sản phẩm nào.");
//             return;
//         }
//         if (!confirm(`Xóa ${ids.length} sản phẩm đã chọn?`)) return;

//         try {
//             let okCount = 0;
//             for (const id of ids) {
//                 const res = await fetch(summaryApi.url(summaryApi.book.delete(id)), {
//                     method: "DELETE",
//                 });
//                 if (res.ok) okCount++;
//             }

//             toast.success(`Đã xóa ${okCount}/${ids.length} sản phẩm`);
//             setItems((prev) => prev.filter((x) => !selectedIds.has(x.id)));
//             setTotal((t) => Math.max(0, t - okCount));
//             setSelectedIds(new Set());
//         } catch (e) {
//             console.error(e);
//             toast.error("Có lỗi khi xóa hàng loạt");
//         }
//     };

//     // Export CSV (giá dùng giá hiệu lực)
//     const handleExportCSV = () => {
//         if (!visibleItems.length) {
//             toast.info("Không có dữ liệu để export");
//             return;
//         }
//         const headers = ["ID", "Title", "Author", "Effective Price", "Base Price", "Stock", "Created At"];
//         const rows = visibleItems.map((b) => [
//             b.id,
//             `"${String(b.title || "").replace(/"/g, '""')}"`,
//             `"${String(b.author || "").replace(/"/g, '""')}"`,
//             effectivePrice(b),
//             Number(b.price) || 0,
//             Number(b.stock) || 0,
//             dateVN(b.created_at),
//         ]);
//         const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
//         const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;
//         a.download = "products.csv";
//         a.click();
//         URL.revokeObjectURL(url);
//     };

//     const applyFilters = (e) => {
//         e.preventDefault();
//         if (filterDraft.priceMin && filterDraft.priceMax) {
//             const min = Number(filterDraft.priceMin);
//             const max = Number(filterDraft.priceMax);
//             if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
//                 toast.error("Giá tối thiểu phải nhỏ hơn hoặc bằng giá tối đa");
//                 return;
//             }
//         }
//         setFilters({ ...filterDraft });
//         setOpenFilter(false);
//     };

//     const clearFilters = () => {
//         setFilters({ ...INITIAL_FILTERS });
//         setFilterDraft({ ...INITIAL_FILTERS });
//         setOpenFilter(false);
//     };

//     const activeFilterCount = useMemo(
//         () =>
//             [filters.category, filters.stock, filters.priceMin, filters.priceMax].filter(
//                 Boolean
//             ).length,
//         [filters]
//     );

//     const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
//     const pageEnd =
//         total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + visibleItems.length);

//     return (
//         <div className="space-y-5">
//             {/* ==== Title + Export + Add + BulkDelete ==== */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <h1 className="text-2xl font-bold">Books</h1>
//                 <div className="flex items-center gap-2">
//                     <button
//                         onClick={handleExportCSV}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                     >
//                         <MdDownload /> Export
//                     </button>
//                     <button
//                         onClick={handleBulkDelete}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 disabled:opacity-50"
//                         disabled={selectedIds.size === 0}
//                         title="Xóa tất cả sản phẩm đã chọn"
//                     >
//                         <MdDelete /> Xóa đã chọn ({selectedIds.size})
//                     </button>
//                     <Link
//                         to="/admin/products-add"
//                         className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
//                     >
//                         <MdAdd /> Thêm sản phẩm
//                     </Link>
//                 </div>
//             </div>

//             {/* ==== Search + Filters + Column chooser ==== */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <div className="relative w-full sm:w-96">
//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                         <MdSearch />
//                     </span>
//                     <input
//                         value={query}
//                         onChange={(e) => {
//                             setQuery(e.target.value);
//                         }}
//                         placeholder="Tìm theo tên sách, tác giả…"
//                         className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                 </div>

//                 <div className="flex items-center gap-2">
//                     {/* Filters */}
//                     <div className="relative">
//                         <button
//                             ref={filterBtnRef}
//                             onClick={() => setOpenFilter((v) => !v)}
//                             className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                             aria-expanded={openFilter}
//                         >
//                             <MdFilterList /> Filters
//                             {activeFilterCount > 0 && (
//                                 <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-medium text-white">
//                                     {activeFilterCount}
//                                 </span>
//                             )}
//                         </button>
//                         {openFilter && (
//                             <form
//                                 ref={filterMenuRef}
//                                 onSubmit={applyFilters}
//                                 className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-20 space-y-3"
//                             >
//                                 <div>
//                                     <label className="mb-1 block text-sm font-medium text-gray-600">
//                                         Danh mục
//                                     </label>
//                                     <select
//                                         value={filterDraft.category}
//                                         onChange={(e) =>
//                                             setFilterDraft((prev) => ({ ...prev, category: e.target.value }))
//                                         }
//                                         className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                     >
//                                         <option value="">Tất cả</option>
//                                         {categoryLoading ? (
//                                             <option disabled>Đang tải…</option>
//                                         ) : (
//                                             categoryOptions.map((cat) => (
//                                                 <option key={cat.id} value={cat.id}>
//                                                     {cat.name}
//                                                 </option>
//                                             ))
//                                         )}
//                                     </select>
//                                 </div>
//                                 <div>
//                                     <label className="mb-1 block text-sm font-medium text-gray-600">
//                                         Tồn kho
//                                     </label>
//                                     <select
//                                         value={filterDraft.stock}
//                                         onChange={(e) =>
//                                             setFilterDraft((prev) => ({ ...prev, stock: e.target.value }))
//                                         }
//                                         className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                     >
//                                         <option value="">Tất cả</option>
//                                         <option value="in">Còn hàng (&gt; 20)</option>
//                                         <option value="low">Sắp hết (&le; 20)</option>
//                                         <option value="out">Hết hàng</option>
//                                     </select>
//                                 </div>
//                                 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
//                                     <div>
//                                         <label className="mb-1 block text-sm font-medium text-gray-600">
//                                             Giá tối thiểu
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min={0}
//                                             value={filterDraft.priceMin}
//                                             onChange={(e) =>
//                                                 setFilterDraft((prev) => ({
//                                                     ...prev,
//                                                     priceMin: e.target.value,
//                                                 }))
//                                             }
//                                             className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="mb-1 block text-sm font-medium text-gray-600">
//                                             Giá tối đa
//                                         </label>
//                                         <input
//                                             type="number"
//                                             min={0}
//                                             value={filterDraft.priceMax}
//                                             onChange={(e) =>
//                                                 setFilterDraft((prev) => ({
//                                                     ...prev,
//                                                     priceMax: e.target.value,
//                                                 }))
//                                             }
//                                             className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                         />
//                                     </div>
//                                 </div>
//                                 <div className="flex items-center justify-between pt-2">
//                                     <button
//                                         type="button"
//                                         onClick={clearFilters}
//                                         className="text-sm font-medium text-gray-500 hover:text-gray-700"
//                                     >
//                                         Xóa lọc
//                                     </button>
//                                     <div className="flex items-center gap-2">
//                                         <button
//                                             type="button"
//                                             onClick={() => setOpenFilter(false)}
//                                             className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
//                                         >
//                                             Đóng
//                                         </button>
//                                         <button
//                                             type="submit"
//                                             className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
//                                         >
//                                             Áp dụng
//                                         </button>
//                                     </div>
//                                 </div>
//                             </form>
//                         )}
//                     </div>

//                     {/* Column chooser */}
//                     <div className="relative">
//                         <button
//                             ref={colBtnRef}
//                             onClick={() => setOpenColMenu((v) => !v)}
//                             className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
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
//                                 <div className="font-medium mb-2">Toggle Columns</div>
//                                 <div className="space-y-2">
//                                     {[
//                                         { key: "product", label: "Product" },
//                                         { key: "author", label: "Author" },
//                                         { key: "stock", label: "Stock" },
//                                         { key: "price", label: "Price" },
//                                         { key: "createdAt", label: "Created At" },
//                                     ].map(({ key, label }) => (
//                                         <label
//                                             key={key}
//                                             className="flex items-center gap-2 text-sm cursor-pointer"
//                                         >
//                                             <input
//                                                 type="checkbox"
//                                                 className="accent-blue-600"
//                                                 checked={!!showCols[key]}
//                                                 onChange={(e) =>
//                                                     setShowCols((s) => ({ ...s, [key]: e.target.checked }))
//                                                 }
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

//             {/* ==== Table ==== */}
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
//                                 {showCols.product && <th className="p-3 text-left">Sách</th>}
//                                 {showCols.author && <th className="p-3 text-left">Tác giả</th>}
//                                 {showCols.stock && <th className="p-3 text-left">Tồn kho</th>}
//                                 {showCols.price && <th className="p-3 text-left">Giá</th>}
//                                 {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
//                                 <th className="w-24 p-3 text-right">Actions</th>
//                             </tr>
//                         </thead>

//                         <tbody className="divide-y">
//                             {loading ? (
//                                 <tr>
//                                     <td colSpan={columnCount} className="p-8 text-center text-gray-500">
//                                         Đang tải…
//                                     </td>
//                                 </tr>
//                             ) : visibleItems.length === 0 ? (
//                                 <tr>
//                                     <td colSpan={columnCount} className="p-8 text-center text-gray-500">
//                                         Không có sách nào.
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 visibleItems.map((b) => {
//                                     const checked = selectedIds.has(b.id);
//                                     const base = Number(b.price) || 0;
//                                     const shown = effectivePrice(b);
//                                     const hasSale =
//                                         b?.sale_price !== null &&
//                                         b?.sale_price !== undefined &&
//                                         b?.sale_price !== "" &&
//                                         Number(b.sale_price) < base;

//                                     // Bar (trên) + dòng số lượng (dưới)
//                                     const pct = Math.min(100, (Number(b.stock) / 50) * 100);
//                                     const barClass = stockBarClass(b.stock);
//                                     const s = stockLabel(b.stock);

//                                     return (
//                                         <tr key={b.id} className="hover:bg-gray-50">
//                                             <td className="w-12 p-0">
//                                                 <div className="h-16 flex items-center justify-center">
//                                                     <input
//                                                         type="checkbox"
//                                                         className="accent-blue-600"
//                                                         checked={checked}
//                                                         onChange={() => toggleRow(b.id)}
//                                                     />
//                                                 </div>
//                                             </td>

//                                             {showCols.product && (
//                                                 <td className="p-3">
//                                                     <div className="flex items-center gap-3">
//                                                         <img
//                                                             src={b.image_url}
//                                                             alt={b.title}
//                                                             className="w-12 h-12 rounded-md object-cover border"
//                                                         />
//                                                         <div>
//                                                             <Link
//                                                                 to={`/admin/products-edit/${b.id}`}
//                                                                 className="font-medium hover:underline"
//                                                             >
//                                                                 {b.title}
//                                                             </Link>
//                                                             <div className="text-xs text-gray-500">
//                                                                 #{b.slug || b.isbn || b.id}
//                                                             </div>
//                                                         </div>
//                                                     </div>
//                                                 </td>
//                                             )}

//                                             {showCols.author && <td className="p-3">{b.author || "—"}</td>}

//                                             {showCols.stock && (
//                                                 <td className="p-3">
//                                                     <div className="min-w-[180px]">
//                                                         {/* Thanh trạng thái ở TRÊN */}
//                                                         <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
//                                                             <div className={`h-2 ${barClass}`} style={{ width: `${pct}%` }} />
//                                                         </div>
//                                                         {/* Số lượng ở DƯỚI */}
//                                                         <div className="mt-1 text-xs flex items-center justify-between">
//                                                             <span className={`font-medium ${s.color}`}>{s.text}</span>
//                                                             <span className="text-gray-600">
//                                                                 Còn: <strong>{Number(b.stock) || 0}</strong>
//                                                             </span>
//                                                         </div>
//                                                     </div>
//                                                 </td>
//                                             )}

//                                             {showCols.price && (
//                                                 <td className="p-3 font-medium">
//                                                     <div className="flex flex-col leading-5">
//                                                         <span className="text-emerald-600">{toVND(shown)}</span>
//                                                         {hasSale && (
//                                                             <span className="text-xs text-gray-500 line-through">
//                                                                 {toVND(base)}
//                                                             </span>
//                                                         )}
//                                                     </div>
//                                                 </td>
//                                             )}

//                                             {showCols.createdAt && (
//                                                 <td className="p-3">{dateVN(b.created_at)}</td>
//                                             )}

//                                             <td className="p-3 align-middle">
//                                                 <div className="flex items-center justify-end gap-2">
//                                                     <Link
//                                                         to={`/admin/products-edit/${b.id}`}
//                                                         className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
//                                                         title="Sửa"
//                                                     >
//                                                         <MdEdit />
//                                                     </Link>
//                                                     <button
//                                                         onClick={() => handleDelete(b.id)}
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

//                 {/* Pagination */}
//                 <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
//                     <div>
//                         {total > 0 ? (
//                             hasLocalFilters ? (
//                                 <>Đang hiển thị {visibleItems.length} sản phẩm trong trang hiện tại / {total}</>
//                             ) : (
//                                 <>Đang hiển thị {pageStart}–{pageEnd} / {total}</>
//                             )
//                         ) : (
//                             <>Không có dữ liệu</>
//                         )}
//                         {activeFilterCount > 0 && total > 0 && (
//                             <span className="ml-2 text-xs text-gray-500">
//                                 (Đang áp dụng {activeFilterCount} bộ lọc)
//                             </span>
//                         )}
//                         {hasLocalFilters && (
//                             <div className="text-xs text-gray-400">
//                                 * Một số bộ lọc áp dụng trên dữ liệu trong trang hiện tại.
//                             </div>
//                         )}
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <button
//                             className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
//                             onClick={() => setPage((p) => Math.max(1, p - 1))}
//                             disabled={page === 1}
//                         >
//                             ←
//                         </button>
//                         <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">{page}</span>
//                         <button
//                             className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
//                             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                             disabled={page === totalPages}
//                         >
//                             →
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
