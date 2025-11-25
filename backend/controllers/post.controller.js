// backend/controllers/post.controller.js
const PostService = require("../services/post.service"); 
const { z } = require("zod");

// Giữ nguyên bộ Validate
const postSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được trống"),
    slug: z.string().min(1, "Slug không được trống").regex(/^[a-z0-9-]+$/, "Slug chỉ chứa chữ thường, số và gạch ngang"),
    description: z.string().optional(),
    content: z.string().min(1, "Nội dung không được trống"),
    thumbnail: z.string().optional().nullable(),
    blog_category_id: z.string().uuid("Vui lòng chọn danh mục"),
    status: z.enum(["draft", "published"]).default("draft"),
});

module.exports = {
    async getCategories(req, res, next) {
        try {
            const items = await PostService.getCategories();
            res.json({ success: true, items });
        } catch (err) { next(err); }
    },

    async create(req, res, next) {
        try {
            const payload = postSchema.parse(req.body);
            // Controller chỉ việc ném data sang Service
            const newPost = await PostService.create(payload, req.user.id);
            res.status(201).json({ success: true, data: newPost });
        } catch (err) { next(err); }
    },

    async update(req, res, next) {
        try {
            const payload = postSchema.partial().parse(req.body);
            const updated = await PostService.update(req.params.id, payload);
            if (!updated) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
            res.json({ success: true, data: updated });
        } catch (err) { next(err); }
    },

    async remove(req, res, next) {
        try {
            const ok = await PostService.remove(req.params.id);
            if (!ok) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
            res.json({ success: true, message: "Đã xóa" });
        } catch (err) { next(err); }
    },

    async detail(req, res, next) {
        try {
            const post = await PostService.detail(req.params.slugOrId);
            if (!post) return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
            res.json({ success: true, data: post });
        } catch (err) { next(err); }
    },

    async list(req, res, next) {
        try {
            const data = await PostService.list(req.query);
            res.json({ success: true, ...data });
        } catch (err) { next(err); }
    }
};