// backend/services/order.service.js

// code sau – bản dùng trong hệ thống hiện tại
const OrderModel = require("../models/order.model");
const { pool } = require("../config/db.config");

// Tập trạng thái hợp lệ cho order
const ORDER_STATUSES = [
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
];

// Bản đồ các transition cho phép
// (idempotent: cho phép từ X -> X)
const ALLOWED_TRANSITIONS = {
    pending: new Set(["paid", "processing", "cancelled"]),
    paid: new Set(["processing", "shipped", "cancelled"]),
    processing: new Set(["shipped", "cancelled"]),
    shipped: new Set(["delivered", "cancelled"]),
    delivered: new Set(["refunded"]),
    cancelled: new Set(), // đã hủy thì không quay lại
    refunded: new Set(),  // đã hoàn tiền thì coi như kết thúc
};

function canTransitionStatus(from, to) {
    if (from === to) return true;
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.has(to);
}

const OrderService = {
    // Tạo đơn + items (order_details.price_snapshot)
    create: (payload) => OrderModel.create(payload.order, payload.items),

    // Cập nhật đơn; nếu payload.items không truyền -> không đổi chi tiết
    update: (id, payload) => OrderModel.update(id, payload.order, payload.items),

    remove: (id) => OrderModel.remove(id),

    // Chi tiết đơn (admin/nhân viên): gồm order + items
    detail: (id) => OrderModel.findById(id),

    // Danh sách đơn (admin): filter q/status/paging
    list: (params) => OrderModel.list(params),

    /** ========== Dùng cho “Tài khoản của tôi” ========== */

    // Danh sách đơn theo user (đã dùng trong AccountController.myOrders)
    listByUser: ({ userId, page = 1, limit = 10, status }) =>
        OrderModel.listByUser({ userId, page, limit, status }),

    // Xem chi tiết đơn của chính mình
    findMineById: (userId, orderId) => OrderModel.findMineById(userId, orderId),

    // Hủy đơn nếu đang ở trạng thái cho phép (pending|processing)
    cancelMine: async (userId, orderId) => {
        // Trả về { ok:true } hoặc { ok:false, status, message }
        return OrderModel.cancelMine(userId, orderId);
    },

    /**
     * Cập nhật trạng thái đơn hàng với state machine.
     * Dùng cho: Admin cập nhật trạng thái (và sau này có thể tái dùng cho thanh toán).
     *
     * Trả về:
     * - { ok: true, from, to, unchanged? }
     * - { ok: false, status, message }
     */
    updateStatus: async (orderId, nextStatus) => {
        // Validate trạng thái đầu vào
        if (!ORDER_STATUSES.includes(nextStatus)) {
            return {
                ok: false,
                status: 400,
                message: "Trạng thái không hợp lệ.",
            };
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // Khóa dòng đơn hàng để tránh race condition
            const { rows } = await client.query(
                `SELECT status FROM "order" WHERE id = $1 FOR UPDATE`,
                [orderId]
            );
            if (!rows || !rows[0]) {
                await client.query("ROLLBACK");
                return {
                    ok: false,
                    status: 404,
                    message: "Không tìm thấy đơn hàng.",
                };
            }

            const currentStatus = rows[0].status;

            if (!canTransitionStatus(currentStatus, nextStatus)) {
                await client.query("ROLLBACK");
                return {
                    ok: false,
                    status: 400,
                    message: `Không thể chuyển trạng thái từ '${currentStatus}' sang '${nextStatus}'.`,
                };
            }

            // Không có thay đổi -> coi như thành công nhưng không update DB nữa
            if (currentStatus === nextStatus) {
                await client.query("COMMIT");
                return {
                    ok: true,
                    from: currentStatus,
                    to: nextStatus,
                    unchanged: true,
                };
            }

            await client.query(
                `UPDATE "order"
                 SET status = $2,
                     updated_at = now()
                 WHERE id = $1`,
                [orderId, nextStatus]
            );

            await client.query("COMMIT");
            return {
                ok: true,
                from: currentStatus,
                to: nextStatus,
            };
        } catch (err) {
            await client.query("ROLLBACK");
            console.error("updateStatus error:", err);
            return {
                ok: false,
                status: 500,
                message: "Lỗi khi cập nhật trạng thái đơn hàng.",
                error: err.message,
            };
        } finally {
            client.release();
        }
    },
};

module.exports = OrderService;


// // const OrderModel = require("../models/order.model");

// // const OrderService = {
// //     create: (payload) => OrderModel.create(payload.order, payload.items),
// //     update: (id, payload) => OrderModel.update(id, payload.order, payload.items),
// //     remove: (id) => OrderModel.remove(id),
// //     detail: (id) => OrderModel.findById(id),
// //     list: (params) => OrderModel.list(params),
// // };


// // module.exports = OrderService;


// // code sau
// const OrderModel = require("../models/order.model");

// const OrderService = {
//     // Tạo đơn + items (order_details.price_snapshot)
//     create: (payload) => OrderModel.create(payload.order, payload.items),

//     // Cập nhật đơn; nếu payload.items không truyền -> không đổi chi tiết
//     update: (id, payload) => OrderModel.update(id, payload.order, payload.items),

//     remove: (id) => OrderModel.remove(id),

//     // Chi tiết đơn (admin/nhân viên): gồm order + items
//     detail: (id) => OrderModel.findById(id),

//     // Danh sách đơn (admin): filter q/status/paging
//     list: (params) => OrderModel.list(params),

//     /** ========== Dùng cho “Tài khoản của tôi” ========== */

//     // Danh sách đơn theo user (đã dùng trong AccountController.myOrders)
//     listByUser: ({ userId, page = 1, limit = 10, status }) =>
//         OrderModel.listByUser({ userId, page, limit, status }),

//     // Xem chi tiết đơn của chính mình
//     findMineById: (userId, orderId) => OrderModel.findMineById(userId, orderId),

//     // Hủy đơn nếu đang ở trạng thái cho phép (pending|processing)
//     cancelMine: async (userId, orderId) => {
//         // Trả về { ok:true } hoặc { ok:false, status, message }
//         return OrderModel.cancelMine(userId, orderId);
//     },
//      // Cập nhật trạng thái đơn hàng (dùng cho thanh toán)
//     updateStatus: async (orderId, status) => {
//         const pool = require("../config/db.config");
//         try {
//             await pool.query(
//                 `UPDATE "order" SET status = $2, updated_at = now() WHERE id = $1`,
//                 [orderId, status]
//             );
//             return { ok: true };
//         } catch (err) {
//             console.error("updateStatus error:", err);
//             return { ok: false, error: err.message };
//         }
//     },
// };

// module.exports = OrderService;
