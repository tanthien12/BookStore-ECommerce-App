// backend/services/voucher.service.js
const { pool } = require('../config/db.config');

async function available({ userId, minOrderValue = 0 }) {
    const sql = `
    SELECT c.*
    FROM coupon c
    WHERE c.is_active = TRUE
      AND (c.start_date IS NULL OR c.start_date <= now())
      AND (c.end_date IS NULL OR c.end_date >= now())
      AND (c.usage_limit IS NULL OR c.times_used < c.usage_limit)
      AND (c.min_order_value IS NULL OR c.min_order_value <= $1)
    ORDER BY c.end_date NULLS LAST, c.start_date DESC
  `;
    const r = await pool.query(sql, [minOrderValue || 0]);
    return r.rows;
}

async function used(userId) {
    const sql = `
    SELECT cr.used_at, c.code, c.description, c.type, c.value, cr.order_id
    FROM coupon_redemption cr
    JOIN coupon c ON c.id = cr.coupon_id
    WHERE cr.user_id = $1
    ORDER BY cr.used_at DESC
  `;
    const r = await pool.query(sql, [userId]);
    return r.rows;
}

module.exports = { available, used };
