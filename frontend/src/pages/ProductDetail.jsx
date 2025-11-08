// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiTruck, FiShield, FiHeart, FiShoppingCart } from "react-icons/fi";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import summaryApi from "../common";
import { useCart } from "../context/CartContext";

// helper format tiền của bạn
import { money } from "../helpers/productHelper";

import { reviewApi } from "../api/reviewApi";
import ReviewForm from "../components/layout/ReviewForm";
import ReviewCard from "../components/layout/ReviewCard";
import RatingStars from "../components/layout/RatingStars";

/* =================== Helpers chung =================== */
function to1(num, fallback = "0.0") {
  if (typeof num !== "number" || Number.isNaN(num)) return fallback;
  return num.toFixed(1);
}

// Chuyển mọi kiểu gallery_urls -> mảng URL
function toUrlArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === "string") {
    const s = value.trim();

    // (A) Postgres text[]: "{https://a.jpg,https://b.jpg}"
    if (s.startsWith("{") && s.endsWith("}")) {
      const inner = s.slice(1, -1); // bỏ {}
      // tách phần tử, hỗ trợ cả phần tử có "dấu phẩy" hoặc có dấu ngoặc kép
      const parts = inner.match(/"([^"\\]*(\\.[^"\\]*)*)"|[^,]+/g) || [];
      return parts
        .map((p) => {
          let t = p.trim();
          // bỏ "" bọc quanh nếu có
          if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
          return t.replace(/\\"/g, '"').trim();
        })
        .filter(Boolean);
    }

    // (B) JSON string: '["https://a.jpg","https://b.jpg"]'
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // ignore
    }

    // (C) CSV thường: 'https://a.jpg, https://b.jpg'
    return s
      .split(",")
      .map((x) => x.trim().replace(/^"(.*)"$/, "$1"))
      .filter(Boolean);
  }

  return [];
}


// Gom ảnh từ DB: gallery_urls + image_url
function collectImagesFromBook(book) {
  const urls = [
    ...toUrlArray(book?.gallery_urls),
    ...(book?.image_url ? [book.image_url] : []),
  ];
  const unique = Array.from(new Set(urls.filter(Boolean)));
  return unique.length ? unique : ["https://via.placeholder.com/600x800?text=No+Image"];
}

/* =================== Lightbox =================== */
function Lightbox({ images, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/90 text-white flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute top-4 left-4 text-sm opacity-80 select-none">
        {index + 1} / {images.length}
      </div>

      <div
        className="relative max-w-[90vw] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[index]}
          alt={`image-${index + 1}`}
          className="object-contain max-h-[85vh] max-w-[90vw] mx-auto"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            aria-label="Previous"
            onClick={(e) => (e.stopPropagation(), prev())}
            className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full border border-white/40 px-3 py-2 hover:bg-white/10"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={(e) => (e.stopPropagation(), next())}
            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full border border-white/40 px-3 py-2 hover:bg-white/10"
          >
            ›
          </button>
        </>
      )}

      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full border border-white/40 px-3 py-1 hover:bg-white/10"
      >
        ✕
      </button>
    </div>
  );
}

