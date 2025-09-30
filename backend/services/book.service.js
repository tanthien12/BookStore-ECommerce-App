// src/services/book.service.js
const BookModel = require("../models/book.model");

const BookService = {
    /**
     * Tạo sách mới từ payload form.
     * payload: {
     *  title, author, isbn, publisher, published_year,
     *  language, format, price, stock, description, image_url,
     *  category_ids?: string[] (UUID)
     * }
     */
    async create(payload) {
        const { category_ids = [], ...bookData } = payload;
        const book = await BookModel.create(bookData);
        if (category_ids?.length) {
            await BookModel.setCategories(book.id, category_ids);
        }
        return await BookModel.findById(book.id);
    },

    /**
     * Cập nhật sách theo id (UUID)
     */
    async update(id, payload) {
        const { category_ids = [], ...bookData } = payload;
        const updated = await BookModel.update(id, bookData);
        if (!updated) return null;

        // Đồng bộ danh mục
        await BookModel.setCategories(id, category_ids);
        return await BookModel.findById(id);
    },

    async remove(id) {
        return BookModel.remove(id);
    },

    async detail(id) {
        return BookModel.findById(id);
    },

    /**
     * Danh sách + filter
     * params: { q?, category_id?, language?, format?, page?, limit?, sort? }
     */
    async list(params) {
        return BookModel.list(params);
    },
};

module.exports = BookService;
