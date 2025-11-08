import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useCategories from "../../hooks/useCategories";

/* Icon tiêu đề */
function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#ef4444" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#ef4444" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#ef4444" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#ef4444" />
    </svg>
  );
}

/* Helpers */
function chunk10(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i += 10) out.push(arr.slice(i, i + 10));
  return out;
}
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

export default function CategorySection() {
  const { categories, loading } = useCategories();
  const list = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const slides = useMemo(() => chunk10(list), [list]);

  const [index, setIndex] = useState(0);
  const total = slides.length || 1;

  // giữ index hợp lệ khi dữ liệu đổi
  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [total, index]);

  return (
    <section className="mt-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span><GridIcon /></span>
            <h2 className="text-[18px] font-semibold">Danh mục sản phẩm</h2>
          </div>
        </div>

        {/* Slider */}
        <div className="relative group/slider">
          {loading ? (
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-4 px-4 py-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-[70px] h-[70px] rounded-lg bg-gray-200 animate-pulse" />
                  <div className="h-3 w-16 mt-2 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : slides.length === 0 ? (
            <div className="text-sm text-gray-500 px-4 py-6">Chưa có danh mục.</div>
          ) : (
            <>
              <div className="overflow-hidden px-6 py-6">
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    width: `${100 * total}%`,
                    transform: `translateX(-${(100 / total) * index}%)`,
                  }}
                >
                  {slides.map((slide, sIdx) => (
                    <div key={sIdx} className="px-1 sm:px-2" style={{ width: `${100 / total}%` }}>
                      {/* 10 mục/slide ở desktop */}
                      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-10 gap-4">
                        {slide.map((c) => (
                          <CategoryItem key={c.id ?? c.slug ?? c.name} data={c} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mũi tên hai bên */}
              {total > 1 && (
                <>
                  <button
                    aria-label="Previous"
                    onClick={() => setIndex((i) => (i - 1 + total) % total)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-gray-200 bg-white/90 shadow-sm hover:shadow-md hover:bg-white transition opacity-0 group-hover/slider:opacity-100"
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Next"
                    onClick={() => setIndex((i) => (i + 1) % total)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full border border-gray-200 bg-white/90 shadow-sm hover:shadow-md hover:bg-white transition opacity-0 group-hover/slider:opacity-100"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Chấm điều hướng */}
              {total > 1 && (
                <div className="mt-3 mb-4 flex items-center justify-center gap-2">
                  {Array.from({ length: total }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        index === i ? "bg-gray-800" : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      aria-label={`Tới slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function CategoryItem({ data }) {
  const id = data?.id ? String(data.id) : "";
  const slug = data?.slug || (data?.name ? slugify(data.name) : "");
  const to = `/category/${encodeURIComponent(slug || id)}`;

  const img = data?.image_url || "/images/placeholders/category.png";

  return (
    <Link
      to={to}
      className="flex flex-col items-center text-center group/item"
      title={data?.name}
    >
      {/* Khung ảnh có shadow nhẹ + hover */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <img
          src={img}
          alt={data?.name}
          loading="lazy"
          className="w-[70px] h-[70px] object-contain"
          onError={(e) => { e.currentTarget.src = "/images/placeholders/category.png"; }}
        />
      </div>
      <div className="mt-2 text-[13px] text-gray-800 leading-tight line-clamp-2">
        {data?.name}
      </div>
    </Link>
  );
}
