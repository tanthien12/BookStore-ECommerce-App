const CommentService = require("../services/post.comment.service");

module.exports = {
    async list(req, res, next) {
        try {
            const { postId } = req.params;
            const list = await CommentService.list(postId);
            res.json({ success: true, data: list });
        } catch (err) { next(err); }
    },

    async create(req, res, next) {
        try {
            const { content, post_id, parent_id } = req.body;
            
            // Validate cơ bản tại controller
            if (!content?.trim()) {
                return res.status(400).json({ success: false, message: "Nội dung không được để trống" });
            }

            const currentUser = req.user; // Từ middleware auth
            const newComment = await CommentService.create(currentUser.id, currentUser, { content, post_id, parent_id });
            
            res.status(201).json({ success: true, data: newComment });
        } catch (err) { next(err); }
    },

    async remove(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role_slug || req.user.role; // Lấy role

            await CommentService.remove(id, userId, userRole);
            res.json({ success: true, message: "Đã xóa bình luận" });
        } catch (err) {
            if (err.message === "NOT_FOUND") return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
            if (err.message === "FORBIDDEN") return res.status(403).json({ success: false, message: "Không có quyền xóa" });
            next(err);
        }
    }
};