const ProductReviewModel = require("../models/productReview.model");

const ReviewService = {
  // User tạo / cập nhật review gốc
  async upsertRootReview(user_id, { book_id, rating, content }) {
    if (!book_id) throw new Error("Thiếu book_id");
    if (!rating || rating < 1 || rating > 5) {
        throw new Error("Số sao không hợp lệ");
    }
    if (!content || !content.trim()) {
        throw new Error("Nội dung không được để trống");
    }

    const review = await ProductReviewModel.upsertRootReview({
      book_id,
      user_id,
      rating,
      content: content.trim(),
    });

    // cập nhật rating_avg và rating_count trong book
    const aggregate = await ProductReviewModel.recomputeBookRating(book_id);

    return { review, aggregate };
  },

  // Lấy danh sách review gốc + reply của mỗi review
  async listByBook(book_id) {
    const roots = await ProductReviewModel.getRootReviewsByBook(book_id);

    const result = [];
    for (const r of roots) {
      const replies = await ProductReviewModel.getRepliesByParent(r.id);
      result.push({
        ...r,
        replies,
      });
    }

    return result;
  },

  // Lấy review gốc của chính user
  async getMyReview(book_id, user_id) {
    return await ProductReviewModel.getMyRootReview(book_id, user_id);
  },

  // Xoá review gốc hoặc reply
  async deleteReviewOrReply(id, currentUser) {
    const isAdmin =
      currentUser.role === "admin" || currentUser.role === "ADMIN";

    const deleted = await ProductReviewModel.softDelete(
      id,
      currentUser.id,
      isAdmin
    );
    if (!deleted) {
      throw new Error("Không có quyền xoá hoặc review/reply không tồn tại");
    }

    // nếu xoá là review gốc => cập nhật lại điểm sách
    if (deleted.parent_id === null) {
      await ProductReviewModel.recomputeBookRating(deleted.book_id);
    }

    return true;
  },

  // Thêm reply: chỉ owner của review gốc hoặc admin
  async addReply(currentUser, { root_review_id, content }) {
    if (!content || !content.trim()) {
      throw new Error("Nội dung phản hồi không được để trống");
    }

    // lấy owner của review gốc
    const ownerId = await ProductReviewModel.getRootOwner(root_review_id);
    if (!ownerId) {
      throw new Error("Review không tồn tại hoặc đã bị xoá");
    }

    const isOwner = String(ownerId) === String(currentUser.id);
    const isAdmin =
      currentUser.role === "admin" || currentUser.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new Error("Bạn không có quyền trả lời đánh giá này");
    }

    const row = await ProductReviewModel.createReply({
      parent_id: root_review_id,
      user_id: currentUser.id,
      content: content.trim(),
    });

    if (!row) {
      throw new Error("Không tạo được phản hồi");
    }

    return row;
  },

  // Chỉnh sửa reply: chỉ chủ reply
  async updateReply(currentUser, { reply_id, content }) {
    if (!content || !content.trim()) {
      throw new Error("Nội dung phản hồi không được để trống");
    }

    const updated = await ProductReviewModel.updateReply({
      reply_id,
      user_id: currentUser.id,
      content: content.trim(),
    });

    if (!updated) {
      throw new Error("Không có quyền sửa phản hồi này");
    }

    return updated;
  },
};

module.exports = ReviewService;
