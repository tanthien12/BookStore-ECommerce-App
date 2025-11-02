// backend/models/cart.model.js
const { pool } = require("../config/db.config");

// Lấy cart đang active của user, nếu chưa có thì tạo mới
async function getOrCreateActiveCart(userId) {
    // tìm trước
    const found = await pool.query(
        `
        SELECT id, user_id, status, created_at, updated_at
        FROM bookstore.cart
        WHERE user_id = $1 AND status = 'active'
        LIMIT 1;
        `,
        [userId]
    );

    if (found.rows.length > 0) {
        return found.rows[0];
    }

    // tạo mới
    const created = await pool.query(
        `
        INSERT INTO bookstore.cart (user_id, status, created_at, updated_at)
        VALUES ($1, 'active', NOW(), NOW())
        RETURNING id, user_id, status, created_at, updated_at;
        `,
        [userId]
    );

    return created.rows[0];
}

// Lấy tất cả item trong giỏ của user (join sang book để FE hiển thị)
async function listItemsOfUser(userId) {
    const { rows } = await pool.query(
        `
        SELECT 
            ci.id AS cart_item_id,
            ci.cart_id,
            ci.book_id,
            ci.quantity,
            ci.price_snapshot,
            b.title,
            b.image_url,
            b.price AS book_price
        FROM bookstore.cart c
        JOIN bookstore.cart_items ci ON ci.cart_id = c.id
        JOIN bookstore.book b ON b.id = ci.book_id
        WHERE c.user_id = $1
          AND c.status = 'active'
        ORDER BY ci.created_at DESC;
        `,
        [userId]
    );
    return rows;
}

// Thêm hoặc tăng số lượng 1 sản phẩm trong giỏ
async function upsertCartItem(cartId, bookId, quantity, priceSnapshot) {
    // chốt giá: nếu không truyền snapshot thì lấy từ book
    let finalPrice = priceSnapshot;

    if (finalPrice == null) {
        const bookRes = await pool.query(
            `SELECT price FROM bookstore.book WHERE id = $1`,
            [bookId]
        );
        if (!bookRes.rows[0]) {
            const err = new Error("BOOK_NOT_FOUND");
            throw err;
        }
        finalPrice = bookRes.rows[0].price;
    }

    const { rows } = await pool.query(
        `
        INSERT INTO bookstore.cart_items (cart_id, book_id, quantity, price_snapshot, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (cart_id, book_id)
        DO UPDATE SET quantity = bookstore.cart_items.quantity + EXCLUDED.quantity
        RETURNING *;
        `,
        [cartId, bookId, quantity, finalPrice]
    );

    return rows[0];
}

// Cập nhật số lượng
async function updateCartItemQuantity(cartItemId, quantity) {
    const { rows } = await pool.query(
        `
        UPDATE bookstore.cart_items
        SET quantity = $1
        WHERE id = $2
        RETURNING *;
        `,
        [quantity, cartItemId]
    );
    return rows[0];
}

// Xóa 1 item
async function deleteCartItem(cartItemId) {
    await pool.query(
        `DELETE FROM bookstore.cart_items WHERE id = $1`,
        [cartItemId]
    );
}

// Xóa toàn bộ giỏ của user
async function clearCartOfUser(userId) {
    const { rows } = await pool.query(
        `SELECT id FROM bookstore.cart WHERE user_id = $1 AND status = 'active' LIMIT 1`,
        [userId]
    );
    if (!rows[0]) return;

    const cartId = rows[0].id;
    await pool.query(
        `DELETE FROM bookstore.cart_items WHERE cart_id = $1`,
        [cartId]
    );
}

module.exports = {
    getOrCreateActiveCart,
    listItemsOfUser,
    upsertCartItem,
    updateCartItemQuantity,
    deleteCartItem,
    clearCartOfUser,
};
