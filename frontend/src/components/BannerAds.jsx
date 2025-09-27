
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// ✅ Import ảnh bằng relative path
import b1 from "../assets/banner/b1.webp";
import b2 from "../assets/banner/b2.webp";
import side1 from "../assets/banner/side1.webp";
import side2 from "../assets/banner/side2.webp";
import small1 from "../assets/banner/small1.webp";
import small2 from "../assets/banner/small2.webp";
import small3 from "../assets/banner/small3.webp";
import small4 from "../assets/banner/small4.webp";

const BannerAds = () => {
  const mainBanners = [b1, b2];
  const sideBanners = [side1, side2];
  const smallBanners = [small1, small2, small3, small4];

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-4">
      {/* Top: Carousel + side banners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Carousel */}
        <div className="lg:col-span-2 rounded-xl overflow-hidden">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000 }}
            loop
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
        <div className="flex flex-col gap-4">
          {sideBanners.map((src, idx) => (
            <a href="#" key={idx} className="block rounded-xl overflow-hidden">
              <img src={src} alt={`Side ${idx + 1}`} className="w-full object-cover" />
            </a>
          ))}
        </div>
      </div>

      {/* Small banners row */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {smallBanners.map((src, idx) => (
          <a href="#" key={idx} className="block rounded-xl overflow-hidden">
            <img src={src} alt={`Small ${idx + 1}`} className="w-full object-cover" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default BannerAds;
