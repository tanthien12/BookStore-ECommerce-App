// controllers/payment.controller.js
const PaymentService = require("../services/payment.service");
const OrderService = require("../services/order.service");

const CLIENT_URL = process.env.APP_URL || "http://localhost:5173";

/** VNPay: tạo URL thanh toán (không tạo payment ở bước này) */
async function createVNPayUrl(req, res) {
  try {
    const { order_id, amount } = req.body || {};
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.connection?.remoteAddress ||
      req.ip ||
      "127.0.0.1";

    if (!order_id) {
      return res.status(400).json({ success: false, error: true, message: "order_id is required" });
    }

    const paymentUrl = await PaymentService.createVNPayUrlFromExistingOrder({
      orderId: order_id,
      amount,
      ipAddr: clientIp,
    });

    return res.json({ success: true, paymentUrl });
  } catch (err) {
    console.error("[VNPay] createVNPayUrl error:", err);
    return res.status(500).json({ success: false, error: true, message: err.message });
  }
}

/** VNPay: return URL – Service sẽ tự verify + cập nhật DB */
async function vnpayReturn(req, res) {
  try {
    // Lấy lại các query param từ VNPAY để gửi về frontend
    const vnpParams = req.query || {};

    // Service xử lý (đã đúng)
    const result = await PaymentService.handleVNPayReturn(vnpParams);
    // result: { ok: boolean, orderId, status, reason? }

    if (!result.ok) {
      const reason = result.reason || "unknown";

      // Sửa 1: Thêm orderId, code, method vào redirect thất bại
      const orderId = result.orderId || vnpParams['vnp_TxnRef'] || "";
      const code = vnpParams['vnp_ResponseCode'] || "XX";

      return res.redirect(`${CLIENT_URL}/checkout-fail?orderId=${orderId}&reason=${encodeURIComponent(reason)}&code=${code}&method=vnpay`);
    }

    // Thành công
    // Sửa 2: Thêm amount, method, code, txn vào redirect thành công
    const orderId = result.orderId; // Đã xác thực
    const amount = Number(vnpParams['vnp_Amount']) / 100; // VNPAY trả về * 100
    const code = vnpParams['vnp_ResponseCode'];
    const txnId = vnpParams['vnp_TransactionNo'];

    const successUrl = `${CLIENT_URL}/checkout-success?orderId=${orderId}&amount=${amount}&method=vnpay&code=${code}&txn=${txnId}`;

    return res.redirect(successUrl);


  } catch (err) {
    console.error("[VNPay][RETURN] error:", err);
    return res.redirect(`${CLIENT_URL}/checkout-fail?reason=server_error`);
  }
}

/**
 * COD: FE chỉ gọi endpoint này sau khi /checkout/success
 * Lưu 1 payment 'unpaid' bám order cho thống nhất reporting
 */
async function codSuccess(req, res) {
  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ success: false, error: true, message: "order_id is required" });
    }

    const order = await OrderService.detail(order_id);
    if (!order) {
      return res.status(404).json({ success: false, error: true, message: "ORDER_NOT_FOUND" });
    }
    if (order.payment_method !== "cod") {
      return res.status(400).json({ success: false, error: true, message: "ORDER_NOT_COD" });
    }

    // Dùng hàm đã có trong service để tạo record
    await PaymentService.createPaymentRecordSafe({
      order_id,
      method: "cod",
      status: "unpaid",
      amount_paid: 0,
      currency: "VND",
      transaction_id: null,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("[COD][SUCCESS] error:", err);
    return res.status(500).json({ success: false, error: true, message: err.message });
  }
}

module.exports = {
  createVNPayUrl,
  vnpayReturn,
  codSuccess,
};