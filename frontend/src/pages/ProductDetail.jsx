// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FiTruck, FiShield, FiHeart, FiShoppingCart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import summaryApi, { authHeaders } from "../common";
import { useCart } from "../context/CartContext";

// Helper format tiền
import { money } from "../helpers/productHelper";

// API review
import { reviewApi } from "../api/reviewApi";

// Layout components
import RatingStars from "../components/layout/RatingStars";
import RelatedBooks from "../components/layout/RelatedBooks";
import ProductReviews from "../components/layout/ProductReviews";

/* =================== Helpers chung =================== */
function to1(num, fallback = "0.0") {
  if (typeof num !== "number" || Number.isNaN(num)) return fallback;
  return num.toFixed(1);
}

// ⭐️ Hàm format số lượng bán giống ProductCard (ví dụ: 1500 -> 1.5k)
function formatSold(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

function toUrlArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    const s = value.trim();
    if (s.startsWith("{") && s.endsWith("}")) {
      const inner = s.slice(1, -1);
      const parts = inner.match(/"([^"\\]*(\\.[^"\\]*)*)"|[^,]+/g) || [];
      return parts.map((p) => p.trim().replace(/^"|"$/g, "").replace(/\\"/g, '"')).filter(Boolean);
    }
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return s.split(",").map((x) => x.trim().replace(/^"(.*)"$/, "$1")).filter(Boolean);
  }
  return [];
}

function collectImagesFromBook(book) {
  const urls = [...toUrlArray(book?.gallery_urls), ...(book?.image_url ? [book.image_url] : [])];
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
    <div className="fixed inset-0 z-[1000] bg-black/90 text-white flex items-center justify-center" onClick={onClose}>
      <div className="absolute top-4 left-4 text-sm opacity-80 select-none">{index + 1} / {images.length}</div>
      <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <img src={images[index]} alt={`img-${index}`} className="object-contain max-h-[85vh] max-w-[90vw] mx-auto" />
      </div>
      {images.length > 1 && (
        <>
          <button onClick={(e) => (e.stopPropagation(), prev())} className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full border border-white/40 px-3 py-2 hover:bg-white/10">‹</button>
          <button onClick={(e) => (e.stopPropagation(), next())} className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full border border-white/40 px-3 py-2 hover:bg-white/10">›</button>
        </>
      )}
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full border border-white/40 px-3 py-1 hover:bg-white/10">✕</button>
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
        <div className="relative flex items-center justify-center h-[300px] md:h-[420px]">
          {images.length > 1 && (
            <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border px-2 py-1 hover:bg-white">‹</button>
          )}
          <img src={images[activeIndex]} alt={book?.title} className="max-h-full object-contain cursor-zoom-in" onClick={() => setOpen(true)} />
          {images.length > 1 && (
            <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white/90 border px-2 py-1 hover:bg-white">›</button>
          )}
          {discountPercent > 0 && (
            <span className="absolute top-5 left-5 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">-{discountPercent}%</span>
          )}
        </div>
        {images.length > 1 && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {images.slice(0, 5).map((src, idx) => (
              <button key={idx} onClick={() => setActiveIndex(idx)} onMouseEnter={() => setActiveIndex(idx)} className={`relative aspect-[4/5] overflow-hidden rounded-lg border ${activeIndex === idx ? "border-red-500" : "border-gray-200"}`}>
                <img src={src} alt="" className="h-full w-full object-cover pointer-events-none" />
              </button>
            ))}
          </div>
        )}
      </div>
      {open && <Lightbox images={images} startIndex={activeIndex} onClose={() => setOpen(false)} />}
    </>
  );
}

/* =================== Components phụ =================== */
const ShippingCard = () => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
    <div className="flex items-center gap-2 text-gray-800 font-medium"><FiTruck className="h-5 w-5" /> Giao hàng nhanh</div>
    <div className="text-sm text-gray-600">Nhận dự kiến: 1-3 ngày · Miễn phí từ 299.000đ</div>
    <div className="flex gap-2 text-sm">
       <span className="rounded-lg bg-gray-100 px-2 py-1 border border-gray-200">VNPay</span>
       <span className="rounded-lg bg-gray-100 px-2 py-1 border border-gray-200">COD</span>
    </div>
  </div>
);

