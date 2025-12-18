// src/pages/component/FlashSale.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import useFlashSaleBooks from "../../hooks/useFlashSaleBooks";
import ProductCard from "../../components/layout/ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import Swiper và CSS
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

// Hàm format đồng hồ đếm ngược
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

export default function FlashSale() {
  const { books, loading } = useFlashSaleBooks(25);
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  
  // Ref để điều khiển Swiper từ nút bên ngoài
  const swiperRef = useRef(null);

  // Tìm thời điểm kết thúc sớm nhất
  const nearestEnd = useMemo(() => {
    if (!books?.length) return null;
    const ends = books
      .map((b) => (b.active_flashsale?.sale_end ? new Date(b.active_flashsale.sale_end) : null))
      .filter((d) => d && !isNaN(d.getTime()))
      .sort((a, b) => a - b);
    return ends[0] || null;
  }, [books]);

  // Cập nhật đồng hồ
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(formatCountdown(nearestEnd)), 1000);
    return () => clearInterval(t);
  }, [nearestEnd]);

  if (loading) {
    return (
      <section className="mt-6 bg-[#ffe9e9] rounded-xl p-4 animate-pulse">
        <h2 className="text-base font-semibold text-red-600 mb-2">Flash Sale</h2>
        <div className="h-40 bg-red-50 rounded-md"></div>
      </section>
    );
  }
  
  if (!books || books.length === 0) return null;

  return (
    <section className="mt-6 md:mt-10 rounded-2xl overflow-hidden shadow-lg border border-red-100 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 md:px-6 md:py-4 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
        
        {/* Left: Title + Timer */}
        <div className="flex items-center gap-2 md:gap-3">
          <h2 className="text-lg md:text-2xl font-extrabold uppercase tracking-wide whitespace-nowrap">
            🔥 Flash Sale
          </h2>
          
          <div className="flex items-center gap-1 bg-white text-red-600 px-2 py-0.5 md:px-3 md:py-1 rounded md:rounded-md font-bold text-xs md:text-base shadow-sm">
            <span>{timeLeft.h}</span>:<span>{timeLeft.m}</span>:<span>{timeLeft.s}</span>
          </div>
        </div>

        {/* Right: Link & Controls */}
        <div className="flex items-center gap-2">
            <Link 
              to="/flash-sale" 
              className="text-white hover:text-yellow-200 transition-colors flex items-center"
              aria-label="Xem tất cả Flash Sale"
            >
              {/* Desktop: Hiện chữ */}
              <span className="hidden md:inline text-sm font-medium mr-1">Xem tất cả</span>
              
              {/* Mobile: Hiện icon mũi tên to */}
              <ChevronRight className="md:hidden w-6 h-6" />

              {/* Desktop: Icon mũi tên nhỏ trang trí */}
              <span className="hidden md:inline">&rarr;</span>
            </Link>
          
            {/* Nút Next/Prev chỉ hiện trên Desktop */}
            <div className="hidden md:flex items-center gap-2 ml-2">
                <button
                aria-label="Previous"
                onClick={() => swiperRef.current?.slidePrev()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white text-white hover:text-red-600 transition-colors"
                >
                <ChevronLeft size={18} />
                </button>
                <button
                aria-label="Next"
                onClick={() => swiperRef.current?.slideNext()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white text-white hover:text-red-600 transition-colors"
                >
                <ChevronRight size={18} />
                </button>
            </div>
        </div>
      </div>

      {/* Slider Content */}
      <div className="p-3 md:p-5">
        <Swiper
            modules={[Navigation, Autoplay]}
            onBeforeInit={(swiper) => {
                swiperRef.current = swiper;
            }}
            spaceBetween={10}
            slidesPerView={2} // Mobile mặc định hiện 2 item
            breakpoints={{
                // Tablet nhỏ
                640: {
                    slidesPerView: 3,
                    spaceBetween: 15,
                },
                // Tablet to
                768: {
                    slidesPerView: 4,
                    spaceBetween: 20,
                },
                // Desktop
                1024: {
                    slidesPerView: 5,
                    spaceBetween: 20,
                },
                // Màn hình siêu rộng
                1280: {
                    slidesPerView: 5,
                    spaceBetween: 24,
                }
            }}
            autoplay={{
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
            }}
            loop={false}
            className="pb-2"
        >
          {books.map((book) => (
            <SwiperSlide key={book.id} className="h-auto">
                <div className="h-full border border-gray-100 rounded-lg hover:shadow-md transition-shadow p-2">
                    <ProductCard book={book} />
                </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}