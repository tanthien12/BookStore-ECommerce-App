// backend/services/flashsale.service.js
const FlashsaleModel = require("../models/flashsale.model");

const FlashsaleService = {
    async createCampaign(payload) {
        if (new Date(payload.end_time) <= new Date(payload.start_time)) {
            throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
        return FlashsaleModel.createCampaign(payload);
    },

    async listCampaigns(params) {
        return FlashsaleModel.listCampaigns(params);
    },
    
    async getCampaignDetails(id) {
        const [campaign, items] = await Promise.all([
            FlashsaleModel.findCampaignById(id),
            FlashsaleModel.getItemsForCampaign(id)
        ]);
        if (!campaign) return null;
        return { ...campaign, items };
    },

    async addItemToCampaign(payload) {
        // (Bạn có thể thêm logic kiểm tra giá sale < giá gốc ở đây)
        return FlashsaleModel.addItemToCampaign(payload);
    },

    async removeItemFromCampaign(itemId) {
        return FlashsaleModel.removeItemFromCampaign(itemId);
    },

    async findActiveSaleItems(limit = 10) {
        return FlashsaleModel.listActiveSaleItems({ limit });
    }
};
module.exports = FlashsaleService;