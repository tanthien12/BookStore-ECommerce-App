// backend/controllers/account.controller.js
const accountService = require('../services/account.service');
const orderService = require('../services/order.service');

exports.me = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const me = await accountService.getMe(userId);
        if (!me) return res.status(404).json({ success: false, message: 'User not found' });
        const stats = await accountService.getQuickStats(userId);
        res.json({ success: true, user: me, stats });
    } catch (e) { next(e); }
};

exports.updateMe = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { name, avatar_url, phone, gender, date_of_birth } = req.body || {};
        if (name != null && String(name).trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Tên quá ngắn' });
        }
        const updated = await accountService.updateMe(userId, { name, avatar_url, phone, gender, date_of_birth });
        res.json({ success: true, user: updated });
    } catch (e) { next(e); }
};

exports.changePassword = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body || {};
        if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Thiếu mật khẩu' });
        if (String(newPassword).length < 6) return res.status(400).json({ success: false, message: 'Mật khẩu mới tối thiểu 6 ký tự' });
        await accountService.changePassword(userId, currentPassword, newPassword);
        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (e) { next(e); }
};

exports.myOrders = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 10, status } = req.query;
        const data = await orderService.listByUser({ userId, page, limit, status });
        res.json({ success: true, ...data });
    } catch (e) { next(e); }
};

exports.quickStats = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const stats = await accountService.getQuickStats(userId);
        res.json({ success: true, stats });
    } catch (e) { next(e); }
};

