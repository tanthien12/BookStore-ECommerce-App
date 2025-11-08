// src/components/layout/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";

function formatCurrency(v) {
  if (v == null) return "";
  const num = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("vi-VN") + " ₫";
}

export default function ProductCard({ product, book }) {
  // chấp nhận cả product lẫn book
  const src = product || book || {};

  const id =
    src.id ||
    src.book_id ||
    src.slug ||
    src._id ||
    "";

  const title = src.title || src.name || "Sản phẩm";

  const imageUrl =
    src.imageUrl ||
    src.image_url ||
    src.img ||
    src.thumbnail ||
    "https://via.placeholder.com/200x200?text=Book";

  // ====== GIÁ ======
  // Giá đang bán (ưu tiên sale/discount)
  const sale =
    src.sale_price ??
    src.discount_price ??
    src.price_sale ??
    null;

  // Giá gốc để gạch
  const basePrice = src.price ?? src.original_price ?? null;

  // Giá hiển thị chính
  const price = sale ?? basePrice ?? null;

  // Giá gốc để gạch (khác giá hiển thị và > giá hiển thị)
  const oldPrice =
    basePrice != null && price != null && basePrice > price ? basePrice : null;

  // % giảm
  const discountPercent =
    oldPrice && price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  const sold =
    src.sold_count ||
    src.sold ||
    src.total_sold ||
    src.order_count ||
    null;

  return (
    <div className="w-full bg-white rounded-lg border border-transparent hover:border-red-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition overflow-hidden">
      <Link to={`/product/${id}`} className="block">
        {/* Ảnh */}
        <div className="relative w-full pt-[130%] bg-gray-50 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-contain p-2"
            loading="lazy"
          />

          {/* badge giảm giá */}
          {discountPercent ? (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[11px] font-semibold px-2 py-1 rounded-md">
              -{discountPercent}%
            </span>
          ) : null}
        </div>

        {/* Nội dung */}
        <div className="p-3 flex flex-col gap-2">
          {/* title */}
          <h3 className="text-sm text-gray-800 leading-snug line-clamp-2 min-h-[2.6rem]">
            {title}
          </h3>

          {/* giá */}
          <div className="flex flex-wrap items-center gap-2">
            {price != null ? (
              <span className="text-red-600 font-semibold text-sm">
                {formatCurrency(price)}
              </span>
            ) : (
              <span className="text-gray-400 text-sm">Liên hệ</span>
            )}

            {oldPrice != null ? (
              <span className="text-gray-400 line-through text-xs">
                {formatCurrency(oldPrice)}
              </span>
            ) : null}
          </div>

          {/* đã bán */}
          {sold != null ? (
            <p className="text-[11px] text-gray-400">Đã bán {sold}</p>
          ) : null}
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
