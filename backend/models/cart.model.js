// // backend/models/cart.model.js
// const { pool } = require("../config/db.config");

// // Lấy cart đang active của user, nếu chưa có thì tạo mới
// async function getOrCreateActiveCart(userId) {
//     const found = await pool.query(
//         `
//     SELECT id, user_id, status, created_at, updated_at
//     FROM bookstore.cart
//     WHERE user_id = $1 AND status = 'active'
//     LIMIT 1;
//     `,
//         [userId]
//     );

//     if (found.rows.length > 0) return found.rows[0];

//     const created = await pool.query(
//         `
//     INSERT INTO bookstore.cart (user_id, status, created_at, updated_at)
//     VALUES ($1, 'active', NOW(), NOW())
//     RETURNING id, user_id, status, created_at, updated_at;
//     `,
//         [userId]
//     );
//     return created.rows[0];
// }

// // Lấy tất cả item trong giỏ của user (join sang book để FE hiển thị)
// // Trả thêm: book_price, sale_price, effective_price (= COALESCE), price_snapshot
// async function listItemsOfUser(userId) {
//     const { rows } = await pool.query(
//         `
//     SELECT 
//       ci.id AS cart_item_id,
//       ci.cart_id,
//       ci.book_id,
//       ci.quantity,
//       ci.price_snapshot,
//       b.title,
//       b.image_url,
//       b.price       AS book_price,
//       b.sale_price  AS book_sale_price,
//       COALESCE(b.sale_price, b.price) AS effective_price
//     FROM bookstore.cart c
//     JOIN bookstore.cart_items ci ON ci.cart_id = c.id
//     JOIN bookstore.book b ON b.id = ci.book_id
//     WHERE c.user_id = $1
//       AND c.status = 'active'
//     ORDER BY ci.created_at DESC;
//     `,
//         [userId]
//     );
//     return rows;
// }

// // Thêm hoặc tăng số lượng 1 sản phẩm trong giỏ
// // Nếu priceSnapshot = null => chốt theo giá hiệu lực tại thời điểm thêm (sale_price ?? price)
// async function upsertCartItem(cartId, bookId, quantity, priceSnapshot) {
//     let finalPrice = priceSnapshot;

//     if (finalPrice == null) {
//         const bookRes = await pool.query(
//             `SELECT price, sale_price FROM bookstore.book WHERE id = $1`,
//             [bookId]
//         );
//         const book = bookRes.rows[0];
//         if (!book) {
//             const err = new Error("BOOK_NOT_FOUND");
//             throw err;
//         }
//         finalPrice = book.sale_price ?? book.price;
//     }

//     const { rows } = await pool.query(
//         `
//     INSERT INTO bookstore.cart_items (cart_id, book_id, quantity, price_snapshot, created_at)
//     VALUES ($1, $2, $3, $4, NOW())
//     ON CONFLICT (cart_id, book_id)
//     DO UPDATE SET quantity = bookstore.cart_items.quantity + EXCLUDED.quantity
//     RETURNING *;
//     `,
//         [cartId, bookId, quantity, finalPrice]
//     );

//     return rows[0];
// }

// // Cập nhật số lượng
// async function updateCartItemQuantity(cartItemId, quantity) {
//     const { rows } = await pool.query(
//         `
//     UPDATE bookstore.cart_items
//     SET quantity = $1
//     WHERE id = $2
//     RETURNING *;
//     `,
//         [quantity, cartItemId]
//     );
//     return rows[0];
// }

// // Xóa 1 item
// async function deleteCartItem(cartItemId) {
//     await pool.query(`DELETE FROM bookstore.cart_items WHERE id = $1`, [cartItemId]);
// }

// // Xóa toàn bộ giỏ của user
// async function clearCartOfUser(userId) {
//     const { rows } = await pool.query(
//         `SELECT id FROM bookstore.cart WHERE user_id = $1 AND status = 'active' LIMIT 1`,
//         [userId]
//     );
//     if (!rows[0]) return;

