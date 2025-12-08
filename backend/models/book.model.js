// backend/models/book.model.js
// backend/models/book.model.js
const { pool } = require("../config/db.config");

// Định nghĩa câu truy vấn JOIN flash sale
const ACTIVE_FLASH_SALE_JOIN = `
LEFT JOIN (
    -- Bắt đầu subquery để xếp hạng
    SELECT 
        ranked_sales.book_id,
        ranked_sales.active_flashsale
    FROM (
        -- Subquery bên trong: Lấy *tất cả* sale hợp lệ và đánh số
        SELECT 
            fi.book_id,
            JSON_BUILD_OBJECT(
                'item_id', fi.id,
                'campaign_id', fs.id,
                'sale_price', fi.sale_price,
                'sale_quantity', fi.sale_quantity,
                'sold_quantity', fi.sold_quantity,
                'sale_end', fs.end_time
            ) AS active_flashsale,
            
            -- Đánh số thứ tự (row_number) cho mỗi book_id,
            -- ưu tiên giá sale rẻ nhất (price ASC)
            ROW_NUMBER() OVER(
                PARTITION BY fi.book_id 
                ORDER BY fi.sale_price ASC
            ) as rn
            
        FROM bookstore.flashsale_items fi
        JOIN bookstore.flashsale fs ON fs.id = fi.flashsale_id
        WHERE 
            fs.is_active = TRUE
            AND fs.start_time <= NOW()
            AND fs.end_time > NOW()
            AND fi.sold_quantity < fi.sale_quantity
    ) AS ranked_sales
    -- Subquery bên ngoài: Chỉ chọn sale có hạng 1 (rẻ nhất)
    WHERE ranked_sales.rn = 1
) AS sale ON sale.book_id = b.id
`;

function mapRow(row) {
    if (!row) return null;
    const activeSale = row.active_flashsale;
    let effective_price = row.price;
    if (activeSale && activeSale.sale_price != null) {
        effective_price = activeSale.sale_price;
    }
    return {
        ...row,
        gallery_urls: row.gallery_urls || [],
        effective_price: effective_price,
    };
}

