export const reviewApi = {
  async fetchAll(bookId) {
    const res = await fetch(`/api/books/${bookId}/reviews`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không tải được đánh giá");
    return data.data;
  },

  async fetchMine(bookId) {
    const res = await fetch(`/api/books/${bookId}/my-review`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    const data = await res.json();
    if (!data.success) return null; // chưa đăng nhập hoặc chưa review
    return data.data;
  },

  async upsert({ book_id, rating, content }) {
    const res = await fetch(`/api/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({ book_id, rating, content }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không gửi được đánh giá");
    return data.data;
  },

  // xóa review gốc HOẶC reply
  async deleteAny(id) {
    const res = await fetch(`/api/reviews/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không xoá được");
    return true;
  },

  async addReply(reviewId, content) {
    const res = await fetch(`/api/reviews/${reviewId}/replies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không gửi được phản hồi");
    return data.data;
  },

  async updateReply(replyId, content) {
    const res = await fetch(`/api/replies/${replyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Không sửa được phản hồi");
    return data.data;
  },
};
