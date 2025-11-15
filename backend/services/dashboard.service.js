// // backend/services/dashboard.service.js
// const { query } = require("../config/db.config");

// const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered", "refunded"];

// function toNumber(value) {
//     const n = Number(value);
//     return Number.isFinite(n) ? n : 0;
// }
// function toInt(value) {
//     const n = parseInt(value, 10);
//     return Number.isFinite(n) ? n : 0;
// }

// const DashboardService = {
//     async adminOverview() {
//         // 1) Doanh thu theo ngày trong tháng hiện tại
//         const revenuePromise = query(
//             `
//       SELECT to_char(day::date, 'DD') AS d,
//              COALESCE(SUM(o.grand_total), 0) AS amount
//       FROM generate_series(
//                date_trunc('month', CURRENT_DATE),
//                CURRENT_DATE,
//                interval '1 day'
//            ) AS day
//       LEFT JOIN "order" o
//              ON DATE(o.placed_at) = day::date
//             AND o.status = ANY($1::text[])
//       GROUP BY day
//       ORDER BY day
//       `,
//             [REVENUE_STATUSES]
//         );

//         // 2) Phân bố trạng thái đơn 30 ngày gần nhất
//         const statusDistPromise = query(
//             `
//       SELECT o.status AS name, COUNT(*)::int AS value
//       FROM "order" o
//       WHERE o.placed_at >= (CURRENT_DATE - INTERVAL '30 days')
//       GROUP BY o.status
//       ORDER BY value DESC
//       `
//         );

//         // 3) Top sách bán chạy 30 ngày gần nhất
//         const topBooksPromise = query(
//             `
//       SELECT b.id,
//              b.title,
//              COALESCE(SUM(od.quantity), 0)::int AS qty
//       FROM order_details od
//       JOIN "order" o ON o.id = od.order_id
//       JOIN book b     ON b.id = od.book_id
//       WHERE o.placed_at >= (CURRENT_DATE - INTERVAL '30 days')
//         AND o.status = ANY($1::text[])
//       GROUP BY b.id, b.title
//       ORDER BY qty DESC
//       LIMIT 6
//       `,
//             [REVENUE_STATUSES]
//         );

//         // 4) Sách sắp hết hàng
//         const lowStockPromise = query(
//             `SELECT COUNT(*)::int AS count FROM book WHERE stock IS NOT NULL AND stock <= $1`,
//             [5]
//         );

//         // 5) Khách hàng mới trong tháng hiện tại
//         const newCustomersPromise = query(
//             `
//       SELECT COUNT(*)::int AS count
//       FROM "user"
//       WHERE created_at >= date_trunc('month', CURRENT_DATE)
//       `
//         );

//         // 6) Đơn hàng gần đây
//         const recentOrdersPromise = query(
//             `
//       SELECT o.id,
//              o.grand_total,
//              o.placed_at,
//              o.status,
//              u.name  AS customer_name,
//              u.email AS customer_email
//       FROM "order" o
//       JOIN "user" u ON u.id = o.user_id
//       ORDER BY o.placed_at DESC
//       LIMIT 5
//       `
//         );

//         // 7) Đánh giá gần đây (đã đổi bảng product_review -> review)
//         const recentReviewsPromise = query(
//             `
//       SELECT r.id,
//              r.rating,
//              r.content,
//              r.created_at,
//              u.name  AS user_name,
//              b.title AS book_title
//       FROM bookstore.review r
//       JOIN "user" u ON u.id = r.user_id
//       JOIN book b   ON b.id = r.book_id
//       WHERE r.parent_id IS NULL
//         AND r.is_deleted = FALSE
//       ORDER BY r.created_at DESC
//       LIMIT 5
//       `
//         );

//         const [
//             revenueRes,
//             statusRes,
//             topBooksRes,
//             lowStockRes,
//             newCustomersRes,
//             recentOrdersRes,
//             recentReviewsRes,
//         ] = await Promise.all([
//             revenuePromise,
//             statusDistPromise,
//             topBooksPromise,     // <— tên đúng
//             lowStockPromise,
//             newCustomersPromise,
//             recentOrdersPromise,
//             recentReviewsPromise,
//         ]);