// tiện ích: chuẩn hóa số hoặc null
const toNumberOrNull = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const BookModel = {
    async create(payload) {
        const price = toNumberOrNull(payload.price) ?? 0;

        const text = `
      INSERT INTO bookstore.book (
        title, author, isbn, publisher, published_year, language, format,
        price, stock, description, image_url, gallery_urls, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,NOW(),NOW()
      )
      RETURNING id, title, author, isbn, publisher, published_year, language, format,
                price, stock, sold_count, description, image_url, gallery_urls, rating_avg, rating_count,
                created_at, updated_at,
                price AS effective_price
    `;
        const values = [
            payload.title,
            payload.author ?? null,
            payload.isbn ?? null,
            payload.publisher ?? null,
            payload.published_year ?? null,
            payload.language ?? null,
            payload.format ?? null,
            price,
            payload.stock ?? 0,
            payload.description ?? null,
            payload.image_url ?? null,
            Array.isArray(payload.gallery_urls) ? payload.gallery_urls : null,
        ];
        const { rows } = await pool.query(text, values);
        return mapRow(rows[0]);
    },

    async update(id, payload) {
        const price = toNumberOrNull(payload.price);
        const text = `
      UPDATE bookstore.book
      SET
        title = COALESCE($2, title),
        author = COALESCE($3, author),
        isbn = COALESCE($4, isbn),
        publisher = COALESCE($5, publisher),
        published_year = COALESCE($6, published_year),
        language = COALESCE($7, language),
        format = COALESCE($8, format),
        price = COALESCE($9, price),
        stock = COALESCE($10, stock),
        description = COALESCE($11, description),
        image_url = COALESCE($12, image_url),
        gallery_urls = COALESCE($13, gallery_urls),
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, author, isbn, publisher, published_year, language, format,
                price, stock, sold_count, description, image_url, gallery_urls, rating_avg, rating_count,
                created_at, updated_at,
               price AS effective_price
    `;
        const values = [
            id,
            payload.title ?? null,
            payload.author ?? null,
            payload.isbn ?? null,
            payload.publisher ?? null,
            payload.published_year ?? null,
            payload.language ?? null,
            payload.format ?? null,
            price,
            payload.stock ?? null,
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
      SELECT 
        b.id, b.title, b.author, b.isbn, b.publisher, b.published_year, b.language, b.format,
        b.price, b.stock, b.sold_count, b.description, b.image_url, b.gallery_urls, 
        b.rating_avg, b.rating_count, b.created_at, b.updated_at,
        sale.active_flashsale
      FROM bookstore.book b
      ${ACTIVE_FLASH_SALE_JOIN}
      WHERE b.id = $1
    `;
        const catSql = `
      SELECT c.id, c.name, c.slug
      FROM bookstore.books_categories bc
      JOIN bookstore.category c ON c.id = bc.category_id
      WHERE bc.book_id = $1
    `;
        const [b, cats] = await Promise.all([pool.query(bookSql, [id]), pool.query(catSql, [id])]);
        const book = mapRow(b.rows[0]);
        if (!book) return null;
        return { ...book, categories: cats.rows };
    },

    // ⬇️ BẮT ĐẦU SỬA HÀM LIST ⬇️
    async list({
        q,
        category_id,
        language,
        format,
        page = 1,
        limit = 12,
        sort = "id_desc",
        min,
        max,
        stock,
        created_from,
        created_to,
    }) {
        const offset = (page - 1) * limit;
        const values = [];
        const where = [];
        let joins = "";
        let i = 1; // Biến đếm an toàn cho parameters

        if (q) {
            values.push(`%${q}%`);
            const p = `$${i++}`;
            where.push(
                // Dùng unaccent() để bỏ dấu cả 2 vế: dữ liệu trong DB và từ khóa tìm kiếm
                `(unaccent(b.title) ILIKE unaccent(${p}) 
                  OR unaccent(b.author) ILIKE unaccent(${p}) 
                  OR b.isbn ILIKE ${p} 
                  OR unaccent(b.publisher) ILIKE unaccent(${p}))`
            );
        }
        // Các phần category_id, language, format giữ nguyên như cũ
        if (category_id) {
            joins += " JOIN bookstore.books_categories bc ON bc.book_id = b.id ";
            values.push(category_id);
            where.push(`bc.category_id = $${i++}`);
        }
        if (language) {
            values.push(language);
            where.push(`b.language = $${i++}`);
        }
        if (format) {
            values.push(format);
            where.push(`b.format = $${i++}`);
        }

        // Định nghĩa giá hiệu lực (effective price)
        const effectivePriceSql =
            "COALESCE((sale.active_flashsale->>'sale_price')::numeric, b.price)";

        // Lọc giá theo giá hiệu lực
        if (min != null) {
            values.push(min);
            where.push(`${effectivePriceSql} >= $${i++}`);
        }
        if (max != null) {
            values.push(max);
            where.push(`${effectivePriceSql} <= $${i++}`);
        }

        // Lọc tồn kho
        if (stock === "in") {
            // Còn hàng: > 20
            where.push("b.stock > 20");
        } else if (stock === "low") {
            // Sắp hết: 1–20
            where.push("b.stock > 0 AND b.stock <= 20");
        } else if (stock === "out") {
            // Hết hàng: = 0
            where.push("b.stock = 0");
        }

        // Lọc theo ngày tạo (created_at)
        if (created_from) {
            values.push(created_from);
            where.push(`b.created_at >= $${i++}`);
        }
        if (created_to) {
            values.push(created_to);
            where.push(`b.created_at <= $${i++}`);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

        // Sort dùng giá hiệu lực khi sort theo giá
        let orderBy = "b.id DESC";
        if (sort === "price_asc") orderBy = `${effectivePriceSql} ASC`;
        if (sort === "price_desc") orderBy = `${effectivePriceSql} DESC`;
        if (sort === "title_asc") orderBy = "b.title ASC";
        if (sort === "newest") orderBy = "b.created_at DESC";
        if (sort === "sold_desc") orderBy = "b.sold_count DESC NULLS LAST";

        const listSql = `
      SELECT 
        b.id,
        b.title,
        b.author,
        b.isbn,
        b.publisher,
        b.published_year,
        b.language,
        b.format,
        b.price,
        b.stock,
        b.sold_count,
        b.image_url,
        b.gallery_urls,
        b.rating_avg,
        b.rating_count,
        b.created_at,
        b.updated_at,
        sale.active_flashsale
      FROM bookstore.book b
      ${joins}
      ${ACTIVE_FLASH_SALE_JOIN}
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${i++} OFFSET $${i++}
    `;

        const countSql = `
      SELECT COUNT(DISTINCT b.id) AS count
      FROM bookstore.book b
      ${joins}
      ${ACTIVE_FLASH_SALE_JOIN}
      ${whereSql}
    `;

        const [list, count] = await Promise.all([
            pool.query(listSql, [...values, limit, offset]),
            pool.query(countSql, values),
        ]);

        const items = list.rows.map(mapRow); // mapRow sẽ tính effective_price
        return { items, total: +count.rows[0].count };
    },
    // ⬆️ KẾT THÚC SỬA HÀM LIST ⬆️

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

    async getRelated(bookId, limit = 6) {
        const sql = `
            SELECT 
                b.id, b.title, b.author, b.isbn, b.publisher, b.published_year,
                b.language, b.format, b.price, b.stock, b.sold_count,
                b.description, b.image_url, b.gallery_urls, 
                b.rating_avg, b.rating_count, b.created_at, b.updated_at,
                sale.active_flashsale
            FROM bookstore.book b
            ${ACTIVE_FLASH_SALE_JOIN}
            WHERE b.id IN (
                -- Lấy danh sách sách có cùng category
                SELECT bc.book_id 
                FROM bookstore.books_categories bc
                WHERE bc.category_id IN (
                    -- Lấy các category của cuốn sách hiện tại
                    SELECT category_id FROM bookstore.books_categories WHERE book_id = $1
                )
            )
            AND b.id != $1 -- Trừ chính nó ra
            ORDER BY RANDOM() -- Random thoải mái vì không còn DISTINCT
            LIMIT $2
        `;

        const { rows } = await pool.query(sql, [bookId, limit]);
        return rows.map(mapRow);
    },
};

module.exports = BookModel;
