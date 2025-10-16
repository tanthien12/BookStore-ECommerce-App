// const { z } = require("zod");
// const OrderService = require("../services/order.service");

// const orderSchema = z.object({
//     user_id: z.string().uuid(),
//     status: z.enum(["Pending", "Processing", "Shipped", "Completed", "Canceled"]).default("Pending"),
//     total_amount: z.coerce.number().nonnegative(),
//     items: z.array(z.object({
//         book_id: z.string().uuid(),
//         quantity: z.coerce.number().int().positive(),
//         price: z.coerce.number().nonnegative()
//     })).min(1, "Phải có ít nhất 1 sản phẩm"),
// });

// const paramsIdSchema = z.object({ id: z.string().uuid() });

// module.exports = {
//     async create(req, res, next) {
//         try {
//             const payload = orderSchema.parse(req.body);
//             const order = await OrderService.create({
//                 order: {
//                     user_id: payload.user_id,
//                     status: payload.status,
//                     total_amount: payload.total_amount
//                 },
//                 items: payload.items
//             });
//             res.status(201).json({ success: true, data: order });
//         } catch (e) { next(e); }
//     },

//     async update(req, res, next) {
//         try {
//             const { id } = paramsIdSchema.parse(req.params);
//             const payload = orderSchema.parse(req.body);
//             const order = await OrderService.update(id, {
//                 order: {
//                     user_id: payload.user_id,
//                     status: payload.status,
//                     total_amount: payload.total_amount
//                 },
//                 items: payload.items
//             });
//             if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy" });
//             res.json({ success: true, data: order });
//         } catch (e) { next(e); }
//     },

//     async remove(req, res, next) {
//         try {
//             const { id } = paramsIdSchema.parse(req.params);
//             const ok = await OrderService.remove(id);
//             if (!ok) return res.status(404).json({ success: false, message: "Không tìm thấy" });
//             res.json({ success: true });
//         } catch (e) { next(e); }
//     },

//     async detail(req, res, next) {
//         try {
//             const { id } = paramsIdSchema.parse(req.params);
//             const data = await OrderService.detail(id);
//             if (!data) return res.status(404).json({ success: false, message: "Không tìm thấy" });
//             res.json({ success: true, data });
//         } catch (e) { next(e); }
//     },

//     async list(req, res, next) {
//         try {
//             const { q, status, page, limit } = req.query;
//             const data = await OrderService.list({ q, status, page: +page || 1, limit: +limit || 10 });
//             res.json({ success: true, ...data });
//         } catch (e) { next(e); }
//     },
// };

// code sau
const { z } = require("zod");
const OrderService = require("../services/order.service");

// Enum trạng thái theo DB: pending|paid|processing|shipped|delivered|cancelled|refunded
const StatusEnum = z.enum([
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
]);

// Schema khi tạo/cập nhật đơn (admin hoặc hệ thống)
// - Nếu user là khách hàng đang đặt đơn: lấy user_id từ req.user.id (requireAuth)
// - Nếu admin: có thể truyền user_id qua body.
const itemSchema = z.object({
    book_id: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    price: z.coerce.number().nonnegative(), // sẽ map sang price_snapshot
});

const baseOrderSchema = z.object({
    user_id: z.string().uuid().optional(),
    status: StatusEnum.default("pending"),
    shipping_fee: z.coerce.number().nonnegative().default(0),
    discount_total: z.coerce.number().nonnegative().default(0),
    shipping_address: z.any().optional(), // JSON snapshot địa chỉ nhận hàng
    items: z.array(itemSchema).min(1, "Phải có ít nhất 1 sản phẩm"),
});

const paramsIdSchema = z.object({ id: z.string().uuid() });

/** Tính tổng tạm tính & grand_total theo items/fees/discount */
function computeTotals({ items, shipping_fee = 0, discount_total = 0 }) {
    const subtotal = items.reduce(
        (acc, it) => acc + Number(it.price) * Number(it.quantity),
        0
    );
    const grand_total = Math.max(0, subtotal - Number(discount_total) + Number(shipping_fee));
    return { subtotal, grand_total };
}

