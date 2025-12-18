// src/pages/CategoryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useParams } from "react-router-dom"; 
import summaryApi from "../common/index.js";
import ProductCard from "../components/layout/ProductCard.jsx";
import useCategories from "../hooks/useCategories";
// Import Icon cho Mobile
import { FiFilter, FiX } from "react-icons/fi"; 

/** ---------------- Config ---------------- */
const SORTS = [
  { key: "id_desc", label: "Liên quan" }, // Rút gọn label cho mobile đỡ chật
  { key: "sold_desc", label: "Bán chạy" },
  { key: "newest", label: "Mới nhất" },
  { key: "price_asc", label: "Giá ↑" },
  { key: "price_desc", label: "Giá ↓" },
  { key: "title_asc", label: "A → Z" },
];
const DEFAULT_LIMIT = 24;
const DEFAULT_PRICE_RANGES = [
  { label: "0đ – 150k", min: 0, max: 150000 },
  { label: "150k – 300k", min: 150000, max: 300000 },
  { label: "300k – 500k", min: 300000, max: 500000 },
  { label: "500k – 700k", min: 500000, max: 700000 },
  { label: "Trên 700k", min: 700000, max: "" },
];

/** ---------------- Utils ---------------- */
const numberOrEmpty = (v) => (v === null || v === undefined || v === "" ? "" : String(Number(v)));
const truthy = (v) => v === "1" || v === "true" || v === true;

/** * ---------------- FilterContent Component ---------------- 
 * Tách nội dung bộ lọc ra riêng để dùng chung cho cả Desktop và Mobile Drawer
 */
