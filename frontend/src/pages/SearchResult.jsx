// src/pages/SearchResult.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import summaryApi from "../common/index.js";
import ProductCard from "../components/layout/ProductCard.jsx";
import useCategories from "../hooks/useCategories";
// Import Icon cho Mobile
import { FiFilter, FiX } from "react-icons/fi";

/** ---------------- Config ---------------- */
const SORTS = [
  { key: "id_desc", label: "Liên quan" },
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

/** ---------------- Sub-Component: FilterContent ---------------- 
 * Tách ra để dùng chung cho Desktop Sidebar và Mobile Drawer
 */
const FilterContent = ({ 
  patch, 
  activeFilters, 
  allCategories, 
  loadingCategories, 
  onCloseMobile 
}) => {
  const { category_id, min, max } = activeFilters;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 1. Danh mục */}
      <div className="px-4 py-3 border-b">
        <h4 className="mb-2 text-sm font-bold text-gray-800 uppercase">Danh mục</h4>
        <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {loadingCategories ? (
            <div className="text-sm text-gray-500">Đang tải...</div>
          ) : (
            (allCategories || []).map((c) => {
              const value = c.id;
              const selected = String(category_id) === String(value);
              return (
                <label
                  key={value}
                  className={`flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                    selected ? "bg-red-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        patch({ category_id: selected ? "" : value });
                        onCloseMobile?.();
                      }}
                      className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                    <span className={`text-sm ${selected ? "text-red-600 font-semibold" : "text-gray-700"}`}>
                      {c.name}
                    </span>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Giá */}
      <div className="px-4 py-3 border-b">
        <h4 className="mb-2 text-sm font-bold text-gray-800 uppercase">Khoảng giá</h4>
        <div className="space-y-1">
          {DEFAULT_PRICE_RANGES.map((r, idx) => {
            const selected =
              String(min) === String(r.min ?? "") &&
              String(max) === String(r.max ?? "");
            return (
              <label
                key={idx}
                className={`flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                  selected ? "bg-red-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
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
                    className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                  />
                  <span className={`text-sm ${selected ? "text-red-600 font-semibold" : "text-gray-700"}`}>
                    {r.label}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** ---------------- Main Component ---------------- */
export default function SearchResult() {
  const [sp, setSp] = useSearchParams();

  // State bật tắt bộ lọc mobile
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // URL state
  const q = (sp.get("q") || "").trim();
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.max(12, Number(sp.get("limit") || DEFAULT_LIMIT));
  const category_id = sp.get("category_id") || "";
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

  // Fetch API
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const listEndpoint = summaryApi.book?.list || summaryApi.book?.get;
        const url = new URL(summaryApi.url(listEndpoint));

        if (q) url.searchParams.set("q", q);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));
        if (category_id) url.searchParams.set("category_id", category_id);
        if (min) url.searchParams.set("min", numberOrEmpty(min));
        if (max) url.searchParams.set("max", numberOrEmpty(max)); 
        if (inStock) url.searchParams.set("inStock", "1");
        if (sort) url.searchParams.set("sort", sort);

        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg = data?.message || data?.error || "Không thể tải kết quả";
          throw new Error(msg);
        }

        const payload = data?.data || data;
        const resultItems = payload?.items || [];
        const resultTotal = payload?.total ?? 0;

        if (alive) {
          setItems(Array.isArray(resultItems) ? resultItems : []);
          setTotal(Number(resultTotal) || 0);
        }
      } catch (e) {
        if (alive) setErr(e.message || "Lỗi tìm kiếm");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [q, page, limit, category_id, min, max, inStock, sort]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((total || 0) / limit)), [total, limit]);

  // Update URL helper
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

  /** ---------------- UI ---------------- */
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-3 md:px-4 py-4 md:py-6">
        
        {/* Breadcrumb + Title Mobile */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
          <div className="text-sm text-gray-500">
            <Link to="/" className="hover:underline">Trang chủ</Link>
            <span className="mx-1.5">/</span>
            <span className="text-gray-700">Tìm kiếm: <strong className="text-gray-900">"{q}"</strong></span>
          </div>
          <span className="text-xs md:text-sm text-gray-500 hidden md:inline-block">
             Tìm thấy <strong>{total}</strong> kết quả
          </span>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          
          {/* --- SIDEBAR DESKTOP (Ẩn trên mobile) --- */}
          <aside className="hidden md:block md:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white sticky top-24 overflow-hidden shadow-sm">
               <div className="border-b px-4 py-3 bg-gray-50">
                  <h3 className="text-base font-bold text-gray-800">BỘ LỌC TÌM KIẾM</h3>
               </div>
               <FilterContent 
                  patch={patch}
                  activeFilters={{ category_id, min, max }}
                  allCategories={allCategories}
                  loadingCategories={loadingCategories}
                  onCloseMobile={() => {}} 
               />
            </div>
          </aside>

          {/* --- MAIN CONTENT --- */}
          <main className="col-span-12 md:col-span-9">
            
            {/* Toolbar Mobile: Nút Lọc + Sort ngang */}
            <div className="mb-4">
                {/* Mobile Filter Button */}
                <div className="md:hidden flex items-center justify-between gap-3 mb-3">
                    <button 
                        onClick={() => setShowMobileFilter(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-2 text-sm font-semibold text-gray-700 active:bg-gray-100 shadow-sm transition-colors"
                    >
                        <FiFilter /> Bộ lọc tìm kiếm
                    </button>
                    <div className="text-xs text-gray-500 font-medium">
                        {total} kết quả
                    </div>
                </div>

                {/* Horizontal Scroll Sort */}
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

            {/* Grid kết quả */}
            <div className="rounded-2xl border-none md:border border-gray-200 bg-transparent md:bg-white md:p-4 min-h-[300px]">
              
              {loading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-[280px] rounded-xl bg-gray-200 animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && err && (
                <div className="py-16 text-center text-red-600 bg-white rounded-xl">{err}</div>
              )}

              {!loading && !err && items.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl">
                  <p className="text-gray-500 mb-2">Không tìm thấy sản phẩm nào phù hợp.</p>
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

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="mt-8 flex justify-center">
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
            </div>
          </main>
        </div>
      </div>

      {/* --- MOBILE FILTER DRAWER (OVERLAY) --- */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-[60] md:hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={() => setShowMobileFilter(false)}
            ></div>
            
            {/* Content Sidebar Right */}
            <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-[320px] bg-white shadow-2xl animate-[slideInRight_0.3s_ease-out] flex flex-col">
                {/* Header Drawer */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 shrink-0">
                    <span className="font-bold text-gray-800 text-lg">Bộ Lọc Tìm Kiếm</span>
                    <button 
                        onClick={() => setShowMobileFilter(false)}
                        className="p-1 rounded-full hover:bg-gray-200"
                    >
                        <FiX className="text-xl text-gray-600"/>
                    </button>
                </div>

                {/* Body Drawer */}
                <div className="flex-1 overflow-y-auto">
                    <FilterContent 
                        patch={patch}
                        activeFilters={{ category_id, min, max }}
                        allCategories={allCategories}
                        loadingCategories={loadingCategories}
                        onCloseMobile={() => setShowMobileFilter(false)} 
                    />
                </div>

                {/* Footer Drawer */}
                <div className="p-4 border-t flex gap-3 shrink-0 bg-white">
                    <button 
                        onClick={() => {
                            setSp({ q }); // Giữ lại từ khóa search, xóa filter khác
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
                        Xem kết quả
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}