// backend/services/review.service.js
const ReviewModel = require("../models/review.model");

const ReviewService = {
  listByBook: (bookId) => ReviewModel.listByBook(bookId),
  getMyReview: (userId, bookId) => ReviewModel.getMyReview(userId, bookId),

  upsertRoot: ({ userId, bookId, rating, content }) => {
    if (!bookId) throw new Error("book_id is required");
    if (!(rating >= 1 && rating <= 5)) throw new Error("rating must be 1..5");
    if (!content || !content.trim()) throw new Error("content is required");
    return ReviewModel.upsertRoot({ userId, bookId, rating, content: content.trim() });
  },

  addReply: ({ userId, rootId, content }) => {
    if (!rootId) throw new Error("root review id is required");
    if (!content || !content.trim()) throw new Error("content is required");
    return ReviewModel.addReply({ userId, rootId, content: content.trim() });
  },

  updateReply: ({ userId, replyId, content, isAdmin }) => {
    if (!replyId) throw new Error("reply id is required");
    if (!content || !content.trim()) throw new Error("content is required");
    return ReviewModel.updateReply({ userId, replyId, content: content.trim(), isAdmin });
  },

  deleteAny: ({ userId, id, isAdmin }) =>
    ReviewModel.deleteAny({ userId, id, isAdmin }),
};

module.exports = ReviewService;
