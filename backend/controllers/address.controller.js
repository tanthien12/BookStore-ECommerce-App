// backend/controllers/address.controller.js
const addressService = require('../services/address.service');

exports.list = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const items = await addressService.list(userId);
        res.json({ success: true, items });
    } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const payload = req.body || {};
        const item = await addressService.create(userId, payload);
        res.status(201).json({ success: true, item });
    } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        const payload = req.body || {};
        const item = await addressService.update(userId, id, payload);
        res.json({ success: true, item });
    } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const id = req.params.id;
        await addressService.remove(userId, id);
        res.json({ success: true });
    } catch (e) { next(e); }
};
