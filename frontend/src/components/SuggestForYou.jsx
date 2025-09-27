// src/components/SuggestForYou.jsx
import React, { useMemo } from "react";
import ProductCard from "./ProductCard";
import { products as ALL } from "../data/products";

export default function SuggestForYou({ products = ALL }) {
  const suggestion = useMemo(
    () =>
      [...products]
        .filter((p) => (p.rating && p.rating >= 4) || (p.sold && p.sold > 0))
        .slice(0, 15),
    [products]
  );

  return (
    <section className="mx-auto max-w-7xl px-3 md:px-4 mt-10">
      {/* Header */}
      <div className="rounded-t-xl bg-green-50 border border-green-100">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-bold text-green-700 text-lg">Gợi ý cho bạn</h2>
          <a href="#" className="text-sm text-blue-600 hover:underline">
            Xem tất cả
          </a>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white border-x border-b border-green-100 rounded-b-xl">
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {suggestion.map((p) => (
            <div key={p.id} className="relative">
              <ProductCard product={p} showDiscount />
              {/* Rating + đã bán */}
              <div className="px-3 pb-3">
                {p.rating && (
                  <div className="flex items-center gap-1 text-[11px] text-yellow-500">
                    {"★".repeat(Math.round(p.rating))}
                    <span className="text-gray-500 ml-1">({p.rating})</span>
                  </div>
                )}
                <p className="mt-1 text-[11px] text-gray-500">
                  Đã bán {p.sold || Math.floor(Math.random() * 200)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center pb-5">
          <button
            type="button"
            className="px-5 py-2 rounded-full text-sm bg-green-600 text-white hover:bg-green-700 focus:outline-none"
          >
            Xem thêm
          </button>
        </div>
      </div>
    </section>
  );
}
  