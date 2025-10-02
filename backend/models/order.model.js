const db = require("../config/db.config");

const OrderModel = {
    async create(order, items) {
        // order = { user_id, status, total_amount }
        // items = [{ book_id, quantity, price }]
        return db.tx(async t => {
            const o = await t.one(
                `INSERT INTO orders(user_id, status, total_amount)
         VALUES($1,$2,$3) RETURNING *`,
                [order.user_id, order.status, order.total_amount]
            );

            for (const it of items) {
                await t.none(
                    `INSERT INTO order_items(order_id, book_id, quantity, price)
           VALUES($1,$2,$3,$4)`,
                    [o.id, it.book_id, it.quantity, it.price]
                );
            }
            return o;
        });
    },

    async update(id, order, items) {
        return db.tx(async t => {
            const o = await t.oneOrNone(
                `UPDATE orders
         SET status=$2, total_amount=$3, updated_at=NOW()
         WHERE id=$1 RETURNING *`,
                [id, order.status, order.total_amount]
            );
            if (!o) return null;

            await t.none(`DELETE FROM order_items WHERE order_id=$1`, [id]);
            for (const it of items) {
                await t.none(
                    `INSERT INTO order_items(order_id, book_id, quantity, price)
           VALUES($1,$2,$3,$4)`,
                    [id, it.book_id, it.quantity, it.price]
                );
            }
            return o;
        });
    },

    async remove(id) {
        const res = await db.result(`DELETE FROM orders WHERE id=$1`, [id]);
        return res.rowCount > 0;
    },

    async findById(id) {
        const order = await db.oneOrNone(`SELECT * FROM orders WHERE id=$1`, [id]);
        if (!order) return null;
        const items = await db.manyOrNone(
            `SELECT oi.*, b.title
       FROM order_items oi
       JOIN books b ON b.id=oi.book_id
       WHERE order_id=$1`,
            [id]
        );
        return { ...order, items };
    },

    async list({ q, status, page = 1, limit = 10 }) {
        const offset = (page - 1) * limit;
        const where = [];
        const params = [];

        if (q) {
            params.push(`%${q}%`);
            where.push(`(CAST(o.id AS TEXT) ILIKE $${params.length})`);
        }
        if (status) {
            params.push(status);
            where.push(`o.status=$${params.length}`);
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const sql = `
      SELECT o.*, u.full_name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON u.id=o.user_id
      ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

        const items = await db.manyOrNone(sql, params);
        const total = await db.one(
            `SELECT COUNT(*) as c FROM orders o
       ${whereSql}`,
            params
        );
        return { items, total: +total.c };
    },
};

module.exports = OrderModel;
