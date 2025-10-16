// backend/controllers/voucher.controller.js
const voucherService = require('../services/voucher.service');

exports.available = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { minOrderValue } = req.query;
        const items = await voucherService.available({ userId, minOrderValue });
        res.json({ success: true, items });
    } catch (e) { next(e); }
};

exports.used = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const items = await voucherService.used(userId);
        res.json({ success: true, items });
    } catch (e) { next(e); }
};
