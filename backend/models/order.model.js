// backend/models/order.model.js
const { pool } = require("../config/db.config");

/**
 * Helpers
 */
function buildSet(fields) {
    const cols = [];
    const vals = [];
    let i = 1;
    for (const [k, v] of Object.entries(fields)) {
        if (v === undefined) continue; // skip undefined to avoid accidental NULL
        cols.push(`${k} = $${i++}`);
        vals.push(v);
    }
    return { sql: cols.join(", "), params: vals, nextIndex: i };
}

// ⬇️ BẮT ĐẦU HÀM TRỪ KHO (Giữ nguyên) ⬇️
/**
 * Trừ kho, tăng sold_count, tăng sold_quantity (nếu sale)
 */
async function updateStockAndSoldCounters(client, items) {
    console.log("[StockUpdate] Bắt đầu trừ kho cho", items.length, "sản phẩm.");
    
    for (const item of items) {
        const { book_id, quantity } = item;
        if (!quantity || !book_id) continue;

        // Lệnh 1: Cập nhật stock (với kiểm tra tồn kho) và sold_count
        const updateBookQuery = `
          UPDATE bookstore.book
          SET 
              stock = stock - $1,
              sold_count = sold_count + $1
          WHERE id = $2 AND stock >= $1; -- Quan trọng: Đảm bảo tồn kho đủ
        `;
        const result = await client.query(updateBookQuery, [quantity, book_id]);

        if (result.rowCount === 0) {
            throw new Error(`Không đủ hàng tồn kho (stock) cho sách ID: ${book_id}`);
        }

        // Lệnh 2: Cập nhật flash sale (nếu có)
        const updateSaleQuery = `
          UPDATE bookstore.flashsale_items fi
          SET sold_quantity = sold_quantity + $1
          WHERE 
              fi.book_id = $2
              AND fi.flashsale_id IN (
                  SELECT id FROM bookstore.flashsale
                  WHERE is_active = TRUE
                  AND start_time <= NOW()
                  AND end_time > NOW()
              )
              AND (fi.sale_quantity - fi.sold_quantity) >= $1; -- Quan trọng: Đảm bảo flash sale còn hàng
        `;
        await client.query(updateSaleQuery, [quantity, book_id]);
    }
    console.log("[StockUpdate] Trừ kho thành công.");
}
// ⬆️ KẾT THÚC HÀM TRỪ KHO ⬆️


