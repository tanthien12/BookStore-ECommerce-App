// backend/models/book.model.js
const { pool } = require("../config/db.config");

function mapRow(row) {
    if (!row) return null;
    // Không cần alias nữa, DB đã có cột gallery_urls
    return { ...row, gallery_urls: row.gallery_urls || [] };
}

const BookModel = {
    async create(payload) {
        const text = `
      INSERT INTO bookstore.book (
        title, author, isbn, publisher, published_year, language, format,
        price, stock, description, image_url, gallery_urls, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,NOW(),NOW()
      )
      RETURNING id, title, author, isbn, publisher, published_year, language, format,
                price, stock, description, image_url, gallery_urls, rating_avg, rating_count,
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
            Array.isArray(payload.gallery_urls) ? payload.gallery_urls : null,
        ];
        const { rows } = await pool.query(text, values);
        return mapRow(rows[0]);
    },

    async update(id, payload) {
        const text = `
      UPDATE bookstore.book
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
        gallery_urls = $13,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, author, isbn, publisher, published_year, language, format,
                price, stock, description, image_url, gallery_urls, rating_avg, rating_count,
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
            Array.isArray(payload.gallery_urls) ? payload.gallery_urls : null,
        ];
        const { rows } = await pool.query(text, values);
        return mapRow(rows[0]) || null;
    },

    async remove(id) {
        await pool.query("DELETE FROM bookstore.books_categories WHERE book_id = $1", [id]);
        const { rowCount } = await pool.query("DELETE FROM bookstore.book WHERE id = $1", [id]);
        return rowCount > 0;
    },

    async findById(id) {
        const bookSql = `
      SELECT id, title, author, isbn, publisher, published_year, language, format,
             price, sale_price, sale_start, sale_end, is_flash_sale, stock, sold_count, description, image_url, gallery_urls, rating_avg, rating_count,
             created_at, updated_at
      FROM bookstore.book
      WHERE id = $1
    `;
        const catSql = `
      SELECT c.id, c.name, c.slug
      FROM bookstore.books_categories bc
      JOIN bookstore.category c ON c.id = bc.category_id
      WHERE bc.book_id = $1
    `;
        const [b, cats] = await Promise.all([
            pool.query(bookSql, [id]),
            pool.query(catSql, [id]),
        ]);
        const book = mapRow(b.rows[0]);
        if (!book) return null;
        return { ...book, categories: cats.rows };
    },

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
            joins += " JOIN bookstore.books_categories bc ON bc.book_id = b.id ";
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
             b.language, b.format, b.price, b.sale_price, b.sale_start, b.sale_end, b.is_flash_sale, b.stock, b.sold_count, b.image_url, b.gallery_urls,
             b.rating_avg, b.rating_count, b.created_at, b.updated_at
      FROM bookstore.book b
      ${joins}
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;
        const countSql = `
      SELECT COUNT(DISTINCT b.id) AS count
      FROM bookstore.book b
      ${joins}
      ${whereSql}
    `;

        const [list, count] = await Promise.all([
            pool.query(listSql, values),
            pool.query(countSql, values),
        ]);

        const items = list.rows.map(mapRow);
        return { items, total: +count.rows[0].count };
    },

    async setCategories(book_id, category_ids = []) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            await client.query("DELETE FROM bookstore.books_categories WHERE book_id = $1", [book_id]);
            for (const cid of category_ids) {
                await client.query(
                    `INSERT INTO bookstore.books_categories (book_id, category_id)
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

    async listFlashSale({ limit = 10 } = {}) {
        const sql = `
            SELECT
            id,
            title,
            image_url,
            price,          -- giá gốc
            sale_price,     -- giá đang sale
            sale_start,
            sale_end,
            is_flash_sale
            FROM bookstore.book
            WHERE is_flash_sale = TRUE
            AND sale_price IS NOT NULL
            AND (sale_start IS NULL OR sale_start <= NOW())
            AND (sale_end   IS NOT NULL AND NOW() < sale_end)
            ORDER BY sale_end ASC
            LIMIT $1;
        `;
        const { rows } = await pool.query(sql, [limit]);
        return rows;
    },
    async expireFlashSales() {
        const sql = `
            UPDATE bookstore.book
            SET
            is_flash_sale = FALSE,
            sale_price = NULL,
            sale_start = NULL,
            sale_end = NULL,
            updated_at = NOW()
            WHERE is_flash_sale = TRUE
            AND sale_end IS NOT NULL
            AND NOW() >= sale_end
            RETURNING id;
        `;
        const { rows } = await pool.query(sql);
        return rows; // trả về danh sách id đã expire (nếu cần)
    }

    
};

module.exports = BookModel;
