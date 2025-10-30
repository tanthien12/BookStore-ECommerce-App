// backend/src/services/chat.tools.js
const { z } = require("zod");
const { pool } = require("../config/db.config"); // sửa path nếu khác

// ===== Schemas =====
const searchBooksSchema = z.object({
    query: z.string().min(1),
    category: z.string().optional(),
    price_from: z.number().optional(),
    price_to: z.number().optional(),
});

const addToCartSchema = z.object({
    book_id: z.string().uuid(),
    qty: z.number().int().positive().default(1),
});

const getOrderStatusSchema = z.object({
    // chấp nhận id (UUID) hoặc order_code (mapping tracking_number)
    id: z.string().uuid().optional(),
    order_code: z.string().optional(),
});

async function tool_search_books(args) {
    const { query, category, price_from, price_to } = searchBooksSchema.parse(args);

    const params = [];
    let where = [];
    // Ưu tiên pg_trgm: title/author/description
    params.push(query);
    const simExpr = `
    GREATEST(
      similarity(b.title, $1),
      similarity(COALESCE(b.author,''), $1),
      similarity(COALESCE(b.description,''), $1)
    )
  `;

    where.push(`(${simExpr}) > 0.1 OR b.title ILIKE '%'||$1||'%' OR b.author ILIKE '%'||$1||'%'`);

    if (category) {
        params.push(category);
        where.push(`EXISTS (
      SELECT 1 FROM books_categories bc
      JOIN category c ON c.id = bc.category_id
      WHERE bc.book_id = b.id AND (c.slug = $${params.length} OR c.name ILIKE '%'||$${params.length}||'%')
    )`);
    }
    if (typeof price_from === "number") {
        params.push(price_from);
        where.push(`b.price >= $${params.length}`);
    }
    if (typeof price_to === "number") {
        params.push(price_to);
        where.push(`b.price <= $${params.length}`);
    }

    const sql = `
    SELECT b.id, b.title, b.author, b.price, b.rating_avg, b.image_url
    FROM book b
    WHERE ${where.join(" AND ")}
    ORDER BY ${simExpr} DESC NULLS LAST, b.rating_avg DESC NULLS LAST, b.created_at DESC
    LIMIT 5
  `;

    const { rows } = await pool.query(sql, params);
    return { items: rows };
}

async function tool_add_to_cart(userId, args) {
    const { book_id, qty } = addToCartSchema.parse(args);
    if (!userId) {
        return { error: "UNAUTHENTICATED", message: "Bạn cần đăng nhập để thêm vào giỏ hàng." };
    }

    // Lấy/ tạo cart active
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const cartRes = await client.query(
            `SELECT id FROM cart WHERE user_id = $1 AND status = 'active' LIMIT 1`,
            [userId]
        );
        let cartId = cartRes.rows[0]?.id;
        if (!cartId) {
            const ins = await client.query(
                `INSERT INTO cart (user_id, status) VALUES ($1, 'active') RETURNING id`,
                [userId]
            );
            cartId = ins.rows[0].id;
        }

        // Lấy giá hiện tại
        const bookRes = await client.query(`SELECT price FROM book WHERE id = $1`, [book_id]);
        if (bookRes.rowCount === 0) throw new Error("BOOK_NOT_FOUND");

        const price = bookRes.rows[0].price;

        // Upsert cart_items
        await client.query(
            `INSERT INTO cart_items (cart_id, book_id, quantity, price_snapshot)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cart_id, book_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity`,
            [cartId, book_id, qty, price]
        );

        await client.query("COMMIT");
        return { ok: true, cart_id: cartId };
    } catch (e) {
        await client.query("ROLLBACK");
        if (e.message === "BOOK_NOT_FOUND") {
            return { error: "BOOK_NOT_FOUND", message: "Sách không tồn tại." };
        }
        throw e;
    } finally {
        client.release();
    }
}

async function tool_get_order_status(userId, args) {
    const { id, order_code } = getOrderStatusSchema.parse(args);
    if (!userId) {
        return { error: "UNAUTHENTICATED", message: "Bạn cần đăng nhập để xem đơn hàng." };
    }

    const params = [userId];
    let where = `o.user_id = $1`;
    if (id) {
        params.push(id);
        where += ` AND o.id = $${params.length}`;
    } else if (order_code) {
        // Map order_code -> tracking_number (do schema không có code)
        params.push(order_code);
        where += ` AND o.tracking_number = $${params.length}`;
    } else {
        return { error: "INVALID_ARGS", message: "Thiếu 'id' hoặc 'order_code'." };
    }

    const sql = `
    SELECT o.id, o.status, o.placed_at, o.grand_total, o.tracking_number,
           p.status AS payment_status, p.method AS payment_method, p.amount_paid
    FROM "order" o
    LEFT JOIN payment p ON p.order_id = o.id
    WHERE ${where}
    LIMIT 1
  `;
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return { error: "NOT_FOUND", message: "Không tìm thấy đơn hàng của bạn." };
    return { order: rows[0] };
}

// ===== Tool registry =====
const TOOL_REGISTRY = {
    search_books: {
        name: "search_books",
        schema: searchBooksSchema,
        exec: (userId, args) => tool_search_books(args),
    },
    add_to_cart: {
        name: "add_to_cart",
        schema: addToCartSchema,
        exec: (userId, args) => tool_add_to_cart(userId, args),
    },
    get_order_status: {
        name: "get_order_status",
        schema: getOrderStatusSchema,
        exec: (userId, args) => tool_get_order_status(userId, args),
    },
};

module.exports = { TOOL_REGISTRY };
