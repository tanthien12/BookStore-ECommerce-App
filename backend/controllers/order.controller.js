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
// backend/controllers/order.controller.js
const { z } = require("zod");
const OrderService = require("../services/order.service");
const PaymentService = require("../services/payment.service");

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

const itemSchema = z.object({
    book_id: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    price: z.coerce.number().nonnegative(), // FE gửi giá đã chốt (từ cart)
});

const baseOrderSchema = z.object({
    user_id: z.string().uuid().optional(),
    status: StatusEnum.default("pending"),
    payment_method: z.enum(["cod", "vnpay", "stripe"]), // SỬA: Bắt buộc phải có
    shipping_fee: z.coerce.number().nonnegative().default(0),
    discount_total: z.coerce.number().nonnegative().default(0),
    shipping_address: z.any().optional(), 
    shipping_method: z.string().optional(),
    items: z.array(itemSchema).min(1, "Phải có ít nhất 1 sản phẩm"),
});
const createOrderSchema = baseOrderSchema.passthrough(); // Cho phép các trường khác (coupon, invoice)

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
            const payload = createOrderSchema.parse(req.body);

            // Nếu có auth middleware, ưu tiên user_id từ token
            const authedUserId = req.user?.id;
            const user_id = authedUserId || payload.user_id; // Sửa: Lấy từ token trước
            if (!user_id) {
                return res.status(401).json({ success: false, message: "Yêu cầu đăng nhập" });
            }

            const { subtotal, grand_total } = computeTotals(payload);

            // ⬇️ BẮT ĐẦU SỬA LOGIC TRUYỀN DATA ⬇️
            const order = await OrderService.create({
                order: {
                    user_id,
                    status: payload.status, // Sẽ là 'pending'
                    payment_method: payload.payment_method, // 'cod' hoặc 'vnpay'
                    subtotal,
                    discount_total: payload.discount_total,
                    shipping_fee: payload.shipping_fee,
                    grand_total,
                    shipping_address: payload.shipping_address || null,
                    shipping_method: payload.shipping_method || null,
                    placed_at: new Date(), 
                },
                // map price -> price_snapshot cho order_details
                items: payload.items.map((it) => ({
                    book_id: it.book_id,
                    quantity: it.quantity,
                    price_snapshot: it.price, // Dùng giá 'price' từ payload.items
                })),
            });
            // ⬆️ KẾT THÚC SỬA LOGIC TRUYỀN DATA ⬆️
            
            //  Nếu phương thức thanh toán là COD → tạo bản ghi payment (unpaid)
            if (payload.payment_method === "cod") {
                await PaymentService.createPaymentRecordSafe({
                    order_id: order.id,
                    method: "cod",
                    status: "unpaid", // COD chưa thanh toán
                    amount_paid: 0,
                    currency: "VND",
                    transaction_id: null,
                });
            }
            
            // (Nếu là VNPay, FE sẽ gọi /create-payment-url ngay sau đây)
            
            res.status(201).json({ success: true, data: order });
        } catch (e) {
            next(e);
        }
    },

    /** Admin cập nhật đơn (đổi trạng thái, đổi items, phí ship, giảm giá, tracking...) */
    async update(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const payload = baseOrderSchema.partial().parse(req.body);

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
                const current = await OrderService.detail(id); 
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

