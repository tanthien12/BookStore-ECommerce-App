// src/pages/CategoryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
// ⬇️ Đảm bảo `Link` đã được import
import { useSearchParams, Link, useParams } from "react-router-dom"; 
import summaryApi from "../common/index.js";
import ProductCard from "../components/layout/ProductCard.jsx";
import useCategories from "../hooks/useCategories";

/** ---------------- Config ---------------- */
// (Không thay đổi)
const SORTS = [
  { key: "id_desc", label: "Độ liên quan" },
  { key: "sold_desc", label: "Bán chạy" },
  { key: "newest", label: "Mới nhất" },
  { key: "price_asc", label: "Giá ↑" },
  { key: "price_desc", label: "Giá ↓" },
  { key: "title_asc", label: "Tên A → Z" },
];
const DEFAULT_LIMIT = 24;
const DEFAULT_PRICE_RANGES = [
  { label: "0đ – 150.000đ", min: 0, max: 150000 },
  { label: "150.000đ – 300.000đ", min: 150000, max: 300000 },
  { label: "300.000đ – 500.000đ", min: 300000, max: 500000 },
  { label: "500.000đ – 700.000đ", min: 500000, max: 700000 },
  { label: "700.000đ trở lên", min: 700000, max: "" },
];

/** ---------------- Utils ---------------- */
// (Không thay đổi)
const numberOrEmpty = (v) => (v === null || v === undefined || v === "" ? "" : String(Number(v)));
const truthy = (v) => v === "1" || v === "true" || v === true;

