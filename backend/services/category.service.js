// backend/services/category.service.js
const CategoryModel = require("../models/category.model");

function normCategory(data = {}) {
    const out = { ...data };
    if (out.image_url === "") out.image_url = undefined;
    if (out.slug) out.slug = String(out.slug).trim();
    if (out.name) out.name = String(out.name).trim();
    if (out.description !== undefined) out.description = String(out.description || "");
    return out;
}

const CategoryService = {
    async create(payload) {
        const data = normCategory(payload);
        return CategoryModel.create(data);
    },
    async update(id, payload) {
        const data = normCategory(payload);
        return CategoryModel.update(id, data);
    },
    async remove(id) {
        return CategoryModel.remove(id);
    },
    async detail(id) {
        return CategoryModel.findById(id);
    },
    async list(params) {
        return CategoryModel.list(params);
    },
};

module.exports = CategoryService;
