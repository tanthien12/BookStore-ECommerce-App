// src/models/book.model.js
const { pool } = require("../config/db.config");

/**
 * Book table (UUID):
 *  id UUID PK DEFAULT gen_random_uuid(),
 *  title TEXT NOT NULL,
 *  author TEXT,
 *  isbn TEXT,
 *  publisher TEXT,
 *  published_year INT,
 *  language TEXT,
 *  format TEXT,       // paperback|hardcover|ebook
 *  price NUMERIC(12,2) NOT NULL,
 *  stock INT NOT NULL DEFAULT 0,
 *  description TEXT,
 *  image_url TEXT,
 *  rating_avg NUMERIC(3,2) DEFAULT 0,
 *  rating_count INT DEFAULT 0,
 *  created_at, updated_at TIMESTAMPTZ
 */
const BookModel = {
    /**
     * Tạo mới Book từ payload form
     * payload: {
     *   title, author, isbn, publisher, published_year, language, format,
     *   price, stock, description, image_url
     * }
     * return: row (với id UUID) 
     */
    async create(payload) {
        const text = `
      INSERT INTO book (
        title, author, isbn, publisher, published_year, language, format,
        price, stock, description, image_url, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, NOW(), NOW()
      )
      RETURNING id, title, author, isbn, publisher, published_year, language, format,
                price, stock, description, image_url, rating_avg, rating_count,
                created_at, updated_at
    `;
        const values = [
            payload.title,
            payload.author ?? null,
            payload.isbn ?? null,
            payload.publisher ?? null,
            payload.published_year ?? null,
            payload.language ?? null,
            payload.format ?? null,
            payload.price ?? 0,
            payload.stock ?? 0,
            payload.description ?? null,
            payload.image_url ?? null,
        ];
        const { rows } = await pool.query(text, values);
        return rows[0];
    },

    /**
     * Cập nhật Book theo id (UUID)
     * payload giống create()
     */
    async update(id, payload) {
        const text = `
      UPDATE book
      SET
        title = $2,
        author = $3,
        isbn = $4,
        publisher = $5,
        published_year = $6,
        language = $7,
        format = $8,
        price = $9,
        stock = $10,
        description = $11,
        image_url = $12,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, author, isbn, publisher, published_year, language, format,
                price, stock, description, image_url, rating_avg, rating_count,
                created_at, updated_at
    `;
        const values = [
            id,
            payload.title,
            payload.author ?? null,
            payload.isbn ?? null,
            payload.publisher ?? null,
            payload.published_year ?? null,
            payload.language ?? null,
            payload.format ?? null,
            payload.price ?? 0,
            payload.stock ?? 0,
            payload.description ?? null,
            payload.image_url ?? null,
        ];
        const { rows } = await pool.query(text, values);
        return rows[0] || null;
    },

    async remove(id) {
        // Xóa liên kết trước để tránh FK error
        await pool.query("DELETE FROM books_categories WHERE book_id = $1", [id]);
        const { rowCount } = await pool.query("DELETE FROM book WHERE id = $1", [id]);
        return rowCount > 0;
    },

    async findById(id) {
        const bookSql = `
      SELECT id, title, author, isbn, publisher, published_year, language, format,
             price, stock, description, image_url, rating_avg, rating_count,
             created_at, updated_at
      FROM book
      WHERE id = $1
    `;
        const catSql = `
      SELECT c.id, c.name, c.slug
      FROM books_categories bc
      JOIN category c ON c.id = bc.category_id
      WHERE bc.book_id = $1
    `;
        const [b, cats] = await Promise.all([
            pool.query(bookSql, [id]),
            pool.query(catSql, [id]),
        ]);
        const book = b.rows[0];
        if (!book) return null;
        return { ...book, categories: cats.rows };
    },

    /**
     * List + filter (tùy chọn): q, category_id (UUID), language, format, page, limit, sort
     * sort: id_desc | price_asc | price_desc | title_asc | newest
     */
    async list({ q, category_id, language, format, page = 1, limit = 12, sort = "id_desc" }) {
        const offset = (page - 1) * limit;
        const values = [];
        let where = [];
        let joins = "";

        if (q) {
            values.push(`%${q}%`);
            where.push(`(b.title ILIKE $${values.length} OR b.author ILIKE $${values.length} OR b.isbn ILIKE $${values.length} OR b.publisher ILIKE $${values.length})`);
        }
        if (category_id) {
            joins += " JOIN books_categories bc ON bc.book_id = b.id ";
            values.push(category_id);
            where.push(`bc.category_id = $${values.length}`);
        }
        if (language) {
            values.push(language);
            where.push(`b.language = $${values.length}`);
        }
        if (format) {
            values.push(format);
            where.push(`b.format = $${values.length}`);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        let orderBy = "b.id DESC";
        if (sort === "price_asc") orderBy = "b.price ASC";
        if (sort === "price_desc") orderBy = "b.price DESC";
        if (sort === "title_asc") orderBy = "b.title ASC";
        if (sort === "newest") orderBy = "b.created_at DESC";

        const listSql = `
      SELECT b.id, b.title, b.author, b.isbn, b.publisher, b.published_year,
             b.language, b.format, b.price, b.stock, b.image_url, b.rating_avg, b.rating_count,
             b.created_at, b.updated_at
      FROM book b
      ${joins}
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;
        const countSql = `
      SELECT COUNT(DISTINCT b.id) AS count
      FROM book b
      ${joins}
      ${whereSql}
    `;

        const [list, count] = await Promise.all([
            pool.query(listSql, values),
            pool.query(countSql, values),
        ]);
        return { items: list.rows, total: +count.rows[0].count };
    },

    /**
     * Gắn danh mục cho sách
     * category_ids: UUID[]
     */
    async setCategories(book_id, category_ids = []) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query("DELETE FROM books_categories WHERE book_id = $1", [book_id]);
            for (const cid of category_ids) {
                await client.query(
                    `INSERT INTO books_categories (book_id, category_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
                    [book_id, cid]
                );
            }
            await client.query("COMMIT");
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    },
};

module.exports = BookModel;
