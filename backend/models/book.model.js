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
    async list({ q, category_id, language, format, page = 1, limit = 12, sort = "id_desc", min, max }) {
        const offset = (page - 1) * limit;
        const values = [];
        const where = [];
        let joins = "";
        let i = 1; // Biến đếm an toàn cho parameters

        if (q) {
            values.push(`%${q}%`);
            const p = `$${i++}`;
            where.push(`(b.title ILIKE ${p} OR b.author ILIKE ${p} OR b.isbn ILIKE ${p} OR b.publisher ILIKE ${p})`);
        }
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
        const effectivePriceSql = "COALESCE((sale.active_flashsale->>'sale_price')::numeric, b.price)";
        
        // Thêm logic lọc giá
        if (min != null) {
            values.push(min);
            where.push(`${effectivePriceSql} >= $${i++}`);
        }
        if (max != null) {
            values.push(max);
            where.push(`${effectivePriceSql} <= $${i++}`);
        }
        
        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

        // Sửa logic sort để dùng giá hiệu lực (effective price)
        let orderBy = "b.id DESC";
        if (sort === "price_asc") orderBy = `${effectivePriceSql} ASC`;
        if (sort === "price_desc") orderBy = `${effectivePriceSql} DESC`;
        if (sort === "title_asc") orderBy = "b.title ASC";
        if (sort === "newest") orderBy = "b.created_at DESC";

        const listSql = `
      SELECT 
            b.id, b.title, b.author, b.isbn, b.publisher, b.published_year,
            b.language, b.format, b.price, b.stock, b.sold_count, b.image_url, b.gallery_urls,
            b.rating_avg, b.rating_count, b.created_at, b.updated_at,
            sale.active_flashsale -- Thêm trường sale
      FROM bookstore.book b
      ${joins}
      ${ACTIVE_FLASH_SALE_JOIN} -- Thêm JOIN logic sale
      ${whereSql}
      ORDER BY ${orderBy}
      LIMIT $${i++} OFFSET $${i++}
    `;
        const countSql = `
      SELECT COUNT(DISTINCT b.id) AS count
      FROM bookstore.book b
      ${joins}
      ${ACTIVE_FLASH_SALE_JOIN} -- Thêm JOIN logic sale
      ${whereSql}
    `;

        const [list, count] = await Promise.all([
            pool.query(listSql, [...values, limit, offset]), 
            pool.query(countSql, values)
        ]);
        
        const items = list.rows.map(mapRow); // mapRow sẽ tính 'effective_price'
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
};

module.exports = BookModel;



//cod goc
// // backend/models/book.model.js
// const { pool } = require("../config/db.config");

// function mapRow(row) {
//     if (!row) return null;
//     // Không cần alias nữa, DB đã có cột gallery_urls
//     return { ...row, gallery_urls: row.gallery_urls || [] };
// }

// const BookModel = {
//     async create(payload) {
//         const text = `
//       INSERT INTO bookstore.book (
//         title, author, isbn, publisher, published_year, language, format,
//         price, stock, description, image_url, gallery_urls, created_at, updated_at
//       ) VALUES (
//         $1,$2,$3,$4,$5,$6,$7,
//         $8,$9,$10,$11,$12,NOW(),NOW()
//       )
//       RETURNING id, title, author, isbn, publisher, published_year, language, format,
//                 price, stock, description, image_url, gallery_urls, rating_avg, rating_count,
//                 created_at, updated_at
//     `;
//         const values = [
//             payload.title,
//             payload.author ?? null,
//             payload.isbn ?? null,
//             payload.publisher ?? null,
//             payload.published_year ?? null,
//             payload.language ?? null,
//             payload.format ?? null,
//             payload.price ?? 0,
//             payload.stock ?? 0,
//             payload.description ?? null,
//             payload.image_url ?? null,
//             Array.isArray(payload.gallery_urls) ? payload.gallery_urls : null,
//         ];
//         const { rows } = await pool.query(text, values);
//         return mapRow(rows[0]);
//     },

