// backend/models/notification.model.js
const pool = require("../config/db");

const NotificationModel = {
    async create({ userId, type, content, linkUrl = null }) {
        const sql = `
      INSERT INTO bookstore.notification (user_id, type, content, link_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
        const params = [userId, type, content, linkUrl];
        const { rows } = await pool.query(sql, params);
        return rows[0];
    },

    async listByUser(userId, { limit = 20, offset = 0, unreadOnly = false }) {
        const sql = `
      SELECT id, type, content, link_url, is_read, created_at
      FROM bookstore.notification
      WHERE user_id = $1
        ${unreadOnly ? "AND is_read = false" : ""}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
        const { rows } = await pool.query(sql, [userId, limit, offset]);
        return rows;
    },

    async countUnread(userId) {
        const sql = `
      SELECT COUNT(*)::int AS total
      FROM bookstore.notification
      WHERE user_id = $1
        AND is_read = false;
    `;
        const { rows } = await pool.query(sql, [userId]);
        return rows[0]?.total || 0;
    },

    async markRead(id, userId) {
        const sql = `
      UPDATE bookstore.notification
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
        const { rows } = await pool.query(sql, [id, userId]);
        return rows[0];
    },

    async markAllRead(userId) {
        const sql = `
      UPDATE bookstore.notification
      SET is_read = true
      WHERE user_id = $1 AND is_read = false;
    `;
        await pool.query(sql, [userId]);
    },
};

module.exports = NotificationModel;