const OrderModel = {
    /**
     * Tạo order + order_details (transaction)
     * order: { user_id, status, subtotal, ..., payment_method }
     * items: [{ book_id, quantity, price_snapshot }]
     */
    async create(order, items) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // ⬇️ BẮT ĐẦU SỬA LỖI CÚ PHÁP SQL ⬇️
            // (Xóa dấu phẩy (,) thừa sau 'placed_at')
            const insertOrderSql = `
            INSERT INTO "order" (
                user_id,
                status,
                subtotal,
                discount_total,
                shipping_fee,
                grand_total,
                shipping_address,
                shipping_method,
                placed_at
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8, COALESCE($9, now()))
            RETURNING *;
            `;
            // ⬆️ KẾT THÚC SỬA LỖI CÚ PHÁP SQL ⬆️
            
            const oRes = await client.query(insertOrderSql, [
                order.user_id,
                order.status,
                Number(order.subtotal) || 0,
                Number(order.discount_total) || 0,
                Number(order.shipping_fee) || 0,
                Number(order.grand_total) || 0,
                order.shipping_address || null,
                order.shipping_method || null,
                order.placed_at || null
            ]);
            const o = oRes.rows[0];

            // Insert details
            const insDetail = `
            INSERT INTO order_details (order_id, book_id, quantity, price_snapshot)
            VALUES ($1,$2,$3,$4);
            `;
            for (const it of items) {
                await client.query(insDetail, [
                    o.id,
                    it.book_id,
                    Number(it.quantity),
                    Number(it.price_snapshot) || 0,
                ]);
            }

            // ⬇️ LOGIC TRỪ KHO (Đã đúng) ⬇️
            // Chỉ trừ kho nếu là COD.
            if (order.payment_method === 'cod') {
                // 'items' là mảng [{ book_id, quantity, price_snapshot }]
                await updateStockAndSoldCounters(client, items);
            }
            // ⬆️ KẾT THÚC LOGIC TRỪ KHO ⬆️

            await client.query("COMMIT");
            return o;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    },

    /**
     * Cập nhật order; nếu items truyền vào -> thay toàn bộ chi tiết
     */
    async update(id, order, items) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            if (order && Object.keys(order).length) {
                // ⬇️ BẮT ĐẦU SỬA LỖI GÕ MÁY ⬇️
                const { sql, params, nextIndex } = buildSet({
                    status: order.status,
                    subtotal: order.subtotal != null ? Number(order.subtotal) : undefined,
                    discount_total:
                        order.discount_total != null ? Number(order.discount_total) : undefined,
                    shipping_fee:
                        order.shipping_fee != null ? Number(order.shipping_fee) : undefined,
                    shipping_method:
                        order.shipping_method != null ? order.shipping_method : undefined, // Sửa shipping_ -> shipping_method
                    grand_total:
                        order.grand_total != null ? Number(order.grand_total) : undefined,
                    shipping_address: order.shipping_address,
                    updated_at: new Date(),
                });
                // ⬆️ KẾT THÚC SỬA LỖI GÕ MÁY ⬆️

                if (sql) {
                    const updSql = `UPDATE "order" SET ${sql} WHERE id = $${nextIndex} RETURNING *;`;
                    const updRes = await client.query(updSql, [...params, id]);
                    if (!updRes.rows[0]) {
                        await client.query("ROLLBACK");
                        return null;
                    }
                }
            }

            if (Array.isArray(items)) {
                await client.query(`DELETE FROM order_details WHERE order_id = $1`, [id]);
                const insDetail = `
                INSERT INTO order_details (order_id, book_id, quantity, price_snapshot)
                VALUES ($1,$2,$3,$4);
                `;
                for (const it of items) {
                    await client.query(insDetail, [
                        id,
                        it.book_id,
                        Number(it.quantity),
                        Number(it.price_snapshot) || 0,
                    ]);
                }
            }

            await client.query("COMMIT");
            const o = await this.findById(id);
            return o;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    },
    
    // ... (Các hàm còn lại: remove, findById, list, listByUser, findMineById, cancelMine giữ nguyên) ...

    async remove(id) {
        const res = await pool.query(`DELETE FROM "order" WHERE id = $1`, [id]);
        return res.rowCount > 0;
    },

    async findById(id) {
        const oRes = await pool.query(
            `SELECT o.*
       FROM "order" o
       WHERE o.id = $1
       LIMIT 1`,
            [id]
        );
        const order = oRes.rows[0];
        if (!order) return null;

        const itemsRes = await pool.query(
            `SELECT od.book_id, od.quantity, od.price_snapshot, b.title, b.image_url
       FROM order_details od
       JOIN book b ON b.id = od.book_id
       WHERE od.order_id = $1
       ORDER BY od.id`,
            [id]
        );

        return { ...order, items: itemsRes.rows };
    },

    async list({ q, status, page = 1, limit = 10 }) {
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(1, Number(limit) || 10));
        const offset = (page - 1) * limit;

        const where = [];
        const params = [];
        let i = 1;

        if (q) {
            where.push(`CAST(o.id AS TEXT) ILIKE $${i++}`);
            params.push(`%${q}%`);
        }
        if (status) {
            where.push(`o.status = $${i++}`);
            params.push(status);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

        const listSql = `
      WITH page_data AS (
        SELECT o.id, o.user_id, o.status, o.subtotal, o.discount_total, o.shipping_fee, o.shipping_method,
               o.grand_total, o.placed_at, o.updated_at,
               u.name AS customer_name, u.email AS customer_email
        FROM "order" o
        JOIN "user" u ON u.id = o.user_id
        ${whereSql}
        ORDER BY o.placed_at DESC
        LIMIT $${i++} OFFSET $${i++}
      )
      SELECT
        (SELECT COUNT(*)::int FROM "order" o ${whereSql.replace(/o\./g, 'o.')}) AS total,
        (SELECT json_agg(p.*) FROM page_data p) AS items
    `;
        const listRes = await pool.query(listSql, [...params, limit, offset]);
        const total = listRes.rows[0]?.total || 0;
        const items = listRes.rows[0]?.items || [];

        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    },

    async listByUser({ userId, page = 1, limit = 10, status }) {
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(50, Math.max(1, Number(limit) || 10));
        const offset = (page - 1) * limit;

        const where = [`o.user_id = $1`];
        const params = [userId];
        let i = 2;

        if (status) {
            where.push(`o.status = $${i++}`);
            params.push(status);
        }

        const whereSql = `WHERE ${where.join(" AND ")}`;

        const sql = `
      WITH d AS (
        SELECT o.id, o.status, o.grand_total, o.shipping_fee, o.placed_at
        FROM "order" o
        ${whereSql}
        ORDER BY o.placed_at DESC
        LIMIT $${i} OFFSET $${i + 1}
      )
      SELECT
        (SELECT COUNT(*)::int FROM "order" o ${whereSql}) AS total,
        (SELECT json_agg(d.*) FROM d) AS items
    `;
        const r = await pool.query(sql, [...params, limit, offset]);
        return {
            total: r.rows?.[0]?.total || 0,
            items: r.rows?.[0]?.items || [],
            page,
            limit,
            pages: Math.ceil((r.rows?.[0]?.total || 0) / limit),
        };
    },

    async findMineById(userId, orderId) {
        const oRes = await pool.query(
            `SELECT o.id, o.status, o.subtotal, o.discount_total, o.shipping_fee,
              o.grand_total, o.shipping_address, o.shipping_method,
              o.tracking_number, o.placed_at
       FROM "order" o
       WHERE o.id = $1 AND o.user_id = $2
       LIMIT 1`,
            [orderId, userId]
        );
        const order = oRes.rows[0];
        if (!order) return null;

        const dRes = await pool.query(
            `SELECT od.book_id, od.quantity, od.price_snapshot, b.title, b.image_url
       FROM order_details od
       JOIN book b ON b.id = od.book_id
       WHERE od.order_id = $1`,
            [orderId]
        );

        return { order, items: dRes.rows };
    },

    async cancelMine(userId, orderId) {
        const sRes = await pool.query(
            `SELECT status FROM "order" WHERE id = $1 AND user_id = $2`,
            [orderId, userId]
        );
        const row = sRes.rows[0];
        if (!row) return { ok: false, status: 404, message: "Order not found" };

        if (!["pending", "processing"].includes(row.status)) {
            return {
                ok: false,
                status: 400,
                message: "Không thể hủy đơn ở trạng thái hiện tại",
            };
        }

        await pool.query(
            `UPDATE "order" SET status = 'cancelled', updated_at = now() WHERE id = $1`,
            [orderId]
        );
        return { ok: true };
    },

    updateStockAndSoldCounters, // Export hàm trừ kho
};

module.exports = OrderModel;