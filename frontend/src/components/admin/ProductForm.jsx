// import React, { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { MdSave } from "react-icons/md";

// export default function ProductForm({
//     mode = "create",
//     initialValues = {},
//     allCategories = [],
//     onSubmit,
// }) {
//     const [title, setTitle] = useState(initialValues.title || "");
//     const [author, setAuthor] = useState(initialValues.author || "");
//     const [isbn, setIsbn] = useState(initialValues.isbn || "");
//     const [publisher, setPublisher] = useState(initialValues.publisher || "");
//     const [publishedYear, setPublishedYear] = useState(initialValues.published_year || "");
//     const [language, setLanguage] = useState(initialValues.language || "vi");
//     const [format, setFormat] = useState(initialValues.format || "paperback");
//     const [description, setDescription] = useState(initialValues.description || "");
//     const [price, setPrice] = useState(initialValues.price ?? "");
//     const [stock, setStock] = useState(initialValues.stock ?? 0);
//     const [categoryId, setCategoryId] = useState((initialValues.category_ids && initialValues.category_ids[0]) || "");

//     // Ảnh + preview
//     const [imageFile, setImageFile] = useState(null);
//     const [previewUrl, setPreviewUrl] = useState("");

//     const [errors, setErrors] = useState({});
//     const [submitting, setSubmitting] = useState(false);

//     useEffect(() => {
//         setTitle(initialValues.title || "");
//         setAuthor(initialValues.author || "");
//         setIsbn(initialValues.isbn || "");
//         setPublisher(initialValues.publisher || "");
//         setPublishedYear(initialValues.published_year || "");
//         setLanguage(initialValues.language || "vi");
//         setFormat(initialValues.format || "paperback");
//         setDescription(initialValues.description || "");
//         setPrice(initialValues.price ?? "");
//         setStock(initialValues.stock ?? 0);
//         setCategoryId((initialValues.category_ids && initialValues.category_ids[0]) || "");

//         // nếu đang edit và có image_url sẵn -> hiển thị preview mặc định
//         if (mode === "edit" && initialValues.image_url) {
//             setPreviewUrl(initialValues.image_url);
//         }
//     }, [initialValues, mode]);

//     // cleanup object URL khi unmount/đổi file
//     useEffect(() => {
//         return () => {
//             if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
//         };
//     }, [previewUrl]);

//     const validate = () => {
//         const e = {};
//         if (!title.trim()) e.title = "Tên sách là bắt buộc.";
//         if (price === "" || isNaN(+price) || +price < 0) e.price = "Giá phải là số ≥ 0.";
//         if (stock === "" || isNaN(+stock) || +stock < 0 || !Number.isInteger(+stock)) e.stock = "Tồn kho phải là số nguyên ≥ 0.";
//         if (publishedYear && (!Number.isInteger(+publishedYear) || +publishedYear < 0)) e.published_year = "Năm xuất bản không hợp lệ.";
//         if (mode === "create" && !imageFile) e.image = "Ảnh sản phẩm là bắt buộc.";
//         if (!categoryId) e.category = "Vui lòng chọn danh mục.";
//         setErrors(e);
//         return Object.keys(e).length === 0;
//     };

//     const handleFileChange = (file) => {
//         setImageFile(file || null);
//         if (file) {
//             const url = URL.createObjectURL(file);
//             setPreviewUrl((prev) => {
//                 if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
//                 return url;
//             });
//         }
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         if (!validate()) return;
//         setSubmitting(true);
//         try {
//             const fd = new FormData();
//             fd.append("title", title.trim());
//             fd.append("author", author.trim());
//             fd.append("isbn", isbn.trim());
//             fd.append("publisher", publisher.trim());
//             fd.append("published_year", publishedYear ? String(+publishedYear) : "");
//             fd.append("language", language);
//             fd.append("format", format);
//             fd.append("price", String(+price));
//             fd.append("stock", String(+stock));
//             fd.append("description", description.trim());
//             fd.append("category_ids", JSON.stringify(categoryId ? [categoryId] : []));
//             if (imageFile) fd.append("image", imageFile);

