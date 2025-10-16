// const OrderModel = require("../models/order.model");

// const OrderService = {
//     create: (payload) => OrderModel.create(payload.order, payload.items),
//     update: (id, payload) => OrderModel.update(id, payload.order, payload.items),
//     remove: (id) => OrderModel.remove(id),
//     detail: (id) => OrderModel.findById(id),
//     list: (params) => OrderModel.list(params),
// };


// module.exports = OrderService;


// code sau
const OrderModel = require("../models/order.model");

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
};

module.exports = OrderService;

