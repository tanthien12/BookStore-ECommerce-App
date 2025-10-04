// backend/controllers/admin.role.controller.js
const roleService = require('../services/role.service');

exports.list = async (req, res, next) => {
    try {
        const withCounts = String(req.query.withCounts || '') === 'true';
        const data = await roleService.listRoles(withCounts);
        res.json({ success: true, items: data });
    } catch (e) { next(e); }
};
