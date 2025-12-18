// src/components/layout/ProductReviews.jsx
import React, { useState, useMemo } from "react";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import RatingStars from "./RatingStars";
import { FiEdit3 } from "react-icons/fi"; // Bỏ FiFilter vì không còn lọc

export default function ProductReviews({
  reviews = [],
  currentUser,
  bookId,
  reload,
}) {
  const [showForm, setShowForm] = useState(false);
  
  // --- BỎ state activeTab vì chỉ còn 1 kiểu sort ---

  // 1. Tính toán thống kê (Giữ nguyên)
  const stats = useMemo(() => {
    const total = reviews.length;
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      const star = Math.round(r.rating || 0);
      if (counts[star] !== undefined) counts[star]++;
      sum += r.rating || 0;
    });

    const average = total > 0 ? (sum / total).toFixed(1) : 0;
    return { total, average, counts };
  }, [reviews]);

  // 2. Sắp xếp review: Mặc định luôn là MỚI NHẤT
  const sortedReviews = useMemo(() => {
    let list = [...reviews];
    // Luôn sort theo ngày tạo mới nhất
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }, [reviews]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Đánh giá sản phẩm</h3>

      {/* --- PHẦN 1: HEADER THỐNG KÊ (Giữ nguyên) --- */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 border-b border-gray-100 pb-8">
        <div className="flex flex-col items-center justify-center min-w-[140px]">
          <div className="text-5xl font-extrabold text-gray-900">
            {stats.average}
            <span className="text-xl text-gray-400 font-normal">/5</span>
          </div>
          <div className="my-2">
            <RatingStars value={Number(stats.average)} size={20} />
          </div>
          <p className="text-sm text-gray-500">{stats.total} đánh giá</p>
        </div>

        <div className="flex-1 space-y-2 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.counts[star];
            const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="font-medium w-12 text-gray-700 whitespace-nowrap">
                  {star} sao
                </span>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>
                <span className="w-10 text-right text-gray-400 text-xs">
                  {percent > 0 ? `${Math.round(percent)}%` : "0%"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col justify-center items-center md:items-end md:border-l md:pl-8 md:border-gray-100">
          <p className="text-sm text-gray-500 mb-3 text-center md:text-right">
            Bạn đã mua sản phẩm này?
          </p>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all ${
              showForm
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg"
            }`}
          >
            <FiEdit3 />
            {showForm ? "Đóng biểu mẫu" : "Viết đánh giá"}
          </button>
        </div>
      </div>

      {/* --- PHẦN 2: FORM NHẬP (Ẩn/Hiện) --- */}
      {showForm && (
        <div className="mb-8 animate-fade-in-down">
          <ReviewForm
            bookId={bookId}
            currentUser={currentUser}
            onSubmitted={() => {
              reload();
              setShowForm(false);
            }}
          />
        </div>
      )}

      {/* --- PHẦN 3: TABS LỌC (Đã sửa) --- */}
      {/* Chỉ hiện label Mới nhất, không còn nút bấm chuyển tab */}
      <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
        <div className="pb-3 text-sm font-semibold border-b-2 border-red-600 text-red-600">
          Mới nhất
        </div>
      </div>

      {/* --- PHẦN 4: DANH SÁCH --- */}
      <div className="space-y-6">
        {sortedReviews.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
             <img 
                src="https://cdn-icons-png.flaticon.com/512/4076/4076432.png" 
                alt="empty" 
                className="w-16 h-16 mx-auto mb-3 opacity-50"
            />
            <p>Chưa có đánh giá nào phù hợp.</p>
          </div>
        ) : (
          sortedReviews.map((rv) => (
            <ReviewCard
              key={rv.id}
              review={rv}
              currentUser={currentUser}
              reload={reload}
            />
          ))
        )}
      </div>
    </div>
  );
}