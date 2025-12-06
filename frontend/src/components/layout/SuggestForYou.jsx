import React from "react";
import { Link } from "react-router-dom";
import useBookList from "../../hooks/useBookList";
import ProductCard from "../../components/layout/ProductCard";

export default function SuggestForYou() {
  // Lấy 15 cuốn sách mới nhất để gợi ý
  const { books, loading } = useBookList({ sort: "id_desc", limit: 15 });

  if (loading) {
    return (
      <section className="mt-10 mb-14 bg-green-50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-green-100 animate-pulse rounded"></div>
          <div className="h-6 w-40 bg-green-100 animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-[280px] bg-white animate-pulse rounded-lg"
            ></div>
          ))}
        </div>
      </section>
    );
  }

  if (!books.length) {
    return (
      <section className="mt-10 mb-14 text-center bg-green-50 rounded-lg p-8">
        <h2 className="text-lg font-semibold mb-3 text-green-700 flex items-center justify-center gap-2">
          <span className="text-2xl">✨</span>
          Gợi ý cho bạn
        </h2>
        <p className="text-green-600 text-sm">Không có sách gợi ý.</p>
      </section>
    );
  }

  return (
    <section className="mt-10 mb-14 bg-gradient-to-r from-green-100 via-emerald-50 to-teal-50 rounded-xl shadow-sm p-6">
      {/* Header với icon và màu xanh nhẹ nhàng */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-green-700 flex items-center gap-2">
          <span className="text-2xl">✨</span>
          Gợi ý cho bạn
        </h2>
        <div className="hidden md:block text-green-600 text-sm font-medium">
          Sách mới nhất
        </div>
      </div>

      {/* Grid sản phẩm */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((book) => (
          <ProductCard key={book.id || book.book_id} book={book} />
        ))}
      </div>

      {/* Nút Xem tất cả với màu xanh nhẹ nhàng */}
      {books.length >= 15 && (
        <div className="flex justify-center mt-6">
          <Link
            to="/search"
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            Xem tất cả
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  );
}
