const OrderModel = require("../models/order.model");

const OrderService = {
    create: (payload) => OrderModel.create(payload.order, payload.items),
    update: (id, payload) => OrderModel.update(id, payload.order, payload.items),
    remove: (id) => OrderModel.remove(id),
    detail: (id) => OrderModel.findById(id),
    list: (params) => OrderModel.list(params),
};

module.exports = OrderService;
