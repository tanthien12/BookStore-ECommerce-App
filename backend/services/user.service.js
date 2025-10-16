// backend/services/user.service.js
const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const { findById } = require('../models/order.model');
const { pool } = require("../config/db.config");
const SALT_ROUNDS = 10;

function genTempPassword(length = 12) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pw = '';
    for (let i = 0; i < length; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
}

async function listUsers(query) {
    const { page = 1, limit = 10, sort = 'newest', q, role_id, is_active, created_from, created_to } = query;
    const [items, total] = await Promise.all([
        userModel.adminFindMany({ page, limit, sort, q, role_id, is_active, created_from, created_to }),
        userModel.adminCountMany({ q, role_id, is_active, created_from, created_to }),
    ]);
    return {
        items,
        meta: { page: +page, limit: +limit, total, pages: Math.ceil(total / Math.max(+limit || 10, 1)) }
    };
}

async function getUserDetail(id) {
    const user = await userModel.adminFindByIdWithRole(id);
    if (!user) return null;
    const addresses = await userModel.listAddresses(id);
    return { ...user, addresses };
}

async function createUser({ name, email, password, role_id, is_active = true, avatar_url = null }) {
    // createUser của bạn nhận: { name, email, passwordHash, roleId } và default is_active=true
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const created = await userModel.createUser({ name, email, passwordHash, roleId: role_id });
    // nếu cần set avatar/is_active khác default -> update tiếp (không thay đổi schema)
    if (avatar_url !== null || typeof is_active === 'boolean') {
        await userModel.adminUpdateUser(created.id, { avatar_url, is_active });
        return userModel.adminFindByIdWithRole(created.id);
    }
    return userModel.adminFindByIdWithRole(created.id);
}

async function updateUser(id, payload) {
    // payload: { name?, email?, role_id?, is_active?, avatar_url? }
    return userModel.adminUpdateUser(id, payload);
}

async function resetPassword(id, password) {
    const newPass = password || genTempPassword();
    const hash = await bcrypt.hash(newPass, SALT_ROUNDS);
    await userModel.updateUserPassword(id, hash); // dùng hàm CŨ của bạn
    return { tempPassword: password ? undefined : newPass };
}

async function bulkAction({ action, ids, role_id }) {
    switch (action) {
        case 'activate':
            return { updated: await userModel.adminBulkSetActive(ids, true) };
        case 'deactivate':
            return { updated: await userModel.adminBulkSetActive(ids, false) };
        case 'assignRole':
            if (!role_id) throw new Error('Thiếu role_id');
            return { updated: await userModel.adminBulkAssignRole(ids, role_id) };
        case 'resetPassword': {
            const results = [];
            for (const id of ids || []) {
                const r = await resetPassword(id, null);
                results.push({ id, tempPassword: r.tempPassword });
            }
            return { results };
        }
        default:
            throw new Error('Hành động không hợp lệ');
    }

    // bổ sung nếu cần
    // backend/services/user.service.js (bổ sung nếu chưa có)

}

module.exports = {
    listUsers,
    getUserDetail,
    createUser,
    updateUser,
    resetPassword,
    bulkAction,
};
