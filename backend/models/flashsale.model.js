// backend/models/flashsale.model.js
const { pool } = require("../config/db.config");

const FlashsaleModel = {
    // === Quản lý chiến dịch (flashsale) ===
    async createCampaign(payload) {
        const { name, start_time, end_time, is_active } = payload;
        const sql = `
            INSERT INTO bookstore.flashsale (name, start_time, end_time, is_active)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const { rows } = await pool.query(sql, [name, start_time, end_time, is_active ?? true]);
        return rows[0];
    },
    // ⬇️ THÊM HÀM MỚI ⬇️
    async update(id, payload) {
        const { name, start_time, end_time, is_active } = payload;
        const { rows } = await pool.query(
            `UPDATE bookstore.flashsale
             SET name = $1, start_time = $2, end_time = $3, is_active = $4, updated_at = NOW()
             WHERE id = $5 RETURNING *`,
            [name, start_time, end_time, is_active, id]
        );
        return rows[0];
    },

    // ⬇️ THÊM HÀM MỚI ⬇️
    async remove(id) {
        // (items sẽ tự động bị xóa nhờ "ON DELETE CASCADE" trong CSDL)
        const { rowCount } = await pool.query(
            `DELETE FROM bookstore.flashsale WHERE id = $1`,
            [id]
        );
        return rowCount > 0;
    },
    
    async listCampaigns(params = {}) {
        const sql = `SELECT * FROM bookstore.flashsale ORDER BY start_time DESC`;
        const { rows } = await pool.query(sql);
        return rows;
    },

    async findCampaignById(id) {
        const sql = `SELECT * FROM bookstore.flashsale WHERE id = $1`;
        const { rows } = await pool.query(sql, [id]);
        return rows[0];
    },

    // === Quản lý sản phẩm trong chiến dịch (flashsale_items) ===
    async addItemToCampaign(payload) {
        const { flashsale_id, book_id, sale_price, sale_quantity } = payload;
        const sql = `
            INSERT INTO bookstore.flashsale_items (flashsale_id, book_id, sale_price, sale_quantity)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (flashsale_id, book_id) DO UPDATE
            SET sale_price = EXCLUDED.sale_price,
                sale_quantity = EXCLUDED.sale_quantity,
                sold_quantity = 0,
                updated_at = NOW()
            RETURNING *;
        `;
        const { rows } = await pool.query(sql, [flashsale_id, book_id, sale_price, sale_quantity]);
        return rows[0];
    },

    async removeItemFromCampaign(itemId) {
        const sql = `DELETE FROM bookstore.flashsale_items WHERE id = $1`;
        const { rowCount } = await pool.query(sql, [itemId]);
        return rowCount > 0;
    },

    async getItemsForCampaign(campaignId) {
        const sql = `
            SELECT 
                fi.id, fi.book_id, fi.sale_price, fi.sale_quantity, fi.sold_quantity,
                b.title, b.image_url, b.price AS original_price, b.sold_count
            FROM bookstore.flashsale_items fi
            JOIN bookstore.book b ON b.id = fi.book_id
            WHERE fi.flashsale_id = $1
            ORDER BY fi.created_at;
        `;
        const { rows } = await pool.query(sql, [campaignId]);
        return rows;
    },
    
    // === Logic cho Frontend (Lấy sale đang hoạt động) ===
    async listActiveSaleItems({ limit = 10 } = {}) {
        const sql = `
            SELECT 
                fi.id AS flashsale_item_id,
                fi.sale_price,
                fi.sale_quantity,
                fi.sold_quantity,
                fs.end_time AS sale_end,
                
                b.id,
                b.title,
                b.author,
                b.image_url,
                b.price, -- Giá gốc
                b.rating_avg,
                b.rating_count,
                b.sold_count -- Giữ lại sold_count
            FROM 
                bookstore.flashsale_items fi
            JOIN 
                bookstore.flashsale fs ON fs.id = fi.flashsale_id
            JOIN 
                bookstore.book b ON b.id = fi.book_id
            WHERE 
                fs.is_active = TRUE
                AND fs.start_time <= NOW()
                AND fs.end_time > NOW()
                AND fi.sold_quantity < fi.sale_quantity
            ORDER BY 
                fs.end_time ASC, fi.sale_price ASC
            LIMIT $1;
        `;
        const { rows } = await pool.query(sql, [limit]);
        return rows;
    }
};
module.exports = FlashsaleModel;