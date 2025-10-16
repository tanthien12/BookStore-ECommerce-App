// backend/services/account.service.js
const bcrypt = require('bcrypt');
const { pool } = require('../config/db.config');

// them
// Đồng bộ với enum DB: 'male','female','other','unspecified'
const ALLOWED_GENDERS = new Set(['male', 'female', 'other', 'unspecified']);

function normalizeGender(g) {
    const v = String(g || '').toLowerCase();
    return ALLOWED_GENDERS.has(v) ? v : 'unspecified';
}

function normalizeDate(d) {
    if (d == null || d === '') return null;
    // Nhận 'YYYY-MM-DD' hoặc ISO string → trả Date để node-pg map sang DATE
    const date = new Date(d);
    return isNaN(date.getTime()) ? null : date;
}
//
async function getMe(userId) {
    const sql = `
    SELECT 
      u.id, u.name, u.email, u.avatar_url, u.role_id, r.role_name, 
      u.is_active, u.last_login_at, u.created_at, u.updated_at,
      u.phone, u.gender, u.date_of_birth
    FROM "user" u
    LEFT JOIN role r ON r.id = u.role_id
    WHERE u.id = $1
    LIMIT 1;
  `;
    const r = await pool.query(sql, [userId]);
    return r.rows[0] || null;
}

async function updateMe(userId, { name, phone, gender, date_of_birth, avatar_url }) {
    const fields = [];
    const params = [];
    let i = 1;

    if (name !== undefined) {
        fields.push(`name = $${i++}`);
        params.push(String(name).trim());
    }
    if (phone !== undefined) {
        // có thể thêm kiểm tra pattern phone basic tại đây nếu muốn
        fields.push(`phone = $${i++}`);
        params.push(phone ? String(phone).trim() : null);
    }
    if (gender !== undefined) {
        fields.push(`gender = $${i++}`);
        params.push(normalizeGender(gender));
    }
    if (date_of_birth !== undefined) {
        fields.push(`date_of_birth = $${i++}`);
        params.push(normalizeDate(date_of_birth)); // null hoặc Date
    }
    if (avatar_url !== undefined) {
        fields.push(`avatar_url = $${i++}`);
        params.push(avatar_url ? String(avatar_url).trim() : null);
    }

    if (!fields.length) return getMe(userId);

    const sql = `
    UPDATE "user" 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${i} 
    RETURNING id;
  `;
    params.push(userId);

    await pool.query(sql, params);
    return getMe(userId);
}

async function changePassword(userId, currentPassword, newPassword) {
    const r = await pool.query(`SELECT password_hash FROM "user" WHERE id = $1`, [userId]);
    const row = r.rows[0];
    if (!row) { const err = new Error('User not found'); err.status = 404; throw err; }

    const ok = await bcrypt.compare(String(currentPassword), row.password_hash);
    if (!ok) { const err = new Error('Mật khẩu hiện tại không đúng'); err.status = 400; throw err; }

    const newHash = await bcrypt.hash(String(newPassword), 10);
    await pool.query(`UPDATE "user" SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, userId]);
    return true;
}

async function getQuickStats(userId) {
    const r1 = await pool.query(
        `SELECT COUNT(*)::int AS total_orders, MAX(placed_at) AS last_order_at FROM "order" WHERE user_id = $1`,
        [userId]
    );
    const r2 = await pool.query(
        `SELECT COALESCE(SUM(grand_total),0)::numeric AS total_spent FROM "order" WHERE user_id = $1 AND status IN ('paid','processing','shipped','delivered','refunded')`,
        [userId]
    );
    return {
        total_orders: r1.rows[0]?.total_orders || 0,
        last_order_at: r1.rows[0]?.last_order_at || null,
        total_spent: r2.rows[0]?.total_spent || 0
    };
}

module.exports = { getMe, updateMe, changePassword, getQuickStats };
