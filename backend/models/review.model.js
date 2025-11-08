// backend/models/review.model.js
const { pool } = require("../config/db.config"); 

const ReviewModel = {
  async listByBook(bookId) {
    const client = await pool.connect();
    try {
      // Lấy review gốc + user (ẩn email nếu muốn)
      const rootRes = await client.query(
        `
        SELECT r.id, r.book_id, r.user_id, r.rating, r.content,
               r.created_at, r.updated_at,
               u.name AS user_name, u.avatar_url AS user_avatar
        FROM bookstore.review r
        JOIN bookstore."user" u ON u.id = r.user_id
        WHERE r.book_id = $1 AND r.parent_id IS NULL
        ORDER BY r.created_at DESC
        `,
        [bookId]
      );
      const roots = rootRes.rows;

      // Lấy tất cả reply theo root ids
      const rootIds = roots.map(r => r.id);
      let repliesMap = {};
      if (rootIds.length) {
        const repRes = await client.query(
          `
          SELECT r.id, r.parent_id, r.book_id, r.user_id, r.content,
                 r.created_at, r.updated_at,
                 u.name AS user_name, u.avatar_url AS user_avatar
          FROM bookstore.review r
          JOIN bookstore."user" u ON u.id = r.user_id
          WHERE r.parent_id = ANY($1::uuid[])
          ORDER BY r.created_at ASC
          `,
          [rootIds]
        );
        repliesMap = repRes.rows.reduce((acc, it) => {
          (acc[it.parent_id] ||= []).push(it);
          return acc;
        }, {});
      }

      return roots.map(r => ({ ...r, replies: repliesMap[r.id] || [] }));
    } finally {
      client.release();
    }
  },

  async getMyReview(userId, bookId) {
    const { rows } = await pool.query(
      `SELECT id, book_id, user_id, rating, content, created_at, updated_at
       FROM bookstore.review
       WHERE user_id=$1 AND book_id=$2 AND parent_id IS NULL
       LIMIT 1`,
      [userId, bookId]
    );
    return rows[0] || null;
  },

  async upsertRoot({ userId, bookId, rating, content }) {
    // Nếu đã có -> update; nếu chưa -> insert
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const existed = await client.query(
        `SELECT id FROM bookstore.review
         WHERE user_id=$1 AND book_id=$2 AND parent_id IS NULL
         LIMIT 1`,
        [userId, bookId]
      );

      let reviewId;
      if (existed.rowCount) {
        reviewId = existed.rows[0].id;
        await client.query(
          `UPDATE bookstore.review
           SET rating=$1, content=$2, updated_at=now()
           WHERE id=$3`,
          [rating, content, reviewId]
        );
      } else {
        const ins = await client.query(
          `INSERT INTO bookstore.review (book_id, user_id, rating, content)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [bookId, userId, rating, content]
        );
        reviewId = ins.rows[0].id;
      }

      // Recalc rating_avg & rating_count
      const agg = await client.query(
        `SELECT COUNT(*)::int AS c, COALESCE(AVG(rating),0)::float AS avg
         FROM bookstore.review WHERE book_id=$1 AND parent_id IS NULL AND rating IS NOT NULL`,
        [bookId]
      );
      await client.query(
        `UPDATE bookstore.book SET rating_count=$1, rating_avg=$2, updated_at=now() WHERE id=$3`,
        [agg.rows[0].c, agg.rows[0].avg, bookId]
      );

      await client.query("COMMIT");
      const { rows } = await client.query(
        `SELECT id, book_id, user_id, rating, content, created_at, updated_at
         FROM bookstore.review WHERE id=$1`,
        [reviewId]
      );
      return rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },

  async addReply({ userId, rootId, content }) {
    const { rows } = await pool.query(
      `INSERT INTO bookstore.review (book_id, user_id, parent_id, content)
       SELECT book_id, $1, $2, $3
       FROM bookstore.review WHERE id=$2 AND parent_id IS NULL
       RETURNING id, book_id, user_id, parent_id, content, created_at, updated_at`,
      [userId, rootId, content]
    );
    return rows[0];
  },

  async updateReply({ userId, replyId, content, isAdmin = false }) {
    const own = await pool.query(
      `SELECT user_id FROM bookstore.review WHERE id=$1 AND parent_id IS NOT NULL`,
      [replyId]
    );
    if (!own.rowCount) return null;
    if (!isAdmin && own.rows[0].user_id !== userId) return null;

    const { rows } = await pool.query(
      `UPDATE bookstore.review
       SET content=$1, updated_at=now()
       WHERE id=$2
       RETURNING id, book_id, user_id, parent_id, content, created_at, updated_at`,
      [content, replyId]
    );
    return rows[0] || null;
  },

  async deleteAny({ userId, id, isAdmin = false }) {
    // Chỉ cho xóa của mình (hoặc admin). Nếu là review gốc -> xóa luôn replies.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const r = await client.query(
        `SELECT id, user_id, parent_id, book_id FROM bookstore.review WHERE id=$1`,
        [id]
      );
      if (!r.rowCount) {
        await client.query("ROLLBACK");
        return { ok: false };
      }
      const row = r.rows[0];
      if (!isAdmin && row.user_id !== userId) {
        await client.query("ROLLBACK");
        return { ok: false };
      }

      if (row.parent_id === null) {
        await client.query(`DELETE FROM bookstore.review WHERE parent_id=$1`, [row.id]);
      }
      await client.query(`DELETE FROM bookstore.review WHERE id=$1`, [row.id]);

      // Nếu xóa review gốc -> recalc rating
      if (row.parent_id === null) {
        const agg = await client.query(
          `SELECT COUNT(*)::int AS c, COALESCE(AVG(rating),0)::float AS avg
           FROM bookstore.review WHERE book_id=$1 AND parent_id IS NULL AND rating IS NOT NULL`,
          [row.book_id]
        );
        await client.query(
          `UPDATE bookstore.book SET rating_count=$1, rating_avg=$2, updated_at=now() WHERE id=$3`,
          [agg.rows[0].c, agg.rows[0].avg, row.book_id]
        );
      }

      await client.query("COMMIT");
      return { ok: true };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  },
};

module.exports = ReviewModel;