//     const cartId = rows[0].id;
//     await pool.query(`DELETE FROM bookstore.cart_items WHERE cart_id = $1`, [cartId]);
// }

// module.exports = {
//     getOrCreateActiveCart,
//     listItemsOfUser,
//     upsertCartItem,
//     updateCartItemQuantity,
//     deleteCartItem,
//     clearCartOfUser,
// };


//code goc
// // backend/models/cart.model.js
// const { pool } = require("../config/db.config");

// // Lấy cart đang active của user, nếu chưa có thì tạo mới
// async function getOrCreateActiveCart(userId) {
//     // tìm trước
//     const found = await pool.query(
//         `
//         SELECT id, user_id, status, created_at, updated_at
//         FROM bookstore.cart
//         WHERE user_id = $1 AND status = 'active'
//         LIMIT 1;
//         `,
//         [userId]
//     );

//     if (found.rows.length > 0) {
//         return found.rows[0];
//     }

//     // tạo mới
//     const created = await pool.query(
//         `
//         INSERT INTO bookstore.cart (user_id, status, created_at, updated_at)
//         VALUES ($1, 'active', NOW(), NOW())
//         RETURNING id, user_id, status, created_at, updated_at;
//         `,
//         [userId]
//     );

//     return created.rows[0];
// }

// // Lấy tất cả item trong giỏ của user (join sang book để FE hiển thị)
// async function listItemsOfUser(userId) {
//     const { rows } = await pool.query(
//         `
//         SELECT
//             ci.id AS cart_item_id,
//             ci.cart_id,
//             ci.book_id,
//             ci.quantity,
//             ci.price_snapshot,
//             b.title,
//             b.image_url,
//             b.price AS book_price
//         FROM bookstore.cart c
//         JOIN bookstore.cart_items ci ON ci.cart_id = c.id
//         JOIN bookstore.book b ON b.id = ci.book_id
//         WHERE c.user_id = $1
//           AND c.status = 'active'
//         ORDER BY ci.created_at DESC;
//         `,
//         [userId]
//     );
//     return rows;
// }

// // Thêm hoặc tăng số lượng 1 sản phẩm trong giỏ
// async function upsertCartItem(cartId, bookId, quantity, priceSnapshot) {
//     // chốt giá: nếu không truyền snapshot thì lấy từ book
//     let finalPrice = priceSnapshot;

//     if (finalPrice == null) {
//         const bookRes = await pool.query(
//             `SELECT price FROM bookstore.book WHERE id = $1`,
//             [bookId]
//         );
//         if (!bookRes.rows[0]) {
//             const err = new Error("BOOK_NOT_FOUND");
//             throw err;
//         }
//         finalPrice = bookRes.rows[0].price;
//     }

//     const { rows } = await pool.query(
//         `
//         INSERT INTO bookstore.cart_items (cart_id, book_id, quantity, price_snapshot, created_at)
//         VALUES ($1, $2, $3, $4, NOW())
//         ON CONFLICT (cart_id, book_id)
//         DO UPDATE SET quantity = bookstore.cart_items.quantity + EXCLUDED.quantity
//         RETURNING *;
//         `,
//         [cartId, bookId, quantity, finalPrice]
//     );

//     return rows[0];
// }

// // Cập nhật số lượng
// async function updateCartItemQuantity(cartItemId, quantity) {
//     const { rows } = await pool.query(
//         `
//         UPDATE bookstore.cart_items
//         SET quantity = $1
//         WHERE id = $2
//         RETURNING *;
//         `,
//         [quantity, cartItemId]
//     );
//     return rows[0];
// }

// // Xóa 1 item
// async function deleteCartItem(cartItemId) {
//     await pool.query(
//         `DELETE FROM bookstore.cart_items WHERE id = $1`,
//         [cartItemId]
//     );
// }

