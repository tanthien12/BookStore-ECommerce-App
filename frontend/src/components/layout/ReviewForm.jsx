import React, { useEffect, useState } from "react";
import { reviewApi } from "../../api/reviewApi";
import { toast } from "react-toastify";

export default function ReviewForm({ bookId, currentUser, onSubmitted }) {
    const [myReview, setMyReview] = useState(null);
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");

    useEffect(() => {
        if (!currentUser) return;
        reviewApi.fetchMine(bookId).then((data) => {
            if (data) {
                setMyReview(data);
                setRating(data.rating);
                setContent(data.content || "");
            }
        });
    }, [bookId, currentUser]);

    const handleSave = async () => {
        if (!currentUser) {
            toast.info("Vui lòng đăng nhập để đánh giá");
            return;
        }
        if (rating < 1 || rating > 5) {
            toast.error("Chọn số sao từ 1 đến 5");
            return;
        }
        if (!content.trim()) {
            toast.error("Vui lòng nhập nội dung đánh giá");
            return;
        }

        try {
            await reviewApi.upsert({
                book_id: bookId,
                rating,
                content,
            });
            toast.success("Đã gửi đánh giá");
            onSubmitted?.();
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-800 text-sm">
                    {myReview ? "Cập nhật đánh giá của bạn" : "Viết đánh giá của bạn"}
                </div>

                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            onClick={() => setRating(n)}
                            className={n <= rating ? "text-yellow-500" : "text-gray-300"}
                            style={{ fontSize: 20, lineHeight: 1 }}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>

            <textarea
                className="w-full border rounded-lg p-2 mt-2 text-sm"
                rows={3}
                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            <div className="text-right mt-2">
                <button
                    onClick={handleSave}
                    className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                    {myReview ? "Cập nhật" : "Gửi đánh giá"}
                </button>
            </div>
        </div>
    );
}