//         return {
//             revenueByDay: revenueRes.rows.map((row) => ({
//                 d: row.d,
//                 amount: toNumber(row.amount),
//             })),
//             orderStatusDist: statusRes.rows.map((row) => ({
//                 name: row.name,
//                 value: toInt(row.value),
//             })),
//             topBooks: topBooksRes.rows.map((row) => ({
//                 title: row.title,
//                 qty: toInt(row.qty),
//             })),
//             lowStockCount: toInt(lowStockRes.rows?.[0]?.count),
//             newCustomers: toInt(newCustomersRes.rows?.[0]?.count),
//             recentOrders: recentOrdersRes.rows.map((row) => ({
//                 code: row.id,
//                 value: toNumber(row.grand_total),
//                 createdAt: row.placed_at,
//                 status: row.status,
//                 customer: {
//                     name: row.customer_name,
//                     email: row.customer_email,
//                 },
//             })),
//             recentReviews: recentReviewsRes.rows.map((row) => ({
//                 user: row.user_name,
//                 book: row.book_title,
//                 rating: toNumber(row.rating),
//                 content: row.content,
//                 createdAt: row.created_at,
//             })),
//         };
//     },
// };

// module.exports = DashboardService;

// backend/services/dashboard.service.js
const { query } = require("../config/db.config");

const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered", "refunded"];
const FULFILLED_STATUSES = ["shipped", "delivered"];
const SALES_STATUSES = ["paid", "processing", "shipped", "delivered"];

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE = new Map();

// ========= Helper functions =========
function toNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function toInt(value, fallback = 0) {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : fallback;
}

function round(value, digits = 2) {
    if (!Number.isFinite(value)) return 0;
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function asISODate(date) {
    return date.toISOString().slice(0, 10);
}

function parseDate(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Resolve range dựa vào:
 * - range: "7d" | "30d" | "90d" | "365d" | "month" | "quarter" | "year"
 * - hoặc start, end (yyyy-mm-dd)
 */
function resolveRange({ range = "30d", start, end }) {
    const now = new Date();
    let startDate;
    let endDate;

    const parsedStart = parseDate(start);
    const parsedEnd = parseDate(end);

    // Nếu có start & end hợp lệ => ưu tiên
    if (parsedStart && parsedEnd) {
        startDate = startOfDay(parsedStart);
        endDate = startOfDay(parsedEnd);
    } else {
        const endCandidate = startOfDay(now);
        let days = 30;

        switch (String(range)) {
            case "7d":
                days = 7;
                break;
            case "90d":
                days = 90;
                break;
            case "365d":
            case "year":
                days = 365;
                break;
            case "month": {
                startDate = startOfDay(
                    new Date(endCandidate.getFullYear(), endCandidate.getMonth(), 1)
                );
                endDate = endCandidate;
                break;
            }
            case "quarter": {
                const currentQuarter = Math.floor(endCandidate.getMonth() / 3);
                startDate = startOfDay(
                    new Date(endCandidate.getFullYear(), currentQuarter * 3, 1)
                );
                endDate = endCandidate;
                break;
            }
            default:
                days = 30;
        }

        if (!startDate || !endDate) {
            endDate = endCandidate;
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - (days - 1));
        }
    }

    // Nếu start > end thì swap lại
    if (startDate > endDate) {
        const tmp = startDate;
        startDate = endDate;
        endDate = tmp;
    }

    const rangeLength = Math.max(
        1,
        Math.round((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1
    );

    // Khoảng trước đó (cùng độ dài)
    const previousEnd = new Date(startDate);
    previousEnd.setDate(previousEnd.getDate() - 1);
    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousEnd.getDate() - (rangeLength - 1));

    const label = `${asISODate(startDate)} → ${asISODate(endDate)}`;

    return {
        startDate: asISODate(startDate),
        endDate: asISODate(endDate),
        previousStart: asISODate(previousStart),
        previousEnd: asISODate(previousEnd),
        label,
        rangeLength,
    };
}

//Tab “Chiến dịch & khuyến mãi”
async function fetchFlashsalePerformance(meta, params) {
    const sql = `
        SELECT
            fs.id,
            fs.name,
            fs.start_time,
            fs.end_time,
            fs.is_active,
            COALESCE(SUM(fi.sale_quantity), 0)::int        AS total_quantity,
            COALESCE(SUM(fi.sold_quantity), 0)::int        AS sold_quantity,
            COALESCE(SUM(fi.sold_quantity * fi.sale_price), 0)::numeric AS revenue
        FROM bookstore.flashsale fs
        LEFT JOIN bookstore.flashsale_items fi
            ON fi.flashsale_id = fs.id
        WHERE fs.start_time <= $2::timestamptz
          AND fs.end_time   >= $1::timestamptz
        GROUP BY fs.id, fs.name, fs.start_time, fs.end_time, fs.is_active
        ORDER BY fs.start_time DESC
        LIMIT 10;
    `;
    const { rows } = await query(sql, params);
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        startTime: r.start_time,
        endTime: r.end_time,
        isActive: r.is_active,
        totalQuantity: toInt(r.total_quantity),
        soldQuantity: toInt(r.sold_quantity),
        revenue: Number(r.revenue) || 0,
        soldRate: (toInt(r.total_quantity) > 0)
            ? round(toInt(r.sold_quantity) / toInt(r.total_quantity) * 100, 1)
            : 0,
    }));
}

