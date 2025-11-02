// src/components/layout/TrendingShelf.jsx
import React from "react";
import useBookList from "../../hooks/useBookList";
import ProductCard from "../../components/layout/ProductCard";

export default function TrendingShelf() {
  // dùng sort hợp lệ
  const { books, loading } = useBookList({ sort: "newest", limit: 8 });

  return (
    <section className="mt-6">
      <h2 className="text-base font-semibold mb-3">Sách nổi bật</h2>

      {loading ? (
        <div className="text-sm text-gray-500">Đang tải sách...</div>
      ) : books.length === 0 ? (
        <div className="text-sm text-gray-400">Không có sách để hiển thị.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {books.map((book) => (
            <ProductCard key={book.id || book.book_id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}
