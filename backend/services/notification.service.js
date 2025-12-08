// backend/services/notification.service.js

const { pool } = require("../config/db.config");

const NotificationService = {
    /**
     * Tạo 1 thông báo mới
     * @param {object} params
     *  - userId: uuid user nhận thông báo
     *  - type: loại thông báo (ORDER_NEW | ORDER_STATUS | ...)
     *  - content: nội dung
     *  - linkUrl: link khi click (VD: /admin/orders/:id)
     */
    async createNotification({ userId, type, content, linkUrl = null }) {
        const query = `
      INSERT INTO bookstore.notification (user_id, type, content, link_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
        const values = [userId, type, content, linkUrl];
        const { rows } = await pool.query(query, values);
        return rows[0];
    },

    /**
     * Lấy danh sách thông báo của user
     */
    async getUserNotifications(
        userId,
        { limit = 10, offset = 0, unreadOnly = false } = {}
    ) {
        const conditions = ["user_id = $1"];
        const params = [userId];

        if (unreadOnly) {
            conditions.push("is_read = false");
        }

        params.push(limit, offset);

        const query = `
      SELECT *
      FROM bookstore.notification
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;

        const { rows } = await pool.query(query, params);
        return rows;
    },

    /**
     * Đếm số thông báo chưa đọc
     */
    async countUnread(userId) {
        const query = `
      SELECT COUNT(*)::int AS count
      FROM bookstore.notification
      WHERE user_id = $1 AND is_read = false;
    `;
        const { rows } = await pool.query(query, [userId]);
        return rows[0].count;
    },

    /**
     * Đánh dấu 1 thông báo đã đọc
     */
    async markAsRead(userId, notificationId) {
        const query = `
      UPDATE bookstore.notification
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
        const { rows } = await pool.query(query, [notificationId, userId]);
        return rows[0];
    },

    /**
     * Đánh dấu tất cả thông báo của user là đã đọc
     */
    async markAllAsRead(userId) {
        const query = `
      UPDATE bookstore.notification
      SET is_read = true
      WHERE user_id = $1 AND is_read = false;
    `;
        await pool.query(query, [userId]);
    },
};

module.exports = NotificationService;