async function fetchCouponPerformance(meta, params) {
    const sql = `
        SELECT
            c.id,
            c.code,
            c.description,
            c.type,
            c.value,
            COUNT(cr.id)::int AS uses,
            COALESCE(SUM(o.grand_total), 0)::numeric AS revenue
        FROM coupon c
        LEFT JOIN coupon_redemption cr ON cr.coupon_id = c.id
        LEFT JOIN "order" o ON o.id = cr.order_id
        WHERE cr.used_at >= $1::timestamptz
          AND cr.used_at <= $2::timestamptz
        GROUP BY c.id, c.code, c.description, c.type, c.value
        ORDER BY uses DESC, revenue DESC
        LIMIT 10;
    `;
    const { rows } = await query(sql, params);
    return rows.map(r => ({
        id: r.id,
        code: r.code,
        description: r.description,
        type: r.type,
        value: Number(r.value) || 0,
        uses: toInt(r.uses),
        revenue: Number(r.revenue) || 0,
    }));
}


// ========= Caching =========
function cacheKey(type, meta) {
    return `${type}:${meta.startDate}:${meta.endDate}`;
}

function getCached(type, meta) {
    const key = cacheKey(type, meta);
    const record = CACHE.get(key);
    if (record && record.expiresAt > Date.now()) {
        return record.value;
    }
    CACHE.delete(key);
    return null;
}

