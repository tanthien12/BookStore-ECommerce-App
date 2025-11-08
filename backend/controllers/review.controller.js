// backend/controllers/review.controller.js
const ReviewService = require("../services/review.service");

const ok = (res, data) => res.json({ success: true, data });
const fail = (res, message = "Error", code = 400) => res.status(code).json({ success: false, message });

const ReviewController = {
  // GET /api/books/:bookId/reviews
  async listByBook(req, res) {
    try {
      const data = await ReviewService.listByBook(req.params.bookId);
      ok(res, data);
    } catch (e) {
      console.error("[Review][listByBook]", e);
      fail(res, "Cannot load reviews", 500);
    }
  },

  // GET /api/books/:bookId/my-review
  async getMine(req, res) {
    try {
      const data = await ReviewService.getMyReview(req.user.id, req.params.bookId);
      ok(res, data);
    } catch (e) {
      console.error("[Review][getMine]", e);
      fail(res, "Cannot load my review", 500);
    }
  },

  // POST /api/reviews {book_id, rating, content}
  async upsertRoot(req, res) {
    try {
      const { book_id, rating, content } = req.body || {};
      const data = await ReviewService.upsertRoot({
        userId: req.user.id,
        bookId: book_id,
        rating: Number(rating),
        content,
      });
      ok(res, data);
    } catch (e) {
      console.error("[Review][upsertRoot]", e);
      fail(res, e.message || "Cannot upsert review", 400);
    }
  },

  // POST /api/reviews/:id/replies {content}
  async addReply(req, res) {
    try {
      const data = await ReviewService.addReply({
        userId: req.user.id,
        rootId: req.params.id,
        content: req.body?.content,
      });
      ok(res, data);
    } catch (e) {
      console.error("[Review][addReply]", e);
      fail(res, e.message || "Cannot add reply", 400);
    }
  },

  // PUT /api/replies/:id {content}
  async updateReply(req, res) {
    try {
      const data = await ReviewService.updateReply({
        userId: req.user.id,
        replyId: req.params.id,
        content: req.body?.content,
        isAdmin: req.user?.role === "admin",
      });
      if (!data) return fail(res, "Not allowed or not found", 403);
      ok(res, data);
    } catch (e) {
      console.error("[Review][updateReply]", e);
      fail(res, e.message || "Cannot update reply", 400);
    }
  },

  // DELETE /api/reviews/:id
  async deleteAny(req, res) {
    try {
      const data = await ReviewService.deleteAny({
        userId: req.user.id,
        id: req.params.id,
        isAdmin: req.user?.role === "admin",
      });
      if (!data.ok) return fail(res, "Not allowed or not found", 403);
      ok(res, true);
    } catch (e) {
      console.error("[Review][deleteAny]", e);
      fail(res, e.message || "Cannot delete review/reply", 400);
    }
  },
};

module.exports = ReviewController;
