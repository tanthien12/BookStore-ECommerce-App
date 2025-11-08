// src/api/reviewApi.js
import { API_URL, authHeaders } from "../common";

export const reviewApi = {
  async fetchByBook(bookId) {
    const res = await fetch(`${API_URL}/books/${bookId}/reviews`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không tải được đánh giá");
    return data.data;
  },

  async fetchMine(bookId) {
    const res = await fetch(`${API_URL}/books/${bookId}/my-review`, {
      headers: { ...authHeaders() },
    });
    const data = await res.json();
    if (!data.success) return null;
    return data.data;
  },

  async upsert({ book_id, rating, content }) {
    const res = await fetch(`${API_URL}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ book_id, rating, content }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không gửi được đánh giá");
    return data.data;
  },

  async addReply(reviewId, content) {
    const res = await fetch(`${API_URL}/reviews/${reviewId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không gửi được phản hồi");
    return data.data;
  },

  async updateReply(replyId, content) {
    const res = await fetch(`${API_URL}/replies/${replyId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không sửa được phản hồi");
    return data.data;
  },

  async deleteAny(id) {
    const res = await fetch(`${API_URL}/reviews/${id}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không xoá được");
    return true;
  },
};

export default reviewApi;
