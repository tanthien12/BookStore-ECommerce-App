// src/components/layout/SuggestForYou.jsx
import React from "react";
import useBookList from "../../hooks/useBookList";
import ProductCard from "../../components/layout/ProductCard";

export default function SuggestForYou() {
  // FE cũ của bạn dùng -rating_avg → BE không hiểu → mình dùng id_desc
  const { books, loading } = useBookList({ sort: "id_desc", limit: 8 });

  return (
    <section className="mt-6 mb-10">
      <h2 className="text-base font-semibold mb-3">Gợi ý cho bạn</h2>

      {loading ? (
        <div className="text-sm text-gray-500">Đang gợi ý...</div>
      ) : books.length === 0 ? (
        <div className="text-sm text-gray-400">Không có sách gợi ý.</div>
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