//             await onSubmit?.(fd);
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     return (
//         <form onSubmit={handleSubmit} className="space-y-5">
//             <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
//                 <div className="mb-4">
//                     <h2 className="text-lg font-semibold">{mode === "edit" ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h2>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-sm font-medium mb-1">Tên sách *</label>
//                         <input
//                             value={title}
//                             onChange={(e) => setTitle(e.target.value)}
//                             className={`w-full px-3 py-2 rounded-lg border ${errors.title ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
//                             placeholder="VD: React & Tailwind Thực Chiến"
//                         />
//                         {errors.title && <div className="text-xs text-red-600 mt-1">{errors.title}</div>}
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium mb-1">Tác giả</label>
//                         <input
//                             value={author}
//                             onChange={(e) => setAuthor(e.target.value)}
//                             className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
//                             placeholder="VD: Phạm D"
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium mb-1">ISBN</label>
//                         <input
//                             value={isbn}
//                             onChange={(e) => setIsbn(e.target.value)}
//                             className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
//                             placeholder="978-..."
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium mb-1">Nhà xuất bản</label>
//                         <input
//                             value={publisher}
//                             onChange={(e) => setPublisher(e.target.value)}
//                             className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
//                             placeholder="VD: NXB Trẻ"
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium mb-1">Năm xuất bản</label>
//                         <input
//                             type="number"
//                             value={publishedYear}
//                             onChange={(e) => setPublishedYear(e.target.value)}
//                             className={`w-full px-3 py-2 rounded-lg border ${errors.published_year ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
//                             placeholder="VD: 2024"
//                         />
//                         {errors.published_year && <div className="text-xs text-red-600 mt-1">{errors.published_year}</div>}
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium mb-1">Ngôn ngữ</label>
//                         <select
//                             value={language}
//                             onChange={(e) => setLanguage(e.target.value)}
//                             className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
//                         >
//                             <option value="vi">Tiếng Việt</option>
//                             <option value="en">English</option>
//                             <option value="jp">日本語</option>
//                         </select>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium mb-1">Định dạng</label>
//                         <select
//                             value={format}
//                             onChange={(e) => setFormat(e.target.value)}
//                             className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
//                         >
//                             <option value="paperback">Paperback</option>
//                             <option value="hardcover">Hardcover</option>
//                             <option value="ebook">eBook</option>
//                         </select>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium mb-1">Danh mục *</label>
//                         <select
//                             value={categoryId}
//                             onChange={(e) => setCategoryId(e.target.value)}
//                             className={`w-full px-3 py-2 rounded-lg border ${errors.category ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
//                         >
//                             <option value="">-- Chọn danh mục --</option>
//                             {allCategories.map((c) => (
//                                 <option key={c.id} value={c.id}>{c.name}</option>
//                             ))}
//                         </select>
//                         {errors.category && <div className="text-xs text-red-600 mt-1">{errors.category}</div>}
//                     </div>

//                     <div className="md:col-span-2">
//                         <label className="block text-sm font-medium mb-1">Mô tả</label>
//                         <textarea
//                             value={description}
//                             onChange={(e) => setDescription(e.target.value)}
//                             rows={6}
//                             className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
//                             placeholder="Mô tả nội dung sách…"
//                         />
//                     </div>
//                 </div>
//             </div>

//             {/* Ảnh sản phẩm + Preview */}
//             <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-3">
//                 <label className="block text-sm font-medium mb-1">Thêm/đổi ảnh sản phẩm{mode === "edit" && initialValues.image_url ? " (đang có ảnh sẵn)" : ""}</label>
//                 <div className="flex items-center justify-center w-full">
//                     <label
//                         htmlFor="dropzone-file"
//                         className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${errors.image ? "border-red-400" : "border-gray-300"}`}
//                     >
//                         <div className="flex flex-col items-center justify-center pt-5 pb-6">
//                             <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click để upload</span> hoặc kéo thả</p>
//                             <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
//                         </div>
//                         <input id="dropzone-file" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0])} />
//                     </label>
//                 </div>
//                 {errors.image && <div className="text-xs text-red-600">{errors.image}</div>}
//                 {previewUrl && (
//                     <div className="border rounded-lg p-3 bg-gray-50">
//                         <div className="text-sm text-gray-600 mb-2">Ảnh đã chọn:</div>
//                         <img src={previewUrl} alt="Product image preview" className="max-h-48 w-auto object-contain mx-auto" />
//                     </div>
//                 )}
//             </div>

//             {/* Giá & tồn kho */}
//             <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-sm font-medium mb-1">Giá bán (VND) *</label>
//                         <input
//                             type="number"
//                             value={price}
//                             onChange={(e) => setPrice(e.target.value)}
//                             className={`w-full px-3 py-2 rounded-lg border ${errors.price ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
//                             placeholder="199000"
//                             min={0}
//                             step="1000"
//                         />
//                         {errors.price && <div className="text-xs text-red-600 mt-1">{errors.price}</div>}
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium mb-1">Tồn kho *</label>
//                         <input
//                             type="number"
//                             value={stock}
//                             onChange={(e) => setStock(e.target.value)}
//                             className={`w-full px-3 py-2 rounded-lg border ${errors.stock ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
//                             placeholder="0"
//                             min={0}
//                             step="1"
//                         />
//                         {errors.stock && <div className="text-xs text-red-600 mt-1">{errors.stock}</div>}
//                     </div>
//                 </div>
//             </div>

//             <div className="flex items-center justify-end gap-2">
//                 <Link
//                     to="/admin/products"
//                     className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                 >
//                     Hủy
//                 </Link>
//                 <button
//                     type="submit"
//                     disabled={submitting}
//                     className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
//                 >
//                     <MdSave /> {submitting ? "Đang lưu..." : (mode === "edit" ? "Cập nhật" : "Lưu sản phẩm")}
//                 </button>
//             </div>
//         </form>
//     );
// }

import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MdSave, MdClose } from "react-icons/md";

