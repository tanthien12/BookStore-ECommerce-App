import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import summaryApi from "../common"; // có sẵn trong project của bạn

/* =========================
   CẤU HÌNH LỌC + SẮP XẾP
   ========================= */
const PRICE_RANGES = [
  { id: "p1", label: "0đ - 150,000đ", min: 0, max: 150000 },
  { id: "p2", label: "150,000đ - 300,000đ", min: 150000, max: 300000 },
  { id: "p3", label: "300,000đ - 500,000đ", min: 300000, max: 500000 },
  { id: "p4", label: "500,000đ - 700,000đ", min: 500000, max: 700000 },
  { id: "p5", label: "700,000đ - Trở lên", min: 700000, max: Infinity },
];

const SORT_OPTIONS = [
  { key: "popular", label: "Bán chạy tuần", server: undefined }, // FE sort
  { key: "newest", label: "Mới nhất", server: "newest" },        // BE sort (đã hỗ trợ ở books?)
  { key: "priceAsc", label: "Giá tăng dần", server: "price_asc" },
  { key: "priceDesc", label: "Giá giảm dần", server: "price_desc" },
];

/* =========================
   TIỆN ÍCH NẠP JSON "an toàn"
   ========================= */
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
function pickList(json) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.items)) return json.items;
  if (json && Array.isArray(json.data)) return json.data;
  return [];
}

/* =========================
   CARD SẢN PHẨM
   ========================= */
