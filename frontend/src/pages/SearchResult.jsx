// src/pages/SearchResult.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import summaryApi from "../common/index.js";
import ProductCard from "../components/layout/ProductCard.jsx";

/** ---------------- Config ---------------- */
const SORTS = [
  { key: "id_desc", label: "Độ liên quan" }, // tạm map "relevance" → id mới nhất
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
const numberOrEmpty = (v) => (v === null || v === undefined || v === "" ? "" : String(Number(v)));
const truthy = (v) => v === "1" || v === "true" || v === true;

/** ---------------- Component ---------------- */
export default function SearchResult() {
  const [sp, setSp] = useSearchParams();

  // URL state
  const q = (sp.get("q") || "").trim();
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.max(12, Number(sp.get("limit") || DEFAULT_LIMIT));
  const category_id = sp.get("category_id") || ""; // id hoặc slug, tùy BE xử lý
  const min = sp.get("min") || "";
  const max = sp.get("max") || "";
  const inStock = truthy(sp.get("inStock") || "");
  const sort = sp.get("sort") || "id_desc"; // ✔ nằm trong white-list ở trên

  // Data state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState({ categories: [], priceRanges: DEFAULT_PRICE_RANGES });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // endpoint list/search của bạn
        const listEndpoint = summaryApi.book?.list || summaryApi.book?.get;
        const url = new URL(summaryApi.url(listEndpoint));

        if (q) url.searchParams.set("q", q);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));
        if (category_id) url.searchParams.set("category_id", category_id);
        if (min) url.searchParams.set("min", numberOrEmpty(min));
        if (max) url.searchParams.set("max", numberOrEmpty(max));
        if (inStock) url.searchParams.set("inStock", "1");
        if (sort) url.searchParams.set("sort", sort); // ✔ hợp lệ với BE

        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const msg =
            data?.message ||
            data?.error ||
            (Array.isArray(data) ? "Yêu cầu không hợp lệ" : "Không thể tải kết quả");
          throw new Error(msg);
        }

        // Chuẩn hóa
        const payload = data?.data || data;
        const resultItems = payload?.items || [];
        const resultTotal = payload?.total ?? 0;
        const resultFacets = payload?.facets || {};

        if (alive) {
          setItems(Array.isArray(resultItems) ? resultItems : []);
          setTotal(Number(resultTotal) || 0);
          setFacets({
            categories: resultFacets.categories || [],
            priceRanges: resultFacets.priceRanges?.length
              ? resultFacets.priceRanges
              : DEFAULT_PRICE_RANGES,
          });
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
  }, [q, page, limit, category_id, min, max, inStock, sort]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((total || 0) / limit)),
    [total, limit]
  );

  // Update URL helper
  const patch = (obj, resetPage = true) => {
    const next = Object.fromEntries(sp.entries());
    Object.assign(next, obj);
    if (resetPage) next.page = 1;

    // dọn rỗng
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
          <span className="text-gray-700">Kết quả tìm kiếm</span>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white">
              <div className="border-b px-4 py-3">
                <h3 className="text-base font-bold text-gray-800">LỌC THEO</h3>
              </div>

              {/* Danh mục */}
              <div className="px-4 py-3 border-b">
                <h4 className="mb-2 text-sm font-semibold text-gray-700">DANH MỤC CHÍNH</h4>
                <div className="space-y-1 max-h-[280px] overflow-auto pr-1">
                  {(facets.categories || []).map((c) => {
                    const value = c.id || c.slug;
                    const selected = String(category_id) === String(value);
                    return (
                      <label
                        key={value}
                        className={`flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer ${selected ? "bg-red-50" : "hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => patch({ category_id: selected ? "" : value })}
                            className="h-4 w-4 text-red-600 rounded border-gray-300"
                          />
                          <span className={`text-sm ${selected ? "text-red-600 font-medium" : "text-gray-700"}`}>
                            {c.name}
                          </span>
                        </div>
                        {typeof c.count === "number" ? (
                          <span className="text-xs text-gray-500">{c.count}</span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Giá */}
              <div className="px-4 py-3 border-b">
                <h4 className="mb-2 text-sm font-semibold text-gray-700">GIÁ</h4>
                <div className="space-y-1">
                  {(facets.priceRanges || DEFAULT_PRICE_RANGES).map((r, idx) => {
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

              {/* Còn hàng */}
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

          {/* Main */}
          <main className="col-span-12 md:col-span-9">
            <div className="rounded-2xl border border-gray-200 bg-white">
              <div className="px-4 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-gray-800">
                    KẾT QUẢ TÌM KIẾM:{" "}
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