/** ---------------- Sidebar Component ---------------- */
// ⬇️ SỬA LỖI TRONG SIDEBAR
function Sidebar({ patch, activeFilters, allCategories, loadingCategories }) {
  const { category_id, min, max, inStock } = activeFilters;

  return (
    <aside className="col-span-12 md:col-span-3">
      <div className="rounded-2xl border border-gray-200 bg-white">
        
        {/* ⭐️ BẮT ĐẦU SỬA LỖI DANH MỤC ⭐️ */}
        <div className="px-4 py-3 border-b">
          <h4 className="mb-2 text-sm font-semibold text-gray-700">DANH MỤC CHÍNH</h4>
          <div className="space-y-0.5 max-h-[480px] overflow-auto pr-1">
            {loadingCategories ? (
              <div className="px-3 py-2 text-sm text-gray-500">Đang tải...</div>
            ) : (
              (allCategories || []).map((c) => {
                // Dùng category_id (UUID) để xác định mục đang chọn
                const selected = String(category_id) === String(c.id);
                
                return (
                  // Sửa 1: Dùng <Link> thay vì <button>
                  <Link
                    key={c.id}
                    // Sửa 2: Điều hướng đến URL slug mới
                    // Ví dụ: /category/kinh-di
                    // Thao tác này sẽ tự động xóa query string cũ
                    to={`/category/${c.slug}`}
                    className={`w-full text-left block rounded-md px-3 py-2 text-sm transition-colors ${
                      selected
                        ? "text-orange-500 font-semibold" // Kiểu được chọn
                        : "text-gray-700 hover:text-orange-500 hover:bg-orange-50" // Kiểu mặc định
                    }`}
                  >
                    {c.name}
                  </Link>
                );
              })
            )}
          </div>
        </div>
        {/* ⭐️ KẾT THÚC SỬA LỖI ⭐️ */}


        {/* Bộ lọc Giá (Vẫn dùng patch - Đã đúng) */}
        <div className="px-4 py-3 border-b">
          <h4 className="mb-2 text-sm font-semibold text-gray-700">GIÁ</h4>
          <div className="space-y-1">
            {DEFAULT_PRICE_RANGES.map((r, idx) => {
              const selected =
                String(min) === String(r.min ?? "") &&
                String(max) === String(r.max ?? "");
              return (
                <label
                  key={idx}
                  className={`flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer ${selected ? "bg-red-50" : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        patch({
                          min: selected ? "" : (r.min ?? ""),
                          max: selected ? "" : (r.max ?? ""),
                        })
                      }
                      className="h-4 w-4 text-red-600 rounded border-gray-300"
                    />
                    <span className={`text-sm ${selected ? "text-red-600 font-medium" : "text-gray-700"}`}>
                      {r.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Bộ lọc Còn hàng (Vẫn dùng patch - Đã đúng) */}
        <div className="px-4 py-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!inStock}
              onChange={() => patch({ inStock: inStock ? "" : "1" })}
              className="h-4 w-4 text-red-600 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Còn hàng</span>
          </label>
        </div>
      </div>
    </aside>
  );
}

/** ---------------- Main Page Component ---------------- */
// (Logic phần còn lại của file đã đúng, không cần sửa)
export default function CategoryPage() {
  const [sp, setSp] = useSearchParams();
  const { categoryId: categorySlugFromUrl } = useParams();

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

  // Gọi hook để lấy tất cả danh mục
  const { categories: allCategories, loading: loadingCategories } = useCategories();

  // Logic "Phiên dịch" Slug sang UUID 
  const activeCategoryId = useMemo(() => {
    // Khi dùng <Link>, query string sẽ bị xóa,
    // nên `categoryIdFromQuery` sẽ rỗng khi chuyển trang.
    if (categoryIdFromQuery) {
      return categoryIdFromQuery;
    }
    if (categorySlugFromUrl && allCategories.length > 0) {
      const activeCat = allCategories.find(c => c.slug === categorySlugFromUrl);
      return activeCat ? activeCat.id : ""; // Trả về UUID
    }
    return "";
  }, [categorySlugFromUrl, categoryIdFromQuery, allCategories]);

  // Tìm tên danh mục 
  const activeCategoryName = useMemo(() => {
      if (!activeCategoryId || !allCategories.length) return "Tất cả sản phẩm";
      const activeCat = allCategories.find(c => String(c.id) === String(activeCategoryId));
      return activeCat ? activeCat.name : "Kết quả tìm kiếm";
  }, [activeCategoryId, allCategories]);

  // Fetch sách 
  useEffect(() => {
    const shouldFetch = !categorySlugFromUrl || (categorySlugFromUrl && activeCategoryId);
    if (!shouldFetch) {
        return;
    }

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

        if (!res.ok) {
          const msg = data?.message || data?.error || (Array.isArray(data?.detail) ? data.detail[0].msg : "Không thể tải kết quả");
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

    return () => {
      alive = false;
    };
  }, [q, page, limit, activeCategoryId, min, max, inStock, sort, categorySlugFromUrl]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / limit)),
    [total, limit]
  );

  // Hàm patch ( Dùng cho Giá, Còn hàng)
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
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        {/* breadcrumb */}
        <div className="text-sm text-gray-500 mb-2">
          <Link to="/" className="hover:underline">Trang chủ</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-700">{activeCategoryName}</span>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Sidebar */}
          <Sidebar
            patch={patch}
            activeFilters={{ category_id: activeCategoryId, min, max, inStock }}
            allCategories={allCategories}
            loadingCategories={loadingCategories}
          />

          {/* Main (Không thay đổi) */}
          <main className="col-span-12 md:col-span-9">
            <div className="rounded-2xl border border-gray-200 bg-white">
              <div className="px-4 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-gray-800">
                    {activeCategoryName.toUpperCase()}:{" "}
                    <span className="text-gray-500 font-normal">
                      ({(total || 0).toLocaleString()} kết quả)
                    </span>
                  </h2>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sắp xếp theo</span>
                    <div className="flex flex-wrap gap-2">
                      {SORTS.map((s) => (
                        <button
                          key={s.key}
                          onClick={() => patch({ sort: s.key })}
                          className={`rounded-xl px-3 py-1.5 text-sm border ${sort === s.key
                              ? "border-red-500 bg-red-50 text-red-600"
                              : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                            }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-3 md:px-4 pb-4">
                {/* Loading */}
                {loading && (
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 mt-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="h-[310px] rounded-xl bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                )}

                {/* Error */}
                {!loading && err && (
                  <div className="py-16 text-center text-red-600">{err}</div>
                )}

                {/* Empty */}
                {!loading && !err && items.length === 0 && (
                  <div className="py-16 text-center text-gray-500">
                    Không tìm thấy sản phẩm phù hợp.
                  </div>
                )}

                {/* Grid */}
                {!loading && !err && items.length > 0 && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {items.map((p) => (
                      <ProductCard key={p.id || p._id} product={p} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <nav className="inline-flex gap-1">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page <= 1}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50 bg-white hover:bg-gray-50"
                      >
                        Trước
                      </button>
                      {Array.from({ length: totalPages })
                        .slice(0, 7)
                        .map((_, idx) => {
                          const p = idx + 1;
                          return (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={`px-3 py-2 rounded-lg border text-sm ${p === page
                                  ? "border-red-500 bg-red-50 text-red-600"
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                                }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-50 bg-white hover:bg-gray-50"
                      >
                        Sau
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}