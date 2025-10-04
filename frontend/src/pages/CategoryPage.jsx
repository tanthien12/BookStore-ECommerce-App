import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CATEGORIES, slugify } from "../data/categoryData";
import { products as ALL } from "../data/products";
import { FiChevronDown } from "react-icons/fi";

/* =========================
   CẤU HÌNH LỌC (UI + LOGIC)
   ========================= */
const PRICE_RANGES = [
    { id: "p1", label: "0đ - 150,000đ", min: 0, max: 150000 },
    { id: "p2", label: "150,000đ - 300,000đ", min: 150000, max: 300000 },
    { id: "p3", label: "300,000đ - 500,000đ", min: 300000, max: 500000 },
    { id: "p4", label: "500,000đ - 700,000đ", min: 500000, max: 700000 },
    { id: "p5", label: "700,000đ - Trở lên", min: 700000, max: Infinity },
];

const GENRES = [
    "Comedy",
    "Adventure",
    "Shounen",
    "School Life",
    "Slice Of Life",
    "Drama",
    "Mystery",
    "Romance",
];

/* =========================
   CARD SẢN PHẨM NHANH
   ========================= */
function ProductCard({ p }) {
    return (
        <Link
            to={`/product/${p.id}`}
            className="block rounded-xl bg-white border border-gray-200 hover:shadow-md transition overflow-hidden"
        >
            <img
                src={p.img}
                alt={p.title}
                className="w-full h-48 object-contain bg-white p-3"
                loading="lazy"
            />
            <div className="px-3 pb-3">
                <p className="min-h-[40px] text-sm font-medium leading-snug line-clamp-2 text-gray-900">
                    {p.title}
                </p>
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-red-600 font-bold">
                        {p.price.toLocaleString()} đ
                    </span>
                    {p.oldPrice && (
                        <span className="text-xs text-gray-400 line-through">
                            {p.oldPrice.toLocaleString()} đ
                        </span>
                    )}
                </div>
                {p.badge && (
                    <span className="mt-2 inline-block text-xs text-orange-600">
                        {p.badge}
                    </span>
                )}
            </div>
        </Link>
    );
}

/* =========================
   SIDEBAR (NHÓM SP + GIÁ + GENRES)
   ========================= */
