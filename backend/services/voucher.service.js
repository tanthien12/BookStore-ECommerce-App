// backend/services/voucher.service.js
const pool = require('../config/db.config'); // chỉnh path nếu khác

// Chuẩn hoá code (trim + upper)
function normalizeCode(code) {
  return (code || '').trim().toUpperCase();
}

/**
 * Lấy coupon theo code
 */
async function getCouponByCode(code, client = pool) {
  const normCode = normalizeCode(code);

  const { rows } = await client.query(
    `SELECT *
     FROM bookstore.coupon
     WHERE UPPER(code) = $1`,
    [normCode]
  );

  return rows[0] || null;
}

/**
 * Validate coupon cho 1 đơn hàng (subtotal = tổng tiền hàng, chưa ship)
 * Trả về: { isValid, coupon, discountAmount, reason }
 */
async function validateCouponForOrder({
  code,
  userId,
  subtotal,
  now = new Date(),
  client = pool,
}) {
  const coupon = await getCouponByCode(code, client);

  if (!coupon) {
    return { isValid: false, reason: 'NOT_FOUND' };
  }

  if (!coupon.is_active) {
    return { isValid: false, coupon, reason: 'INACTIVE' };
  }

  // Thời gian hiệu lực
  if (coupon.start_date && now < coupon.start_date) {
    return { isValid: false, coupon, reason: 'NOT_STARTED' };
  }

  if (coupon.end_date && now > coupon.end_date) {
    return { isValid: false, coupon, reason: 'EXPIRED' };
  }

  // Đơn tối thiểu
  if (coupon.min_order_value && Number(subtotal) < Number(coupon.min_order_value)) {
    return { isValid: false, coupon, reason: 'MIN_ORDER_NOT_REACHED' };
  }

  // Giới hạn tổng lượt sử dụng toàn hệ thống
  if (
    coupon.usage_limit !== null &&
    coupon.usage_limit !== undefined &&
    coupon.times_used >= coupon.usage_limit
  ) {
    return { isValid: false, coupon, reason: 'USAGE_LIMIT_REACHED' };
  }

  // Tính tiền giảm
  let discountAmount = 0;
  const value = Number(coupon.value || 0);
  const subtotalNum = Number(subtotal || 0);

  if (coupon.type === 'percent') {
    discountAmount = (subtotalNum * value) / 100;
    if (coupon.max_discount && coupon.max_discount > 0) {
      discountAmount = Math.min(discountAmount, Number(coupon.max_discount));
    }
  } else if (coupon.type === 'fixed') {
    discountAmount = value;
  }

  // Không cho giảm quá subtotal
  discountAmount = Math.max(0, Math.min(discountAmount, subtotalNum));

  if (discountAmount <= 0) {
    return { isValid: false, coupon, reason: 'NO_DISCOUNT' };
  }

  return {
    isValid: true,
    coupon,
    discountAmount,
  };
}

/**
 * Tăng times_used + ghi coupon_redemption trong cùng transaction
 */
async function consumeCoupon({
  couponId,
  userId,
  orderId,
  client = pool,
}) {
  // Tăng times_used nhưng vẫn tôn trọng usage_limit
  const updated = await client.query(
    `UPDATE bookstore.coupon
     SET times_used = times_used + 1
     WHERE id = $1
       AND is_active = TRUE
       AND (usage_limit IS NULL OR times_used < usage_limit)
     RETURNING id`,
    [couponId]
  );

  if (updated.rowCount === 0) {
    const err = new Error('COUPON_USAGE_LIMIT_REACHED');
    err.code = 'COUPON_USAGE_LIMIT_REACHED';
    throw err;
  }

  // Ghi log sử dụng
  await client.query(
    `INSERT INTO bookstore.coupon_redemption (coupon_id, user_id, order_id, used_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT DO NOTHING`,
    [couponId, userId, orderId]
  );
}

/**
 * CRUD cơ bản cho admin
 */
