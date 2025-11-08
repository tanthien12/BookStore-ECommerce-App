
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useFlashSaleBooks from "../../hooks/useFlashSaleBooks";
import ProductCard from "../../components/layout/ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

// format đồng hồ đếm ngược
function formatCountdown(nearestEnd) {
  if (!nearestEnd) return { h: "00", m: "00", s: "00" };
  const now = Date.now();
  const diff = nearestEnd.getTime() - now;
  if (diff <= 0) return { h: "00", m: "00", s: "00" };
  const h = Math.floor(diff / 36e5);
  const m = Math.floor((diff % 36e5) / 6e4);
  const s = Math.floor((diff % 6e4) / 1e3);
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(s).padStart(2, "0"),
  };
}

// chia mảng theo size
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// xác định số item/slide theo kích thước màn hình
function useItemsPerSlide() {
  const [w, setW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  if (w >= 1024) return 5;
  if (w >= 768) return 4;
  if (w >= 640) return 3;
  return 2;
}

export default function FlashSale() {
  const { books, loading } = useFlashSaleBooks(25);
  const itemsPerSlide = useItemsPerSlide();
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });

  // tìm thời điểm kết thúc sớm nhất
  const nearestEnd = useMemo(() => {
    if (!books?.length) return null;
    const ends = books
      .map((b) => (b.sale_end ? new Date(b.sale_end) : null))
      .filter((d) => d && !isNaN(d.getTime()))
      .sort((a, b) => a - b);
    return ends[0] || null;
  }, [books]);

  // cập nhật đồng hồ đếm ngược
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(formatCountdown(nearestEnd)), 1000);
    return () => clearInterval(t);
  }, [nearestEnd]);

  const slides = useMemo(() => chunk(books || [], itemsPerSlide), [books, itemsPerSlide]);
  const total = slides.length;

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [total, index]);

  if (loading) {
    return (
      <section className="mt-6 bg-[#ffe9e9] rounded-xl p-4">
        <h2 className="text-base font-semibold text-red-600 mb-2">Flash Sale</h2>
        <div className="text-sm text-gray-600">Đang tải sách khuyến mãi...</div>
      </section>
    );
  }
  if (!books || books.length === 0) return null;

  return (
    <section className="mt-10 rounded-2xl overflow-hidden shadow-lg border border-red-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide">🔥 Flash Sale</h2>
          <div className="flex items-center gap-1 bg-white text-red-600 px-3 py-1 rounded-md font-semibold">
            <span>{timeLeft.h}</span>:<span>{timeLeft.m}</span>:<span>{timeLeft.s}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label="Previous"
            onClick={() => setIndex((i) => (i - 1 + total) % total)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Next"
            onClick={() => setIndex((i) => (i + 1) % total)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-red-600 hover:bg-white"
          >
            <ChevronRight size={18} />
          </button>

          <Link to="/flash-sale" className="ml-3 text-white hover:underline text-sm">
            Xem tất cả
          </Link>
        </div>
      </div>

      {/* Slider */}
      <div className="relative bg-white">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              width: `${100 * total}%`,
              transform: `translateX(-${(100 / total) * index}%)`,
            }}
          >
            {slides.map((slide, sIdx) => (
              <div key={sIdx} className="px-5 py-5" style={{ width: `${100 / total}%` }}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {slide.map((b) => (
                    <div key={b.id} className="h-full">
                      <ProductCard book={b} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-2 pb-5">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                aria-label={`Chuyển tới slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  index === i ? "bg-red-600" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