function setCached(type, meta, value) {
    const key = cacheKey(type, meta);
    CACHE.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ========= Instrumentation =========
async function instrument(name, fn) {
    const started = Date.now();
    try {
        return await fn();
    } finally {
        const duration = Date.now() - started;
        console.log(`[DashboardService] ${name} took ${duration}ms`);
    }
}

// ========= Metric helpers =========
function buildMetric(current, previous) {
    const delta = current - previous;
    const deltaPercent = previous ? (delta / previous) * 100 : null;
    return {
        current,
        previous,
        delta,
        deltaPercent: deltaPercent == null ? null : round(deltaPercent, 2),
    };
}

function toDateRangeParams(meta) {
    return [meta.startDate, `${meta.endDate} 23:59:59.999`];
}

function toPrevRangeParams(meta) {
    return [meta.previousStart, `${meta.previousEnd} 23:59:59.999`];
}

// ========= Query helpers =========
async function fetchRevenueSeries(meta) {
    const sql = `
        WITH series AS (
            SELECT generate_series($1::date, $2::date, '1 day')::date AS day
        )
        SELECT
            to_char(series.day, 'YYYY-MM-DD') AS day,
            COALESCE(SUM(CASE WHEN o.status::text = ANY($3::text[]) THEN o.grand_total ELSE 0 END), 0)::numeric AS revenue,
            COALESCE(SUM(CASE WHEN o.status = 'refunded' THEN o.grand_total ELSE 0 END), 0)::numeric AS refunded,
            COUNT(o.id)::int AS orders
        FROM series
        LEFT JOIN "order" o
            ON DATE(o.placed_at) = series.day
           AND o.placed_at >= $1
           AND o.placed_at <= $2
        GROUP BY series.day
        ORDER BY series.day;
    `;
    const { rows } = await query(sql, [
        meta.startDate,
        meta.endDate,
        REVENUE_STATUSES,
    ]);
    return rows.map((row) => ({
        day: row.day,
        revenue: Number(row.revenue) || 0,
        refunded: Number(row.refunded) || 0,
        orders: toInt(row.orders),
    }));
}

async function fetchTotals(meta, params) {
    const sql = `
        SELECT
            COALESCE(SUM(CASE WHEN status::text = ANY($3::text[]) THEN grand_total ELSE 0 END), 0)::numeric AS revenue,
            COALESCE(SUM(CASE WHEN status = 'refunded' THEN grand_total ELSE 0 END), 0)::numeric AS refunded,
            COUNT(*)::int AS orders
        FROM "order"
        WHERE placed_at >= $1
          AND placed_at <= $2;
    `;
    const { rows } = await query(sql, [...params, REVENUE_STATUSES]);
    return {
        revenue: Number(rows[0]?.revenue) || 0,
        refunded: Number(rows[0]?.refunded) || 0,
        orders: toInt(rows[0]?.orders),
    };
}

async function fetchRepeatCustomers(meta, params) {
    const sql = `
        WITH scoped AS (
            SELECT
                o.id,
                o.user_id,
                o.placed_at,
                EXISTS (
                    SELECT 1
                    FROM "order" prev
                    WHERE prev.user_id = o.user_id
                      AND prev.placed_at < $1
                      AND prev.status <> 'cancelled'
                    LIMIT 1
                ) AS has_previous
            FROM "order" o
            WHERE o.placed_at >= $1
              AND o.placed_at <= $2
              AND o.status <> 'cancelled'
        )
        SELECT
            COUNT(*)::int AS total_orders,
            COUNT(*) FILTER (WHERE has_previous)::int AS repeat_orders
        FROM scoped;
    `;
    const { rows } = await query(sql, params);
    const total = toInt(rows[0]?.total_orders);
    const repeat = toInt(rows[0]?.repeat_orders);
    return { total, repeat };
}

async function fetchFulfillmentHours(meta, params) {
    const sql = `
        SELECT
            AVG(EXTRACT(EPOCH FROM (o.updated_at - o.placed_at)) / 3600.0) AS hours,
            COUNT(*)::int AS total
        FROM "order" o
        WHERE o.placed_at >= $1
          AND o.placed_at <= $2
          AND o.status::text = ANY($3::text[])
          AND o.updated_at IS NOT NULL
          AND o.placed_at IS NOT NULL;
    `;
    const { rows } = await query(sql, [...params, FULFILLED_STATUSES]);
    return {
        hours: Number(rows[0]?.hours) || 0,
        total: toInt(rows[0]?.total),
    };
}

async function fetchOrderStatus(meta, params) {
    const sql = `
        SELECT o.status AS name, COUNT(*)::int AS value
        FROM "order" o
        WHERE o.placed_at >= $1
          AND o.placed_at <= $2
        GROUP BY o.status
        ORDER BY value DESC;
    `;
    const { rows } = await query(sql, params);
    return rows.map((row) => ({ name: row.name, value: toInt(row.value) }));
}

async function fetchTopBooks(meta, params) {
    const sql = `
        SELECT b.id, b.title, COALESCE(SUM(od.quantity), 0)::int AS qty
        FROM order_details od
        JOIN "order" o ON o.id = od.order_id
        JOIN bookstore.book b ON b.id = od.book_id
        WHERE o.placed_at >= $1
          AND o.placed_at <= $2
          AND o.status::text = ANY($3::text[])
        GROUP BY b.id, b.title
        ORDER BY qty DESC
        LIMIT 6;
    `;
    const { rows } = await query(sql, [...params, SALES_STATUSES]);
    return rows.map((row) => ({ title: row.title, qty: toInt(row.qty) }));
}

async function fetchLowStock() {
    const sql = `
        SELECT COUNT(*)::int AS count
        FROM bookstore.book
        WHERE stock IS NOT NULL AND stock <= $1
    `;
    const { rows } = await query(sql, [5]);
    return toInt(rows[0]?.count);
}

async function fetchNewCustomers(meta, params) {
    const sql = `
        SELECT COUNT(*)::int AS count
        FROM "user"
        WHERE created_at >= $1::date
          AND created_at <= $2::timestamp;
    `;
    const { rows } = await query(sql, params);
    return toInt(rows[0]?.count);
}

async function fetchRecentOrders() {
    const sql = `
        SELECT o.id,
               o.grand_total,
               o.placed_at,
               o.status,
               u.name AS customer_name,
               u.email AS customer_email
        FROM "order" o
        JOIN "user" u ON u.id = o.user_id
        ORDER BY o.placed_at DESC
        LIMIT 5;
    `;
    const { rows } = await query(sql);
    return rows.map((row) => ({
        code: row.id,
        value: Number(row.grand_total) || 0,
        createdAt: row.placed_at,
        status: row.status,
        customer: {
            name: row.customer_name,
            email: row.customer_email,
        },
    }));
}

async function fetchRecentReviews() {
    const sql = `
        SELECT r.id,
               r.rating,
               r.content,
               r.created_at,
               u.name AS user_name,
               b.title AS book_title
        FROM bookstore.review r
        JOIN "user" u ON u.id = r.user_id
        JOIN bookstore.book b ON b.id = r.book_id
        ORDER BY r.created_at DESC
        LIMIT 5;
    `;
    const { rows } = await query(sql);
    return rows.map((row) => ({
        user: row.user_name,
        book: row.book_title,
        rating: Number(row.rating) || 0,
        content: row.content,
        createdAt: row.created_at,
    }));
}

async function fetchAlerts(meta, params) {
    const pendingSql = `
        SELECT COUNT(*)::int AS cnt
        FROM "order"
        WHERE status = 'pending'
          AND placed_at >= $1
          AND placed_at <= $2;
    `;
    const cancelledSql = `
        SELECT COUNT(*)::int AS cnt
        FROM "order"
        WHERE status = 'cancelled'
          AND placed_at >= $1
          AND placed_at <= $2;
    `;
    const [pendingRes, cancelledRes] = await Promise.all([
        query(pendingSql, params),
        query(cancelledSql, params),
    ]);

    const pending = toInt(pendingRes.rows?.[0]?.cnt);
    const cancelled = toInt(cancelledRes.rows?.[0]?.cnt);
    const alerts = [];

    if (pending > 0) {
        alerts.push({
            type: "pending_orders",
            label: "Đơn hàng chờ xử lý",
            count: pending,
            severity: "warning",
            href: "/admin/orders?status=pending",
        });
    }

    if (cancelled > 0) {
        alerts.push({
            type: "cancelled_orders",
            label: "Đơn hàng bị hủy",
            count: cancelled,
            severity: cancelled > pending ? "danger" : "info",
            href: "/admin/orders?status=cancelled",
        });
    }

    const lowStockCount = await fetchLowStock();
    if (lowStockCount > 0) {
        alerts.push({
            type: "low_stock",
            label: "Sản phẩm sắp hết hàng",
            count: lowStockCount,
            severity: "danger",
            href: "/admin/books?filter=low-stock",
        });
    }

    return { alerts, lowStockCount };
}

async function fetchTopCategories(meta, params) {
    const sql = `
        SELECT c.id,
               c.name,
               COALESCE(SUM(od.quantity), 0)::int AS qty
        FROM order_details od
        JOIN "order" o ON o.id = od.order_id
        JOIN bookstore.book b ON b.id = od.book_id
        JOIN bookstore.books_categories bc ON bc.book_id = b.id
        JOIN bookstore.category c ON c.id = bc.category_id
        WHERE o.placed_at >= $1
          AND o.placed_at <= $2
          AND o.status::text = ANY($3::text[])
        GROUP BY c.id, c.name
        ORDER BY qty DESC
        LIMIT 8;
    `;
    const { rows } = await query(sql, [...params, SALES_STATUSES]);
    return rows.map((row) => ({ name: row.name, qty: toInt(row.qty) }));
}

async function fetchTopAuthors(meta, params) {
    const sql = `
        SELECT COALESCE(NULLIF(b.author, ''), 'Không xác định') AS author,
               COALESCE(SUM(od.quantity), 0)::int AS qty,
               COALESCE(SUM(od.quantity * od.price_snapshot), 0)::numeric AS revenue
        FROM order_details od
        JOIN "order" o ON o.id = od.order_id
        JOIN bookstore.book b ON b.id = od.book_id
        WHERE o.placed_at >= $1
          AND o.placed_at <= $2
          AND o.status::text = ANY($3::text[])
        GROUP BY author
        ORDER BY revenue DESC
        LIMIT 8;
    `;
    const { rows } = await query(sql, [...params, SALES_STATUSES]);
    return rows.map((row) => ({
        author: row.author,
        qty: toInt(row.qty),
        revenue: Number(row.revenue) || 0,
    }));
}

async function fetchInventoryVelocity(meta, params) {
    const sql = `
        WITH sales AS (
            SELECT b.id,
                   b.title,
                   b.stock,
                   COALESCE(SUM(od.quantity), 0)::int AS sold
            FROM bookstore.book b
            LEFT JOIN order_details od ON od.book_id = b.id
            LEFT JOIN "order" o
                   ON o.id = od.order_id
                  AND o.placed_at >= $1
                  AND o.placed_at <= $2
                  AND o.status::text = ANY($3::text[])
            GROUP BY b.id, b.title, b.stock
        )
        SELECT id, title, stock, sold,
               CASE
                   WHEN (stock + sold) = 0 THEN 0
                   ELSE sold::numeric / (stock + sold)
               END AS velocity
        FROM sales
        ORDER BY velocity DESC
        LIMIT 10;
    `;
    const { rows } = await query(sql, [...params, SALES_STATUSES]);
    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        stock: toInt(row.stock),
        sold: toInt(row.sold),
        velocity: round(Number(row.velocity) || 0, 3),
    }));
}