/* =================== ImageGallery =================== */
function ImageGallery({ book, discountPercent = 0 }) {
  const images = collectImagesFromBook(book);
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const handlePrev = () => setActiveIndex((cur) => (cur - 1 + images.length) % images.length);
  const handleNext = () => setActiveIndex((cur) => (cur + 1) % images.length);

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-3">
        {/* Ảnh lớn */}
        <div className="relative flex items-center justify-center h-[420px]">
          {images.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border px-2 py-1 hover:bg-white"
            >
              ‹
            </button>
          )}

          {/* Click mở lightbox */}
          <img
            src={images[activeIndex]}
            alt={book?.title || "image"}
            className="max-h-full object-contain cursor-zoom-in"
            onClick={() => setOpen(true)}
          />

          {images.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border px-2 py-1 hover:bg-white"
            >
              ›
            </button>
          )}

          {discountPercent > 0 && (
            <span className="absolute top-5 left-5 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Thumbnails — hover để đổi ảnh */}
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2">
            {images.map((src, idx) => (
              <button
                key={src + idx}
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)} // hover đổi ảnh
                className={`relative aspect-[4/5] overflow-hidden rounded-lg border ${
                  activeIndex === idx ? "border-red-500" : "border-gray-200 hover:border-gray-300"
                }`}
                aria-label={`Choose image ${idx + 1}`}
              >
                <img
                  src={src}
                  alt={`thumb-${idx}`}
                  className="h-full w-full object-cover pointer-events-none"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {open && (
        <Lightbox
          images={images}
          startIndex={activeIndex}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/* =================== Các block phụ =================== */
const ShippingCard = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
    <div className="flex items-center gap-2 text-gray-800">
      <FiTruck className="h-5 w-5" /> Giao hàng nhanh: Nội thành HCM, Hà Nội
    </div>
    <div className="text-sm text-gray-600">
      Nhận dự kiến: 1-3 ngày · Miễn phí từ 299.000đ
    </div>
    <div className="flex gap-3 text-sm">
      <span className="rounded-lg bg-gray-100 px-2 py-1">ZaloPay</span>
      <span className="rounded-lg bg-gray-100 px-2 py-1">VNPay</span>
      <span className="rounded-lg bg-gray-100 px-2 py-1">COD</span>
    </div>
  </div>
);

const Policies = () => (
  <ul className="space-y-2 text-sm text-gray-700">
    <li className="flex items-center gap-2">
      <FiShield className="h-4 w-4" /> Hàng chính hãng, đổi trả 7 ngày
    </li>
    <li className="flex items-center gap-2">
      <FiShield className="h-4 w-4" /> Bảo mật thanh toán
    </li>
    <li className="flex items-center gap-2">
      <FiShield className="h-4 w-4" /> Hỗ trợ 24/7
    </li>
  </ul>
);

const InfoTable = ({ book }) => {
  const rows = [
    { label: "Tác giả", value: book.author },
    { label: "Nhà xuất bản", value: book.publisher },
    { label: "Năm XB", value: book.published_year },
    { label: "Ngôn ngữ", value: book.language },
    { label: "Định dạng", value: book.format },
    { label: "Tồn kho", value: book.stock },
  ].filter((r) => r.value !== undefined && r.value !== null && r.value !== "");

  if (!rows.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b px-4 py-2 font-semibold">Thông tin chi tiết</div>
      <dl className="grid grid-cols-1 md:grid-cols-2">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[160px_1fr] gap-4 px-4 py-2 ${
              i % 2 === 0 ? "bg-gray-50" : "bg-white"
            }`}
          >
            <dt className="text-gray-500">{row.label}</dt>
            <dd className="text-gray-800">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const Quantity = ({ value, onChange }) => (
  <div className="inline-flex items-center rounded-xl border border-gray-300 overflow-hidden">
    <button
      type="button"
      className="px-3 py-2 text-lg"
      onClick={() => onChange(Math.max(1, value - 1))}
    >
      -
    </button>
    <input
      className="w-12 text-center outline-none"
      value={value}
      onChange={(e) => onChange(Math.max(1, parseInt(e.target.value || 1, 10)))}
    />
    <button
      type="button"
      className="px-3 py-2 text-lg"
      onClick={() => onChange(value + 1)}
    >
      +
    </button>
  </div>
);

/* =================== Main =================== */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const currentUser = useSelector((state) => state.user?.data);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);

  // Load reviews
  const loadReviews = async () => {
  try {
    const list = await reviewApi.fetchByBook(id);  // id = bookId lấy từ useParams()
    setReviews(Array.isArray(list) ? list : []);
  } catch (error) {
    console.error("Failed to load reviews:", error);
    setReviews([]);
  }
};

  useEffect(() => {
    loadReviews();
  }, [id]);

  // Fetch chi tiết sách (trả đúng field: image_url, gallery_urls, price, sale_price, rating_avg, rating_count, ...)
  useEffect(() => {
    let ignore = false;

    async function fetchBook() {
      setLoading(true);
      try {
        const res = await fetch(summaryApi.url(`/books/${id}`));
        const json = await res.json();
        const data = json?.data ? json.data : json; // tuỳ BE bọc data

        if (!ignore) setBook(data);
      } catch (err) {
        console.error("Fetch book detail failed:", err);
        if (!ignore) setBook(null);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchBook();
    return () => {
      ignore = true;
    };
  }, [id]);

  // Giá & khuyến mãi
  const hasSale =
    book?.sale_price != null &&
    book?.price != null &&
    Number(book.sale_price) < Number(book.price);

  const price = hasSale ? Number(book.sale_price) : Number(book?.price ?? 0);
  const oldPrice = hasSale ? Number(book.price) : null;
  const discountPercent = hasSale
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  // Rating
  const rawRating = book?.rating_avg;
  const averageRating =
    rawRating == null
      ? 0
      : Number.isFinite(Number(rawRating))
      ? Number(rawRating)
      : 0;
  const ratingCount =
    book?.rating_count == null ? 0 : Number(book.rating_count);

  // Handlers
  const handleAddToCart = async () => {
    if (!book) return;
    const ok = await addToCart(
      {
        id: book.id,
        title: book.title,
        price: book.sale_price ?? book.price,
        image_url: book.image_url,
      },
      qty
    );
    if (ok) toast.success("Đã thêm vào giỏ hàng", { autoClose: 1400 });
  };

  const handleBuyNow = async () => {
    if (!book) return;
    const ok = await addToCart(
      {
        id: book.id,
        title: book.title,
        price: book.sale_price ?? book.price,
        image_url: book.image_url,
      },
      qty
    );
    if (ok) navigate("/cart");
  };

  /* =================== Render =================== */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-10">
        <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-10 text-center">
        <h1 className="text-xl font-semibold mb-3">Không tìm thấy sản phẩm</h1>
        <Link to="/" className="text-red-600 hover:underline">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
      {/* breadcrumb */}
      <nav className="text-sm text-gray-500 mb-3">
        <Link to="/" className="hover:underline">
          Trang chủ
        </Link>{" "}
        /{" "}
        <span className="hover:underline">
          {book.category_name || "Danh mục"}
        </span>{" "}
        / <span className="text-gray-800">{book.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Cột trái: gallery + policies */}
        <div className="lg:col-span-2 space-y-4">
          <ImageGallery book={book} discountPercent={discountPercent} />

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="font-semibold mb-2">Chính sách cửa hàng</div>
            <Policies />
          </div>
        </div>

        {/* Cột phải: thông tin & mua hàng */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {book.title}
            </h1>

            {book.author && (
              <p className="mt-1 text-sm text-gray-500">
                Tác giả: <span className="text-gray-700">{book.author}</span>
              </p>
            )}

            {/* Rating */}
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <RatingStars value={averageRating} />
              <span className="text-gray-700 font-medium">
                {to1(averageRating)} / 5
              </span>
              <span>({ratingCount} đánh giá)</span>
            </div>

            {/* Giá */}
            <div className="mt-4 flex items-end gap-3">
              <div className="text-2xl font-extrabold text-red-600">
                {price ? money(price) : "Liên hệ"}
              </div>
              {oldPrice && (
                <div className="text-gray-400 line-through text-lg">
                  {money(oldPrice)}
                </div>
              )}
              {discountPercent > 0 && (
                <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-600">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Shipping */}
            <div className="mt-4">
              <ShippingCard />
            </div>

            {/* Qty + Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Số lượng</span>
                <Quantity value={qty} onChange={setQty} />
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleBuyNow}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-white font-semibold hover:bg-red-700"
                >
                  <FiShoppingCart className="h-5 w-5" />
                  Mua ngay
                </button>
                <button
                  onClick={handleAddToCart}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-3 text-red-600 font-semibold hover:bg-red-50"
                >
                  Thêm vào giỏ
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-gray-700 hover:bg-gray-50">
                  <FiHeart /> Yêu thích
                </button>
              </div>
            </div>

            {/* Tồn kho */}
            {typeof book.stock === "number" && (
              <p className="mt-3 text-xs text-gray-500">
                Còn lại: {book.stock} sản phẩm
              </p>
            )}
          </div>

          {/* Bảng thông tin */}
          <InfoTable book={book} />

          {/* Mô tả */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="font-semibold mb-2">Mô tả sản phẩm</div>
            <p className="whitespace-pre-line text-gray-800 leading-relaxed">
              {book.description || "Đang cập nhật mô tả..."}
            </p>
          </div>

          {/* Review */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-gray-900">
                  Đánh giá & nhận xét
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <RatingStars value={averageRating} />
                  <span className="text-gray-700 font-medium">
                    {to1(averageRating)} / 5
                  </span>
                  <span className="text-gray-500">
                    ({ratingCount} đánh giá)
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <ReviewForm
                bookId={id}
                currentUser={currentUser}
                onSubmitted={loadReviews}
              />
            </div>

            <div>
              {reviews.length === 0 ? (
                <div className="text-sm text-gray-500">
                  Chưa có đánh giá nào. Hãy là người đầu tiên!
                </div>
              ) : (
                <ul className="space-y-4">
                  {reviews.map((rv) => (
                    <li key={rv.id}>
                      <ReviewCard
                        review={rv}
                        currentUser={currentUser}
                        reload={loadReviews}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
