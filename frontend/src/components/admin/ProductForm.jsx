// src/components/admin/ProductForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MdSave, MdClose } from "react-icons/md";
import TomSelect from "tom-select";

export default function ProductForm({
    mode = "create",
    initialValues = null,
    allCategories = [],
    categoriesLoading = false,
    onSubmit,
}) {
    // ====== Text fields ======
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

    // ====== Categories (TomSelect) ======
    const [categoryIds, setCategoryIds] = useState([]); // string[]
    const categorySelectRef = useRef(null);
    const tomRef = useRef(null);

    // ====== Images ======
    const [previews, setPreviews] = useState([]); // [{kind:'existing'|'new', url, file?}]
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // ---------- Hydrate edit ----------
    useEffect(() => {
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

        const cat = Array.isArray(initialValues.category_ids) ? initialValues.category_ids : [];
        setCategoryIds(cat);

        const exist = [
            ...(Array.isArray(initialValues.gallery_urls) ? initialValues.gallery_urls : []),
            ...(initialValues.image_url ? [initialValues.image_url] : []),
        ].filter(Boolean).map((url) => ({ kind: "existing", url }));
        setPreviews(exist);
    }, [initialValues?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- helper: đồng bộ style TomSelect với input Tailwind ---
    const applyTomSelectTailwind = (ts) => {
        if (!ts) return;
        const wrapper = ts.wrapper;               // .ts-wrapper
        const control = wrapper?.querySelector(".ts-control"); // div chính hiển thị control
        // Wrapper: dùng focus ring khi input nằm trong control được focus
        wrapper?.classList.add("w-full", "focus-within:ring-2", "focus-within:ring-blue-500", "rounded-lg");
        // Control: font-size, padding, border giống input; dùng ! để override CSS TomSelect
        control?.classList.add(
            "bg-white",
            "!px-3",
            "!py-2",
            "!rounded-lg",
            "!border",
            "!border-gray-300",
            "!text-base"
        );
        // Input thật bên trong (để placeholder & text đồng bộ size)
        const input = control?.querySelector("input");
        input?.classList.add("!text-base");

        // Dropdown khi mở (đồng bộ font)
        ts.on("dropdown_open", () => {
            ts.dropdown?.classList.add("!text-base");
        });
    };

    // ---------- Init / Re-init TomSelect ----------
    useEffect(() => {
        if (!categorySelectRef.current) return;

        if (tomRef.current) {
            try { tomRef.current.destroy(); } catch { }
            tomRef.current = null;
        }

        const ts = new TomSelect(categorySelectRef.current, {
            plugins: ["remove_button"],
            persist: false,
            create: false,
            maxItems: null,
            valueField: "id",
            labelField: "name",
            searchField: ["name"],
            options: allCategories,
            items: categoryIds, // set selected
            placeholder: categoriesLoading ? "Đang tải danh mục…" : "Chọn danh mục…",
            onChange(values) {
                const arr = Array.isArray(values) ? values : (values ? [values] : []);
                setCategoryIds(arr);
            },
            onInitialize() {
                applyTomSelectTailwind(this);
            },
        });

        // Phòng khi onInitialize không chạy đúng thứ tự, apply 1 lần nữa
        applyTomSelectTailwind(ts);
        tomRef.current = ts;

        return () => {
            try { ts.destroy(); } catch { }
            tomRef.current = null;
        };
    }, [allCategories, categoriesLoading]); // chỉ re-init khi dữ liệu danh mục đổi

    // Sync selected items khi categoryIds đổi (không re-init)
    useEffect(() => {
        if (!tomRef.current) return;
        tomRef.current.setValue(categoryIds, true);
    }, [categoryIds]);

    // ---------- Clean blob URLs ----------
    useEffect(() => {
        return () => {
            previews.forEach((p) => {
                if (p.kind === "new" && p.url?.startsWith("blob:")) URL.revokeObjectURL(p.url);
            });
        };
    }, [previews]);

    // ---------- Validation ----------
    const validate = () => {
        const e = {};
        if (!title.trim()) e.title = "Tên sách là bắt buộc.";
        if (price === "" || isNaN(+price) || +price < 0) e.price = "Giá phải là số ≥ 0.";
        if (stock === "" || isNaN(+stock) || +stock < 0 || !Number.isInteger(+stock)) e.stock = "Tồn kho phải là số nguyên ≥ 0.";
        if (publishedYear && (!Number.isInteger(+publishedYear) || +publishedYear < 0)) e.published_year = "Năm xuất bản không hợp lệ.";
        if (categoryIds.length === 0) e.category = "Vui lòng chọn ít nhất 1 danh mục.";
        if (mode === "create" && previews.length === 0) e.image = "Vui lòng chọn ít nhất 1 ảnh.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ---------- Images ----------
    const handleFilesChange = (fileList) => {
        const incoming = Array.from(fileList || []).filter((f) => f.type?.startsWith("image/"));
        if (!incoming.length) return;
        const mapped = incoming.map((file) => ({ kind: "new", file, url: URL.createObjectURL(file) }));
        setPreviews((prev) => [...prev, ...mapped]);
    };

    const handleRemovePreviewAt = (idx) => {
        setPreviews((prev) => {
            const next = [...prev];
            const removed = next.splice(idx, 1)[0];
            if (removed?.kind === "new" && removed.url?.startsWith("blob:")) URL.revokeObjectURL(removed.url);
            return next;
        });
    };

    // ---------- Submit ----------
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
            fd.append("category_ids_json", JSON.stringify(categoryIds));
            const keepUrls = previews.filter((p) => p.kind === "existing").map((p) => p.url);
            fd.append("keep_image_urls_json", JSON.stringify(keepUrls));
            previews.filter((p) => p.kind === "new" && p.file).forEach((p) => fd.append("images", p.file));
            await onSubmit?.(fd);
        } finally {
            setSubmitting(false);
        }
    };

    // ============ UI ============
    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic info */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">{mode === "edit" ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
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
                </div>

                {/* Hàng: Định dạng – Danh mục (2 cột) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                        {/* Class ở đây không quyết định, vì TomSelect sẽ thay thế; style đã được apply trong applyTomSelectTailwind */}
                        <select
                            ref={categorySelectRef}
                            multiple
                            disabled={categoriesLoading}
                            
                        />
                        {errors.category && <div className="text-xs text-red-600 mt-1">{errors.category}</div>}
                    </div>
                </div>

                <div className="mt-4">
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

            {/* Images */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-3">
                <label className="block text-sm font-medium mb-1">
                    Thêm/đổi ảnh sản phẩm {mode === "edit" && previews.length > 0 ? "(đang có ảnh sẵn)" : ""}
                </label>

                <div className="flex items-center justify-center w-full">
                    <label
                        htmlFor="dropzone-files"
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${errors.image ? "border-red-400" : "border-gray-300"}`}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click để upload</span> hoặc kéo thả (chọn nhiều)
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB/ảnh)</p>
                        </div>
                        <input
                            id="dropzone-files"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFilesChange(e.target.files)}
                        />
                    </label>
                </div>
                {errors.image && <div className="text-xs text-red-600">{errors.image}</div>}

                {previews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {previews.map((p, idx) => (
                            <div key={p.url + idx} className="group relative border rounded-lg p-2 bg-gray-50">
                                <img
                                    src={p.url}
                                    alt={`preview-${idx}`}
                                    className="w-full h-36 object-contain bg-white rounded transition-transform duration-200 group-hover:scale-[1.01]"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemovePreviewAt(idx)}
                                    className="absolute top-1.5 right-1.5 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 border shadow-sm
                             opacity-0 group-hover:opacity-100 transition-opacity duration-150
                             text-gray-700 hover:bg-white"
                                    title="Xóa ảnh này"
                                >
                                    <MdClose />
                                </button>
                                <div
                                    className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                    style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(0,0,0,0.06) 100%)" }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Price & stock */}
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

            {/* Actions */}
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
