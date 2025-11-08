// src/components/review/ReviewCard.jsx
import React, { useState } from "react";
import RatingStars from "./RatingStars";
import { reviewApi } from "../../api/reviewApi";
import { toast } from "react-toastify";

export default function ReviewCard({ review, currentUser, reload }) {
  const [replyText, setReplyText] = useState("");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const isOwner = currentUser?.id === review.user_id;

  // helper: kiểm tra token localStorage
  const hasToken = () =>
    !!(localStorage.getItem("access_token") || localStorage.getItem("token"));

  const submitReply = async () => {
    if (!currentUser && !hasToken()) {
      toast.info("Bạn cần đăng nhập để phản hồi.");
      return;
    }

    if (!replyText.trim()) {
      toast.warning("Nội dung phản hồi không được để trống.");
      return;
    }

    try {
      await reviewApi.addReply(review.id, replyText.trim());
      setReplyText("");
      setShowReplyBox(false);
      toast.success("Đã gửi phản hồi!");
      reload?.();
    } catch (err) {
      console.error("reply error:", err);
      toast.error(err?.message || "Gửi phản hồi thất bại");
    }
  };

  const deleteThis = async () => {
    if (!currentUser && !hasToken()) {
      toast.info("Bạn cần đăng nhập để xoá.");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn xoá đánh giá này?")) return;

    try {
      await reviewApi.deleteAny(review.id);
      toast.success("Đã xoá đánh giá.");
      reload?.();
    } catch (err) {
      console.error("delete review error:", err);
      toast.error(err?.message || "Xoá thất bại");
    }
  };

  const deleteReply = async (id) => {
    if (!currentUser && !hasToken()) {
      toast.info("Bạn cần đăng nhập để xoá.");
      return;
    }
    if (!window.confirm("Bạn có chắc muốn xoá phản hồi này?")) return;
    try {
      await reviewApi.deleteAny(id);
      toast.success("Đã xoá phản hồi.");
      reload?.();
    } catch (err) {
      console.error("delete reply err:", err);
      toast.error(err?.message || "Xoá phản hồi thất bại");
    }
  };

  return (
    <article className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
      {/* Header: avatar + name/date  --- stars ở phải */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <img
            src={review.user_avatar || "/avatar.svg"}
            alt="avatar"
            className="w-11 h-11 rounded-full border border-gray-200 object-cover"
          />
          <div>
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-gray-800">{review.user_name || "Người dùng"}</h4>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
            </div>
          </div>
        </div>

        {/* Stars (phía phải top) */}
        <div className="flex items-center gap-2">
          {review.rating != null ? (
            <div className="flex items-center gap-2">
              <RatingStars value={review.rating} size={18} />
              <span className="text-sm text-gray-600">{review.rating}.0</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Nội dung */}
      <div className="mt-3 text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
        {review.content}
      </div>

      {/* Actions small */}
      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <button
          className="flex items-center gap-2 hover:text-gray-700"
          onClick={() => toast.info("Chức năng Thích tạm ẩn (cần backend).")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 9l-2 2-2-2m0 6l2-2 2 2" />
          </svg>
          <span>Thích (0)</span>
        </button>

        <button
          className="hover:text-gray-700"
          onClick={() => toast.info("Báo cáo đã được gửi (tạm).")}
        >
          Báo cáo
        </button>

        <button
          className="hover:text-gray-700"
          onClick={() => setShowReplyBox((s) => !s)}
        >
          Trả lời
        </button>

        {/* Nếu là owner của review gốc thì cho xóa */}
        {isOwner && (
          <button
            onClick={deleteThis}
            className="ml-auto text-red-600 hover:underline"
          >
            Xoá đánh giá
          </button>
        )}
      </div>

      {/* Reply input (ẩn/hiện) */}
      {showReplyBox && (
        <div className="mt-3">
          <div className="flex items-start gap-3">
            <img
              src={currentUser?.avatar_url || "/avatar.svg"}
              alt="me"
              className="w-8 h-8 rounded-full border border-gray-200 object-cover"
            />
            <div className="flex-1">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Viết phản hồi..."
                className="w-full p-3 rounded-xl border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-200 min-h-[64px] resize-y"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={submitReply}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  Gửi
                </button>
                <button
                  onClick={() => { setShowReplyBox(false); setReplyText(""); }}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Huỷ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Replies list */}
      {review.replies?.length > 0 && (
        <div className="mt-4 space-y-3">
          {review.replies.map((rep) => (
            <div key={rep.id} className="flex items-start gap-3 pl-3 border-l-2 border-gray-100">
              <img
                src={rep.user_avatar || "/avatar.svg"}
                alt="rep-avatar"
                className="w-8 h-8 rounded-full border border-gray-200 object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{rep.user_name || "Người dùng"}</span>
                  <span className="text-xs text-gray-400">{rep.created_at ? new Date(rep.created_at).toLocaleDateString() : ""}</span>
                </div>
                <div className="mt-1 text-gray-700 text-sm whitespace-pre-wrap">{rep.content}</div>

                <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                  {/* Nếu là chính chủ reply thì hiện nút xóa */}
                  {currentUser?.id === rep.user_id && (
                    <button
                      onClick={() => deleteReply(rep.id)}
                      className="text-red-600 hover:underline"
                    >
                      Xoá phản hồi
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
