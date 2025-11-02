// backend/controllers/payment.controller.js
const PaymentService = require("../services/payment.service");
const OrderService = require("../services/order.service");

/**
 * FE gọi vào đây để tạo link VNPay
 * Có 2 kiểu:
 * 1) FE đã tạo order trước → gửi order_id + amount → tạo link dựa trên order đã có
 * 2) FE CHƯA tạo order → (flow khác, bạn đã có trong PaymentService.createVNPayPayment)
 */
async function createVNPayUrl(req, res) {
  try {
    const userId = req.user?.id || null;
    const { amount, bankCode = "", order_id } = req.body;

    // Nếu FE gửi sẵn order_id thì dùng luôn
    if (order_id) {
      const paymentUrl = await PaymentService.createVNPayUrlFromExistingOrder({
        orderId: order_id,
        amount,
        bankCode,
        ipAddr:
          req.headers["x-forwarded-for"] ||
          req.connection?.remoteAddress ||
          req.socket?.remoteAddress ||
          "127.0.0.1",
      });

      return res.json({
        success: true,
        paymentUrl,
      });
    }

    // Nếu không có order_id → dùng flow "tạo đơn + tạo payment + sinh URL"
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Cần đăng nhập để thanh toán.",
      });
    }

    // TODO: nếu bạn muốn cho phép thanh toán nhanh từ giỏ thì truyền items ở body
    const payment = await PaymentService.createVNPayPayment({
      userId,
      items: req.body.items || [],
      amount,
      shipping_address: req.body.shipping_address,
      shipping_fee: req.body.shipping_fee,
      discount_total: req.body.discount_total,
    });

    return res.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      order: payment.order,
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

    // thành công
    if (result.ok) {
      // nếu bạn muốn chắc nữa vẫn có thể gọi lên OrderService để update lại
      if (result.orderId) {
        await OrderService.updateStatus(result.orderId, "paid");
      }

      // redirect về FE
      const FE_URL =
        process.env.APP_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:5173";

      return res.redirect(
        `${FE_URL}/checkout/success?paid=1&order_id=${result.orderId}`
      );
    }

    // thất bại
    const FE_URL =
      process.env.APP_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173";
    return res.redirect(
      `${FE_URL}/checkout/fail?reason=${encodeURIComponent(
        result.status || result.reason || "failed"
      )}`
    );
  } catch (err) {
    console.error("vnpayReturn error:", err);
    const FE_URL =
      process.env.APP_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173";
    return res.redirect(
      `${FE_URL}/checkout/fail?reason=server_error`
    );
  }
}

module.exports = {
  createVNPayUrl,
  vnpayReturn,
};
