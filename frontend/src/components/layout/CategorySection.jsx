import React, { useMemo, useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { BiCategory } from "react-icons/bi";

// Import hook logic (đảm bảo đường dẫn đúng với cấu trúc dự án của bạn)
import useCategories from "../../hooks/useCategories";

/* --- 1. HELPER FUNCTIONS --- */
function slugify(text) {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* --- 2. CUSTOM HOOK: useItemsPerRow (Đã tối ưu Performance) --- */
function useItemsPerRow() {
  // Lazy Initialization: Tính toán ngay lần đầu để tránh layout shift
  const getItemsCount = () => {
    if (typeof window === 'undefined') return 10; // Mặc định cho Server
    const width = window.innerWidth;
    if (width < 640) return 4;
    if (width < 768) return 5;
    if (width < 1024) return 6;
    if (width < 1280) return 8;
    return 10;
  };

  const [itemsPerRow, setItemsPerRow] = useState(getItemsCount);

  useEffect(() => {
    let timeoutId = null;

    const handleResize = () => {
      // Debounce: Chỉ tính toán lại sau khi người dùng dừng kéo 200ms
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setItemsPerRow(getItemsCount());
      }, 200);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return itemsPerRow;
}

/* --- 3. COMPONENT: CategoryItem (Đã Fix lỗi ảnh lặp vô tận) --- */
const CategoryItem = memo(({ data }) => {
  const rawSlug = data?.slug || (data?.name ? slugify(data.name) : "") || String(data?.id) || "unknown";
  const to = `/category/${encodeURIComponent(rawSlug)}`;

  // Đường dẫn ảnh dự phòng
  const PLACEHOLDER = "/images/placeholders/category.png";

  // Hàm xử lý lỗi ảnh quan trọng
  const handleImageError = (e) => {
    const target = e.currentTarget;
    // Nếu src hiện tại đã chứa placeholder (nghĩa là đã lỗi 1 lần rồi) -> Dừng ngay để tránh vòng lặp
    if (target.src.includes("placeholders/category.png")) {
      target.onerror = null;
      return;
    }
    // Gán ảnh placeholder nếu ảnh gốc lỗi
    target.onerror = null;
    target.src = PLACEHOLDER;
  };

  return (
    <Link
      to={to}
      className="group flex flex-col items-center text-center p-2 rounded-lg transition-all duration-300 hover:bg-gray-50"
      title={data?.name}
    >
      {/* Khung ảnh */}
      <div className="
        relative w-full aspect-square mb-2 
        overflow-hidden rounded-xl 
        bg-white border border-gray-100 shadow-sm 
        transition-all duration-300 
        group-hover:shadow-md group-hover:border-red-200
      ">
        <img
          src={data?.image_url || PLACEHOLDER}
          alt={data?.name || "Category"}
          loading="lazy"
          className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-110"
          onError={handleImageError} // Gọi hàm xử lý lỗi tại đây
        />
      </div>

      {/* Tên danh mục */}
      <div className="w-full">
        <span className="
          block text-[12px] md:text-[13px] font-semibold 
          leading-tight text-gray-700 
          line-clamp-2 transition-colors group-hover:text-red-600
        ">
          {data?.name || "Danh mục"}
        </span>
      </div>
    </Link>
  );
});

/* --- 4. MAIN COMPONENT: CategorySection --- */
export default function CategorySection() {
  const { categories, loading } = useCategories();
  const itemsPerRow = useItemsPerRow();

  // Chia danh sách thành các trang (chunks)
  const slides = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    if (list.length === 0) return [];

    const chunks = [];
    for (let i = 0; i < list.length; i += itemsPerRow) {
      chunks.push(list.slice(i, i + itemsPerRow));
    }
    return chunks;
  }, [categories, itemsPerRow]);

  const [index, setIndex] = useState(0);
  const total = slides.length || 1;

  // Reset về trang đầu khi số lượng item/dòng thay đổi
  useEffect(() => {
    setIndex(0);
  }, [itemsPerRow]);

  // CSS Class cho nút điều hướng
  // Thêm 'pointer-events-none' để không bấm được khi nút ẩn
  const getNavBtnClass = (isHidden) => `
    absolute top-1/2 -translate-y-1/2 z-20
    w-10 h-10 flex items-center justify-center
    text-gray-400 hover:text-gray-900 
    transition-all duration-300 hover:scale-125
    cursor-pointer
    ${isHidden ? "opacity-0 pointer-events-none" : "opacity-100"}
  `;

  return (
    <section className="mt-8 select-none">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">

        {/* --- HEADER --- */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b-2 border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <BiCategory className="text-gray-800 text-3xl" />
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">
              Danh mục sản phẩm
            </h2>
          </div>
        </div>

        {/* --- SLIDER BODY --- */}
        <div className="relative group/slider px-2 md:px-4 py-4">

          {/* Nút Previous */}
          {total > 1 && (
            <button
              onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
              disabled={index === 0}
              className={`${getNavBtnClass(index === 0)} left-0 -ml-2 md:ml-0`}
              aria-label="Previous"
            >
              <FaChevronLeft size={24} />
            </button>
          )}

          {/* Nút Next */}
          {total > 1 && (
            <button
              onClick={() => setIndex((prev) => Math.min(total - 1, prev + 1))}
              disabled={index === total - 1}
              className={`${getNavBtnClass(index === total - 1)} right-0 -mr-2 md:mr-0`}
              aria-label="Next"
            >
              <FaChevronRight size={24} />
            </button>
          )}

          {loading ? (
            // Skeleton Loading
            <div
              className="grid gap-2 w-full animate-pulse"
              style={{ gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: itemsPerRow }).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2 p-2">
                  <div className="w-full aspect-square rounded-xl bg-gray-200" />
                  <div className="h-3 w-16 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : slides.length === 0 ? (
            <div className="py-8 text-center text-gray-400">Chưa có danh mục.</div>
          ) : (
            <div className="overflow-hidden px-1">
              <div
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{
                  width: `${100 * total}%`,
                  transform: `translateX(-${(100 / total) * index}%)`,
                }}
              >
                {slides.map((slide, sIdx) => (
                  <div key={sIdx} className="px-1" style={{ width: `${100 / total}%` }}>
                    <div
                      className="grid gap-2 md:gap-4 w-full"
                      style={{ gridTemplateColumns: `repeat(${itemsPerRow}, minmax(0, 1fr))` }}
                    >
                      {slide.map((c, i) => (
                        // Ưu tiên dùng id làm key, nếu không có mới dùng index
                        <CategoryItem key={c.id || `idx-${i}`} data={c} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// import React, { useMemo, useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import useCategories from "../../hooks/useCategories";

// /* Icon tiêu đề */
// function GridIcon() {
//   return (
//     <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
//       <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#ef4444" />
//       <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#ef4444" />
//       <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#ef4444" />
//       <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#ef4444" />
//     </svg>
//   );
// }

// /* Helpers */
// function chunk10(arr) {
//   const out = [];
//   for (let i = 0; i < arr.length; i += 10) out.push(arr.slice(i, i + 10));
//   return out;
// }
// function slugify(text) {
//   if (!text) return "";
//   return String(text)
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/[^a-z0-9\s-]/g, "")
//     .trim()
//     .replace(/\s+/g, "-")
//     .replace(/-+/g, "-");
// }

// export default function CategorySection() {
//   const { categories, loading } = useCategories();
//   const list = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
//   const slides = useMemo(() => chunk10(list), [list]);

//   const [index, setIndex] = useState(0);
//   const total = slides.length || 1;

//   // giữ index hợp lệ khi dữ liệu đổi
//   useEffect(() => {
//     if (index >= total) setIndex(0);
//   }, [total, index]);

//   return (
//     <section className="mt-6">
//       <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//         {/* Header */}
//         <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
//           <div className="flex items-center gap-2">
//             <span><GridIcon /></span>
//             <h2 className="text-[18px] font-semibold">Danh mục sản phẩm</h2>
//           </div>
//         </div>

//         {/* Slider */}
//         <div className="relative group/slider">
//           {loading ? (
//             <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-4 px-4 py-6">
//               {Array.from({ length: 10 }).map((_, i) => (
//                 <div key={i} className="flex flex-col items-center">
//                   <div className="w-[70px] h-[70px] rounded-lg bg-gray-200 animate-pulse" />
//                   <div className="h-3 w-16 mt-2 bg-gray-200 rounded animate-pulse" />
//                 </div>
//               ))}
//             </div>
//           ) : slides.length === 0 ? (
//             <div className="text-sm text-gray-500 px-4 py-6">Chưa có danh mục.</div>
//           ) : (
//             <>
//               <div className="overflow-hidden px-6 py-6">
//                 <div
//                   className="flex transition-transform duration-500 ease-in-out"
//                   style={{
//                     width: `${100 * total}%`,
//                     transform: `translateX(-${(100 / total) * index}%)`,
//                   }}
//                 >
//                   {slides.map((slide, sIdx) => (
//                     <div key={sIdx} className="px-1 sm:px-2" style={{ width: `${100 / total}%` }}>
//                       {/* 10 mục/slide ở desktop */}
//                       <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-4">
//                         {slide.map((c) => (
//                           <CategoryItem key={c.id ?? c.slug ?? c.name} data={c} />
//                         ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Mũi tên hai bên */}
//               {total > 1 && (
//                 <>
//                   <button
//                     aria-label="Previous"
//                     onClick={() => setIndex((i) => (i - 1 + total) % total)}
//                     className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-gray-200 bg-white/90 shadow-sm hover:shadow-md hover:bg-white transition opacity-0 group-hover/slider:opacity-100"
//                   >
//                     ‹
//                   </button>
//                   <button
//                     aria-label="Next"
//                     onClick={() => setIndex((i) => (i + 1) % total)}
//                     className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-gray-200 bg-white/90 shadow-sm hover:shadow-md hover:bg-white transition opacity-0 group-hover/slider:opacity-100"
//                   >
//                     ›
//                   </button>
//                 </>
//               )}

//               {/* Chấm điều hướng */}
//               {total > 1 && (
//                 <div className="mt-3 mb-4 flex items-center justify-center gap-2">
//                   {Array.from({ length: total }).map((_, i) => (
//                     <button
//                       key={i}
//                       onClick={() => setIndex(i)}
//                       className={`h-2.5 w-2.5 rounded-full transition ${
//                         index === i ? "bg-gray-800" : "bg-gray-300 hover:bg-gray-400"
//                       }`}
//                       aria-label={`Tới slide ${i + 1}`}
//                     />
//                   ))}
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </section>
//   );
// }

// function CategoryItem({ data }) {
//   const id = data?.id ? String(data.id) : "";
//   const slug = data?.slug || (data?.name ? slugify(data.name) : "");
//   const to = `/category/${encodeURIComponent(slug || id)}`;

//   const img = data?.image_url || "/images/placeholders/category.png";

//   return (
//     <Link
//       to={to}
//       className="flex flex-col items-center text-center group/item"
//       title={data?.name}
//     >
//       {/* Khung ảnh có shadow nhẹ + hover */}
//       <div className="rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
//         <img
//           src={img}
//           alt={data?.name}
//           loading="lazy"
//           className="w-[70px] h-[70px] object-contain"
//           onError={(e) => { e.currentTarget.src = "/images/placeholders/category.png"; }}
//         />
//       </div>
//       <div className="mt-2 text-[13px] text-gray-800 leading-tight line-clamp-2">
//         {data?.name}
//       </div>
//     </Link>
//   );
// }
