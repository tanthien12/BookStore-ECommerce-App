import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css"; import "swiper/css/navigation";

import { products } from "../../data/products";
import ProductCard from "./ProductCard";


export default function FlashSale() {
    const list = products.slice(0, 8); // ví dụ lấy vài item
    return (
        <div className="mx-auto max-w-7xl px-3 md:px-4 mt-8">
            <div className="flex items-center justify-between bg-white rounded-t-xl px-4 py-2">
                <h2 className="text-lg font-bold text-red-600">FLASH SALE ⚡</h2>
                <a href="#" className="text-blue-600 text-sm hover:underline">Xem tất cả</a>
            </div>
            <div className="bg-gradient-to-r from-red-400 to-red-500 p-4 rounded-b-xl">
                <Swiper modules={[Navigation]} navigation spaceBetween={16} slidesPerView={2}
                    breakpoints={{ 640: { slidesPerView: 3 }, 1024: { slidesPerView: 5 } }}>
                    {list.map(p => (
                        <SwiperSlide key={p.id}>
                            <ProductCard product={p} showDiscount />
                        </SwiperSlide>
                    ))}
                </Swiper>

            </div>
        </div>
    );
}