const Policies = () => (
  <ul className="space-y-2 text-sm text-gray-700">
    <li className="flex items-center gap-2"><FiShield className="text-blue-500"/> Hàng chính hãng, đổi trả 7 ngày</li>
    <li className="flex items-center gap-2"><FiShield className="text-blue-500"/> Bảo mật thanh toán</li>
    <li className="flex items-center gap-2"><FiShield className="text-blue-500"/> Hỗ trợ 24/7</li>
  </ul>
);

const InfoTable = ({ book }) => {
  const rows = [
    { label: "Tác giả", value: book.author },
    { label: "NXB", value: book.publisher },
    { label: "Năm XB", value: book.published_year },
    { label: "Ngôn ngữ", value: book.language },
    { label: "Định dạng", value: book.format },
    { label: "Tồn kho", value: book.stock },
  ].filter((r) => r.value);
  if (!rows.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b px-4 py-2 font-semibold">Thông tin chi tiết</div>
      <dl className="grid grid-cols-1 md:grid-cols-2">
        {rows.map((row, i) => (
          <div key={row.label} className={`grid grid-cols-[140px_1fr] gap-4 px-4 py-2 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
            <dt className="text-gray-500 text-sm">{row.label}</dt>
            <dd className="text-gray-800 text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const Quantity = ({ value, onChange }) => (
  <div className="inline-flex items-center rounded-xl border border-gray-300 overflow-hidden h-9 md:h-auto">
    <button type="button" className="px-3 py-1 md:py-2 text-lg hover:bg-gray-100" onClick={() => onChange(Math.max(1, value - 1))}>-</button>
    <input className="w-10 md:w-12 text-center outline-none text-sm font-semibold" value={value} onChange={(e) => onChange(Math.max(1, parseInt(e.target.value || 1, 10)))} />
    <button type="button" className="px-3 py-1 md:py-2 text-lg hover:bg-gray-100" onClick={() => onChange(value + 1)}>+</button>
  </div>
);

function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  useEffect(() => {
    if (!endTime) return;
    const end = new Date(endTime).getTime();
    const update = () => {
      const diff = end - Date.now();
      if (diff <= 0) return setTimeLeft({ h: "00", m: "00", s: "00" });
      setTimeLeft({
        h: String(Math.floor(diff / 36e5)).padStart(2, "0"),
        m: String(Math.floor((diff % 36e5) / 6e4)).padStart(2, "0"),
        s: String(Math.floor((diff % 6e4) / 1e3)).padStart(2, "0"),
      });
    };
    const t = setInterval(update, 1000);
    update();
    return () => clearInterval(t);
  }, [endTime]);
  return (
    <div className="flex items-center gap-1 bg-white text-red-600 px-2 py-0.5 rounded text-xs md:text-sm font-bold">
      <span>Kết thúc:</span>
      <span className="bg-gray-100 px-1 rounded">{timeLeft.h}</span>:
      <span className="bg-gray-100 px-1 rounded">{timeLeft.m}</span>:
      <span className="bg-gray-100 px-1 rounded">{timeLeft.s}</span>
    </div>
  );
}

function SaleProgress({ sold, total }) {
  const percent = total > 0 ? Math.round((sold / total) * 100) : 0;
  return (
    <div className="mt-2 md:mt-3">
      <div className="w-full bg-red-100 rounded-full h-3 md:h-4 overflow-hidden relative">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 h-full rounded-full transition-all duration-300" style={{ width: `${percent}%` }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] md:text-xs font-bold text-white shadow-sm">{sold >= total ? "Hết hàng" : `Đã bán ${sold}`}</span>
        </div>
      </div>
    </div>
  );
}

/* =================== Main Component =================== */
export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const currentUser = useSelector((state) => state.user?.data);

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const loadReviews = async () => {
    try {
      const list = await reviewApi.fetchByBook(id);
      setReviews(Array.isArray(list) ? list : []);
    } catch (error) { setReviews([]); }
  };

  useEffect(() => { loadReviews(); window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    let ignore = false;
    async function fetchBook() {
      setLoading(true);
      try {
        const res = await fetch(summaryApi.url(`/books/${id}`));
        const json = await res.json();
        const data = json?.data ? json.data : json; 
        if (!ignore) setBook(data);
      } catch (err) { if (!ignore) setBook(null); } 
      finally { if (!ignore) setLoading(false); }
    }
    fetchBook();
    return () => { ignore = true; };
  }, [id]);

  useEffect(() => {
    if (!book?.id) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(summaryApi.url(summaryApi.wishlist.list), { headers: { ...authHeaders() }, signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.success) setIsWishlisted((data.items || []).some((item) => item.book_id === book.id));
      } catch {}
    })();
    return () => controller.abort();
  }, [book?.id]);

  const activeSale = book?.active_flashsale;
  const hasSale = activeSale && activeSale.sale_price != null && Number(activeSale.sale_price) < Number(book.price);
  const price = hasSale ? Number(activeSale.sale_price) : Number(book?.price ?? 0);
  const oldPrice = hasSale ? Number(book.price) : null;
  const discountPercent = hasSale ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  
  // --- Logic Rating & Sold ---
  const averageRating = Number(book?.rating_avg) || 0;
  const ratingCount = Number(book?.rating_count) || 0;

  // ⭐️ LOGIC SỬA LỖI ĐÃ BÁN: Ưu tiên hiển thị số lượng bán của Flash Sale nếu có
  // (Giống hệt logic trong ProductCard.jsx)
  const soldCount = activeSale 
    ? (activeSale.sold_quantity ?? 0) 
    : (book?.sold_count ?? book?.sold ?? 0);

  const handleAddToCart = async () => {
    if (!book) return;
    if (typeof book.stock === 'number' && qty > book.stock) {
      toast.error(`Số lượng hàng không đủ (Còn lại: ${book.stock})`);
      return; 
    }
    const ok = await addToCart({ id: book.id, title: book.title, price, image_url: book.image_url }, qty);
    if (ok) toast.success("Đã thêm vào giỏ hàng", { autoClose: 1400 });
  };

  const handleBuyNow = async () => {
    if (!book) return;
    if (typeof book.stock === 'number' && qty > book.stock) {
      toast.error(`Số lượng hàng không đủ (Còn lại: ${book.stock})`);
      return; 
    }
    const ok = await addToCart({ id: book.id, title: book.title, price, image_url: book.image_url }, qty);
    if (ok) navigate("/cart");
  };

  const handleToggleWishlist = async () => {
    if (!book?.id) return;
    const headers = authHeaders();
    if (!headers?.Authorization) {
      toast.info("Vui lòng đăng nhập");
      navigate("/login");
      return;
    }
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      const url = isWishlisted ? summaryApi.wishlist.remove(book.id) : summaryApi.wishlist.add(book.id);
      const method = isWishlisted ? "DELETE" : "POST";
      const res = await fetch(summaryApi.url(url), { method, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) throw new Error(data?.message);
      setIsWishlisted(!isWishlisted);
      toast.success(isWishlisted ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích");
    } catch (err) { toast.error(err.message); } 
    finally { setWishlistLoading(false); }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Đang tải sản phẩm...</div>;
  if (!book) return <div className="p-10 text-center text-red-600 font-bold">Không tìm thấy sản phẩm</div>;

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-4 py-4 md:py-6 pb-24 md:pb-6">
      
      <nav className="text-sm text-gray-500 mb-3 hidden md:block">
        <Link to="/" className="hover:underline">Trang chủ</Link> / <span className="text-gray-800">{book.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        
        {/* Cột trái: Ảnh */}
        <div className="lg:col-span-2 space-y-4">
          <ImageGallery book={book} discountPercent={discountPercent} />

          {/* ẨN TRÊN MOBILE */}
          <div className="hidden md:block rounded-2xl border border-gray-200 bg-white p-4">
            <div className="font-semibold mb-2">Chính sách cửa hàng</div>
            <Policies />
          </div>
        </div>

        {/* Cột phải: Thông tin */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-snug">{book.title}</h1>
            
            {book.author && <p className="mt-1 text-sm text-gray-500">Tác giả: <span className="text-gray-800 font-medium">{book.author}</span></p>}
            
            {/* ⭐️ ĐÃ SỬA: Dùng soldCount thay vì book.sold */}
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <RatingStars value={averageRating} />
              <span>({ratingCount} đánh giá)</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-700">Đã bán {formatSold(soldCount)}</span>
            </div>

            <div className="mt-4 flex items-end gap-3 bg-gray-50 p-3 rounded-lg md:bg-transparent md:p-0">
              <div className="text-2xl font-extrabold text-red-600">{money(price)}</div>
              {oldPrice && <div className="text-gray-400 line-through text-sm md:text-lg">{money(oldPrice)}</div>}
              {discountPercent > 0 && <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-1 rounded">-{discountPercent}%</span>}
            </div>

            {activeSale && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-600">🔥 FLASH SALE</span>
                  <CountdownTimer endTime={activeSale.sale_end} />
                </div>
                <SaleProgress sold={activeSale.sold_quantity} total={activeSale.sale_quantity} />
              </div>
            )}

            <div className="mt-4"><ShippingCard /></div>

            {/* BUTTONS DESKTOP: Ẩn trên Mobile */}
            <div className="mt-6 hidden md:flex flex-wrap items-center gap-4 border-t pt-4 border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Số lượng</span>
                <Quantity value={qty} onChange={setQty} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleBuyNow} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-white font-bold hover:bg-red-700 shadow-md shadow-red-200">
                  <FiShoppingCart /> Mua ngay
                </button>
                <button onClick={handleAddToCart} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-red-600 font-bold hover:bg-red-100">
                  Thêm vào giỏ
                </button>
                <button onClick={handleToggleWishlist} disabled={wishlistLoading} className={`rounded-xl border px-3 py-3 ${isWishlisted ? "text-red-600 border-red-200 bg-red-50" : "text-gray-400 border-gray-200 hover:bg-gray-50"}`}>
                  {isWishlisted ? <FaHeart className="text-xl" /> : <FiHeart className="text-xl" />}
                </button>
              </div>
            </div>

            {/* MOBILE QUANTITY ONLY */}
            <div className="md:hidden mt-4 flex items-center justify-between py-3 border-t border-b border-gray-100">
               <span className="font-medium text-gray-700">Chọn số lượng:</span>
               <Quantity value={qty} onChange={setQty} />
            </div>

          </div>

          <InfoTable book={book} />

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="font-semibold mb-2">Mô tả sản phẩm</div>
            <p className="whitespace-pre-line text-gray-800 leading-relaxed text-sm md:text-base">{book.description || "Đang cập nhật..."}</p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProductReviews reviews={reviews} currentUser={currentUser} bookId={id} reload={loadReviews} />
      </div>
      <RelatedBooks currentBookId={id} />

      {/* ==================== MOBILE FIXED FOOTER ==================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {/* Nút Yêu thích */}
        <button 
           onClick={handleToggleWishlist} 
           className={`flex flex-col items-center justify-center min-w-[3.5rem] rounded-lg border ${isWishlisted ? 'border-red-200 text-red-600 bg-red-50' : 'border-gray-300 text-gray-500'}`}
        >
           {isWishlisted ? <FaHeart className="text-xl mb-0.5"/> : <FiHeart className="text-xl mb-0.5"/>}
           <span className="text-[10px] font-medium">Thích</span>
        </button>

        {/* Nút Thêm Giỏ */}
        <button 
           onClick={handleAddToCart}
           className="flex-1 rounded-lg bg-red-50 border border-red-600 text-red-600 font-bold text-sm active:bg-red-100 flex flex-col items-center justify-center leading-tight"
        >
           <FiShoppingCart className="text-lg mb-0.5" />
           <span>Thêm giỏ</span>
        </button>

        {/* Nút Mua Ngay */}
        <button 
           onClick={handleBuyNow}
           className="flex-[1.3] rounded-lg bg-red-600 text-white font-bold text-sm active:bg-red-700 shadow-lg shadow-red-200"
        >
           MUA NGAY
        </button>
      </div>

    </div>
  );
}