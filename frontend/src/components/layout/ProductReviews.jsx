// src/components/layout/ProductReviews.jsx
import React, { useState, useMemo } from "react";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import RatingStars from "./RatingStars";
import { FiEdit3, FiFilter } from "react-icons/fi";

export default function ProductReviews({
  reviews = [],
  currentUser,
  bookId,
  reload,
}) {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("newest"); // 'newest' | 'loved'

  // 1. Tính toán thống kê
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

  // 2. Sắp xếp review
  const sortedReviews = useMemo(() => {
    let list = [...reviews];
    if (activeTab === "newest") {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (activeTab === "loved") {
      list.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
    }
    return list;
  }, [reviews, activeTab]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Đánh giá sản phẩm</h3>

      {/* --- PHẦN 1: HEADER THỐNG KÊ --- */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 border-b border-gray-100 pb-8">
        
        {/* Cột trái: Điểm số to */}
        <div className="flex flex-col items-center justify-center min-w-[140px]">
          {/* SỬA 1: Đổi màu chữ thành đen (text-gray-900) */}
          <div className="text-5xl font-extrabold text-gray-900">
            {stats.average}
            <span className="text-xl text-gray-400 font-normal">/5</span>
          </div>
          <div className="my-2">
            <RatingStars value={Number(stats.average)} size={20} />
          </div>
          <p className="text-sm text-gray-500">{stats.total} đánh giá</p>
        </div>

        {/* Cột giữa: Các thanh Progress Bar */}
        <div className="flex-1 space-y-2 justify-center flex flex-col">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.counts[star];
            const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-sm">
                {/* SỬA 2: Thêm whitespace-nowrap và tăng width lên w-12 để không xuống dòng */}
                <span className="font-medium w-12 text-gray-700 whitespace-nowrap">
                  {star} sao
                </span>
                
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  {/* SỬA 3: Đổi màu thanh thành vàng (bg-yellow-400) */}
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

        {/* Cột phải: Nút viết đánh giá */}
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

      {/* --- PHẦN 3: TABS LỌC --- */}
      <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
        <button
          onClick={() => setActiveTab("newest")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "newest"
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Mới nhất
        </button>
        <button
          onClick={() => setActiveTab("loved")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "loved"
              ? "border-red-600 text-red-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Yêu thích nhất
        </button>
        <div className="ml-auto text-xs text-gray-400 hidden sm:flex items-center gap-1">
           <FiFilter /> Lọc đánh giá
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