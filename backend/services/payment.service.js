// backend/services/payment.service.js
const moment = require("moment");
const crypto = require("crypto");
const { env } = require("../config");
const { pool } = require("../config/db.config");
const OrderService = require("./order.service");
// ⬇️ THÊM MỚI 1: IMPORT OrderModel ⬇️
const OrderModel = require("../models/order.model");

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

/* Chuẩn hoá IP */
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

  /* ===================== CREATE URL ===================== */
  async createVNPayUrlFromExistingOrder({ orderId, amount, bankCode = "", ipAddr = "127.0.0.1" }) {
    if (!env.VNP_TMN_CODE || !env.VNP_HASH_SECRET || !env.VNP_URL || !env.VNP_RETURN_URL) {
      throw new Error("VNPay env chưa cấu hình đủ");
    }

    const order = await OrderService.detail(orderId);
    if (!order) throw new Error("ORDER_NOT_FOUND");
    // (Quan trọng) Chỉ cho phép thanh toán đơn 'pending'
    if (order.status !== 'pending') throw new Error("ORDER_NOT_PENDING");

    const needToPay = Number(amount || order.grand_total || 0);
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
      transaction_id: vnpTxnRef, // Lưu TxnRef để tìm lại
    });

    const createDate = moment().format("YYYYMMDDHHmmss");

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

    const redirectUrl = new URL(env.VNP_URL);
    Object.entries(vnpParams).forEach(([key, value]) => {
      redirectUrl.searchParams.append(key, String(value));
    });

    const hmac = crypto.createHmac("sha512", env.VNP_HASH_SECRET);
    const signData = redirectUrl.search.slice(1); // bỏ dấu ?
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex").toUpperCase();

    redirectUrl.searchParams.append("vnp_SecureHash", signed);
    redirectUrl.searchParams.append("vnp_SecureHashType", "SHA512");

    return redirectUrl.toString();
  },

  /* ===================== RETURN (SỬA LỖI LOGIC) ===================== */
  async handleVNPayReturn(query) {
    const vnpParams = { ...query };
    const secureHashFromVNPay = String(vnpParams["vnp_SecureHash"] || "").toUpperCase();
    delete vnpParams["vnp_SecureHash"];
    delete vnpParams["vnp_SecureHashType"];

    const sorted = sortObject(vnpParams);
    const tempUrl = new URL("http://dummy.local/");
    Object.entries(sorted).forEach(([k, v]) => tempUrl.searchParams.append(k, String(v)));
    const signData = tempUrl.search.slice(1);

    const calculatedHash = crypto
      .createHmac("sha512", env.VNP_HASH_SECRET)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex")
      .toUpperCase();

    const vnpTxnRef = sorted["vnp_TxnRef"];
    const responseCode = sorted["vnp_ResponseCode"];
    const transactionNo = sorted["vnp_TransactionNo"] || null;

    // Tìm lại order_id từ bảng payment bằng vnp_TxnRef
    const { rows } = await pool.query(
      `SELECT order_id FROM bookstore.payment WHERE transaction_id = $1 AND status = 'pending' LIMIT 1;`,
      [vnpTxnRef]
    );
    const orderId = rows[0]?.order_id || null;

    // (Check 1) Chữ ký không hợp lệ HOẶC không tìm thấy giao dịch 'pending'
    if (secureHashFromVNPay !== calculatedHash || !orderId) {
        if (orderId) {
            await PaymentService.updatePaymentStatusByOrder(orderId, "failed");
        }
        return { ok: false, orderId, status: "failed", reason: "INVALID_SIGNATURE_OR_TX" };
    }
    
    // (Check 2) Chữ ký hợp lệ, nhưng giao dịch VNPay thất bại
    if (responseCode !== "00") {
        await PaymentService.updatePaymentStatusByOrder(orderId, "failed");
        return { ok: false, orderId, status: "failed", reason: responseCode };
    }

    // (Check 3) Thành công (responseCode === "00" VÀ Chữ ký hợp lệ)
    // ⬇️ BẮT ĐẦU THÊM MỚI 2: LOGIC TRỪ KHO TRONG TRANSACTION ⬇️
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Lấy chi tiết đơn hàng (items)
        const itemsRes = await client.query(
            `SELECT book_id, quantity FROM bookstore.order_details WHERE order_id = $1`,
            [orderId]
        );
        const items = itemsRes.rows;

        if (!items || items.length === 0) {
            throw new Error(`Không tìm thấy (items) cho đơn hàng ID: ${orderId}`);
        }

        // 2. Gọi logic trừ kho (từ OrderModel)
        // (Nếu hàm này ném lỗi (vd: hết hàng), transaction sẽ ROLLBACK)
        await OrderModel.updateStockAndSoldCounters(client, items);

        // 3. Cập nhật trạng thái payment
        await client.query(
           `UPDATE bookstore.payment SET status = 'paid', transaction_id = $2, paid_at = NOW()
            WHERE order_id = $1 AND status = 'pending'`,
            [orderId, transactionNo]
        );
        
        // 4. Cập nhật trạng thái order
        await client.query(
           `UPDATE "order" SET status = 'paid', updated_at = now() 
            WHERE id = $1 AND status = 'pending'`,
            [orderId]
        );
        
        await client.query('COMMIT');
        
        return { ok: true, orderId, status: "paid" };

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[StockDeduction] Lỗi khi trừ kho/cập nhật đơn hàng ${orderId}:`, err);
        
        // (Ghi nhận lỗi nhưng vẫn báo VNPay thất bại)
        await PaymentService.updatePaymentStatusByOrder(orderId, "failed");
        return { ok: false, orderId, status: "failed", reason: "STOCK_UPDATE_ERROR" };
    } finally {
        client.release();
    }
  },
};

module.exports = PaymentService;