async function createCoupon(data, client = pool) {
  const {
    code,
    description,
    type,
    value,
    start_date,
    end_date,
    min_order_value,
    max_discount,
    usage_limit,
    is_active = true,
  } = data;

  const normCode = normalizeCode(code);

  const { rows } = await client.query(
    `INSERT INTO bookstore.coupon
      (code, description, type, value, start_date, end_date,
       min_order_value, max_discount, usage_limit, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      normCode,
      description || null,
      type,
      value,
      start_date || null,
      end_date || null,
      min_order_value || 0,
      max_discount || 0,
      usage_limit || null,
      is_active,
    ]
  );

  return rows[0];
}

async function listCoupons({ search, status } = {}, client = pool) {
  const params = [];
  const where = [];

  if (search) {
    params.push(`%${search}%`);
    where.push(`(code ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  if (status === 'active') {
    where.push(`is_active = TRUE`);
  } else if (status === 'inactive') {
    where.push(`is_active = FALSE`);
  }

  const sql = `
    SELECT *
    FROM bookstore.coupon
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY created_at DESC
  `;

  const { rows } = await client.query(sql, params);
  return rows;
}

async function getCouponById(id, client = pool) {
  const { rows } = await client.query(
    `SELECT * FROM bookstore.coupon WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function updateCoupon(id, data, client = pool) {
  const fields = [];
  const params = [];
  let idx = 1;

  const pushField = (name, value, transform = (v) => v) => {
    if (value !== undefined) {
      fields.push(`${name} = $${idx}`);
      params.push(transform(value));
      idx += 1;
    }
  };

  pushField('code', data.code, normalizeCode);
  pushField('description', data.description || null);
  pushField('type', data.type);
  pushField('value', data.value);
  pushField('start_date', data.start_date || null);
  pushField('end_date', data.end_date || null);
  pushField('min_order_value', data.min_order_value ?? 0);
  pushField('max_discount', data.max_discount ?? 0);
  pushField('usage_limit', data.usage_limit ?? null);
  pushField('is_active', data.is_active);

  if (!fields.length) return getCouponById(id, client);

  params.push(id);

  const { rows } = await client.query(
    `
    UPDATE bookstore.coupon
    SET ${fields.join(', ')}, updated_at = now()
    WHERE id = $${params.length}
    RETURNING *
  `,
    params
  );

  return rows[0] || null;
}

async function deleteCoupon(id, client = pool) {
  await client.query(
    `DELETE FROM bookstore.coupon WHERE id = $1`,
    [id]
  );
}

async function listAvailableCouponsForUser(userId, client = pool) {
  const now = new Date();

  const { rows } = await client.query(
    `
    SELECT *
    FROM bookstore.coupon
    WHERE is_active = TRUE
      AND (start_date IS NULL OR start_date <= $1)
      AND (end_date IS NULL OR end_date >= $1)
      AND (usage_limit IS NULL OR times_used < usage_limit)
    ORDER BY
      end_date IS NULL ASC,  -- voucher có end_date hiển thị trước
      end_date ASC,
      created_at DESC
    `,
    [now]
  );

  return rows;
}

module.exports = {
  getCouponByCode,
  validateCouponForOrder,
  consumeCoupon,
  createCoupon,
  listCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  listAvailableCouponsForUser,
};


// // backend/services/voucher.service.js
// const { pool } = require('../config/db.config');

// async function available({ userId, minOrderValue = 0 }) {
//     const sql = `
//     SELECT c.*
//     FROM coupon c
//     WHERE c.is_active = TRUE
//       AND (c.start_date IS NULL OR c.start_date <= now())
//       AND (c.end_date IS NULL OR c.end_date >= now())
//       AND (c.usage_limit IS NULL OR c.times_used < c.usage_limit)
//       AND (c.min_order_value IS NULL OR c.min_order_value <= $1)
//     ORDER BY c.end_date NULLS LAST, c.start_date DESC
//   `;
//     const r = await pool.query(sql, [minOrderValue || 0]);
//     return r.rows;
// }

// async function used(userId) {
//     const sql = `
//     SELECT cr.used_at, c.code, c.description, c.type, c.value, cr.order_id
//     FROM coupon_redemption cr
//     JOIN coupon c ON c.id = cr.coupon_id
//     WHERE cr.user_id = $1
//     ORDER BY cr.used_at DESC
//   `;
//     const r = await pool.query(sql, [userId]);
//     return r.rows;
// }

// module.exports = { available, used };
