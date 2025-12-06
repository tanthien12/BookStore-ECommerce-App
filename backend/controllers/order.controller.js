// backend/controllers/order.controller.js

const { z } = require("zod");
const OrderService = require("../services/order.service");
const PaymentService = require("../services/payment.service");
const VoucherService = require("../services/voucher.service");

/**
 * Enum trạng thái theo DB:
 * pending|paid|processing|shipped|delivered|cancelled|refunded
 */
const StatusEnum = z.enum([
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
]);

const listQuerySchema = z.object({
    q: z.string().optional(),
    status: StatusEnum.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(5000).default(10),
    from: z.string().optional(), // yyyy-mm-dd
    to: z.string().optional(),
});


const itemSchema = z.object({
    book_id: z.string().uuid(),
    quantity: z.coerce.number().int().positive(),
    price: z.coerce.number().nonnegative(), // FE gửi giá đã chốt (từ cart)
});

/**
 * Schema cơ bản cho order (dùng chung cho create & update)
 */
const baseOrderSchema = z.object({
    user_id: z.string().uuid().optional(),
    status: StatusEnum.default("pending"),
    payment_method: z.enum(["cod", "vnpay", "stripe"]), // Bắt buộc
    shipping_fee: z.coerce.number().nonnegative().default(0),
    discount_total: z.coerce.number().nonnegative().default(0),
    shipping_address: z.any().optional(),
    shipping_method: z.string().optional(),
    items: z.array(itemSchema).min(1, "Phải có ít nhất 1 sản phẩm"),
});

/**
 * Schema cho tạo đơn (mở rộng base, thêm coupon_code)
 * Cho phép passthrough các trường khác (vd: invoice, note, ...)
 */
const createOrderSchema = baseOrderSchema
    .extend({
        coupon_code: z.string().trim().min(1).optional(),
    })
    .passthrough();

const paramsIdSchema = z.object({ id: z.string().uuid() });

/** Tính tổng tạm tính & grand_total theo items/fees/discount */
function computeTotals({ items, shipping_fee = 0, discount_total = 0 }) {
    const subtotal = items.reduce(
        (acc, it) => acc + Number(it.price) * Number(it.quantity),
        0
    );
    const grand_total = Math.max(
        0,
        subtotal - Number(discount_total) + Number(shipping_fee)
    );
    return { subtotal, grand_total };
}

/** Map reason từ voucher service -> message thân thiện cho user */
function mapCouponReasonToMessage(reason) {
    switch (reason) {
        case "NOT_FOUND":
            return "Mã giảm giá không tồn tại hoặc đã bị xoá.";
        case "INACTIVE":
            return "Mã giảm giá hiện đang tạm khóa.";
        case "NOT_STARTED":
            return "Mã giảm giá này chưa đến thời gian bắt đầu áp dụng.";
        case "EXPIRED":
            return "Mã giảm giá này đã hết hạn.";
        case "MIN_ORDER_NOT_REACHED":
            return "Đơn hàng chưa đạt giá trị tối thiểu để sử dụng mã này.";
        case "USAGE_LIMIT_REACHED":
            return "Mã giảm giá này đã được sử dụng tối đa số lượt cho phép.";
        case "NO_DISCOUNT":
            return "Mã giảm giá này không mang lại ưu đãi cho đơn hàng hiện tại.";
        default:
            return "Không thể áp dụng mã giảm giá. Vui lòng kiểm tra lại.";
    }
}