module.exports = {
    /** Admin/system tạo đơn hoặc user checkout (nếu bạn gắn vào luồng user) */
    async create(req, res, next) {
        try {
            const payload = baseOrderSchema.parse(req.body);

            // Nếu có auth middleware, ưu tiên user_id từ token
            const authedUserId = req.user?.id;
            const user_id = payload.user_id || authedUserId;
            if (!user_id) {
                return res.status(400).json({ success: false, message: "Thiếu user_id" });
            }

            const { subtotal, grand_total } = computeTotals(payload);

            const order = await OrderService.create({
                order: {
                    user_id,
                    status: payload.status,
                    subtotal,
                    discount_total: payload.discount_total,
                    shipping_fee: payload.shipping_fee,
                    grand_total,
                    shipping_address: payload.shipping_address || null,
                    placed_at: new Date(), // theo schema
                },
                // map price -> price_snapshot cho order_details
                items: payload.items.map((it) => ({
                    book_id: it.book_id,
                    quantity: it.quantity,
                    price_snapshot: it.price,
                })),
            });

            res.status(201).json({ success: true, data: order });
        } catch (e) {
            next(e);
        }
    },

    /** Admin cập nhật đơn (đổi trạng thái, đổi items, phí ship, giảm giá, tracking...) */
    /** Admin cập nhật đơn (đổi trạng thái, đổi items, phí ship, giảm giá, tracking...) */
    async update(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const payload = baseOrderSchema.partial().parse(req.body);

            // Tính lại tổng tiền trong 3 trường hợp:
            // 1) Có gửi items mới  → dùng items mới
            // 2) Không gửi items nhưng có đổi shipping_fee/discount_total → lấy items hiện có rồi tính lại
            // 3) Không đổi gì liên quan đến tiền → không tính lại
            let totals = {};
            let normalizedItems;

            if (payload.items && payload.items.length) {
                // items mới từ client
                normalizedItems = payload.items.map(it => ({
                    book_id: it.book_id,
                    quantity: it.quantity,
                    price_snapshot: it.price,
                }));
                const { subtotal, grand_total } = computeTotals({
                    items: payload.items, // dùng 'price'
                    shipping_fee: payload.shipping_fee ?? 0,
                    discount_total: payload.discount_total ?? 0,
                });
                totals = { subtotal, grand_total };
            } else if (payload.shipping_fee !== undefined || payload.discount_total !== undefined) {
                // cần tính lại từ items hiện có
                const current = await OrderService.detail(id); // { ... , items:[{price_snapshot, quantity}] }
                if (!current) return res.status(404).json({ success: false, message: "Không tìm thấy" });

                const itemsNow = (current.items || []).map(it => ({
                    price: Number(it.price_snapshot),
                    quantity: Number(it.quantity),
                }));
                const { subtotal, grand_total } = computeTotals({
                    items: itemsNow,
                    shipping_fee: payload.shipping_fee ?? current.shipping_fee ?? 0,
                    discount_total: payload.discount_total ?? current.discount_total ?? 0,
                });
                totals = { subtotal, grand_total };
                normalizedItems = undefined; // không đổi chi tiết
            }

            const order = await OrderService.update(id, {
                order: {
                    ...(payload.user_id ? { user_id: payload.user_id } : {}),
                    ...(payload.status ? { status: payload.status } : {}),
                    ...(payload.shipping_address !== undefined ? { shipping_address: payload.shipping_address } : {}),
                    ...(payload.shipping_fee !== undefined ? { shipping_fee: payload.shipping_fee } : {}),
                    ...(payload.discount_total !== undefined ? { discount_total: payload.discount_total } : {}),
                    ...totals,
                },
                items: normalizedItems, // chỉ truyền nếu có items mới
            });

            if (!order) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true, data: order });
        } catch (e) {
            next(e);
        }
    },


    async remove(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const ok = await OrderService.remove(id);
            if (!ok) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true });
        } catch (e) {
            next(e);
        }
    },

    async detail(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const data = await OrderService.detail(id);
            if (!data) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true, data });
        } catch (e) {
            next(e);
        }
    },

    async list(req, res, next) {
        try {
            const { q, status, page, limit } = req.query;
            const data = await OrderService.list({
                q,
                status,
                page: +page || 1,
                limit: +limit || 10,
            });
            res.json({ success: true, ...data });
        } catch (e) {
            next(e);
        }
    },

    /** ========== API cho "Tài khoản của tôi" (khách hàng) ========== */

    // GET /api/me/orders/:id  (chỉ xem đơn của chính mình)
    async detailMine(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const userId = req.user?.id;
            const data = await OrderService.findMineById(userId, id);
            if (!data) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true, ...data }); // { order, items }
        } catch (e) {
            next(e);
        }
    },

    // POST /api/me/orders/:id/cancel (hủy nếu trạng thái cho phép)
    async cancelMine(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const userId = req.user?.id;
            const ok = await OrderService.cancelMine(userId, id);
            if (!ok.ok) {
                return res
                    .status(ok.status || 400)
                    .json({ success: false, message: ok.message || "Không thể hủy đơn" });
            }
            res.json({ success: true, message: "Đã hủy đơn" });
        } catch (e) {
            next(e);
        }
    },
};

