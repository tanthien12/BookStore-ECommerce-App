const { pool } = require("../config/db.config");

const TBL_COMMENTS = 'bookstore.post_comments';
const TBL_USERS = 'bookstore."user"';

const PostCommentModel = {
    // Tạo bình luận mới
    async create({ content, post_id, user_id, parent_id }) {
        const sql = `
            INSERT INTO ${TBL_COMMENTS} (content, post_id, user_id, parent_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, content, post_id, user_id, parent_id, created_at
        `;
        const { rows } = await pool.query(sql, [content, post_id, user_id, parent_id]);
        return rows[0];
    },

    // Lấy danh sách comment theo bài viết (Kèm thông tin người dùng)
    async listByPost(postId) {
        const sql = `
            SELECT c.id, c.content, c.created_at, c.user_id, c.parent_id,
                   u.name as user_name, u.avatar_url as user_avatar
            FROM ${TBL_COMMENTS} c
            LEFT JOIN ${TBL_USERS} u ON c.user_id = u.id
            WHERE c.post_id = $1
            ORDER BY c.created_at DESC
        `;
        const { rows } = await pool.query(sql, [postId]);
        return rows;
    },

    // Xóa comment
    async remove(id) {
        const { rowCount } = await pool.query(`DELETE FROM ${TBL_COMMENTS} WHERE id = $1`, [id]);
        return rowCount > 0;
    },

    // Lấy chi tiết để check quyền xóa
    async findById(id) {
        const { rows } = await pool.query(`SELECT * FROM ${TBL_COMMENTS} WHERE id = $1`, [id]);
        return rows[0];
    }
};

module.exports = PostCommentModel;