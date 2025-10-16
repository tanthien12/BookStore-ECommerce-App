// backend/services/wishlist.service.js
const { pool } = require('../config/db.config');

async function list(userId) {
    const sql = `
    SELECT w.book_id, b.title, b.price, b.image_url, b.rating_avg, b.rating_count
    FROM wishlist w
    JOIN book b ON b.id = w.book_id
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC
  `;
    const r = await pool.query(sql, [userId]);
    return r.rows;
}

async function add(userId, bookId) {
    const sql = `INSERT INTO wishlist (user_id, book_id) VALUES ($1,$2) ON CONFLICT (user_id, book_id) DO NOTHING RETURNING *`;
    const r = await pool.query(sql, [userId, bookId]);
    return r.rows[0] || { user_id: userId, book_id: bookId };
}

async function remove(userId, bookId) {
    await pool.query(`DELETE FROM wishlist WHERE user_id = $1 AND book_id = $2`, [userId, bookId]);
    return true;
}

module.exports = { list, add, remove };