module.exports = {
    /** Admin/system tạo đơn hoặc user checkout (nếu bạn gắn vào luồng user) */
    async create(req, res, next) {
        try {
            const payload = createOrderSchema.parse(req.body);

            // Nếu có auth middleware, ưu tiên user_id từ token
            const authedUserId = req.user?.id;
            const user_id = authedUserId || payload.user_id;
            if (!user_id) {
                return res
                    .status(401)
                    .json({ success: false, message: "Yêu cầu đăng nhập" });
            }

            // Tính subtotal "thô" (chưa giảm giá, chưa ship)
            const { subtotal } = computeTotals({
                items: payload.items,
                shipping_fee: 0,
                discount_total: 0,
            });

            // Xử lý giảm giá / coupon
            let discount_total = Number(payload.discount_total || 0);
            let appliedCoupon = null;

            if (payload.coupon_code && payload.coupon_code.trim()) {
                const validation = await VoucherService.validateCouponForOrder({
                    code: payload.coupon_code,
                    userId: user_id,
                    subtotal,
                    now: new Date(),
                });

                if (!validation.isValid) {
                    return res.status(400).json({
                        success: false,
                        reason: validation.reason,
                        message: mapCouponReasonToMessage(validation.reason),
                    });
                }

                discount_total = validation.discountAmount;
                appliedCoupon = validation.coupon;
            }

            // Tính lại subtotal/grand_total với discount + shipping_fee
            const { grand_total } = computeTotals({
                items: payload.items,
                shipping_fee: payload.shipping_fee,
                discount_total,
            });

            const order = await OrderService.create({
                order: {
                    user_id,
                    status: payload.status, // 'pending'
                    payment_method: payload.payment_method, // 'cod' | 'vnpay' | 'stripe'
                    subtotal,
                    discount_total,
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
                    price_snapshot: it.price,
                })),
            });

            // Ghi nhận coupon đã sử dụng (nếu có)
            if (appliedCoupon) {
                try {
                    await VoucherService.consumeCoupon({
                        couponId: appliedCoupon.id,
                        userId: user_id,
                        orderId: order.id,
                    });
                } catch (err) {
                    // Không làm fail đơn nếu việc ghi coupon lỗi,
                    // nhưng có thể log lại để kiểm tra
                    console.error(
                        "Lỗi khi consume coupon cho order",
                        order.id,
                        err
                    );
                }
            }

            // Nếu COD: tạo bản ghi payment unpaid
            if (payload.payment_method === "cod") {
                await PaymentService.createPaymentRecordSafe({
                    order_id: order.id,
                    method: "cod",
                    status: "unpaid",
                    amount_paid: 0,
                    currency: "VND",
                    transaction_id: null,
                });
            }

            // (Nếu VNPay, FE sẽ gọi /vnpay/create-payment-url ngay sau đây)
            res.status(201).json({
                success: true,
                data: order,
            });
        } catch (e) {
            next(e);
        }
    },

    /** Admin cập nhật đơn (đổi items, phí ship, giảm giá, v.v.) */
    async update(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const payload = baseOrderSchema.partial().parse(req.body);

            let totals = {};
            let normalizedItems;

            if (payload.items && payload.items.length) {
                // items mới từ client
                normalizedItems = payload.items.map((it) => ({
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
            } else if (
                payload.shipping_fee !== undefined ||
                payload.discount_total !== undefined
            ) {
                // cần tính lại từ items hiện có
                const current = await OrderService.detail(id);
                if (!current)
                    return res
                        .status(404)
                        .json({ success: false, message: "Không tìm thấy" });

                const itemsNow = (current.items || []).map((it) => ({
                    price: Number(it.price_snapshot),
                    quantity: Number(it.quantity),
                }));
                const { subtotal, grand_total } = computeTotals({
                    items: itemsNow,
                    shipping_fee:
                        payload.shipping_fee ?? current.shipping_fee ?? 0,
                    discount_total:
                        payload.discount_total ?? current.discount_total ?? 0,
                });
                totals = { subtotal, grand_total };
                normalizedItems = undefined; // không đổi chi tiết
            }

            const order = await OrderService.update(id, {
                order: {
                    ...(payload.user_id ? { user_id: payload.user_id } : {}),
                    ...(payload.status ? { status: payload.status } : {}), // (Status riêng sẽ dùng API updateStatus)
                    ...(payload.shipping_address !== undefined
                        ? { shipping_address: payload.shipping_address }
                        : {}),
                    ...(payload.shipping_fee !== undefined
                        ? { shipping_fee: payload.shipping_fee }
                        : {}),
                    ...(payload.discount_total !== undefined
                        ? { discount_total: payload.discount_total }
                        : {}),
                    ...totals,
                },
                items: normalizedItems, // chỉ truyền nếu có items mới
            });

            if (!order)
                return res
                    .status(404)
                    .json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true, data: order });
        } catch (e) {
            next(e);
        }
    },

    async remove(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const ok = await OrderService.remove(id);
            if (!ok)
                return res
                    .status(404)
                    .json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true });
        } catch (e) {
            next(e);
        }
    },

    async detail(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const data = await OrderService.detail(id);
            if (!data)
                return res
                    .status(404)
                    .json({ success: false, message: "Không tìm thấy" });
            res.json({ success: true, data });
        } catch (e) {
            next(e);
        }
    },

    async list(req, res, next) {
        try {
            const query = listQuerySchema.parse(req.query);
            const data = await OrderService.list(query);
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
            if (!data)
                return res
                    .status(404)
                    .json({ success: false, message: "Không tìm thấy" });
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
                    .json({
                        success: false,
                        message: ok.message || "Không thể hủy đơn",
                    });
            }
            res.json({ success: true, message: "Đã hủy đơn" });
        } catch (e) {
            next(e);
        }
    },

    /**
     * Admin: cập nhật trạng thái đơn hàng sử dụng state machine.
     * Body: { "status": "processing" | "shipped" | ... }
     */
    async updateStatus(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const bodySchema = z.object({
                status: StatusEnum,
            });
            const { status } = bodySchema.parse(req.body);

            const result = await OrderService.updateStatus(id, status);
            if (!result.ok) {
                return res.status(result.status || 400).json({
                    success: false,
                    message:
                        result.message ||
                        "Không thể cập nhật trạng thái đơn hàng",
                });
            }

            return res.json({
                success: true,
                data: {
                    id,
                    from: result.from,
                    to: result.to ?? status,
                    unchanged: !!result.unchanged,
                },
            });
        } catch (e) {
            next(e);
        }
    },
};
