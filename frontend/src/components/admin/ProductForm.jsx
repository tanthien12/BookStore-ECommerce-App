// src/components/admin/ProductForm.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdSave } from "react-icons/md";

export default function ProductForm({
    mode = "create",
    initialValues = null,          // 🔧 đổi {} -> null
    allCategories = [],
    onSubmit,
}) {
    // --- STATE
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [isbn, setIsbn] = useState("");
    const [publisher, setPublisher] = useState("");
    const [publishedYear, setPublishedYear] = useState("");
    const [language, setLanguage] = useState("vi");
    const [format, setFormat] = useState("paperback");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState(0);
    const [categoryId, setCategoryId] = useState("");

    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // 🔧 Chỉ “đổ lại form” khi EDIT và id thay đổi
    useEffect(() => {
        if (mode !== "edit") return;
        if (!initialValues) return;

        setTitle(initialValues.title || "");
        setAuthor(initialValues.author || "");
        setIsbn(initialValues.isbn || "");
        setPublisher(initialValues.publisher || "");
        setPublishedYear(initialValues.published_year || "");
        setLanguage(initialValues.language || "vi");
        setFormat(initialValues.format || "paperback");
        setDescription(initialValues.description || "");
        setPrice(initialValues.price ?? "");
        setStock(initialValues.stock ?? 0);
        setCategoryId((initialValues.category_ids && initialValues.category_ids[0]) || "");

        if (initialValues.image_url) {
            setPreviewUrl(initialValues.image_url);
        }
        // 👇 phụ thuộc vào khóa nhận diện (id) nếu có
    }, [mode, initialValues?.id]);

    // cleanup blob URL
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const validate = () => {
        const e = {};
        if (!title.trim()) e.title = "Tên sách là bắt buộc.";
        if (price === "" || isNaN(+price) || +price < 0) e.price = "Giá phải là số ≥ 0.";
        if (stock === "" || isNaN(+stock) || +stock < 0 || !Number.isInteger(+stock)) e.stock = "Tồn kho phải là số nguyên ≥ 0.";
        if (publishedYear && (!Number.isInteger(+publishedYear) || +publishedYear < 0)) e.published_year = "Năm xuất bản không hợp lệ.";
        if (mode === "create" && !imageFile) e.image = "Ảnh sản phẩm là bắt buộc.";
        if (!categoryId) e.category = "Vui lòng chọn danh mục.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleFileChange = (file) => {
        setImageFile(file || null);
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl((prev) => {
                if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
                return url;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("title", title.trim());
            fd.append("author", author.trim());
            fd.append("isbn", isbn.trim());
            fd.append("publisher", publisher.trim());
            fd.append("published_year", publishedYear ? String(+publishedYear) : "");
            fd.append("language", language);
            fd.append("format", format);
            fd.append("price", String(+price));
            fd.append("stock", String(+stock));
            fd.append("description", description.trim());
            // giữ chuẩn như đã thống nhất với AddProduct
            fd.append("category_ids_json", JSON.stringify(categoryId ? [categoryId] : []));
            if (imageFile) fd.append("image", imageFile);

            await onSubmit?.(fd);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                        {mode === "edit" ? "Sửa sản phẩm" : "Thêm sản phẩm"}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tên sách *</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.title ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
                            placeholder="VD: React & Tailwind Thực Chiến"
                        />
                        {errors.title && <div className="text-xs text-red-600 mt-1">{errors.title}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Tác giả</label>
                        <input
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="VD: Phạm D"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">ISBN</label>
                        <input
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="978-..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Nhà xuất bản</label>
                        <input
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="VD: NXB Trẻ"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Năm xuất bản</label>
                        <input
                            type="number"
                            value={publishedYear}
                            onChange={(e) => setPublishedYear(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.published_year ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
                            placeholder="VD: 2024"
                        />
                        {errors.published_year && <div className="text-xs text-red-600 mt-1">{errors.published_year}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Ngôn ngữ</label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="vi">Tiếng Việt</option>
                            <option value="en">English</option>
                            <option value="jp">日本語</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Định dạng</label>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="paperback">Paperback</option>
                            <option value="hardcover">Hardcover</option>
                            <option value="ebook">eBook</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Danh mục *</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.category ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
                        >
                            <option value="">-- Chọn danh mục --</option>
                            {allCategories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.category && <div className="text-xs text-red-600 mt-1">{errors.category}</div>}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Mô tả</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="Mô tả nội dung sách…"
                        />
                    </div>
                </div>
            </div>

            {/* Ảnh sản phẩm + Preview */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-3">
                <label className="block text-sm font-medium mb-1">
                    Thêm/đổi ảnh sản phẩm{mode === "edit" && initialValues.image_url ? " (đang có ảnh sẵn)" : ""}
                </label>
                <div className="flex items-center justify-center w-full">
                    <label
                        htmlFor="dropzone-file"
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${errors.image ? "border-red-400" : "border-gray-300"}`}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click để upload</span> hoặc kéo thả</p>
                            <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" accept="image/*"
                            onChange={(e) => handleFileChange(e.target.files?.[0])} />
                    </label>
                </div>
                {errors.image && <div className="text-xs text-red-600">{errors.image}</div>}
                {previewUrl && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                        <div className="text-sm text-gray-600 mb-2">Ảnh đã chọn:</div>
                        <img src={previewUrl} alt="Product image preview" className="max-h-48 w-auto object-contain mx-auto" />
                    </div>
                )}
            </div>

            {/* Giá & tồn kho */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Giá bán (VND) *</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.price ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
                            placeholder="199000"
                            min={0}
                            step="1000"
                        />
                        {errors.price && <div className="text-xs text-red-600 mt-1">{errors.price}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Tồn kho *</label>
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.stock ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
                            placeholder="0"
                            min={0}
                            step="1"
                        />
                        {errors.stock && <div className="text-xs text-red-600 mt-1">{errors.stock}</div>}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                <Link
                    to="/admin/products"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                >
                    Hủy
                </Link>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                    <MdSave /> {submitting ? "Đang lưu..." : (mode === "edit" ? "Cập nhật" : "Lưu sản phẩm")}
                </button>
            </div>
        </form>
    );
}
