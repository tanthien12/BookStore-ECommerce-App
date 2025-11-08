import React, { useState } from "react";
import useBookList from "../../hooks/useBookList";
import ProductCard from "../../components/layout/ProductCard";

export default function TrendingShelf() {
  const { books, loading } = useBookList({ sort: "newest", limit: 20 });
  const [showAll, setShowAll] = useState(false);

  // chỉ hiện 2 dòng đầu tiên (tuỳ theo cột)
  const visibleBooks = showAll ? books : books.slice(0, 10);

  return (
    <section className="mt-8 mb-14 bg-white border border-violet-200 shadow-md rounded-xl p-6 md:p-8">
      {/* Header với icon và màu tím nhẹ nhàng */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1 h-6 bg-violet-400 rounded-full"></div>
        <h2 className="text-xl font-bold text-violet-700">Sách nổi bật</h2>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Đang tải sách...</div>
      ) : books.length === 0 ? (
        <div className="text-gray-400 text-sm">Không có sách để hiển thị.</div>
      ) : (
        <>
          {/* Lưới sách */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {visibleBooks.map((book) => (
              <ProductCard key={book.id || book.book_id} book={book} />
            ))}
          </div>

          {/* Nút xem thêm / thu gọn với màu tím nhẹ */}
          {books.length > 10 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-violet-400 to-purple-400 
                text-white font-semibold shadow-sm hover:shadow-md hover:from-violet-500 hover:to-purple-500 
                transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {showAll ? "Thu gọn" : "Xem thêm"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
