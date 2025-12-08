// backend/services/order.service.js

const OrderModel = require("../models/order.model");
const { pool } = require("../config/db.config");

// NEW: NotificationService + RoleModel
const NotificationService = require("./notification.service");
const RoleModel = require("../models/role.model");

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
    cancelled: new Set(),
    refunded: new Set(),
};

function canTransitionStatus(from, to) {
    if (from === to) return true;
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed) return false;
    return allowed.has(to);
}

// NEW: map trạng thái -> label tiếng Việt
const STATUS_LABELS = {
    pending: "Chờ xác nhận",
    paid: "Đã thanh toán",
    processing: "Đang xử lý",
    shipped: "Đang giao",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
    refunded: "Đã hoàn tiền",
};

const OrderService = {
    /**
     * Tạo đơn + items (order_details.price_snapshot)
     * Sau khi tạo đơn -> gửi notification ORDER_NEW cho tất cả admin.
     */
    create: async (payload) => {
        const order = await OrderModel.create(payload.order, payload.items);

        // Gửi thông báo cho admin (không làm fail đơn nếu lỗi)
        try {
            if (typeof RoleModel.getAdmins === "function") {
                const admins = await RoleModel.getAdmins();

                if (admins && admins.length > 0) {
                    const contentForAdmin = `Có đơn hàng mới #${order.id} từ khách hàng ID ${order.user_id} – tổng ${order.grand_total}đ`;
                    const linkForAdmin = `/admin/orders/${order.id}`;

                    await Promise.all(
                        admins.map((admin) =>
                            NotificationService.createNotification({
                                userId: admin.id,
                                type: "ORDER_NEW",
                                content: contentForAdmin,
                                linkUrl: linkForAdmin,
                            })
                        )
                    );
                }
            }
        } catch (err) {
            console.error(
                "Lỗi khi gửi thông báo ORDER_NEW cho admin:",
                err.message
            );
        }

        return order;
    },

    // Cập nhật đơn; nếu payload.items không truyền -> không đổi chi tiết
    update: (id, payload) => OrderModel.update(id, payload.order, payload.items),

    remove: (id) => OrderModel.remove(id),

    // Chi tiết đơn (admin/nhân viên): gồm order + items
    detail: (id) => OrderModel.findById(id),

    // Danh sách đơn (admin): filter q/status/paging
    list: (params) => OrderModel.list(params),

    /** ========== Dùng cho “Tài khoản của tôi” ========== */

    listByUser: ({ userId, page = 1, limit = 10, status }) =>
        OrderModel.listByUser({ userId, page, limit, status }),

    findMineById: (userId, orderId) => OrderModel.findMineById(userId, orderId),

    cancelMine: async (userId, orderId) => {
        return OrderModel.cancelMine(userId, orderId);
    },

    /**
     * Admin: cập nhật trạng thái đơn hàng (state machine).
     * Sau khi cập nhật -> gửi notification ORDER_STATUS cho user.
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
                `
          SELECT id, user_id, status, grand_total
          FROM "order"
          WHERE id = $1
          FOR UPDATE
        `,
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

            const orderRow = rows[0];
            const currentStatus = orderRow.status;

            if (!canTransitionStatus(currentStatus, nextStatus)) {
                await client.query("ROLLBACK");
                return {
                    ok: false,
                    status: 400,
                    message: `Không thể chuyển trạng thái từ '${currentStatus}' sang '${nextStatus}'.`,
                };
            }

            // Không đổi trạng thái -> vẫn coi là thành công
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
                `
          UPDATE "order"
          SET status = $2,
              updated_at = now()
          WHERE id = $1
        `,
                [orderId, nextStatus]
            );

            await client.query("COMMIT");

            // Sau khi COMMIT thành công -> gửi notification cho user
            try {
                const fromLabel = STATUS_LABELS[currentStatus] || currentStatus;
                const toLabel = STATUS_LABELS[nextStatus] || nextStatus;
                const contentForUser = `Đơn hàng #${orderId} đã chuyển từ "${fromLabel}" sang "${toLabel}".`;
                const linkForUser = `/account/orders/${orderId}`;

                await NotificationService.createNotification({
                    userId: orderRow.user_id,
                    type: "ORDER_STATUS",
                    content: contentForUser,
                    linkUrl: linkForUser,
                });
            } catch (err) {
                console.error(
                    "Lỗi khi gửi thông báo ORDER_STATUS cho user:",
                    err.message
                );
            }

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


//code goc
// // backend/services/order.service.js

// // code sau – bản dùng trong hệ thống hiện tại
// const OrderModel = require("../models/order.model");
// const { pool } = require("../config/db.config");

// // Tập trạng thái hợp lệ cho order
// const ORDER_STATUSES = [
//     "pending",
//     "paid",
//     "processing",
//     "shipped",
//     "delivered",
//     "cancelled",
//     "refunded",
// ];

// // Bản đồ các transition cho phép
// // (idempotent: cho phép từ X -> X)
// const ALLOWED_TRANSITIONS = {
//     pending: new Set(["paid", "processing", "cancelled"]),
//     paid: new Set(["processing", "shipped", "cancelled"]),
//     processing: new Set(["shipped", "cancelled"]),
//     shipped: new Set(["delivered", "cancelled"]),
//     delivered: new Set(["refunded"]),
//     cancelled: new Set(), // đã hủy thì không quay lại
//     refunded: new Set(),  // đã hoàn tiền thì coi như kết thúc
// };

// function canTransitionStatus(from, to) {
//     if (from === to) return true;
//     const allowed = ALLOWED_TRANSITIONS[from];
//     if (!allowed) return false;
//     return allowed.has(to);
// }

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

//     /**
//      * Cập nhật trạng thái đơn hàng với state machine.
//      * Dùng cho: Admin cập nhật trạng thái (và sau này có thể tái dùng cho thanh toán).
//      *
//      * Trả về:
//      * - { ok: true, from, to, unchanged? }
//      * - { ok: false, status, message }
//      */
//     updateStatus: async (orderId, nextStatus) => {
//         // Validate trạng thái đầu vào
//         if (!ORDER_STATUSES.includes(nextStatus)) {
//             return {
//                 ok: false,
//                 status: 400,
//                 message: "Trạng thái không hợp lệ.",
//             };
//         }

//         const client = await pool.connect();
//         try {
//             await client.query("BEGIN");

//             // Khóa dòng đơn hàng để tránh race condition
//             const { rows } = await client.query(
//                 `SELECT status FROM "order" WHERE id = $1 FOR UPDATE`,
//                 [orderId]
//             );
//             if (!rows || !rows[0]) {
//                 await client.query("ROLLBACK");
//                 return {
//                     ok: false,
//                     status: 404,
//                     message: "Không tìm thấy đơn hàng.",
//                 };
//             }

//             const currentStatus = rows[0].status;

//             if (!canTransitionStatus(currentStatus, nextStatus)) {
//                 await client.query("ROLLBACK");
//                 return {
//                     ok: false,
//                     status: 400,
//                     message: `Không thể chuyển trạng thái từ '${currentStatus}' sang '${nextStatus}'.`,
//                 };
//             }

//             // Không có thay đổi -> coi như thành công nhưng không update DB nữa
//             if (currentStatus === nextStatus) {
//                 await client.query("COMMIT");
//                 return {
//                     ok: true,
//                     from: currentStatus,
//                     to: nextStatus,
//                     unchanged: true,
//                 };
//             }

//             await client.query(
//                 `UPDATE "order"
//                  SET status = $2,
//                      updated_at = now()
//                  WHERE id = $1`,
//                 [orderId, nextStatus]
//             );

//             await client.query("COMMIT");
//             return {
//                 ok: true,
//                 from: currentStatus,
//                 to: nextStatus,
//             };
//         } catch (err) {
//             await client.query("ROLLBACK");
//             console.error("updateStatus error:", err);
//             return {
//                 ok: false,
//                 status: 500,
//                 message: "Lỗi khi cập nhật trạng thái đơn hàng.",
//                 error: err.message,
//             };
//         } finally {
//             client.release();
//         }
//     },
// };

// module.exports = OrderService;