//     async update(id, payload) {
//         const text = `
//       UPDATE bookstore.book
//       SET
//         title = $2,
//         author = $3,
//         isbn = $4,
//         publisher = $5,
//         published_year = $6,
//         language = $7,
//         format = $8,
//         price = $9,
//         stock = $10,
//         description = $11,
//         image_url = $12,
//         gallery_urls = $13,
//         updated_at = NOW()
//       WHERE id = $1
//       RETURNING id, title, author, isbn, publisher, published_year, language, format,
//                 price, stock, description, image_url, gallery_urls, rating_avg, rating_count,
//                 created_at, updated_at
//     `;
//         const values = [
//             id,
//             payload.title,
//             payload.author ?? null,
//             payload.isbn ?? null,
//             payload.publisher ?? null,
//             payload.published_year ?? null,
//             payload.language ?? null,
//             payload.format ?? null,
//             payload.price ?? 0,
//             payload.stock ?? 0,
//             payload.description ?? null,
//             payload.image_url ?? null,
//             Array.isArray(payload.gallery_urls) ? payload.gallery_urls : null,
//         ];
//         const { rows } = await pool.query(text, values);
//         return mapRow(rows[0]) || null;
//     },

//     async remove(id) {
//         await pool.query("DELETE FROM bookstore.books_categories WHERE book_id = $1", [id]);
//         const { rowCount } = await pool.query("DELETE FROM bookstore.book WHERE id = $1", [id]);
//         return rowCount > 0;
//     },

//     async findById(id) {
//         const bookSql = `
//       SELECT id, title, author, isbn, publisher, published_year, language, format,
//              price, stock, description, image_url, gallery_urls, rating_avg, rating_count,
//              created_at, updated_at
//       FROM bookstore.book
//       WHERE id = $1
//     `;
//         const catSql = `
//       SELECT c.id, c.name, c.slug
//       FROM bookstore.books_categories bc
//       JOIN bookstore.category c ON c.id = bc.category_id
//       WHERE bc.book_id = $1
//     `;
//         const [b, cats] = await Promise.all([
//             pool.query(bookSql, [id]),
//             pool.query(catSql, [id]),
//         ]);
//         const book = mapRow(b.rows[0]);
//         if (!book) return null;
//         return { ...book, categories: cats.rows };
//     },

//     async list({ q, category_id, language, format, page = 1, limit = 12, sort = "id_desc" }) {
//         const offset = (page - 1) * limit;
//         const values = [];
//         let where = [];
//         let joins = "";

//         if (q) {
//             values.push(`%${q}%`);
//             where.push(`(b.title ILIKE $${values.length} OR b.author ILIKE $${values.length} OR b.isbn ILIKE $${values.length} OR b.publisher ILIKE $${values.length})`);
//         }
//         if (category_id) {
//             joins += " JOIN bookstore.books_categories bc ON bc.book_id = b.id ";
//             values.push(category_id);
//             where.push(`bc.category_id = $${values.length}`);
//         }
//         if (language) {
//             values.push(language);
//             where.push(`b.language = $${values.length}`);
//         }
//         if (format) {
//             values.push(format);
//             where.push(`b.format = $${values.length}`);
//         }

//         const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
//         let orderBy = "b.id DESC";
//         if (sort === "price_asc") orderBy = "b.price ASC";
//         if (sort === "price_desc") orderBy = "b.price DESC";
//         if (sort === "title_asc") orderBy = "b.title ASC";
//         if (sort === "newest") orderBy = "b.created_at DESC";

//         const listSql = `
//       SELECT b.id, b.title, b.author, b.isbn, b.publisher, b.published_year,
//              b.language, b.format, b.price, b.stock, b.image_url, b.gallery_urls,
//              b.rating_avg, b.rating_count, b.created_at, b.updated_at
//       FROM bookstore.book b
//       ${joins}
//       ${whereSql}
//       ORDER BY ${orderBy}
//       LIMIT ${limit} OFFSET ${offset}
//     `;
//         const countSql = `
//       SELECT COUNT(DISTINCT b.id) AS count
//       FROM bookstore.book b
//       ${joins}
//       ${whereSql}
//     `;

//         const [list, count] = await Promise.all([
//             pool.query(listSql, values),
//             pool.query(countSql, values),
//         ]);

//         const items = list.rows.map(mapRow);
//         return { items, total: +count.rows[0].count };
//     },

//     async setCategories(book_id, category_ids = []) {
//         const client = await pool.connect();
//         try {
//             await client.query("BEGIN");
//             await client.query("DELETE FROM bookstore.books_categories WHERE book_id = $1", [book_id]);
//             for (const cid of category_ids) {
//                 await client.query(
//                     `INSERT INTO bookstore.books_categories (book_id, category_id)
//                      VALUES ($1, $2)
//                      ON CONFLICT DO NOTHING`,
//                     [book_id, cid]
//                 );
//             }
//             await client.query("COMMIT");
//         } catch (e) {
//             await client.query("ROLLBACK");
//             throw e;
//         } finally {
//             client.release();
//         }
//     },
// };

// module.exports = BookModel;