function FilterContent({ patch, activeFilters, allCategories, loadingCategories, onCloseMobile }) {
  const { category_id, min, max, inStock } = activeFilters;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 1. Danh mục */}
      <div className="px-4 py-3 border-b">
        <h4 className="mb-2 text-sm font-bold text-gray-800 uppercase">Danh mục</h4>
        <div className="space-y-0.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {loadingCategories ? (
            <div className="px-3 py-2 text-sm text-gray-500">Đang tải...</div>
          ) : (
            (allCategories || []).map((c) => {
              const selected = String(category_id) === String(c.id);
              return (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  onClick={onCloseMobile} // Đóng drawer khi chọn trên mobile
                  className={`w-full text-left block rounded-md px-3 py-2 text-sm transition-colors ${
                    selected
                      ? "text-red-600 font-bold bg-red-50" 
                      : "text-gray-600 hover:text-red-600 hover:bg-gray-50"
                  }`}
                >
                  {c.name}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Giá */}
      <div className="px-4 py-3 border-b">
        <h4 className="mb-2 text-sm font-bold text-gray-800 uppercase">Khoảng giá</h4>
        <div className="space-y-2">
          {DEFAULT_PRICE_RANGES.map((r, idx) => {
            const selected =
              String(min) === String(r.min ?? "") &&
              String(max) === String(r.max ?? "");
            return (
              <label
                key={idx}
                className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border transition-all ${
                    selected ? "border-red-500 bg-red-50" : "border-transparent hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => {
                      patch({
                        min: selected ? "" : (r.min ?? ""),
                        max: selected ? "" : (r.max ?? ""),
                      });
                      onCloseMobile?.();
                  }}
                  className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
                <span className={`text-sm ${selected ? "text-red-600 font-semibold" : "text-gray-700"}`}>
                  {r.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Tình trạng */}
      {/* <div className="px-4 py-3">
        <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            checked={!!inStock}
            onChange={() => {
                patch({ inStock: inStock ? "" : "1" });
                onCloseMobile?.();
            }}
            className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
          />
          <span className="text-sm text-gray-700 font-medium">Chỉ hiện sản phẩm còn hàng</span>
        </label>
      </div> */}
    </div>
  );
}

/** ---------------- Main Page Component ---------------- */
export default function CategoryPage() {
  const [sp, setSp] = useSearchParams();
  const { categoryId: categorySlugFromUrl } = useParams();

  // State hiển thị bộ lọc Mobile
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // URL state
  const q = (sp.get("q") || "").trim();
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.max(12, Number(sp.get("limit") || DEFAULT_LIMIT));
  const categoryIdFromQuery = sp.get("category_id") || ""; 
  const min = sp.get("min") || "";
  const max = sp.get("max") || "";
  const inStock = truthy(sp.get("inStock") || "");
  const sort = sp.get("sort") || "id_desc";

  // Data state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const { categories: allCategories, loading: loadingCategories } = useCategories();

  // Logic active ID
  const activeCategoryId = useMemo(() => {
    if (categoryIdFromQuery) return categoryIdFromQuery;
    if (categorySlugFromUrl && allCategories.length > 0) {
      const activeCat = allCategories.find(c => c.slug === categorySlugFromUrl);
      return activeCat ? activeCat.id : "";
    }
    return "";
  }, [categorySlugFromUrl, categoryIdFromQuery, allCategories]);

  // Logic active Name
  const activeCategoryName = useMemo(() => {
      if (!activeCategoryId || !allCategories.length) return "Tất cả sản phẩm";
      const activeCat = allCategories.find(c => String(c.id) === String(activeCategoryId));
      return activeCat ? activeCat.name : "Kết quả tìm kiếm";
  }, [activeCategoryId, allCategories]);

  // Fetch Data
  useEffect(() => {
    const shouldFetch = !categorySlugFromUrl || (categorySlugFromUrl && activeCategoryId);
    if (!shouldFetch) return;

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const listEndpoint = summaryApi.book?.list || "/books";
        const url = new URL(summaryApi.url(listEndpoint));

        if (q) url.searchParams.set("q", q);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));
        if (activeCategoryId) url.searchParams.set("category_id", activeCategoryId); 
        if (min) url.searchParams.set("min", numberOrEmpty(min));
        if (max) url.searchParams.set("max", numberOrEmpty(max));
        if (inStock) url.searchParams.set("inStock", "1");
        if (sort) url.searchParams.set("sort", sort);

        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Lỗi tải dữ liệu");

        const payload = data?.data || data;
        const resultItems = payload?.items || [];
        const resultTotal = payload?.total ?? 0;

        if (alive) {
          setItems(Array.isArray(resultItems) ? resultItems : []);
          setTotal(Number(resultTotal) || 0);
        }
      } catch (e) {
        if (alive) setErr(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [q, page, limit, activeCategoryId, min, max, inStock, sort, categorySlugFromUrl]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [total, limit]);

  const patch = (obj, resetPage = true) => {
    const next = Object.fromEntries(sp.entries());
    Object.assign(next, obj);
    if (resetPage) next.page = 1;
    Object.keys(next).forEach((k) => {
      if (next[k] === "" || next[k] === null || next[k] === "null") delete next[k];
    });
    setSp(next, { replace: true });
  };

  const setPage = (p) =>
    setSp({ ...Object.fromEntries(sp.entries()), page: String(Math.max(1, Math.min(p, totalPages))) });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-3 md:px-4 py-4 md:py-6">
        
        {/* Breadcrumb & Mobile Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
            <div className="text-sm text-gray-500">
                <Link to="/" className="hover:underline">Trang chủ</Link>
                <span className="mx-1.5">/</span>
                <span className="text-gray-800 font-medium truncate">{activeCategoryName}</span>
            </div>
            {/* Hiển thị số lượng kết quả */}
            <span className="text-xs md:text-sm text-gray-500 hidden md:inline-block">
                Hiển thị <strong>{items.length}</strong> / {total} sản phẩm
            </span>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          
          {/* --- SIDEBAR (DESKTOP) --- */}
          {/* Chỉ hiện trên màn hình md trở lên. Ẩn trên mobile */}
          <aside className="hidden md:block md:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white sticky top-24 overflow-hidden shadow-sm">
                <FilterContent 
                    patch={patch}
                    activeFilters={{ category_id: activeCategoryId, min, max, inStock }}
                    allCategories={allCategories}
                    loadingCategories={loadingCategories}
                    onCloseMobile={() => {}} // Desktop không cần đóng
                />
            </div>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <main className="col-span-12 md:col-span-9">
            
            {/* Toolbar: Mobile Filter + Sort */}
            <div className="mb-4">
                {/* Mobile Filter Button */}
                <div className="md:hidden flex items-center justify-between gap-3 mb-3">
                    <button 
                        onClick={() => setShowMobileFilter(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-2 text-sm font-semibold text-gray-700 active:bg-gray-100 shadow-sm"
                    >
                        <FiFilter /> Bộ lọc
                    </button>
                    <div className="text-xs text-gray-500">
                        {total} sản phẩm
                    </div>
                </div>

                {/* Sort Options (Scroll ngang trên mobile) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    <span className="text-sm text-gray-500 whitespace-nowrap hidden md:block">Sắp xếp:</span>
                    {SORTS.map((s) => (
                    <button
                        key={s.key}
                        onClick={() => patch({ sort: s.key })}
                        className={`shrink-0 rounded-full px-4 py-1.5 text-xs md:text-sm border transition-colors ${sort === s.key
                            ? "border-red-500 bg-red-50 text-red-600 font-medium"
                            : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                        {s.label}
                    </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="min-h-[300px]">
                {loading && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-[280px] rounded-xl bg-gray-200 animate-pulse" />
                    ))}
                  </div>
                )}

                {!loading && !err && items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 mb-2">Không tìm thấy sản phẩm nào</p>
                    <button onClick={() => setSp({})} className="text-red-600 font-medium hover:underline">
                        Xóa bộ lọc
                    </button>
                  </div>
                )}

                {!loading && !err && items.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {items.map((p) => (
                      <ProductCard key={p.id || p._id} product={p} />
                    ))}
                  </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="mt-8 flex justify-center pb-8">
                <nav className="inline-flex items-center gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-100 transition"
                  >
                    &lt;
                  </button>
                  <span className="px-3 text-sm font-medium text-gray-700">
                    Trang {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-2 rounded-lg text-sm disabled:opacity-30 hover:bg-gray-100 transition"
                  >
                     &gt;
                  </button>
                </nav>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* --- MOBILE FILTER DRAWER (OVERLAY) --- */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-[60] md:hidden">
            {/* Backdrop tối màu */}
            <div 
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={() => setShowMobileFilter(false)}
            ></div>
            
            {/* Drawer Content trượt từ phải sang */}
            <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[320px] bg-white shadow-2xl animate-[slideInRight_0.3s_ease-out]">
                <div className="flex flex-col h-full">
                    {/* Header Mobile Filter */}
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                        <span className="font-bold text-gray-800 text-lg">Bộ Lọc</span>
                        <button 
                            onClick={() => setShowMobileFilter(false)}
                            className="p-1 rounded-full hover:bg-gray-200"
                        >
                            <FiX className="text-xl text-gray-600"/>
                        </button>
                    </div>

                    {/* Body Filter (Tái sử dụng FilterContent) */}
                    <div className="flex-1 overflow-y-auto">
                        <FilterContent 
                            patch={patch}
                            activeFilters={{ category_id: activeCategoryId, min, max, inStock }}
                            allCategories={allCategories}
                            loadingCategories={loadingCategories}
                            onCloseMobile={() => setShowMobileFilter(false)}
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="p-4 border-t flex gap-3">
                        <button 
                            onClick={() => {
                                setSp({}); // Reset hết bộ lọc
                                setShowMobileFilter(false);
                            }}
                            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                        >
                            Thiết lập lại
                        </button>
                        <button 
                            onClick={() => setShowMobileFilter(false)}
                            className="flex-1 py-2.5 bg-red-600 rounded-lg text-white font-bold shadow-md hover:bg-red-700"
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}