import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdSave } from "react-icons/md";

// helper: tạo slug tiếng Việt không dấu
function slugifyVi(str = "") {
    return String(str)
        .normalize("NFD").replace(/\p{Diacritic}/gu, "") // bỏ dấu
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export default function CategoryForm({
    mode = "create",            // "create" | "edit"
    initialValues = null,       // 🔧 đổi {} -> null để tránh object mới mỗi render
    onSubmit,                   // (FormData) => Promise<void>
}) {
    // ===== STATE gốc trống, chỉ đổ khi EDIT + có initialValues
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Theo dõi người dùng đã chạm vào ô slug chưa (để không overwrite khi họ gõ tay)
    const [slugTouched, setSlugTouched] = useState(false);

    // ===== Đổ dữ liệu khi EDIT (chỉ khi id thay đổi)
    useEffect(() => {
        if (mode !== "edit" || !initialValues) return;

        setName(initialValues.name || "");
        setSlug(initialValues.slug || "");
        setDescription(initialValues.description || "");
        setSlugTouched(false);

        if (initialValues.image_url) setPreviewUrl(initialValues.image_url);
    }, [mode, initialValues?.id]); // 👈 chỉ phụ thuộc id

    // Cleanup blob URL khi đổi file/unmount
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // ===== Tự gợi ý slug khi TẠO MỚI & user chưa sửa slug thủ công
    useEffect(() => {
        if (mode === "create" && !slugTouched) {
            setSlug(slugifyVi(name));
        }
    }, [name, mode, slugTouched]);

    const validate = () => {
        const e = {};
        if (!name.trim()) e.name = "Tên danh mục là bắt buộc.";
        if (!slug.trim()) e.slug = "Slug là bắt buộc.";
        if (mode === "create" && !imageFile) e.image = "Ảnh danh mục là bắt buộc.";
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
        } else {
            setPreviewUrl("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("name", name.trim());
            fd.append("slug", slug.trim());
            fd.append("description", description.trim());
            if (imageFile) fd.append("image", imageFile); // backend xử lý upload -> image_url
            await onSubmit?.(fd);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Thông tin danh mục */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                <div className="mb-4">
                    <h2 className="text-lg font-semibold">
                        {mode === "edit" ? "Sửa danh mục" : "Thêm danh mục"}
                    </h2>
                    <p className="text-sm text-gray-500">
                        Bảng Category: name, slug, description{initialValues?.image_url ? ", image_url" : ""}.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.name ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
                            placeholder="VD: Lập trình, Cơ sở dữ liệu"
                        />
                        {errors.name && <div className="text-xs text-red-600 mt-1">{errors.name}</div>}
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Slug *</label>
                        <input
                            value={slug}
                            onChange={(e) => {
                                setSlug(slugifyVi(e.target.value));
                                setSlugTouched(true); // user đã chỉnh tay
                            }}
                            onFocus={() => setSlugTouched(true)}
                            className={`w-full px-3 py-2 rounded-lg border ${errors.slug ? "border-red-400" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
                            placeholder="lap-trinh"
                        />
                        {errors.slug && <div className="text-xs text-red-600 mt-1">{errors.slug}</div>}
                    </div>

                    {/* Description (full width) */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Mô tả</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                            placeholder="Mô tả ngắn về danh mục…"
                        />
                    </div>
                </div>
            </div>

            {/* Ảnh danh mục */}
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 space-y-3">
                <label className="block text-sm font-medium mb-2">
                    {mode === "edit" ? "Đổi ảnh danh mục" : "Thêm ảnh danh mục"}
                    {mode === "edit" && initialValues?.image_url ? " (đang có ảnh sẵn)" : ""}
                </label>
                <div className="flex items-center justify-center w-full">
                    <label
                        htmlFor="cat-dropzone"
                        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${errors.image ? "border-red-400" : "border-gray-300"}`}
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click để upload</span> hoặc kéo thả
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
                        </div>
                        <input
                            id="cat-dropzone"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                        />
                    </label>
                </div>
                {errors.image && <div className="text-xs text-red-600 mt-1">{errors.image}</div>}

                {/* Preview ảnh (nếu có) */}
                {previewUrl && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                        <div className="text-sm text-gray-600 mb-2">Ảnh đã chọn:</div>
                        <img src={previewUrl} alt="Category preview" className="max-h-48 w-auto object-contain mx-auto" />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
                <Link
                    to="/admin/categories"
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
                    {submitting ? "Đang lưu..." : mode === "edit" ? "Cập nhật" : "Lưu danh mục"}
                </button>
            </div>
        </form>
    );
}
