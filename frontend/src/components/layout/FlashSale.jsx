// src/components/layout/FlashSale.jsx
import React from "react";
import useFlashSaleBooks from "../../hooks/useFlashSaleBooks";
import ProductCard from "../../components/layout/ProductCard";

export default function FlashSale() {
  const { books, loading } = useFlashSaleBooks(8);

  return (
    <section className="mt-6 bg-[#ffe9e9] rounded-lg p-4">
      <h2 className="text-base font-semibold text-red-600 mb-3">Flash Sale</h2>

      {loading ? (
        <div className="text-sm text-gray-500">Đang tải sách khuyến mãi...</div>
      ) : books.length === 0 ? (
        <div className="text-sm text-gray-400">Chưa có sách.</div>
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
