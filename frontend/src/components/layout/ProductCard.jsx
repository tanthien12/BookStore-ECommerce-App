import React from "react";
import { Link } from "react-router-dom";
// chỉnh đường dẫn này theo cấu trúc dự án của bạn
import { money } from "../../helpers/productHelper";

export default function ProductCard({ book, product, topBadgeText }) {
  // Hỗ trợ cả props book hoặc product
  const src = book || product || {};

  const id = src.id;
  const title = src.title || "Sản phẩm";
  const imageUrl =
    src.image_url || src.imageUrl || "https://via.placeholder.com/220x300?text=Book";

  // Giá: mapping theo backend (price, sale_price)
  const basePrice = src.price ?? null;
  const salePrice = src.sale_price ?? src.salePrice ?? null;
  const hasSale =
    basePrice != null &&
    salePrice != null &&
    Number(salePrice) > 0 &&
    Number(salePrice) < Number(basePrice);
  const discountPercent = hasSale
    ? Math.max(0, Math.round((1 - Number(salePrice) / Number(basePrice)) * 100))
    : 0;

  // Rating + sold (nếu API có)
  const ratingAvg = Number(src.rating_avg ?? src.ratingAvg ?? 0);
  const ratingCount = Number(src.rating_count ?? src.ratingCount ?? 0);
  const soldCount = Number(src.sold_count ?? src.soldCount ?? 0);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-transparent bg-white shadow-sm transition hover:border-red-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <Link to={`/product/${id}`} className="block">
        {/* Image */}
        <div className="relative bg-gray-50">
          {topBadgeText ? (
            <span className="absolute right-2 top-2 z-10 rounded-md bg-neutral-800/90 px-2 py-0.5 text-xs font-semibold text-white">
              {topBadgeText}
            </span>
          ) : null}
          {/* giữ tỉ lệ 3:4, object-contain giống ảnh mẫu */}
          <div className="relative w-full pt-[133.33%]">
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain p-2"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Title 2 dòng */}
          <h3
            className="text-sm font-medium text-neutral-900"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.6rem",
            }}
            title={title}
          >
            {title}
          </h3>

          {/* Giá + badge giảm */}
          <div className="mt-2 flex items-end gap-2">
            <div className="flex flex-col">
              <span className={`text-base font-semibold ${hasSale ? "text-red-600" : "text-neutral-900"}`}>
                {money(hasSale ? salePrice : basePrice)}
              </span>
              {hasSale && (
                <span className="text-xs text-neutral-500 line-through">
                  {money(basePrice)}
                </span>
              )}
            </div>
            {hasSale && (
              <span className="mb-[2px] rounded-md bg-red-600 px-2 py-[2px] text-xs font-bold text-white">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Rating + đã bán */}
          {(ratingAvg > 0 || soldCount > 0) && (
            <div className="mt-2 flex items-center gap-3 text-xs text-neutral-600">
              {ratingAvg > 0 && (
                <span className="inline-flex items-center gap-1">
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const filled = i + 1 <= Math.round(ratingAvg);
                      return (
                        <svg
                          key={i}
                          viewBox="0 0 20 20"
                          className={`h-3.5 w-3.5 ${filled ? "fill-yellow-500" : "fill-neutral-300"}`}
                        >
                          <path d="M10 15.27l5.18 3.05-1.64-5.81L18 8.63l-6-.22L10 3 8 8.41l-6 .22 4.46 3.88L4.82 18.3 10 15.27z" />
                        </svg>
                      );
                    })}
                  </span>
                  <span className="font-medium text-neutral-700">{ratingAvg.toFixed(1)}</span>
                  {ratingCount > 0 && <span>({ratingCount})</span>}
                </span>
              )}
              {soldCount > 0 && <span className="whitespace-nowrap">Đã bán {soldCount}</span>}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
