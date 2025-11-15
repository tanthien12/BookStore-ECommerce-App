// backend/controllers/admin.dashboard.controller.js
const DashboardService = require("../services/dashboard.service");

const DEFAULT_RANGE = "month";
const ALLOWED_RANGES = new Set(["7d", "30d", "month", "year"]);

/**
 * Chuẩn hoá range: nếu không hợp lệ thì dùng DEFAULT_RANGE
 */
function normalizeRange(range) {
    if (!range || typeof range !== "string") return DEFAULT_RANGE;
    const value = range.trim().toLowerCase();
    return ALLOWED_RANGES.has(value) ? value : DEFAULT_RANGE;
}

/**
 * Đọc query từ req và build options truyền xuống service
 * Ưu tiên start/end nếu service có hỗ trợ; nếu không sẽ bỏ qua ở tầng service.
 */
function buildOptionsFromQuery(req) {
    const { range, start, end } = req.query || {};
    const normalizedRange = normalizeRange(range);

    const options = { range: normalizedRange };

    if (start) options.start = start;
    if (end) options.end = end;

    return options;
}

module.exports = {
    /**
     * Tổng quan dashboard (doanh thu, trạng thái đơn, top sách, v.v.)
     * GET /admin/dashboard?range=30d&start=2025-01-01&end=2025-01-31
     */
    async overview(req, res, next) {
        try {
            const options = buildOptionsFromQuery(req);
            const data = await DashboardService.adminOverview(options);

            return res.status(200).json({
                success: true,
                message: "Dashboard overview fetched successfully",
                range: options.range,
                data,
            });
        } catch (error) {
            console.error("Dashboard overview error:", error);
            next(error);
        }
    },

    /**
     * Phân tích theo sản phẩm (nếu bạn đã/ sẽ implement trong DashboardService.productAnalytics)
     * Ví dụ: top sản phẩm theo doanh thu, tồn kho, tỉ lệ hoàn/hủy theo sách, v.v.
     * GET /admin/dashboard/products?range=30d
     */
    async products(req, res, next) {
        try {
            const options = buildOptionsFromQuery(req);
            const data = await DashboardService.productAnalytics(options);

            return res.status(200).json({
                success: true,
                message: "Product analytics fetched successfully",
                range: options.range,
                data,
            });
        } catch (error) {
            console.error("Dashboard product analytics error:", error);
            next(error);
        }
    },

    /**
     * Phân tích khách hàng (nếu bạn đã/ sẽ implement trong DashboardService.customerAnalytics)
     * Ví dụ: khách hàng mới, khách hàng trung thành, LTV, tần suất mua, v.v.
     * GET /admin/dashboard/customers?range=year
     */
    async customers(req, res, next) {
        try {
            const options = buildOptionsFromQuery(req);
            const data = await DashboardService.customerAnalytics(options);

            return res.status(200).json({
                success: true,
                message: "Customer analytics fetched successfully",
                range: options.range,
                data,
            });
        } catch (error) {
            console.error("Dashboard customer analytics error:", error);
            next(error);
        }
    },

    // ===Tab “Chiến dịch & khuyến mãi”
    async campaigns(req, res, next) {
        try {
            const { range, start, end } = req.query || {};
            const data = await DashboardService.campaignAnalytics({ range, start, end });
            res.json({ success: true, data });
        } catch (error) {
            next(error);
        }
    },

};
