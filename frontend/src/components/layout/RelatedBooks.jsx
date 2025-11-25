// src/components/layout/common/RelatedBooks.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import summaryApi from "../../common"; 
import normalizeBook from "../../helpers/normalizeBook"; 
import ProductCard from "./ProductCard"; 

const RelatedBooks = ({ currentBookId }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!currentBookId) return;

    let isMounted = true;

    const fetchRelated = async () => {
      setLoading(true);
      try {
        const res = await fetch(summaryApi.url(`/books/${currentBookId}/related`));
        const json = await res.json();

        if (isMounted && json.success && Array.isArray(json.data)) {
          const normalized = json.data.map((b) => normalizeBook(b));
          setBooks(normalized);
        }
      } catch (err) {
        console.error("Lỗi tải sách tương tự:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [currentBookId]);

  if (!loading && books.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4">
      <h2 className="mb-4 text-xl font-bold text-gray-900">
        Có thể bạn sẽ thích
      </h2>

      {loading ? (
        <div className="text-center py-4 text-gray-500">Đang tải gợi ý...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {books.map((book) => (
        
            <ProductCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedBooks;