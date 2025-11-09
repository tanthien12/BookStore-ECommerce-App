// backend/controllers/flashsale.controller.js
const { z } = require("zod");
const FlashsaleService = require("../services/flashsale.service");

// Zod schemas
const createCampaignSchema = z.object({
    name: z.string().min(1, "Tên chiến dịch là bắt buộc"),
    start_time: z.coerce.date({ message: "start_time không hợp lệ" }),
    end_time: z.coerce.date({ message: "end_time không hợp lệ" }),
    is_active: z.boolean().optional(),
});

const addItemSchema = z.object({
    flashsale_id: z.string().uuid(),
    book_id: z.string().uuid(),
    sale_price: z.coerce.number().positive("Giá sale phải > 0"),
    sale_quantity: z.coerce.number().int().positive("Số lượng sale phải > 0"),
});

const paramsIdSchema = z.object({
    id: z.string().uuid("id phải là UUID hợp lệ"),
});

module.exports = {
    // === API cho Trang chủ (Public) ===
    async getActiveFlashSale(req, res, next) {
        try {
            const limit = Number(req.query.limit) || 10;
            const data = await FlashsaleService.findActiveSaleItems(limit);
            res.status(200).json({
                success: true,
                message: "Lấy flash sale đang hoạt động thành công",
                data: data,
            });
        } catch (err) {
            next(err);
        }
    },

    // === API cho Admin (Protected) ===
    async createCampaign(req, res, next) {
        try {
            const payload = createCampaignSchema.parse(req.body);
            const data = await FlashsaleService.createCampaign(payload);
            res.status(201).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    },

    async listCampaigns(req, res, next) {
        try {
            const data = await FlashsaleService.listCampaigns(req.query);
            res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    },
    
    async getCampaignDetails(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params);
            const data = await FlashsaleService.getCampaignDetails(id);
            if (!data) {
                return res.status(404).json({ success: false, message: "Không tìm thấy chiến dịch" });
            }
            res.status(200).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    },

    async addItemToCampaign(req, res, next) {
        try {
            const payload = addItemSchema.parse(req.body);
            const data = await FlashsaleService.addItemToCampaign(payload);
            res.status(201).json({ success: true, data });
        } catch (err) {
            next(err);
        }
    },
    
    async removeItemFromCampaign(req, res, next) {
        try {
            const { id } = paramsIdSchema.parse(req.params); // id này là của flashsale_item
            const ok = await FlashsaleService.removeItemFromCampaign(id);
            if (!ok) return res.status(404).json({ success: false, message: "Không tìm thấy item" });
            res.json({ success: true, message: "Đã xóa item khỏi chiến dịch" });
        } catch (err) {
            next(err);
        }
    }
};