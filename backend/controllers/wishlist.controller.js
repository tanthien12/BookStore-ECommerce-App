// backend/controllers/wishlist.controller.js
const wishlistService = require('../services/wishlist.service');

exports.list = async (req, res, next) => {
    try {
        const items = await wishlistService.list(req.user.id);
        res.json({ success: true, items });
    } catch (e) { next(e); }
};

exports.add = async (req, res, next) => {
    try {
        const item = await wishlistService.add(req.user.id, req.params.bookId);
        res.status(201).json({ success: true, item });
    } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
    try {
        await wishlistService.remove(req.user.id, req.params.bookId);
        res.json({ success: true });
    } catch (e) { next(e); }
};