const toVND = (n) =>
    (Number.isFinite(+n) ? +n : 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });

export default function ProductForm({
    mode = "create",                 // "create" | "edit"
    initialValues = {},              // { ... , image_url? | image_urls?[], category_ids?[] }
    allCategories = [],              // [{ id, name }]
    onSubmit,                        // async (FormData) => void
}) {
    // ====== FORM STATE ======
    const [title, setTitle] = useState(initialValues.title || "");
    const [author, setAuthor] = useState(initialValues.author || "");
    const [isbn, setIsbn] = useState(initialValues.isbn || "");
    const [publisher, setPublisher] = useState(initialValues.publisher || "");
    const [publishedYear, setPublishedYear] = useState(initialValues.published_year || "");
    const [language, setLanguage] = useState(initialValues.language || "vi");
    const [format, setFormat] = useState(initialValues.format || "paperback");
    const [description, setDescription] = useState(initialValues.description || "");
    const [price, setPrice] = useState(initialValues.price ?? "");
    const [stock, setStock] = useState(initialValues.stock ?? 0);
    const [categoryId, setCategoryId] = useState(initialValues.category_ids?.[0] || "");

    // ====== IMAGES (multiple) ======
    // Mảng ảnh hiển thị: { id, url, isOld, file? }
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);

    // ====== UX ======
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // ---- đồng bộ khi initialValues đổi ----
    useEffect(() => {
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
        setCategoryId(initialValues.category_ids?.[0] || "");

        // map ảnh cũ -> previews
        let oldUrls = [];
        if (Array.isArray(initialValues.image_urls)) oldUrls = initialValues.image_urls;
        else if (initialValues.image_url) oldUrls = [initialValues.image_url];

        setImages(
            oldUrls.map((u, idx) => ({
                id: `old-${idx}-${u}`,
                url: u,
                isOld: true,
            }))
        );
    }, [initialValues, mode]);

    // ---- cleanup blob urls khi unmount ----
    useEffect(() => {
        return () => {
            images.forEach((img) => {
                if (!img.isOld && img.url?.startsWith("blob:")) {
                    URL.revokeObjectURL(img.url);
                }
            });
        };
    }, [images]);

    // ====== VALIDATE ======
    const validate = () => {
        const e = {};
        if (!title.trim()) e.title = "Tên sách là bắt buộc.";
        if (price === "" || isNaN(+price) || +price < 0) e.price = "Giá phải là số ≥ 0.";
        if (stock === "" || isNaN(+stock) || +stock < 0 || !Number.isInteger(+stock))
            e.stock = "Tồn kho phải là số nguyên ≥ 0.";
        if (publishedYear && (!Number.isInteger(+publishedYear) || +publishedYear < 0))
            e.published_year = "Năm xuất bản không hợp lệ.";
        if (!categoryId) e.category = "Vui lòng chọn danh mục.";
        if (images.length === 0) e.images = "Cần chọn ít nhất 1 ảnh sản phẩm.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    // ====== FILE HANDLERS ======
    const addFiles = (fileList) => {
        const files = Array.from(fileList || []);
        if (files.length === 0) return;

        const newItems = [];
        files.forEach((f, i) => {
            if (!f.type.startsWith("image/")) return;    // chỉ nhận ảnh
            if (f.size > 5 * 1024 * 1024) return;        // ≤ 5MB (tuỳ chỉnh)
            const url = URL.createObjectURL(f);
            newItems.push({
                id: `new-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                url,
                isOld: false,
                file: f,
            });
        });

        if (newItems.length === 0) return;
        setImages((prev) => [...prev, ...newItems]);
    };

    const onInputChange = (e) => {
        addFiles(e.target.files);
        // reset để chọn lại cùng file vẫn trigger onChange
        e.target.value = "";
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer?.files?.length) {
            addFiles(e.dataTransfer.files);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const removeImage = (id) => {
        setImages((prev) => {
            const item = prev.find((x) => x.id === id);
            const next = prev.filter((x) => x.id !== id);
            if (item && !item.isOld && item.url?.startsWith("blob:")) {
                URL.revokeObjectURL(item.url);
            }
            return next;
        });
    };

    // ====== SUBMIT ======
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
            fd.append("category_ids", JSON.stringify(categoryId ? [categoryId] : []));

            // ảnh mới
            images.filter((x) => !x.isOld && x.file).forEach((x) => {
                fd.append("images", x.file); // backend: multer.array("images")
            });

            // danh sách ảnh cũ giữ lại
            const keepOld = images.filter((x) => x.isOld).map((x) => x.url);
            fd.append("keep_old_images", JSON.stringify(keepOld));

            await onSubmit?.(fd);
        } finally {
            setSubmitting(false);
        }
    };

    // ====== UI ======
    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Thông tin sản phẩm */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                        {mode === "edit" ? "Sửa sản phẩm" : "Thêm sản phẩm"}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Tên sách *</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.title ? "border-red-400" : "border-gray-300"
                                } focus:ring-2 focus:ring-blue-500`}
                            placeholder="VD: React & Tailwind Thực Chiến"
                        />
                        {errors.title && <div className="text-xs text-red-600 mt-1">{errors.title}</div>}
                    </div>

                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Tác giả</label>
                        <input
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="VD: Phạm D"
                        />
                    </div>

                    {/* ISBN */}
                    <div>
                        <label className="block text-sm font-medium mb-1">ISBN</label>
                        <input
                            value={isbn}
                            onChange={(e) => setIsbn(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="978-..."
                        />
                    </div>

                    {/* Publisher */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Nhà xuất bản</label>
                        <input
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="VD: NXB Trẻ"
                        />
                    </div>

                    {/* Published Year */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Năm xuất bản</label>
                        <input
                            type="number"
                            value={publishedYear}
                            onChange={(e) => setPublishedYear(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.published_year ? "border-red-400" : "border-gray-300"
                                } focus:ring-2 focus:ring-blue-500`}
                            placeholder="VD: 2024"
                        />
                        {errors.published_year && (
                            <div className="text-xs text-red-600 mt-1">{errors.published_year}</div>
                        )}
                    </div>

                    {/* Language */}
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

                    {/* Format */}
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

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Danh mục *</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.category ? "border-red-400" : "border-gray-300"
                                } focus:ring-2 focus:ring-blue-500`}
                        >
                            <option value="">-- Chọn danh mục --</option>
                            {allCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.category && <div className="text-xs text-red-600 mt-1">{errors.category}</div>}
                    </div>

                    {/* Description (full width) */}
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

            {/* Images (multiple) */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-3">
                <label className="block text-sm font-medium mb-1">
                    Ảnh sản phẩm (có thể chọn nhiều)
                </label>

                {/* Dropzone */}
                <div
                    className={`flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 ${errors.images ? "border-red-400" : "border-gray-300"
                        }`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") fileInputRef.current?.click();
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Click hoặc kéo thả ảnh vào đây"
                >
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click để upload</span> hoặc kéo thả
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG (≤ 5MB mỗi ảnh)</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        id="dropzone-files"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={onInputChange}
                    />
                </div>
                {errors.images && <div className="text-xs text-red-600">{errors.images}</div>}

                {/* Preview Grid */}
                {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {images.map((img) => (
                            <div key={img.id} className="relative border rounded-lg overflow-hidden bg-gray-50">
                                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                <img src={img.url} className="w-full h-36 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removeImage(img.id)}
                                    className="absolute top-1 right-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow"
                                    title="Xóa ảnh này"
                                >
                                    <MdClose className="w-4 h-4" />
                                </button>
                                {img.isOld && (
                                    <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                        Ảnh cũ
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Price & Stock */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Giá bán (VND) *</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.price ? "border-red-400" : "border-gray-300"
                                } focus:ring-2 focus:ring-blue-500`}
                            placeholder="199000"
                            min={0}
                            step="1000"
                        />
                        <div className="text-xs text-gray-500 mt-1">{toVND(+price || 0)}</div>
                        {errors.price && <div className="text-xs text-red-600 mt-1">{errors.price}</div>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Tồn kho *</label>
                        <input
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.stock ? "border-red-400" : "border-gray-300"
                                } focus:ring-2 focus:ring-blue-500`}
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
                    <MdSave />
                    {submitting ? "Đang lưu..." : mode === "edit" ? "Cập nhật" : "Lưu sản phẩm"}
                </button>
            </div>
        </form>
    );
}
