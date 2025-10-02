const { z } = require("zod");
const OrderService = require("../services/order.service");

const orderSchema = z.object({
    user_id: z.string().uuid(),
    status: z.enum(["Pending", "Processing", "Shipped", "Completed", "Canceled"]).default("Pending"),
    total_amount: z.coerce.number().nonnegative(),
    items: z.array(z.object({
        book_id: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
        price: z.coerce.number().nonnegative()
    })).min(1, "Phải có ít nhất 1 sản phẩm"),
});

const paramsIdSchema = z.object({ id: z.string().uuid() });

module.exports = {
    async create(req, res, next) {
        try {
            const payload = orderSchema.parse(req.body);
            const order = await OrderService.create({
                order: {
                    user_id: payload.user_id,
                    status: payload.status,
                    total_amount: payload.total_amount
                },
                items: payload.items
            });
            res.status(201).json({ success: true, data: order });
        } catch (e) { next(e); }
    },

    async update(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const payload = orderSchema.parse(req.body);
            const order = await OrderService.update(id, {
                order: {
                    user_id: payload.user_id,
                    status: payload.status,
                    total_amount: payload.total_amount
                },
                items: payload.items
            });
            if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true, data: order });
        } catch (e) { next(e); }
    },

    async remove(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const ok = await OrderService.remove(id);
            if (!ok) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true });
        } catch (e) { next(e); }
    },

    async detail(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const data = await OrderService.detail(id);
            if (!data) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true, data });
        } catch (e) { next(e); }
    },

    async list(req, res, next) {
        try {
            const { q, status, page, limit } = req.query;
            const data = await OrderService.list({ q, status, page: +page || 1, limit: +limit || 10 });
            res.json({ success: true, ...data });
        } catch (e) { next(e); }
    },
};
