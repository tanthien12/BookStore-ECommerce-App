// backend/services/payment.service.js
const moment = require("moment");
const crypto = require("crypto");
const qs = require("qs");
const { env } = require("../config");
const OrderService = require("./order.service");
const { pool } = require("../config/db.config");

// sắp xếp object để ký VNPay
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

const PaymentService = {
  /**
   * Tạo bản ghi payment trong bảng bookstore.payment
   */
  async createPaymentRecord({ order_id, method, amount_paid, currency = "VND" }) {
    const { rows } = await pool.query(
      `
      INSERT INTO bookstore.payment (order_id, method, status, amount_paid, currency)
      VALUES ($1, $2, 'initiated', $3, $4)
      RETURNING *;
      `,
      [order_id, method, amount_paid, currency]
    );
    return rows[0];
  },

  /**
   * Cập nhật trạng thái payment theo order_id
   */
  async updatePaymentStatusByOrder(order_id, status, transaction_id = null) {
    const { rows } = await pool.query(
      `
      UPDATE bookstore.payment
      SET status = $2,
          transaction_id = COALESCE($3, transaction_id),
          paid_at = CASE WHEN $2 = 'success' THEN NOW() ELSE paid_at END
      WHERE order_id = $1
      RETURNING *;
      `,
      [order_id, status, transaction_id]
    );
    return rows[0];
  },

  /**
   * B1: FE gửi yêu cầu thanh toán VNPay
   * -> tạo order
   * -> tạo payment record
   * -> sinh URL
   * -> trả về cho controller
   */
  async createVNPayPayment({ userId, items, amount, shipping_address, shipping_fee = 0, discount_total = 0, shipping_method = "standard" }) {
    if (!userId) {
      throw new Error("UNAUTHORIZED");
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("EMPTY_ITEMS");
    }

    // 1) tạo ORDER (pending)
    const order = await OrderService.create({
      order: {
        user_id: userId,
        status: "pending",
        subtotal: Number(amount) || 0,
        discount_total: Number(discount_total) || 0,
        shipping_fee: Number(shipping_fee) || 0,
        grand_total:
          Number(amount) - Number(discount_total) + Number(shipping_fee) || 0,
        shipping_address: shipping_address || null,
        shipping_method,
      },
      items: items.map((it) => ({
        book_id: it.book_id,
        quantity: it.quantity,
        price_snapshot: it.price_snapshot ?? it.price ?? 0,
      })),
    });

    const needToPay =
      Number(amount) - Number(discount_total) + Number(shipping_fee) || 0;

    // 2) tạo PAYMENT record
    const payment = await PaymentService.createPaymentRecord({
      order_id: order.id,
      method: "vnpay",
      amount_paid: needToPay,
      currency: "VND",
    });

    // 3) sinh URL VNPay
    const vnp_TmnCode = env.VNP_TMN_CODE;
    const vnp_HashSecret = env.VNP_HASH_SECRET;
    const vnp_Url = env.VNP_URL;
    const vnp_ReturnUrl = env.VNP_RETURN_URL;

    const createDate = moment().format("YYYYMMDDHHmmss");
    const orderId = order.id;

    let vnp_Params = {};
    vnp_Params["vnp_Version"] = "2.1.0";
    vnp_Params["vnp_Command"] = "pay";
    vnp_Params["vnp_TmnCode"] = vnp_TmnCode;
    vnp_Params["vnp_Locale"] = "vn";
    vnp_Params["vnp_CurrCode"] = "VND";
    vnp_Params["vnp_TxnRef"] = orderId;
    vnp_Params["vnp_OrderInfo"] = `Thanh toan don hang #${orderId}`;
    vnp_Params["vnp_OrderType"] = "other";
    vnp_Params["vnp_Amount"] = needToPay * 100;
    vnp_Params["vnp_ReturnUrl"] = vnp_ReturnUrl;
    vnp_Params["vnp_IpAddr"] = "127.0.0.1"; // có thể truyền từ controller
    vnp_Params["vnp_CreateDate"] = createDate;

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params["vnp_SecureHash"] = signed;

    const paymentUrl = `${vnp_Url}?${qs.stringify(vnp_Params, {
      encode: false,
    })}`;

    return {
      paymentUrl,
      order,
      payment,
    };
  },

  /**
   * B2: VNPay redirect về -> verify + cập nhật
   * Trả về: { ok, orderId, status }
   */
  async handleVNPayReturn(query) {
    let vnp_Params = { ...query };
    const secureHash = vnp_Params["vnp_SecureHash"];

    // bỏ 2 trường này ra để ký lại
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const signed = crypto
      .createHmac("sha512", env.VNP_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    const orderId = vnp_Params["vnp_TxnRef"];
    const rspCode = vnp_Params["vnp_ResponseCode"];
    const vnp_TransactionNo = vnp_Params["vnp_TransactionNo"];

    if (secureHash === signed && rspCode === "00") {
      // thành công
      await OrderService.updateStatus(orderId, "paid");
      await PaymentService.updatePaymentStatusByOrder(
        orderId,
        "success",
        vnp_TransactionNo
      );
      return { ok: true, orderId, status: "success" };
    } else {
      // thất bại
      await OrderService.updateStatus(orderId, "cancelled");
      await PaymentService.updatePaymentStatusByOrder(orderId, "failed");
      return { ok: false, orderId, status: "failed" };
    }
  },
};

module.exports = PaymentService;
