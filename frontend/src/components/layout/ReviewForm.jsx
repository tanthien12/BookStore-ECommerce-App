import React, { useState } from "react"; // Bỏ useEffect
import RatingStars from "./RatingStars";
import { reviewApi } from "../../api/reviewApi";
import { toast } from "react-toastify";

export default function ReviewForm({ bookId, currentUser, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // --- ĐÃ BỎ useEffect fetchMine để không load lại comment cũ ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasToken = localStorage.getItem("access_token") || localStorage.getItem("token");

    if (!currentUser && !hasToken) {
      return toast.info("Bạn cần đăng nhập để đánh giá.");
    }

    if (!content.trim()) return toast.warning("Nội dung đánh giá không được để trống.");

    try {
      setLoading(true);
      // Dùng upsert vẫn ok, backend sẽ tự tạo mới hoặc update dựa trên logic của bạn.
      // Nhưng ở đây form luôn trắng nên người dùng trải nghiệm như viết mới.
      await reviewApi.upsert({ book_id: bookId, rating, content });
      
      setLoading(false);
      toast.success("Gửi đánh giá thành công!");
      
      // Reset form sau khi gửi
      setContent("");
      setRating(5);
      
      onSubmitted?.();
    } catch (err) {
      setLoading(false);
      toast.error(err?.message || "Có lỗi xảy ra khi gửi đánh giá");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-800">Đánh giá của bạn</h4>
        <RatingStars value={rating} onChange={setRating} size={22} />
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Nhập nội dung đánh giá của bạn..."
        className="w-full min-h-[100px] p-3 rounded-xl bg-white border border-gray-300 text-gray-900
                  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200"
      />

      <div className="mt-3 text-right">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-60"
        >
          {loading ? "Đang gửi..." : "Gửi đánh giá"}
        </button>
      </div>
    </form>
  );
}