import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Import ảnh
import b1 from "../../assets/banner/b1.webp";
import b2 from "../../assets/banner/b2.webp";
import side1 from "../../assets/banner/side1.webp";
import side2 from "../../assets/banner/side2.webp";
import small1 from "../../assets/banner/small1.webp";
import small2 from "../../assets/banner/small2.webp";
import small3 from "../../assets/banner/small3.webp";
import small4 from "../../assets/banner/small4.webp";

const BannerAds = () => {
    const mainBanners = [b1, b2];
    const sideBanners = [side1, side2];
    const smallBanners = [small1, small2, small3, small4];

    // [QUAN TRỌNG] Gộp tất cả ảnh vào một mảng duy nhất để chạy slide trên Mobile
    const mobileBanners = [...mainBanners, ...sideBanners, ...smallBanners];

    return (
        <div className="mx-auto max-w-7xl px-3 md:px-4 mt-4">
            
            {/* --- GIAO DIỆN MOBILE (< 768px): HIỆN 1 SLIDE DUY NHẤT --- */}
            <div className="block md:hidden rounded-xl overflow-hidden">
                <Swiper
                    modules={[Pagination, Autoplay]}
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 3000 }}
                    spaceBetween={10}
                    slidesPerView={1}
                    loop
                    className="w-full aspect-[16/9]" // Tỷ lệ khung hình đẹp cho mobile
                >
                    {mobileBanners.map((src, idx) => (
                        <SwiperSlide key={idx}>
                            <img
                                src={src}
                                alt={`Banner Mobile ${idx}`}
                                className="w-full h-full object-cover"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* --- GIAO DIỆN DESKTOP (>= 768px): GIỮ NGUYÊN LAYOUT GRID CŨ --- */}
            <div className="hidden md:block">
                {/* Top: Carousel + side banners */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Carousel Desktop */}
                    <div className="lg:col-span-2 rounded-xl overflow-hidden">
                        <Swiper
                            modules={[Navigation, Pagination, Autoplay]}
                            navigation
                            pagination={{ clickable: true }}
                            autoplay={{ delay: 4000 }}
                            loop
                            className="h-full" // Đảm bảo swiper chiếm hết chiều cao
                        >
                            {mainBanners.map((src, idx) => (
                                <SwiperSlide key={idx}>
                                    <img
                                        src={src}
                                        alt={`Banner ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>

                    {/* Side banners */}
                    <div className="flex flex-col gap-4 h-full">
                        {sideBanners.map((src, idx) => (
                            <a href="#" key={idx} className="block rounded-xl overflow-hidden flex-1 group">
                                <img 
                                    src={src} 
                                    alt={`Side ${idx + 1}`} 
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Small banners row */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {smallBanners.map((src, idx) => (
                        <a href="#" key={idx} className="block rounded-xl overflow-hidden aspect-[2/1] group">
                            <img 
                                src={src} 
                                alt={`Small ${idx + 1}`} 
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BannerAds;