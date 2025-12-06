// backend/controllers/category.controller.js
const { z } = require("zod");
const CategoryService = require("../services/category.service");

const optionalUrlOrEmpty = z
    .string()
    .url({ message: "image_url phải là URL hợp lệ" })
    .optional()
    .or(z.literal("").transform(() => undefined));

const createSchema = z.object({
    name: z.string().min(1, "Tên danh mục bắt buộc"),
    slug: z.string().min(1, "Slug bắt buộc"),
    description: z.string().optional().nullable(),
    image_url: optionalUrlOrEmpty, // FE sẽ upload trước, gửi absolute URL vào đây
});

const updateSchema = createSchema.partial();

const listSchema = z.object({
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    // ⬇️ tăng max lên 5000 để export không lỗi
    limit: z.coerce.number().int().min(1).max(5000).default(20),
    sort: z.enum(["newest", "name_asc", "name_desc"]).optional(),

    // ⬇️ thêm filter từ FE
    has_products: z.enum(["with", "without"]).optional(),
    created_from: z.string().optional(), // yyyy-mm-dd
    created_to: z.string().optional(),
});

const idSchema = z.object({ id: z.string().uuid("id không hợp lệ") });

module.exports = {
    async create(req, res, next) {
        try {
            const payload = createSchema.parse(req.body);
            const data = await CategoryService.create(payload);
            res.status(201).json({ success: true, data });
        } catch (e) { next(e); }
    },
    async update(req, res, next) {
        try {
            const { id } = idSchema.parse(req.params);
            const payload = updateSchema.parse(req.body);
            const data = await CategoryService.update(id, payload);
            if (!data) return res.status(404).json({ success: false, error: true, message: "Không tìm thấy" });
            res.json({ success: true, data });
        } catch (e) { next(e); }
    },
    async remove(req, res, next) {
        try {
            const { id } = idSchema.parse(req.params);
            const ok = await CategoryService.remove(id);
            if (!ok) return res.status(404).json({ success: false, error: true, message: "Không tìm thấy" });
            res.json({ success: true });
        } catch (e) { next(e); }
    },
    async detail(req, res, next) {
        try {
            const { id } = idSchema.parse(req.params);
            const data = await CategoryService.detail(id);
            if (!data) return res.status(404).json({ success: false, error: true, message: "Không tìm thấy" });
            res.json({ success: true, data });
        } catch (e) { next(e); }
    },
    async list(req, res, next) {
        try {
            const query = listSchema.parse(req.query);
            const data = await CategoryService.list(query);
            res.json({ success: true, ...data });
        } catch (e) { next(e); }
    },
};
