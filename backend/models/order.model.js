// const db = require("../config/db.config");

// const OrderModel = {
//     async create(order, items) {
//         // order = { user_id, status, total_amount }
//         // items = [{ book_id, quantity, price }]
//         return db.tx(async t => {
//             const o = await t.one(
//                 `INSERT INTO orders(user_id, status, total_amount)
//          VALUES($1,$2,$3) RETURNING *`,
//                 [order.user_id, order.status, order.total_amount]
//             );

//             for (const it of items) {
//                 await t.none(
//                     `INSERT INTO order_items(order_id, book_id, quantity, price)
//            VALUES($1,$2,$3,$4)`,
//                     [o.id, it.book_id, it.quantity, it.price]
//                 );
//             }
//             return o;
//         });
//     },

//     async update(id, order, items) {
//         return db.tx(async t => {
//             const o = await t.oneOrNone(
//                 `UPDATE orders
//          SET status=$2, total_amount=$3, updated_at=NOW()
//          WHERE id=$1 RETURNING *`,
//                 [id, order.status, order.total_amount]
//             );
//             if (!o) return null;

//             await t.none(`DELETE FROM order_items WHERE order_id=$1`, [id]);
//             for (const it of items) {
//                 await t.none(
//                     `INSERT INTO order_items(order_id, book_id, quantity, price)
//            VALUES($1,$2,$3,$4)`,
//                     [id, it.book_id, it.quantity, it.price]
//                 );
//             }
//             return o;
//         });
//     },

//     async remove(id) {
//         const res = await db.result(`DELETE FROM orders WHERE id=$1`, [id]);
//         return res.rowCount > 0;
//     },

//     async findById(id) {
//         const order = await db.oneOrNone(`SELECT * FROM orders WHERE id=$1`, [id]);
//         if (!order) return null;
//         const items = await db.manyOrNone(
//             `SELECT oi.*, b.title
//        FROM order_items oi
//        JOIN books b ON b.id=oi.book_id
//        WHERE order_id=$1`,
//             [id]
//         );
//         return { ...order, items };
//     },

//     async list({ q, status, page = 1, limit = 10 }) {
//         const offset = (page - 1) * limit;
//         const where = [];
//         const params = [];

//         if (q) {
//             params.push(`%${q}%`);
//             where.push(`(CAST(o.id AS TEXT) ILIKE $${params.length})`);
//         }
//         if (status) {
//             params.push(status);
//             where.push(`o.status=$${params.length}`);
//         }

//         const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
//         const sql = `
//       SELECT o.*, u.full_name as customer_name, u.email as customer_email
//       FROM orders o
//       JOIN users u ON u.id=o.user_id
//       ${whereSql}
//       ORDER BY o.created_at DESC
//       LIMIT ${limit} OFFSET ${offset}
//     `;

//         const items = await db.manyOrNone(sql, params);
//         const total = await db.one(
//             `SELECT COUNT(*) as c FROM orders o
//        ${whereSql}`,
//             params
//         );
//         return { items, total: +total.c };
//     },
// };

// module.exports = OrderModel;

// code sau
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

const OrderModel = {
    /**
     * Tạo order + order_details (transaction)
     * order: { user_id, status, subtotal, discount_total, shipping_fee, grand_total, shipping_address?, placed_at? }
     * items: [{ book_id, quantity, price_snapshot }]
     */
    async create(order, items) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            const insertOrderSql = `
        INSERT INTO "order" (
          user_id, status, subtotal, discount_total, shipping_fee, grand_total,
          shipping_address, placed_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8, now()))
        RETURNING *;
      `;
            const oRes = await client.query(insertOrderSql, [
                order.user_id,
                order.status, // must be lowercase per enum
                Number(order.subtotal) || 0,
                Number(order.discount_total) || 0,
                Number(order.shipping_fee) || 0,
                Number(order.grand_total) || 0,
                order.shipping_address || null,
                order.placed_at || null,
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
     * order: { status?, subtotal?, discount_total?, shipping_fee?, grand_total?, shipping_address? }
     * items: optional [{ book_id, quantity, price_snapshot }]
     */
    async update(id, order, items) {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            if (order && Object.keys(order).length) {
                const { sql, params, nextIndex } = buildSet({
                    status: order.status,
                    subtotal: order.subtotal != null ? Number(order.subtotal) : undefined,
                    discount_total:
                        order.discount_total != null ? Number(order.discount_total) : undefined,
                    shipping_fee:
                        order.shipping_fee != null ? Number(order.shipping_fee) : undefined,
                    grand_total:
                        order.grand_total != null ? Number(order.grand_total) : undefined,
                    shipping_address: order.shipping_address,
                    updated_at: new Date(),
                });

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
            // trả về bản ghi mới nhất
            const o = await this.findById(id);
            return o;
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    },

    async remove(id) {
        // ON DELETE CASCADE trong order_details đảm bảo chi tiết bị xoá theo
        const res = await pool.query(`DELETE FROM "order" WHERE id = $1`, [id]);
        return res.rowCount > 0;
    },

    /**
     * Chi tiết đơn (admin/nhân viên)
     */
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

    /**
     * Danh sách đơn (admin) với tìm kiếm/loc theo status, q (id…)
     */
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
        SELECT o.id, o.user_id, o.status, o.subtotal, o.discount_total, o.shipping_fee,
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

    /**
     * Danh sách đơn theo user (dùng cho /api/me/orders)
     */
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

    /**
     * Chi tiết đơn của chính mình (bảo vệ quyền sở hữu)
     */
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

    /**
     * Hủy đơn của chính mình nếu trạng thái còn cho phép
     * Cho phép: pending | processing
     */
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
};

module.exports = OrderModel;