async function fetchSlowMovers(meta, params) {
    const sql = `
        SELECT b.id,
               b.title,
               b.stock,
               COALESCE(SUM(od.quantity), 0)::int AS sold
        FROM bookstore.book b
        LEFT JOIN order_details od ON od.book_id = b.id
        LEFT JOIN "order" o
               ON o.id = od.order_id
              AND o.placed_at >= $1
              AND o.placed_at <= $2
              AND o.status::text = ANY($3::text[])
        GROUP BY b.id, b.title, b.stock
        HAVING COALESCE(SUM(od.quantity), 0) < 3 AND COALESCE(b.stock, 0) > 0
        ORDER BY b.stock DESC
        LIMIT 6;
    `;
    const { rows } = await query(sql, [...params, SALES_STATUSES]);
    return rows.map((row) => ({
        id: row.id,
        title: row.title,
        stock: toInt(row.stock),
        sold: toInt(row.sold),
    }));
}

async function fetchCohorts(meta) {
    const sql = `
        WITH scoped AS (
            SELECT
                o.user_id,
                date_trunc('month', o.placed_at) AS month,
                MIN(o.placed_at) OVER (PARTITION BY o.user_id) AS first_order_at
            FROM "order" o
            WHERE o.placed_at >= ($1::date - INTERVAL '5 months')
              AND o.placed_at <= ($1::date + INTERVAL '1 day' - INTERVAL '1 millisecond')
              AND o.status <> 'cancelled'
        )
        SELECT
            to_char(month, 'YYYY-MM') AS month,
            COUNT(DISTINCT CASE WHEN date_trunc('month', first_order_at) = month THEN user_id END)::int AS new_customers,
            COUNT(DISTINCT CASE WHEN date_trunc('month', first_order_at) < month THEN user_id END)::int AS repeat_customers
        FROM scoped
        GROUP BY month
        ORDER BY month;
    `;

    // chỉ cần truyền meta.endDate, ví dụ "2025-09-14"
    const { rows } = await query(sql, [meta.endDate]);

    return rows.map((row) => ({
        month: row.month,
        newCustomers: toInt(row.new_customers),
        repeatCustomers: toInt(row.repeat_customers),
    }));
}