function CategorySidebar({ categoryId, subSlug, subItems, onPrice, onGenre, selected }) {
    const [showAll, setShowAll] = useState(false);
    const MAX = 8;
    const visible = showAll ? subItems : subItems.slice(0, MAX);

    return (
        <aside className="rounded-2xl border border-gray-200 bg-white p-4">
            {/* Nhóm sản phẩm */}
            <div className="text-[11px] font-semibold text-gray-500 uppercase mb-2">
                Nhóm sản phẩm
            </div>
            <ul className="space-y-1 text-sm">
                <li>
                    <Link
                        to={`/category/${categoryId}`}
                        className={`block px-0 py-1 hover:text-orange-600 ${!subSlug ? "text-orange-600 font-medium" : "text-gray-700"
                            }`}
                    >
                        Tất Cả Nhóm Sản Phẩm
                    </Link>
                </li>
                {visible.map((name) => {
                    const s = slugify(name);
                    return (
                        <li key={s}>
                            <Link
                                to={`/category/${categoryId}/${s}`}
                                className={`block px-0 py-1 hover:text-orange-600 ${subSlug === s ? "text-orange-600 font-medium" : "text-gray-700"
                                    }`}
                            >
                                {name}
                            </Link>
                        </li>
                    );
                })}
            </ul>
            {subItems.length > MAX && (
                <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-orange-600 hover:text-orange-700"
                >
                    {showAll ? "Thu gọn" : "Xem Thêm"}
                    <FiChevronDown
                        className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""
                            }`}
                    />
                </button>
            )}

            {/* Giá */}
            <div className="mt-6 text-[11px] font-semibold text-gray-500 uppercase mb-2">
                Giá
            </div>
            <ul className="space-y-1 text-sm">
                {PRICE_RANGES.map((r) => {
                    const checked = selected.prices.includes(r.id);
                    return (
                        <li key={r.id} className="flex items-center gap-2">
                            <input
                                id={`price-${r.id}`}
                                type="checkbox"
                                checked={checked}
                                onChange={() => onPrice(r.id)}
                                className="h-4 w-4"
                            />
                            <label htmlFor={`price-${r.id}`} className="cursor-pointer">
                                {r.label}
                            </label>
                        </li>
                    );
                })}
            </ul>

            {/* Genres */}
            <div className="mt-6 text-[11px] font-semibold text-gray-500 uppercase mb-2">
                Genres
            </div>
            <ul className="space-y-1 text-sm">
                {GENRES.map((g) => {
                    const checked = selected.genres.includes(g);
                    return (
                        <li key={g} className="flex items-center gap-2">
                            <input
                                id={`genre-${g}`}
                                type="checkbox"
                                checked={checked}
                                onChange={() => onGenre(g)}
                                className="h-4 w-4"
                            />
                            <label htmlFor={`genre-${g}`} className="cursor-pointer">
                                {g}
                            </label>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}

/* =========================
   TRANG DANH MỤC
   ========================= */
const SORT_OPTIONS = [
    { key: "popular", label: "Bán Chạy Tuần" },
    { key: "new", label: "Mới nhất" },
    { key: "priceAsc", label: "Giá tăng dần" },
    { key: "priceDesc", label: "Giá giảm dần" },
];

export default function CategoryPage() {
    const { categoryId, subSlug } = useParams();

    const category = CATEGORIES.find((c) => c.id === categoryId);
    const subLabel =
        subSlug &&
        category?.columns
            .flatMap((c) => c.items)
            .find((n) => slugify(n) === subSlug);

    // ------- state bộ lọc + toolbar
    const [sort, setSort] = useState("popular");
    const [pageSize, setPageSize] = useState(24);
    const [selectedPrices, setSelectedPrices] = useState([]); // id của PRICE_RANGES
    const [selectedGenres, setSelectedGenres] = useState([]); // tên trong GENRES

    // ------- handlers lọc
    const togglePrice = (id) =>
        setSelectedPrices((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    const toggleGenre = (g) =>
        setSelectedGenres((prev) =>
            prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
        );

    // ------- danh sách con (nhóm sản phẩm ở sidebar)
    const subItems = useMemo(
        () => (category ? category.columns.flatMap((c) => c.items) : []),
        [category]
    );

    // ------- lọc + sắp xếp
    const list = useMemo(() => {
        if (!category) return [];

        let arr = ALL.filter((p) => p.categoryId === categoryId);
        if (subSlug) arr = arr.filter((p) => p.subSlug === subSlug);

        // filter theo price
        if (selectedPrices.length) {
            const ranges = PRICE_RANGES.filter((r) => selectedPrices.includes(r.id));
            arr = arr.filter((p) =>
                ranges.some((r) => p.price >= r.min && p.price < r.max)
            );
        }

        // filter theo genres
        if (selectedGenres.length) {
            arr = arr.filter((p) =>
                (p.genres || []).some((g) => selectedGenres.includes(g))
            );
        }

        // sort
        switch (sort) {
            case "priceAsc":
                arr = [...arr].sort((a, b) => a.price - b.price);
                break;
            case "priceDesc":
                arr = [...arr].sort((a, b) => b.price - a.price);
                break;
            case "new":
                arr = [...arr].sort((a, b) => (b.createdAt || b.id) - (a.createdAt || a.id));
                break;
            default: // popular
                arr = [...arr].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        return arr.slice(0, pageSize);
    }, [
        ALL,
        category,
        categoryId,
        subSlug,
        selectedPrices,
        selectedGenres,
        sort,
        pageSize,
    ]);

    // ------- không có category
    if (!category) {
        return (
            <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
                <p className="text-gray-700">Danh mục không tồn tại.</p>
                <Link to="/" className="text-red-600 underline">
                    Về trang chủ
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 mb-3">
                <Link to="/" className="hover:underline">
                    Trang chủ
                </Link>{" "}
                /{" "}
                <span className="hover:underline">Sách Tiếng Việt</span> /{" "}
                <span className="hover:underline">Văn học</span> /{" "}
                <span className="text-orange-600 font-medium">
                    {subLabel || "Tất cả"}
                </span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                {/* SIDEBAR */}
                <CategorySidebar
                    categoryId={categoryId}
                    subSlug={subSlug}
                    subItems={subItems}
                    onPrice={togglePrice}
                    onGenre={toggleGenre}
                    selected={{ prices: selectedPrices, genres: selectedGenres }}
                />

                {/* CONTENT */}
                <section>
                    {/* Thanh công cụ */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 mb-3">
                        <div className="text-sm">
                            <span className="font-semibold">
                                {subLabel || category.label}
                            </span>{" "}
                            · {list.length} sản phẩm
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">Sắp xếp theo:</label>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
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
                    {list.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                            Chưa có sản phẩm phù hợp bộ lọc.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {list.map((p) => (
                                <ProductCard key={p.id} p={p} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}