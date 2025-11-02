// backend/services/payment.service.js
const qs = require("qs");
const crypto = require("crypto");
const moment = require("moment");
const pool = require("../config/db.config");

const VNP_TMN_CODE = process.env.VNP_TMN_CODE;
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET;
const VNP_URL =
  process.env.VNP_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNP_RETURN_URL =
  process.env.VNP_RETURN_URL ||
  "http://localhost:4000/api/vnpay/return"; // bạn đang mount ngay trong index.js

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

const PaymentService = {
  /**
   * Tạo URL thanh toán VNPay
   */
  async createVNPayUrl({ amount, bankCode, orderId, ipAddr }) {
    const now = new Date();
    const createDate = moment(now).format("YYYYMMDDHHmmss");

    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: VNP_TMN_CODE,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId, // dùng chính order_id
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "billpayment",
      vnp_Amount: Number(amount) * 100, // VNPay tính theo đồng *100
      vnp_ReturnUrl: VNP_RETURN_URL,
      vnp_IpAddr: ipAddr || "127.0.0.1",
      vnp_CreateDate: createDate,
    };

    if (bankCode) {
      vnp_Params["vnp_BankCode"] = bankCode;
    }

    const sorted = sortObject(vnp_Params);

    const signData = qs.stringify(sorted, { encode: false });
    const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    sorted["vnp_SecureHash"] = signed;

    const paymentUrl = `${VNP_URL}?${qs.stringify(sorted, { encode: true })}`;
    return paymentUrl;
  },

  /**
   * Xác thực dữ liệu VNPay trả về và lưu vào bảng payment nếu thành công
   */
  async handleVNPayReturn(vnpParams) {
    const secureHash = vnpParams["vnp_SecureHash"];

    delete vnpParams["vnp_SecureHash"];
    delete vnpParams["vnp_SecureHashType"];

    const sorted = sortObject(vnpParams);
    const signData = qs.stringify(sorted, { encode: false });

    const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    const isValid = secureHash === signed;
    const isSuccess = vnpParams["vnp_ResponseCode"] === "00";

    const orderId = vnpParams["vnp_TxnRef"]; // chính là order_id mình gửi sang

    if (!isValid) {
      return { ok: false, reason: "INVALID_SIGNATURE", orderId };
    }

    if (isSuccess) {
      const amount = Number(vnpParams["vnp_Amount"] || 0) / 100;
      const transactionId = vnpParams["vnp_TransactionNo"] || null;

      // LƯU VÀO BẢNG bookstore.payment
      const insertSql = `
        INSERT INTO payment (
          order_id,
          method,
          status,
          amount_paid,
          currency,
          transaction_id,
          paid_at
        )
        VALUES ($1,$2,$3,$4,$5,$6, now())
        RETURNING *;
      `;
      await pool.query(insertSql, [
        orderId,
        "vnpay", // enum payment_method phải có 'vnpay'
        "paid",  // enum payment_status phải có 'paid'
        amount,
        "VND",
        transactionId,
      ]);
    }

    return {
      ok: isSuccess,
      orderId,
    };
  },
};

module.exports = PaymentService;
