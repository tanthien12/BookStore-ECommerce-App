// src/components/layout/ProductCard.jsx
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


// import React from "react";
// import { Link } from "react-router-dom";

// function formatCurrency(v) {
//   if (v == null) return "";
//   // v có thể là string từ BE
//   const num = typeof v === "string" ? Number(v) : v;
//   if (Number.isNaN(num)) return "";
//   return num.toLocaleString("vi-VN") + " ₫";
// }

// export default function ProductCard({ product, book }) {
//   // chấp nhận cả product lẫn book
//   const src = product || book || {};

//   const id =
//     src.id ||
//     src.book_id ||
//     src.slug ||
//     src._id ||
//     ""; // để dùng cho link

//   const title = src.title || src.name || "Sản phẩm";

//   const imageUrl =
//     src.imageUrl ||
//     src.image_url ||
//     src.img ||
//     src.thumbnail ||
//     "https://via.placeholder.com/200x200?text=Book";

//   // giá hiện tại
//   const price =
//     src.discount_price ??
//     src.sale_price ??
//     src.price ??
//     src.final_price ??
//     null;

//   // giá gốc
//   const oldPrice =
//     src.price && src.discount_price && src.discount_price < src.price
//       ? src.price
//       : src.oldPrice || src.original_price || null;

//   // tính % giảm
//   let discountPercent = src.discount_percent;
//   if (!discountPercent && oldPrice && price && oldPrice > price) {
//     discountPercent = Math.round(((oldPrice - price) / oldPrice) * 100);
//   }

//   const sold =
//     src.sold_count ||
//     src.sold ||
//     src.total_sold ||
//     src.order_count ||
//     null;

//   return (
//     <div className="w-full bg-white rounded-lg border border-transparent hover:border-red-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition overflow-hidden">
//       <Link to={`/product/${id}`} className="block">
//         {/* Ảnh */}
//         <div className="relative w-full pt-[130%] bg-gray-50 overflow-hidden">
//           <img
//             src={imageUrl}
//             alt={title}
//             className="absolute inset-0 w-full h-full object-contain p-2"
//             loading="lazy"
//           />

//           {/* badge giảm giá */}
//           {discountPercent ? (
//             <span className="absolute top-2 left-2 bg-red-500 text-white text-[11px] font-semibold px-2 py-1 rounded-md">
//               -{discountPercent}%
//             </span>
//           ) : null}
//         </div>

//         {/* Nội dung */}
//         <div className="p-3 flex flex-col gap-2">
//           {/* title */}
//           <h3 className="text-sm text-gray-800 leading-snug line-clamp-2 min-h-[2.6rem]">
//             {title}
//           </h3>

//           {/* giá */}
//           <div className="flex flex-wrap items-center gap-2">
//             {price != null ? (
//               <span className="text-red-600 font-semibold text-sm">
//                 {formatCurrency(price)}
//               </span>
//             ) : (
//               <span className="text-gray-400 text-sm">Liên hệ</span>
//             )}

//             {oldPrice != null && oldPrice !== price ? (
//               <span className="text-gray-400 line-through text-xs">
//                 {formatCurrency(oldPrice)}
//               </span>
//             ) : null}
//           </div>

//           {/* đã bán */}
//           {sold != null ? (
//             <p className="text-[11px] text-gray-400">
//               Đã bán {sold}
//             </p>
//           ) : null}
//         </div>
//       </Link>
//     </div>
//   );
// }
