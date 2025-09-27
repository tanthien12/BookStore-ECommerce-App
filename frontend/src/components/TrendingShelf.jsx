// src/components/TrendingShelf.jsx
import React, { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import { products as ALL } from "../data/products";
import { pickTrendingGroups } from "../helpers/productHelper";

const TABS = [
  { id: "day", label: "Xu Hướng Theo Ngày" },
  { id: "hot", label: "Sách HOT - Giảm Sốc" },
  { id: "foreign", label: "Bestseller Ngoại Văn" },
];

export default function TrendingShelf({ products = ALL }) {
  const { day, hot, foreign } = useMemo(
    () => pickTrendingGroups(products),
    [products]
  );
  const [active, setActive] = useState("day");
  const current =
    active === "day" ? day : active === "hot" ? hot : foreign;

  return (
    <section className="mx-auto max-w-7xl px-3 md:px-4 mt-10">
      {/* Header + Tabs */}
      <div className="rounded-t-xl bg-pink-50 border border-pink-100">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-bold text-pink-700 text-lg">Xu Hướng Mua Sắm</h2>
          <a href="#" className="text-sm text-blue-600 hover:underline">
            Xem tất cả
          </a>
        </div>
        <div className="flex gap-1 px-3 pb-2 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={[
                "text-xs md:text-sm rounded-full px-3 md:px-4 py-1.5 border",
                active === tab.id
                  ? "bg-white border-pink-300 text-pink-700 shadow"
                  : "bg-transparent border-transparent text-gray-600 hover:bg-white hover:border-pink-200",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white border-x border-b border-pink-100 rounded-b-xl">
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {current.map((p) => (
            <div key={p.id} className="relative">
              <ProductCard product={p} showDiscount />
              {/* Thanh “Đã bán” */}
              <div className="px-3 pb-3">
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-400"
                    style={{ width: `${(p.id * 13) % 100}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Đã bán {(p.id * 13) % 100}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center pb-5">
          <button
            type="button"
            className="px-5 py-2 rounded-full text-sm bg-pink-600 text-white hover:bg-pink-700 focus:outline-none"
          >
            Xem thêm
          </button>
        </div>
      </div>
    </section>
  );
}