async function fetchInactiveCustomers(meta) {
    const sql = `
        SELECT COUNT(*)::int AS cnt
        FROM "user" u
        LEFT JOIN LATERAL (
            SELECT MAX(o.placed_at) AS last_order_at
            FROM "order" o
            WHERE o.user_id = u.id
              AND o.status <> 'cancelled'
        ) last ON true
        WHERE last.last_order_at IS NULL OR last.last_order_at < $1;
    `;
    const { rows } = await query(sql, [`${meta.startDate} 00:00:00`]);
    return toInt(rows[0]?.cnt);
}

async function fetchRepeatCustomersCount(meta) {
    const sql = `
        SELECT COUNT(DISTINCT o.user_id)::int AS repeat_customers
        FROM "order" o
        WHERE o.placed_at >= $1
          AND o.placed_at <= $2
          AND o.status <> 'cancelled'
          AND EXISTS (
              SELECT 1
              FROM "order" prev
              WHERE prev.user_id = o.user_id
                AND prev.placed_at < $1
                AND prev.status <> 'cancelled'
              LIMIT 1
          );
    `;
    const { rows } = await query(sql, [
        meta.startDate,
        `${meta.endDate} 23:59:59.999`,
    ]);
    return toInt(rows[0]?.repeat_customers);
}