function ProductCard({ p }) {
  const img = p.thumbnail || p.image_url || (p.images && p.images[0]) || "/images/placeholder.png";
  const price = p.final_price ?? p.sale_price ?? p.price ?? 0;
  const old = p.original_price ?? p.list_price ?? null;

  return (
    <Link
      to={`/books/${p.id}`}
      className="block rounded-xl bg-white border border-gray-100 hover:shadow-md transition overflow-hidden"
    >
      <img
        src={img}
        alt={p.title || p.name}
        className="w-full h-48 object-contain bg-white p-3"
        loading="lazy"
      />
      <div className="px-3 pb-3">
        <p className="min-h-[40px] text-sm font-medium leading-snug line-clamp-2 text-gray-900">
          {p.title || p.name}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-red-600 font-bold">
            {Number(price).toLocaleString()} đ
          </span>
          {old && (
            <span className="text-xs text-gray-400 line-through">
              {Number(old).toLocaleString()} đ
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* =========================
   SIDEBAR DANH MỤC CON (nếu có)
   ========================= */
function Sidebar({ subs, onTogglePrice, selectedPrices }) {
  return (
    <aside className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Giá */}
      <div className="text-[11px] font-semibold text-gray-500 uppercase mb-2">
        Giá
      </div>
      <ul className="space-y-1 text-sm">
        {PRICE_RANGES.map((r) => {
          const checked = selectedPrices.includes(r.id);
          return (
            <li key={r.id} className="flex items-center gap-2">
              <input
                id={`price-${r.id}`}
                type="checkbox"
                checked={checked}
                onChange={() => onTogglePrice(r.id)}
                className="h-4 w-4"
              />
              <label htmlFor={`price-${r.id}`} className="cursor-pointer">
                {r.label}
              </label>
            </li>
          );
        })}
      </ul>

      {/* Nhóm con (tuỳ chọn – nếu backend trả) */}
      {subs?.length ? (
        <>
          <div className="mt-6 text-[11px] font-semibold text-gray-500 uppercase mb-2">
            Nhóm sản phẩm
          </div>
          <ul className="space-y-1 text-sm">
            {subs.map((s) => (
              <li key={s.slug}>
                <Link
                  to={`/category/${s.parent}/${s.slug}`}
                  className="block px-0 py-1 text-gray-700 hover:text-orange-600"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </aside>
  );
}

/* =========================
   TRANG DANH MỤC (DỮ LIỆU THẬT)
   ========================= */
export default function CategoryPage() {
  const { categoryId, subSlug } = useParams();

  // dữ liệu từ server
  const [categories, setCategories] = useState([]);
  const [serverBooks, setServerBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [sortKey, setSortKey] = useState("popular");
  const [pageSize, setPageSize] = useState(24);
  const [selectedPrices, setSelectedPrices] = useState([]);

  // ===== 1) Nạp categories thật
  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch(summaryApi.url("/categories")); // GET /api/categories
      const json = await safeJson(res);
      if (!alive) return;
      setCategories(pickList(json));
    })();
    return () => { alive = false; };
  }, []);

  const activeCategory =
    categories.find((c) => c.id === categoryId || c.slug === categoryId) || null;

  // ===== 2) Nạp books thật theo category (ưu tiên filter ở BE)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        // cố gắng dùng sort ở BE nếu có
        const s = SORT_OPTIONS.find((o) => o.key === sortKey)?.server;
        if (s) params.set("sort", s);
        // truyền cả id và slug để BE tự chọn cái hợp lệ
        if (activeCategory?.id) params.set("category_id", activeCategory.id);
        if (activeCategory?.slug) params.set("category_slug", activeCategory.slug);
        if (subSlug) params.set("sub", subSlug);
        params.set("limit", String(pageSize));

        const url = summaryApi.url(`/books${params.toString() ? `?${params}` : ""}`); // GET /api/books
        const res = await fetch(url);
        const json = await safeJson(res);

        let list = pickList(json);

        // ===== Fallback lọc ở FE nếu BE chưa hỗ trợ filter
        if (list.length && (activeCategory?.id || activeCategory?.slug)) {
          const cid = activeCategory?.id;
          const cslug = activeCategory?.slug;
          list = list.filter((b) =>
            (b.category_id && cid && b.category_id === cid) ||
            (b.category_slug && cslug && b.category_slug === cslug) ||
            !b.category_id // nếu dữ liệu không có field → giữ lại, sẽ lọc tiếp theo price
          );
        }

        setServerBooks(list);
      } catch {
        setServerBooks([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    // re-fetch khi đổi categoryId/subSlug/sortKey/pageSize
  }, [activeCategory?.id, activeCategory?.slug, subSlug, sortKey, pageSize]);

  // ===== 3) Lọc theo PRICE ở FE + sort phụ (popular/price khi BE không sort)
  const finalBooks = useMemo(() => {
    let arr = [...serverBooks];

    if (selectedPrices.length) {
      const ranges = PRICE_RANGES.filter((r) => selectedPrices.includes(r.id));
      arr = arr.filter((p) => {
        const price = Number(p.final_price ?? p.sale_price ?? p.price ?? 0);
        return ranges.some((r) => price >= r.min && price < r.max);
      });
    }

    // nếu sortKey không map được server → sort ở FE
    switch (sortKey) {
      case "priceAsc":
        arr.sort((a, b) => (a.final_price ?? a.sale_price ?? a.price ?? 0) - (b.final_price ?? b.sale_price ?? b.price ?? 0));
        break;
      case "priceDesc":
        arr.sort((a, b) => (b.final_price ?? b.sale_price ?? b.price ?? 0) - (a.final_price ?? a.sale_price ?? a.price ?? 0));
        break;
      case "popular":
        arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
      // "newest" đã cố gắng nhờ BE; nếu BE không có thì có thể sort theo created_at
        arr.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return arr.slice(0, pageSize);
  }, [serverBooks, selectedPrices, sortKey, pageSize]);

  const togglePrice = (id) =>
    setSelectedPrices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // ===== 4) Render
  if (!activeCategory && categories.length) {
    return (
      <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
        <p className="text-gray-700">Danh mục không tồn tại.</p>
        <Link to="/" className="text-red-600 underline">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
      {/* Breadcrumb đơn giản */}
      <nav className="text-sm text-gray-500 mb-3">
        <Link to="/" className="hover:underline">Trang chủ</Link> /{" "}
        <span className="text-orange-600 font-medium">
          {activeCategory?.name || activeCategory?.label || "Danh mục"}
        </span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* SIDEBAR */}
        <Sidebar
          subs={[]}
          onTogglePrice={togglePrice}
          selectedPrices={selectedPrices}
        />

        {/* CONTENT */}
        <section>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 mb-3 shadow-sm">
            <div className="text-sm">
              <span className="font-semibold">
                {activeCategory?.name || activeCategory?.label || "Danh mục"}
              </span>{" "}
              · {finalBooks.length} sản phẩm
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sắp xếp:</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="rounded-lg border-gray-300 text-sm"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border-gray-300 text-sm"
              >
                {[12, 24, 48].map((n) => (
                  <option key={n} value={n}>
                    {n} sản phẩm
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lưới sản phẩm */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-white border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : finalBooks.length === 0 ? (
            <div className="p-6 text-center text-gray-500 bg-white rounded-xl">
              Chưa có sản phẩm phù hợp bộ lọc.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {finalBooks.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
