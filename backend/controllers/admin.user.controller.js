// backend/controllers/admin.user.controller.js
const userService = require("../services/user.service");
const UserModel = require("../models/user.model");

exports.list = async (req, res, next) => {
    try {
        const {
            q,
            page = 1,
            limit = 10,
            sort = "newest",
            role_id,
            is_active,
            created_from,
            created_to,
        } = req.query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));

        const filters = {
            q: q && q.trim() ? q.trim() : undefined,
            role_id: role_id || undefined,
            is_active:
                typeof is_active === "undefined" ||
                    is_active === null ||
                    is_active === ""
                    ? undefined
                    : is_active,
            created_from: created_from || undefined,
            created_to: created_to || undefined,
        };

        const [items, total] = await Promise.all([
            UserModel.adminFindMany({
                page: pageNum,
                limit: limitNum,
                sort,
                ...filters,
            }),
            UserModel.adminCountMany(filters),
        ]);

        res.json({
            success: true,
            items,
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
        });
    } catch (e) {
        next(e);
    }
};

exports.getOne = async (req, res, next) => {
    try {
        const data = await userService.getUserDetail(req.params.id);
        if (!data)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy user" });
        res.json({ success: true, data });
    } catch (e) {
        next(e);
    }
};

exports.create = async (req, res, next) => {
    try {
        const { name, email, password, role_id, is_active, avatar_url } =
            req.body;
        if (!name || !email || !password || !role_id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu name/email/password/role_id",
            });
        }
        const user = await userService.createUser({
            name,
            email,
            password,
            role_id,
            is_active,
            avatar_url,
        });
        res.status(201).json({ success: true, data: user });
    } catch (e) {
        next(e);
    }
};

exports.update = async (req, res, next) => {
    try {
        const user = await userService.updateUser(
            req.params.id,
            req.body || {}
        );
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "Không tìm thấy user" });
        res.json({ success: true, data: user });
    } catch (e) {
        next(e);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { password } = req.body || {};
        const r = await userService.resetPassword(req.params.id, password);
        res.json({
            success: true,
            message: "Đã đặt lại mật khẩu",
            ...r,
        });
    } catch (e) {
        next(e);
    }
};

exports.bulk = async (req, res, next) => {
    try {
        const { action, ids, role_id } = req.body || {};
        if (!action || !Array.isArray(ids) || !ids.length) {
            return res.status(400).json({
                success: false,
                message: "Thiếu action hoặc danh sách ids",
            });
        }
        const r = await userService.bulkAction({ action, ids, role_id });
        res.json({ success: true, ...r });
    } catch (e) {
        next(e);
    }
};


//code goc
// // backend/controllers/admin.user.controller.js
// const userService = require('../services/user.service');

// exports.list = async (req, res, next) => {
//     try {
//         const data = await userService.listUsers(req.query);
//         res.json({ success: true, ...data });
//     } catch (e) { next(e); }
// };

// exports.getOne = async (req, res, next) => {
//     try {
//         const data = await userService.getUserDetail(req.params.id);
//         if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
//         res.json({ success: true, data });
//     } catch (e) { next(e); }
// };

// exports.create = async (req, res, next) => {
//     try {
//         const { name, email, password, role_id, is_active, avatar_url } = req.body;
//         if (!name || !email || !password || !role_id) {
//             return res.status(400).json({ success: false, message: 'Thiếu name/email/password/role_id' });
//         }
//         const user = await userService.createUser({ name, email, password, role_id, is_active, avatar_url });
//         res.status(201).json({ success: true, data: user });
//     } catch (e) { next(e); }
// };

// exports.update = async (req, res, next) => {
//     try {
//         const user = await userService.updateUser(req.params.id, req.body || {});
//         if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
//         res.json({ success: true, data: user });
//     } catch (e) { next(e); }
// };

// exports.resetPassword = async (req, res, next) => {
//     try {
//         const { password } = req.body || {};
//         const r = await userService.resetPassword(req.params.id, password);
//         res.json({ success: true, message: 'Đã đặt lại mật khẩu', ...r });
//     } catch (e) { next(e); }
// };

// exports.bulk = async (req, res, next) => {
//     try {
//         const { action, ids, role_id } = req.body || {};
//         if (!action || !Array.isArray(ids) || !ids.length) {
//             return res.status(400).json({ success: false, message: 'Thiếu action hoặc danh sách ids' });
//         }
//         const r = await userService.bulkAction({ action, ids, role_id });
//         res.json({ success: true, ...r });
//     } catch (e) { next(e); }
// };
