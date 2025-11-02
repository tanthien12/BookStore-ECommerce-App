const pool = require("../config/db.config");

const ProductReviewModel = {
  // Tạo hoặc cập nhật review gốc (review chính có rating)
  async upsertRootReview({ book_id, user_id, rating, content }) {
    const query = `
      INSERT INTO product_review (book_id, user_id, parent_id, rating, content)
      VALUES ($1, $2, NULL, $3, $4)
      ON CONFLICT (book_id, user_id)
      WHERE product_review.parent_id IS NULL AND product_review.is_deleted = FALSE
      DO UPDATE SET
        rating = EXCLUDED.rating,
        content = EXCLUDED.content,
        is_deleted = FALSE,
        updated_at = NOW()
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      book_id,
      user_id,
      rating,
      content,
    ]);
    return rows[0];
  },

  // Lấy toàn bộ review gốc cho 1 sách
  async getRootReviewsByBook(book_id) {
    const query = `
      SELECT pr.*,
             u.name AS user_name,
             u.avatar_url,
             u.id   AS owner_id
      FROM product_review pr
      JOIN "user" u ON u.id = pr.user_id
      WHERE pr.book_id = $1
        AND pr.parent_id IS NULL
        AND pr.is_deleted = FALSE
      ORDER BY pr.created_at DESC;
    `;
    const { rows } = await pool.query(query, [book_id]);
    return rows;
  },

  // Lấy reply theo review cha
  async getRepliesByParent(parent_id) {
    const query = `
      SELECT pr.*,
             u.name AS user_name,
             u.avatar_url,
             u.id   AS owner_id
      FROM product_review pr
      JOIN "user" u ON u.id = pr.user_id
      WHERE pr.parent_id = $1
        AND pr.is_deleted = FALSE
      ORDER BY pr.created_at ASC;
    `;
    const { rows } = await pool.query(query, [parent_id]);
    return rows;
  },

  // Lấy review gốc của user cho 1 sách
  async getMyRootReview(book_id, user_id) {
    const query = `
      SELECT pr.*,
             u.name AS user_name,
             u.avatar_url,
             u.id   AS owner_id
      FROM product_review pr
      JOIN "user" u ON u.id = pr.user_id
      WHERE pr.book_id = $1
        AND pr.user_id = $2
        AND pr.parent_id IS NULL
        AND pr.is_deleted = FALSE
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [book_id, user_id]);
    return rows[0] || null;
  },

  // Xóa mềm review gốc hoặc reply
  async softDelete(id, user_id, isAdmin = false) {
    const query = `
      UPDATE product_review
      SET is_deleted = TRUE,
          updated_at = NOW()
      WHERE id = $1
      ${isAdmin ? "" : "AND user_id = $2"}
      RETURNING *;
    `;
    const params = isAdmin ? [id] : [id, user_id];
    const { rows } = await pool.query(query, params);
    return rows[0] || null;
  },

  // Tạo reply
  async createReply({ parent_id, user_id, content }) {
    const query = `
      INSERT INTO product_review (book_id, user_id, parent_id, rating, content)
      SELECT book_id, $2, $1, NULL, $3
      FROM product_review
      WHERE id = $1
        AND parent_id IS NULL
        AND is_deleted = FALSE
      RETURNING *;
    `;
    // Lưu ý: để tránh giả mạo book_id, mình lấy book_id từ review cha
    const { rows } = await pool.query(query, [
      parent_id,
      user_id,
      content,
    ]);
    return rows[0] || null;
  },

  // Update reply content (chỉ chính chủ reply)
  async updateReply({ reply_id, user_id, content }) {
    const query = `
      UPDATE product_review
      SET content = $1,
          updated_at = NOW()
      WHERE id = $2
        AND user_id = $3
        AND parent_id IS NOT NULL
        AND is_deleted = FALSE
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [
      content,
      reply_id,
      user_id,
    ]);
    return rows[0] || null;
  },

  // Lấy owner của review gốc (dùng để check quyền reply)
  async getRootOwner(root_id) {
    const query = `
      SELECT user_id
      FROM product_review
      WHERE id = $1
        AND parent_id IS NULL
        AND is_deleted = FALSE
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [root_id]);
    return rows[0]?.user_id || null;
  },

  // Sau khi thay đổi review, cập nhật rating_avg / rating_count cho book
  async recomputeBookRating(book_id) {
    const aggQuery = `
      SELECT
        COALESCE(AVG(rating),0)::numeric(3,2) AS avg,
        COUNT(*)::int AS count
      FROM product_review
      WHERE book_id = $1
        AND parent_id IS NULL
        AND is_deleted = FALSE
        AND rating IS NOT NULL;
    `;
    const { rows } = await pool.query(aggQuery, [book_id]);
    const avg = rows[0].avg || 0;
    const count = rows[0].count || 0;

    await pool.query(
      `
      UPDATE book
      SET rating_avg = $2,
          rating_count = $3,
          updated_at = NOW()
      WHERE id = $1;
    `,
      [book_id, avg, count]
    );

    return { avg, count };
  },

  // Lấy 1 record bất kỳ theo id (để biết nó là root hay reply)
  async getById(id) {
    const query = `
      SELECT *
      FROM product_review
      WHERE id = $1
        AND is_deleted = FALSE
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },
};

module.exports = ProductReviewModel;
