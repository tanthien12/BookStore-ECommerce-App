const CommentModel = require("../models/post.comment.model");

module.exports = {
    async list(postId) {
        return await CommentModel.listByPost(postId);
    },

    async create(userId, userInfo, { content, post_id, parent_id }) {
        if (!content || !content.trim()) {
            throw new Error("EMPTY_CONTENT");
        }

        const newComment = await CommentModel.create({
            content,
            post_id,
            user_id: userId,
            parent_id: parent_id || null
        });

        // Gắn thêm thông tin user để trả về frontend
        return {
            ...newComment,
            user_name: userInfo.name || "Người dùng",
            user_avatar: userInfo.avatar_url
        };
    },

    async remove(commentId, requesterId, requesterRole) {
        const comment = await CommentModel.findById(commentId);
        if (!comment) throw new Error("NOT_FOUND");

        // Check quyền: Chính chủ hoặc Admin
        const isOwner = comment.user_id === requesterId;
        // Logic check role tùy thuộc vào project của bạn (role_slug hoặc role name)
        const isAdmin = requesterRole === 'admin' || requesterRole === 'quản trị viên';

        if (!isOwner && !isAdmin) {
            throw new Error("FORBIDDEN");
        }

        return await CommentModel.remove(commentId);
    }
};