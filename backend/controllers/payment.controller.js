// backend/controllers/payment.controller.js
const PaymentService = require("../services/payment.service");
const OrderService = require("../services/order.service");

async function createVNPayUrl(req, res) {
  try {
    const { amount, bankCode, order_id } = req.body;

    if (!order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu order_id" });
    }

    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    const paymentUrl = await PaymentService.createVNPayUrl({
      amount,
      bankCode,
      orderId: order_id,
      ipAddr,
    });

    return res.json({
      success: true,
      paymentUrl,
    });
  } catch (err) {
    console.error("createVNPayUrl error:", err);
    return res.status(500).json({
      success: false,
      message: "Tạo link thanh toán thất bại",
    });
  }
}

async function vnpayReturn(req, res) {
  try {
    const result = await PaymentService.handleVNPayReturn(req.query);

    if (result.ok) {
      // cập nhật trạng thái đơn hàng
      if (result.orderId) {
        await OrderService.updateStatus(result.orderId, "paid");
      }

      // redirect về FE
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/checkout/success?paid=1`
      );
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL || "http://localhost:5173"}/checkout/fail?reason=${result.reason}`
      );
    }
  } catch (err) {
    console.error("vnpayReturn error:", err);
    return res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}/checkout/fail?reason=server_error`
    );
  }
}

module.exports = {
  createVNPayUrl,
  vnpayReturn,
};
