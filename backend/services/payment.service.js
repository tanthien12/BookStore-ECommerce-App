const moment = require("moment");
const crypto = require("crypto");
const { env } = require("../config");
const { pool } = require("../config/db.config");
const OrderService = require("./order.service");

/* Bỏ rỗng + sort A→Z */
function sortObject(obj) {
  const ordered = {};
  Object.keys(obj)
    .sort((a, b) => a.toString().localeCompare(b.toString()))
    .forEach((k) => {
      const v = obj[k];
      if (v !== null && v !== undefined && v !== "") ordered[k] = v;
    });
  return ordered;
}

/* Chuẩn hoá IP cho dễ đọc log (không bắt buộc) */
function normalizeIp(ip) {
  if (!ip) return "127.0.0.1";
  if (ip === "::1") return "127.0.0.1";
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

const PaymentService = {
  async createPaymentRecordSafe({
    order_id,
    method = "vnpay",
    status = "pending",
    amount_paid = 0,
    currency = "VND",
    transaction_id = null,
  }) {
    const { rows } = await pool.query(
      `
      INSERT INTO bookstore.payment (order_id, method, status, amount_paid, currency, transaction_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [order_id, method, status, Number(amount_paid) || 0, currency, transaction_id]
    );
    return rows[0];
  },

  async updatePaymentStatusByOrder(order_id, status, transaction_id = null) {
    const { rows } = await pool.query(
       `
      UPDATE bookstore.payment
      SET status = $2::bookstore.payment_status,
          transaction_id = COALESCE($3, transaction_id),
          paid_at = CASE
                      WHEN $2::bookstore.payment_status = 'paid'::bookstore.payment_status
                      THEN NOW()
                      ELSE paid_at
                    END
      WHERE order_id = $1
      RETURNING *;
      `,
      [order_id, status, transaction_id]
    );
    return rows[0];
  },

  /* ===================== CREATE URL (theo ảnh) ===================== */
  async createVNPayUrlFromExistingOrder({ orderId, amount, bankCode = "", ipAddr = "127.0.0.1" }) {
    if (!env.VNP_TMN_CODE || !env.VNP_HASH_SECRET || !env.VNP_URL || !env.VNP_RETURN_URL) {
      throw new Error("VNPay env chưa cấu hình đủ");
    }

    const order = await OrderService.detail(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const needToPay = Number(amount || order.grand_total || order.total_price || 0);
    if (!needToPay || needToPay <= 0) throw new Error("INVALID_AMOUNT");

    const vnpTxnRef =
      moment().format("YYYYMMDDHHmmss") +
      Math.floor(Math.random() * 10000).toString().padStart(4, "0");

    // Lưu payment pending trước để bám giao dịch
    await PaymentService.createPaymentRecordSafe({
      order_id: orderId,
      method: "vnpay",
      status: "pending",
      amount_paid: needToPay,
      currency: "VND",
      transaction_id: vnpTxnRef,
    });

    const createDate = moment().format("YYYYMMDDHHmmss");

    // 1) Build params (raw), sort key
    let vnpParams = sortObject({
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: env.VNP_TMN_CODE,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: vnpTxnRef,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: Math.round(needToPay * 100),
      vnp_ReturnUrl: env.VNP_RETURN_URL,
      vnp_IpAddr: normalizeIp(ipAddr),
      vnp_CreateDate: createDate,
      ...(bankCode ? { vnp_BankCode: bankCode } : {}),
    });

    // 2) Dùng URLSearchParams để encode, rồi ký trên phần query đã encode
    const redirectUrl = new URL(env.VNP_URL);
    Object.entries(vnpParams).forEach(([key, value]) => {
      redirectUrl.searchParams.append(key, String(value));
    });

    // CHÚ Ý: không có vnp_SecureHash, vnp_SecureHashType trong query trước khi ký
    const hmac = crypto.createHmac("sha512", env.VNP_HASH_SECRET);
    const signData = redirectUrl.search.slice(1); // bỏ dấu ? đầu
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex").toUpperCase();

    redirectUrl.searchParams.append("vnp_SecureHash", signed);
    redirectUrl.searchParams.append("vnp_SecureHashType", "SHA512");

    console.log("[VNPay][CREATE] QueryForSign:", signData);
    console.log("[VNPay][CREATE] HashLocal:", signed);
    console.log("[VNPay][CREATE] URL:", redirectUrl.toString());

    return redirectUrl.toString();
  },

  /* ===================== RETURN (theo ảnh) ===================== */
  async handleVNPayReturn(query) {
    const vnpParams = { ...query };
    const secureHashFromVNPay = String(vnpParams["vnp_SecureHash"] || "").toUpperCase();
    delete vnpParams["vnp_SecureHash"];
    delete vnpParams["vnp_SecureHashType"];

    // sort + build lại query encode bằng URLSearchParams rồi ký y hệt cách create
    const sorted = sortObject(vnpParams);
    const tempUrl = new URL("http://dummy.local/");
    Object.entries(sorted).forEach(([k, v]) => tempUrl.searchParams.append(k, String(v)));
    const signData = tempUrl.search.slice(1);

    const calculatedHash = crypto
      .createHmac("sha512", env.VNP_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex")
      .toUpperCase();

    console.log("[VNPay][RETURN] QueryForSign:", signData);
    console.log("[VNPay][RETURN] FromVNPay:", secureHashFromVNPay);
    console.log("[VNPay][RETURN] Calculated:", calculatedHash);

    const vnpTxnRef = sorted["vnp_TxnRef"];
    const responseCode = sorted["vnp_ResponseCode"];
    const transactionNo = sorted["vnp_TransactionNo"] || null;

    // Tìm lại order_id từ bảng payment bằng vnp_TxnRef
    const { rows } = await pool.query(
      `SELECT order_id FROM bookstore.payment WHERE transaction_id = $1 LIMIT 1;`,
      [vnpTxnRef]
    );
    const orderId = rows[0]?.order_id || null;

    if (secureHashFromVNPay === calculatedHash && responseCode === "00" && orderId) {
      await PaymentService.updatePaymentStatusByOrder(orderId, "paid", transactionNo);
      await OrderService.updateStatus(orderId, "paid");
      return { ok: true, orderId, status: "paid" };
    } else {
      if (orderId) {
        await PaymentService.updatePaymentStatusByOrder(orderId, "failed");
      }
      return { ok: false, orderId, status: "failed", reason: responseCode || "INVALID_SIGNATURE" };
    }
  },
};

module.exports = PaymentService;