async function fetchAtRiskCustomers(meta) {
    const sql = `
        SELECT u.id,
               u.name,
               u.email,
               MAX(o.placed_at) AS last_order_at,
               COUNT(o.id)::int AS total_orders
        FROM "user" u
        JOIN "order" o ON o.user_id = u.id
        WHERE o.status <> 'cancelled'
        GROUP BY u.id, u.name, u.email
        HAVING MAX(o.placed_at) < $1::date - INTERVAL '30 days'
           AND MAX(o.placed_at) >= $2::date - INTERVAL '120 days'
        ORDER BY MAX(o.placed_at) ASC
        LIMIT 5;
    `;
    const { rows } = await query(sql, [meta.endDate, meta.endDate]);
    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        lastOrderAt: row.last_order_at,
        totalOrders: toInt(row.total_orders),
    }));
}


async function fetchFlashsalePerformance(meta, params) {
    const sql = `
        SELECT
            fs.id,
            fs.name,
            fs.start_time,
            fs.end_time,
            fs.is_active,
            COALESCE(SUM(fi.sale_quantity), 0)::int        AS total_quantity,
            COALESCE(SUM(fi.sold_quantity), 0)::int        AS sold_quantity,
            COALESCE(SUM(fi.sold_quantity * fi.sale_price), 0)::numeric AS revenue
        FROM bookstore.flashsale fs
        LEFT JOIN bookstore.flashsale_items fi
            ON fi.flashsale_id = fs.id
        WHERE fs.start_time <= $2::timestamptz
          AND fs.end_time   >= $1::timestamptz
        GROUP BY fs.id, fs.name, fs.start_time, fs.end_time, fs.is_active
        ORDER BY fs.start_time DESC
        LIMIT 10;
    `;
    const { rows } = await query(sql, params);
    return rows.map(r => ({
        id: r.id,
        name: r.name,
        startTime: r.start_time,
        endTime: r.end_time,
        isActive: r.is_active,
        totalQuantity: toInt(r.total_quantity),
        soldQuantity: toInt(r.sold_quantity),
        revenue: Number(r.revenue) || 0,
        soldRate: (toInt(r.total_quantity) > 0)
            ? round(toInt(r.sold_quantity) / toInt(r.total_quantity) * 100, 1)
            : 0,
    }));
}

async function fetchCouponPerformance(meta, params) {
    const sql = `
        SELECT
            c.id,
            c.code,
            c.description,
            c.type,
            c.value,
            COUNT(cr.id)::int AS uses,
            COALESCE(SUM(o.grand_total), 0)::numeric AS revenue
        FROM coupon c
        LEFT JOIN coupon_redemption cr ON cr.coupon_id = c.id
        LEFT JOIN "order" o ON o.id = cr.order_id
        WHERE cr.used_at >= $1::timestamptz
          AND cr.used_at <= $2::timestamptz
        GROUP BY c.id, c.code, c.description, c.type, c.value
        ORDER BY uses DESC, revenue DESC
        LIMIT 10;
    `;
    const { rows } = await query(sql, params);
    return rows.map(r => ({
        id: r.id,
        code: r.code,
        description: r.description,
        type: r.type,
        value: Number(r.value) || 0,
        uses: toInt(r.uses),
        revenue: Number(r.revenue) || 0,
    }));
}