// // Xóa toàn bộ giỏ của user
// async function clearCartOfUser(userId) {
//     const { rows } = await pool.query(
//         `SELECT id FROM bookstore.cart WHERE user_id = $1 AND status = 'active' LIMIT 1`,
//         [userId]
//     );
//     if (!rows[0]) return;

//     const cartId = rows[0].id;
//     await pool.query(
//         `DELETE FROM bookstore.cart_items WHERE cart_id = $1`,
//         [cartId]
//     );
// }

// module.exports = {
//     getOrCreateActiveCart,
//     listItemsOfUser,
//     upsertCartItem,
//     updateCartItemQuantity,
//     deleteCartItem,
//     clearCartOfUser,
// };
// backend/models/cart.model.js
const { pool } = require("../config/db.config");

// (SAO CHÉP TỪ book.model.js)
// Định nghĩa câu truy vấn JOIN flash sale (ĐÃ SỬA LỖI QUALIFY)
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

// Lấy cart đang active của user, nếu chưa có thì tạo mới
async function getOrCreateActiveCart(userId) {
    const found = await pool.query(
        `
    SELECT id, user_id, status, created_at, updated_at
    FROM bookstore.cart
    WHERE user_id = $1 AND status = 'active'
    LIMIT 1;
    `,
        [userId]
    );

    if (found.rows.length > 0) return found.rows[0];

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

// (SỬA LỖI) Lấy tất cả item trong giỏ của user (join sang book và logic sale)
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
      b.price AS book_price,
      
      -- Lấy giá sale từ logic join (nếu có)
      sale.active_flashsale->>'sale_price' AS book_sale_price,
      
      -- Giá hiệu lực
      COALESCE((sale.active_flashsale->>'sale_price')::numeric, b.price) AS effective_price
      
    FROM bookstore.cart c
    JOIN bookstore.cart_items ci ON ci.cart_id = c.id
    JOIN bookstore.book b ON b.id = ci.book_id
    ${ACTIVE_FLASH_SALE_JOIN} -- Join logic flash sale
    WHERE c.user_id = $1
      AND c.status = 'active'
    ORDER BY ci.created_at DESC;
    `,
        [userId]
    );
    return rows;
}

// (SỬA LỖI) Thêm hoặc tăng số lượng 1 sản phẩm trong giỏ
async function upsertCartItem(cartId, bookId, quantity, priceSnapshot) {
    let finalPrice = priceSnapshot;

    if (finalPrice == null) {
        // Chốt giá theo giá hiệu lực tại thời điểm thêm
        const bookRes = await pool.query(
            `
            SELECT 
                b.price, 
                sale.active_flashsale->>'sale_price' AS sale_price
            FROM bookstore.book b
            ${ACTIVE_FLASH_SALE_JOIN} -- Join logic flash sale
            WHERE b.id = $1
            `,
            [bookId]
        );
        const book = bookRes.rows[0];
        if (!book) {
            const err = new Error("BOOK_NOT_FOUND");
            throw err;
        }
        // Ưu tiên giá sale (nếu có), nếu không thì dùng giá gốc
        finalPrice = book.sale_price ? Number(book.sale_price) : book.price;
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
    await pool.query(`DELETE FROM bookstore.cart_items WHERE id = $1`, [cartItemId]);
}

// Xóa toàn bộ giỏ của user
async function clearCartOfUser(userId) {
    const { rows } = await pool.query(
        `SELECT id FROM bookstore.cart WHERE user_id = $1 AND status = 'active' LIMIT 1`,
        [userId]
    );
    if (!rows[0]) return;

    const cartId = rows[0].id;
    await pool.query(`DELETE FROM bookstore.cart_items WHERE cart_id = $1`, [cartId]);
}

module.exports = {
    getOrCreateActiveCart,
    listItemsOfUser,
    upsertCartItem,
    updateCartItemQuantity,
    deleteCartItem,
    clearCartOfUser,
};