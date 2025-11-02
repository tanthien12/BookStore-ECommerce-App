const ReviewService = require("../services/review.service");

const ReviewController = {
  // GET /api/books/:bookId/reviews
  async listByBook(req, res) {
    try {
      const { bookId } = req.params;
      const data = await ReviewService.listByBook(bookId);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("listByBook:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/books/:bookId/my-review
  async myReview(req, res) {
    try {
      const { bookId } = req.params;
      const user_id = req.user?.id;
      if (!user_id) {
        return res
          .status(401)
          .json({ success: false, message: "Chưa đăng nhập" });
      }
      const data = await ReviewService.getMyReview(bookId, user_id);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("myReview:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/reviews
  // body: { book_id, rating, content }
  async upsertRoot(req, res) {
    try {
      const user_id = req.user?.id;
      if (!user_id) {
        return res
          .status(401)
          .json({ success: false, message: "Yêu cầu đăng nhập" });
      }

      const result = await ReviewService.upsertRootReview(user_id, req.body);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      console.error("upsertRoot:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // DELETE /api/reviews/:id
  // id có thể là review gốc hoặc reply
  async remove(req, res) {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        return res
          .status(401)
          .json({ success: false, message: "Yêu cầu đăng nhập" });
      }

      const { id } = req.params;
      await ReviewService.deleteReviewOrReply(id, currentUser);

      return res.json({ success: true });
    } catch (err) {
      console.error("remove:", err);
      return res.status(403).json({ success: false, message: err.message });
    }
  },

  // POST /api/reviews/:id/replies
  // id = id review gốc
  // body: { content }
  async addReply(req, res) {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        return res
          .status(401)
          .json({ success: false, message: "Yêu cầu đăng nhập" });
      }

      const { id } = req.params;
      const { content } = req.body;

      const row = await ReviewService.addReply(currentUser, {
        root_review_id: id,
        content,
      });

      return res.status(201).json({ success: true, data: row });
    } catch (err) {
      console.error("addReply:", err);
      return res.status(403).json({ success: false, message: err.message });
    }
  },

  // PUT /api/replies/:replyId
  // body: { content }
  async updateReply(req, res) {
    try {
      const currentUser = req.user;
      if (!currentUser) {
        return res
          .status(401)
          .json({ success: false, message: "Yêu cầu đăng nhập" });
      }

      const { replyId } = req.params;
      const { content } = req.body;

      const updated = await ReviewService.updateReply(currentUser, {
        reply_id: replyId,
        content,
      });

      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error("updateReply:", err);
      return res.status(403).json({ success: false, message: err.message });
    }
  },
};

module.exports = ReviewController;