// ========= Service =========
const DashboardService = {
    resolveRange,

    async adminOverview(options = {}) {
        const meta = resolveRange(options);
        const cached = getCached("overview", meta);
        if (cached) return cached;

        const params = toDateRangeParams(meta);
        const prevParams = toPrevRangeParams(meta);

        const result = await instrument("adminOverview", async () => {
            const [
                revenueSeries,
                prevRevenueSeries,
                totals,
                prevTotals,
                repeat,
                prevRepeat,
                fulfillment,
                prevFulfillment,
                statusDist,
                topBooks,
                { alerts, lowStockCount },
                newCustomers,
                recentOrders,
                recentReviews,
            ] = await Promise.all([
                fetchRevenueSeries(meta),
                fetchRevenueSeries({
                    startDate: meta.previousStart,
                    endDate: meta.previousEnd,
                }),
                fetchTotals(meta, params),
                fetchTotals(meta, prevParams),
                fetchRepeatCustomers(meta, params),
                fetchRepeatCustomers(
                    { startDate: meta.previousStart, endDate: meta.previousEnd },
                    prevParams
                ),
                fetchFulfillmentHours(meta, params),
                fetchFulfillmentHours(
                    { startDate: meta.previousStart, endDate: meta.previousEnd },
                    prevParams
                ),
                fetchOrderStatus(meta, params),
                fetchTopBooks(meta, params),
                fetchAlerts(meta, params),
                fetchNewCustomers(meta, params),
                fetchRecentOrders(),
                fetchRecentReviews(),
            ]);

            const revenueMetric = buildMetric(totals.revenue, prevTotals.revenue);
            const ordersMetric = buildMetric(totals.orders, prevTotals.orders);

            const avgOrderValueMetric = buildMetric(
                totals.orders ? totals.revenue / totals.orders : 0,
                prevTotals.orders ? prevTotals.revenue / prevTotals.orders : 0
            );

            const netRevenueCurrent = totals.revenue - totals.refunded;
            const netRevenuePrevious = prevTotals.revenue - prevTotals.refunded;
            const netRevenueMetric = buildMetric(
                netRevenueCurrent,
                netRevenuePrevious
            );

            const repeatRateCurrent = repeat.total
                ? (repeat.repeat / repeat.total) * 100
                : 0;
            const repeatRatePrevious = prevRepeat.total
                ? (prevRepeat.repeat / prevRepeat.total) * 100
                : 0;
            const repeatRateMetric = buildMetric(
                round(repeatRateCurrent, 2),
                round(repeatRatePrevious, 2)
            );

            const fulfillmentCurrent = round(fulfillment.hours || 0, 2);
            const fulfillmentPrevious = round(prevFulfillment.hours || 0, 2);
            const fulfillmentMetric = buildMetric(
                fulfillmentCurrent,
                fulfillmentPrevious
            );

            return {
                range: meta,
                summary: {
                    revenue: revenueMetric,
                    orders: ordersMetric,
                    avgOrderValue: avgOrderValueMetric,
                    netRevenue: netRevenueMetric,
                    repeatCustomerRate: repeatRateMetric,
                    fulfillmentTimeHours: fulfillmentMetric,
                },
                revenueByDay: revenueSeries,
                previousRevenueByDay: prevRevenueSeries,
                orderStatusDist: statusDist,
                topBooks,
                lowStockCount,
                newCustomers,
                alerts,
                recentOrders,
                recentReviews,
            };
        });

        setCached("overview", meta, result);
        return result;
    },

    async productAnalytics(options = {}) {
        const meta = resolveRange(options);
        const cached = getCached("product", meta);
        if (cached) return cached;

        const params = toDateRangeParams(meta);

        const result = await instrument("productAnalytics", async () => {
            const [topCategories, topAuthors, inventoryVelocity, slowMovers] =
                await Promise.all([
                    fetchTopCategories(meta, params),
                    fetchTopAuthors(meta, params),
                    fetchInventoryVelocity(meta, params),
                    fetchSlowMovers(meta, params),
                ]);

            return {
                range: meta,
                topCategories,
                topAuthors,
                inventoryVelocity,
                slowMovers,
            };
        });

        setCached("product", meta, result);
        return result;
    },

    async customerAnalytics(options = {}) {
        const meta = resolveRange(options);
        const cached = getCached("customer", meta);
        if (cached) return cached;

        const result = await instrument("customerAnalytics", async () => {
            const [cohorts, inactiveCustomers, repeatCustomers, atRiskCustomers] =
                await Promise.all([
                    fetchCohorts(meta),
                    fetchInactiveCustomers(meta),
                    fetchRepeatCustomersCount(meta),
                    fetchAtRiskCustomers(meta),
                ]);

            return {
                range: meta,
                cohorts,
                inactiveCustomers,
                repeatCustomers,
                atRiskCustomers,
            };
        });

        setCached("customer", meta, result);
        return result;
    },

    async campaignAnalytics(options = {}) {
        const meta = resolveRange(options);
        const cached = getCached("campaigns", meta);
        if (cached) return cached;

        const params = toDateRangeParams(meta);

        const result = await instrument("campaignAnalytics", async () => {
            const [flashsales, coupons] = await Promise.all([
                fetchFlashsalePerformance(meta, params),
                fetchCouponPerformance(meta, params),
            ]);

            const totalFlashRevenue = flashsales.reduce((s, f) => s + (f.revenue || 0), 0);
            const totalCouponRevenue = coupons.reduce((s, c) => s + (c.revenue || 0), 0);

            return {
                range: meta,
                summary: {
                    flashsaleRevenue: totalFlashRevenue,
                    couponRevenue: totalCouponRevenue,
                    campaignRevenue: totalFlashRevenue + totalCouponRevenue,
                },
                flashsales,
                coupons,
            };
        });

        setCached("campaigns", meta, result);
        return result;
    },

};

module.exports = DashboardService;
