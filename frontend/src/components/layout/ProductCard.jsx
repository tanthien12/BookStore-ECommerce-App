// src/components/layout/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { money } from "../../helpers/productHelper";
import { FaBolt, FaStar } from "react-icons/fa"; 

export default function ProductCard({ book, product, topBadgeText }) {
  // Hỗ trợ cả props book hoặc product
  const src = book || product || {};

  const id = src.id;
  const title = src.title || "Sản phẩm";
  const imageUrl = src.image_url || src.imageUrl || "https://via.placeholder.com/300x300?text=No+Image";

  // --- Logic giá ---
  const activeSale = src.active_flashsale; 
  const basePrice = src.price ?? 0;

  const hasSale =
    activeSale &&
    activeSale.sale_price != null &&
    basePrice != null &&
    Number(activeSale.sale_price) < Number(basePrice);

  const displayPrice = hasSale ? Number(activeSale.sale_price) : Number(basePrice);
  const oldPrice = hasSale ? Number(basePrice) : null;

  const discountPercent = hasSale
    ? Math.max(0, Math.round((1 - Number(displayPrice) / Number(basePrice)) * 100))
    : 0;
  
  // --- Logic Rating & Sold ---
  const ratingAvg = Number(src.rating_avg || 0);
  const soldCount = activeSale ? (activeSale.sold_quantity ?? 0) : (src.sold_count ?? 0);
  
  // Logic hiển thị Badge Xu hướng
  const isTrending = topBadgeText === "Xu hướng" || soldCount > 1000; 

  // Format số lượng bán (vd: 2.9k)
  const formatSold = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num;
  };

  return (
    <div className="group relative w-full overflow-hidden rounded-md bg-white transition-all hover:shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-transparent hover:border-red-500/30">
      <Link to={`/product/${id}`} className="block h-full flex flex-col">
        {/* === 1. IMAGE SECTION === */}
        <div className="relative w-full pt-[100%]">
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* === 2. CONTENT SECTION === */}
        <div className="flex flex-1 flex-col p-2.5">
          {/* TITLE */}
          <div className="min-h-[2.5rem]">
            <h3 
              className="text-xs md:text-sm text-neutral-800 leading-snug"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
              title={title}
            >
              {isTrending && (
                <span className="mr-1 inline-flex items-center rounded-[2px] bg-orange-500 px-1 py-[1px] text-[10px] font-bold text-white align-text-bottom">
                   Xu hướng <FaBolt className="ml-0.5 text-[8px]" />
                </span>
              )}
              {title}
            </h3>
          </div>

          {/* PRICE & INFO SECTION */}
          <div className="mt-auto pt-2">
            {/* Dòng 1: Giá + Tem giảm giá */}
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-red-600">
                {money(displayPrice)}
              </span>
              {hasSale && (
                <span className="rounded-[2px] bg-red-600 px-1 py-[1px] text-[10px] font-bold text-white">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Dòng 2: Giá cũ */}
            {hasSale ? (
              <div className="text-xs text-neutral-400 line-through mt-0.5">
                {money(oldPrice)}
              </div>
            ) : (
              <div className="h-4"></div> 
            )}

            {/* Dòng 3: Rating & Đã bán (GIỐNG ẢNH MẪU) */}
            <div className="mt-2 flex items-center text-xs text-neutral-500">
              {/* Hiển thị 5 ngôi sao */}
              {ratingAvg > 0 && (
                <div className="flex items-center mr-2">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      className={`h-3 w-3 ${
                        index < Math.round(ratingAvg) ? "text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Dấu gạch đứng phân cách (chỉ hiện khi có cả rating và đã bán) */}
              {ratingAvg > 0 && soldCount > 0 && (
                <span className="mx-2 text-neutral-300">|</span>
              )}

              {/* Đã bán */}
              {soldCount > 0 && (
                <span>Đã bán {formatSold(soldCount)}</span>
              )}
            </div>
            
          </div>
        </div>
      </Link>
    </div>
  );
}