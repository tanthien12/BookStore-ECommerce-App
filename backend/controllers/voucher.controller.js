// backend/controllers/voucher.controller.js
const pool = require('../config/db.config'); // chỉnh path nếu khác
const voucherService = require('../services/voucher.service');

/**
 * Helper: map reason -> message tiếng Việt
 */
function reasonToMessage(reason, coupon, subtotal) {
    switch (reason) {
        case 'NOT_FOUND':
            return 'Mã giảm giá không tồn tại hoặc đã bị xoá.';
        case 'INACTIVE':
            return 'Mã giảm giá đang tạm khóa.';
        case 'NOT_STARTED':
            return 'Mã giảm giá này chưa tới ngày bắt đầu áp dụng.';
        case 'EXPIRED':
            return 'Mã giảm giá này đã hết hạn.';
        case 'MIN_ORDER_NOT_REACHED':
            return `Đơn hàng chưa đạt giá trị tối thiểu để áp dụng mã này.`;
        case 'USAGE_LIMIT_REACHED':
            return 'Mã giảm giá này đã được sử dụng tối đa số lượt cho phép.';
        case 'NO_DISCOUNT':
            return 'Mã giảm giá này không tạo ra ưu đãi cho đơn hàng hiện tại.';
        default:
            return 'Không thể áp dụng mã giảm giá. Vui lòng thử lại.';
    }
}

/**
 * API: POST /api/cart/apply-coupon
 * Preview áp dụng mã cho giỏ hiện tại
 */
async function applyCoupon(req, res, next) {
    try {
        const userId = req.user?.id; // yêu cầu đã có authGuard
        const { code } = req.body || {};

        if (!userId) {
            return res.status(401).json({ ok: false, message: 'Bạn cần đăng nhập.' });
        }

        if (!code || !code.trim()) {
            return res.status(400).json({ ok: false, message: 'Vui lòng nhập mã giảm giá.' });
        }

        const client = await pool.connect();

        try {
            // Lấy cart "active" của user
            const cartRes = await client.query(
                `SELECT id
         FROM bookstore.cart
         WHERE user_id = $1 AND status = 'active'
         LIMIT 1`,
                [userId]
            );

            if (cartRes.rowCount === 0) {
                return res.status(400).json({
                    ok: false,
                    reason: 'NO_CART',
                    message: 'Hiện tại giỏ hàng đang trống.',
                });
            }

            const cartId = cartRes.rows[0].id;

            // Tính subtotal từ cart_items
            const subtotalRes = await client.query(
                `SELECT COALESCE(SUM(ci.quantity * ci.price_snapshot), 0) AS subtotal
         FROM bookstore.cart_items ci
         WHERE ci.cart_id = $1`,
                [cartId]
            );

            const subtotal = Number(subtotalRes.rows[0].subtotal || 0);

            if (subtotal <= 0) {
                return res.status(400).json({
                    ok: false,
                    reason: 'EMPTY_CART',
                    message: 'Giỏ hàng hiện tại không có sản phẩm hợp lệ.',
                });
            }

            const validation = await voucherService.validateCouponForOrder({
                code,
                userId,
                subtotal,
                now: new Date(),
                client,
            });

            if (!validation.isValid) {
                return res.status(400).json({
                    ok: false,
                    reason: validation.reason,
                    message: reasonToMessage(validation.reason, validation.coupon, subtotal),
                });
            }

            const { coupon, discountAmount } = validation;
            const grandTotal = subtotal - discountAmount; // chưa tính phí ship vì còn tuỳ logic checkout của bạn

            return res.json({
                ok: true,
                message: 'Áp dụng mã giảm giá thành công.',
                subtotal,
                discount: discountAmount,
                grand_total: grandTotal,
                coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    description: coupon.description,
                    type: coupon.type,
                    value: coupon.value,
                    min_order_value: coupon.min_order_value,
                    max_discount: coupon.max_discount,
                    usage_limit: coupon.usage_limit,
                    times_used: coupon.times_used,
                    start_date: coupon.start_date,
                    end_date: coupon.end_date,
                    is_active: coupon.is_active,
                },
            });
        } finally {
            client.release();
        }
    } catch (err) {
        next(err);
    }
}

/**
 * ADMIN – CRUD coupon
 */

// GET /api/admin/coupons
async function adminListCoupons(req, res, next) {
    try {
        const { search, status } = req.query;
        const coupons = await voucherService.listCoupons({ search, status });
        res.json({ ok: true, data: coupons });
    } catch (err) {
        next(err);
    }
}

// POST /api/admin/coupons
async function adminCreateCoupon(req, res, next) {
    try {
        const coupon = await voucherService.createCoupon(req.body);
        res.status(201).json({ ok: true, data: coupon });
    } catch (err) {
        next(err);
    }
}

// GET /api/admin/coupons/:id
async function adminGetCoupon(req, res, next) {
    try {
        const { id } = req.params;
        const coupon = await voucherService.getCouponById(id);
        if (!coupon) {
            return res.status(404).json({ ok: false, message: 'Không tìm thấy coupon.' });
        }
        res.json({ ok: true, data: coupon });
    } catch (err) {
        next(err);
    }
}

// PUT /api/admin/coupons/:id
async function adminUpdateCoupon(req, res, next) {
    try {
        const { id } = req.params;
        const coupon = await voucherService.updateCoupon(id, req.body);
        if (!coupon) {
            return res.status(404).json({ ok: false, message: 'Không tìm thấy coupon.' });
        }
        res.json({ ok: true, data: coupon });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/admin/coupons/:id
async function adminDeleteCoupon(req, res, next) {
    try {
        const { id } = req.params;
        await voucherService.deleteCoupon(id);
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
}

async function listMyVouchers(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ ok: false, message: 'Bạn cần đăng nhập.' });
        }

        const vouchers = await voucherService.listAvailableCouponsForUser(userId);

        return res.json({
            ok: true,
            data: vouchers,
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    applyCoupon,
    adminListCoupons,
    adminCreateCoupon,
    adminGetCoupon,
    adminUpdateCoupon,
    adminDeleteCoupon,
    listMyVouchers,
};


// // backend/controllers/voucher.controller.js
// const voucherService = require('../services/voucher.service');

// exports.available = async (req, res, next) => {
//     try {
//         const userId = req.user.id;
//         const { minOrderValue } = req.query;
//         const items = await voucherService.available({ userId, minOrderValue });
//         res.json({ success: true, items });
//     } catch (e) { next(e); }
// };

// exports.used = async (req, res, next) => {
//     try {
//         const userId = req.user.id;
//         const items = await voucherService.used(userId);
//         res.json({ success: true, items });
//     } catch (e) { next(e); }
// };
