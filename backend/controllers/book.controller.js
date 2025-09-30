// src/controllers/book.controller.js
const { z } = require("zod");
const BookService = require("../services/book.service");

// Common helpers
const optionalUrlOrEmpty = z
    .string()
    .url({ message: "image_url phải là URL hợp lệ" })
    .optional()
    .or(z.literal("").transform(() => undefined));

const bookSchema = z.object({
    title: z.string().min(1, "Tiêu đề bắt buộc"),
    author: z.string().optional().nullable(),
    isbn: z.string().optional().nullable(),
    publisher: z.string().optional().nullable(),
    published_year: z
        .union([z.coerce.number().int(), z.null()])
        .optional()
        .transform((v) => (Number.isFinite(v) ? v : v ?? null)),
    language: z.string().optional().nullable(),   // hoặc giới hạn enum nếu bạn có danh sách cố định
    format: z
        .enum(["paperback", "hardcover", "ebook"])
        .optional()
        .or(z.string().min(1).optional()) // nếu chưa cố định, cho phép string
        .optional(),
    price: z.coerce.number().nonnegative().default(0),
    stock: z.coerce.number().int().nonnegative().default(0),
    description: z.string().optional().nullable(),
    image_url: optionalUrlOrEmpty,
    // nhận mảng UUID (string)
    category_ids: z.array(z.string().uuid("category_id phải là UUID")).optional().default([]),
});

const listSchema = z.object({
    q: z.string().optional(),
    category_id: z.string().uuid().optional(),
    language: z.string().optional(),
    format: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    sort: z.enum(["id_desc", "price_asc", "price_desc", "title_asc", "newest"]).optional(),
});

// Nếu bạn muốn validate params.id là UUID
const paramsIdSchema = z.object({
    id: z.string().uuid("id phải là UUID hợp lệ"),
});

module.exports = {
    schema: { bookSchema, listSchema },

    async create(req, res, next) {
        try {
            const payload = bookSchema.parse(req.body);
            const created = await BookService.create(payload);
            res.status(201).json({ success: true, data: created });
        } catch (err) { next(err); }
    },

    async update(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const payload = bookSchema.parse(req.body);
            const updated = await BookService.update(id, payload);
            if (!updated) {
                return res.status(404).json({ success: false, error: true, message: "Không tìm thấy" });
            }
            res.json({ success: true, data: updated });
        } catch (err) { next(err); }
    },

    async remove(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const ok = await BookService.remove(id);
            if (!ok) return res.status(404).json({ success: false, error: true, message: "Không tìm thấy" });
            res.json({ success: true, message: "Đã xóa" });
        } catch (err) { next(err); }
    },

    async detail(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const data = await BookService.detail(id);
            if (!data) return res.status(404).json({ success: false, error: true, message: "Không tìm thấy" });
            res.json({ success: true, data });
        } catch (err) { next(err); }
    },

    async list(req, res, next) {
        try {
            const query = listSchema.parse(req.query);
            const data = await BookService.list(query);
            res.json({ success: true, ...data });
        } catch (err) { next(err); }
    },
};
