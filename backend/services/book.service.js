// backend/services/book.service.js
const BookModel = require("../models/book.model");
const {pool} = require("../config/db.config");

const BookService = {
    async create(payload) {
        const { category_ids = [], ...bookData } = payload;
        const book = await BookModel.create(bookData);
        if (category_ids?.length) {
            await BookModel.setCategories(book.id, category_ids);
        }
        return await BookModel.findById(book.id);
    },

    async update(id, payload) {
        const { category_ids = [], ...bookData } = payload;
        const updated = await BookModel.update(id, bookData);
        if (!updated) return null;

        await BookModel.setCategories(id, category_ids);
        return await BookModel.findById(id);
    },

    async remove(id) {
        return BookModel.remove(id);
    },

    async detail(id) {
        return BookModel.findById(id);
    },

    async list(params) {
        return BookModel.list(params);
    },
    async findFlashSaleBooks(limit = 10) {
        return BookModel.listFlashSale({ limit });
    },
    async expireFlashSales() {
        return BookModel.expireFlashSales();
  },

};

module.exports = BookService;
