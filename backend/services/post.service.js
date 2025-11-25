// backend/services/post.service.js
const PostModel = require("../models/post.model");

const PostService = {
    async getCategories() {
        return await PostModel.getAllCategories();
    },

    async create(payload, authorId) {
        // Logic nghiệp vụ: Gắn author_id vào payload
        return await PostModel.create({ ...payload, author_id: authorId });
    },

    async update(id, payload) {
        // Logic nghiệp vụ: Có thể kiểm tra quyền hạn ở đây nếu cần
        return await PostModel.update(id, payload);
    },

    async remove(id) {
        return await PostModel.remove(id);
    },

    async detail(slugOrId) {
        const post = await PostModel.findBySlugOrId(slugOrId);
        if (post) {
            // Tăng view ngầm (không cần await để trả response nhanh)
            PostModel.incrementView(post.id).catch(() => {});
        }
        return post;
    },

    async list(params) {
        // params = { page, limit, status, category_id, q }
        return await PostModel.list(params);
    }
};

module.exports = PostService;