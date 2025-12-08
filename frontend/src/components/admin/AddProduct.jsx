// frontend/src/components/admin/AddProduct.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MdSave } from "react-icons/md";

// ============== MOCK categories (thay bằng API GET /admin/categories) ==============
const MOCK_CATEGORIES = [
    { id: "c1", name: "Programming" },
    { id: "c2", name: "Database" },
    { id: "c3", name: "Frontend" },
    { id: "c4", name: "AI/ML" },
];

// ============== Helpers ==============
const toVND = (n) =>
    (Number.isFinite(+n) ? +n : 0).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });

// nhãn tồn kho giống trang list
function stockLabel(stock) {
    const s = +stock || 0;
    if (s === 0) return { text: "Hết hàng", color: "text-red-600" };
    if (s <= 20) return { text: `${s} sắp hết`, color: "text-amber-600" };
    return { text: `${s} còn hàng`, color: "text-emerald-600" };
}

export default function AddProduct() {
    const navigate = useNavigate();

    // =================== FORM STATE ===================
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

    const [categoryIds, setCategoryIds] = useState([]);
    const [allCategories, setAllCategories] = useState([]);

    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        setAllCategories(MOCK_CATEGORIES);
    }, []);

    const [errors, setErrors] = useState({});
    const validate = () => {
        const e = {};
        if (!title.trim()) e.title = "Tên sách là bắt buộc.";
        if (price === "" || isNaN(+price) || +price < 0) e.price = "Giá phải là số ≥ 0.";
        if (stock === "" || isNaN(+stock) || +stock < 0 || !Number.isInteger(+stock))
            e.stock = "Tồn kho phải là số nguyên ≥ 0.";
        if (publishedYear && (!Number.isInteger(+publishedYear) || +publishedYear < 0))
            e.publishedYear = "Năm xuất bản không hợp lệ.";
        if (!imageFile) e.image = "Ảnh sản phẩm là bắt buộc.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

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
        fd.append("category_ids", JSON.stringify(categoryIds));
        fd.append("image", imageFile);

        console.log("SUBMIT AddProduct (FormData):", Object.fromEntries(fd));
        navigate("/admin/products");
    };

    const stockInfo = useMemo(() => stockLabel(stock), [stock]);

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Add Product</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSubmit}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <MdSave />
                        Lưu sản phẩm
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Thông tin sản phẩm</h2>
                        <p className="text-sm text-gray-500">Nhập thông tin và chọn danh mục.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên sách *</label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${errors.title ? "border-red-400" : "border-gray-300"
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder="VD: React & Tailwind Thực Chiến"
                            />
                            {errors.title && <div className="text-xs text-red-600 mt-1">{errors.title}</div>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Tác giả</label>
                            <input
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="VD: Phạm D"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">ISBN</label>
                            <input
                                value={isbn}
                                onChange={(e) => setIsbn(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="978-..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Nhà xuất bản</label>
                            <input
                                value={publisher}
                                onChange={(e) => setPublisher(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="VD: NXB Trẻ"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Năm xuất bản</label>
                            <input
                                type="number"
                                value={publishedYear}
                                onChange={(e) => setPublishedYear(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${errors.publishedYear ? "border-red-400" : "border-gray-300"
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder="VD: 2024"
                            />
                            {errors.publishedYear && (
                                <div className="text-xs text-red-600 mt-1">{errors.publishedYear}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Ngôn ngữ</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="paperback">Paperback</option>
                                <option value="hardcover">Hardcover</option>
                                <option value="ebook">eBook</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Danh mục</label>
                            <select
                                value={categoryIds}
                                onChange={(e) => setCategoryIds([e.target.value])}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Chọn danh mục --</option>
                                {allCategories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Mô tả</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Mô tả nội dung sách…"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Giá & Tồn kho *</h2>
                        <p className="text-sm text-gray-500">Thiết lập giá bán và số lượng hiện có.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Giá bán (VND) *</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border ${errors.price ? "border-red-400" : "border-gray-300"
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                placeholder="0"
                                min={0}
                                step="1"
                            />
                            <div className={`text-xs mt-1 ${stockInfo.color}`}>{stockInfo.text}</div>
                            {errors.stock && <div className="text-xs text-red-600 mt-1">{errors.stock}</div>}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">Thêm ảnh sản phẩm *</h2>
                        <p className="text-sm text-gray-500">Chọn và tải lên ảnh sản phẩm.</p>
                    </div>

                    <div className="flex items-center justify-center w-full">
                        <label
                            htmlFor="dropzone-file"
                            className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${errors.image ? "border-red-400" : "border-gray-300"
                                }`}
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg
                                    className="w-8 h-8 mb-4 text-gray-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M7 16a4 4 0 01-.88-7.903A5.002 5.002 0 0115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    ></path>
                                </svg>
                                <p className="mb-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click để upload</span> hoặc kéo thả
                                </p>
                                <p className="text-xs text-gray-500">PNG, JPG (MAX. 2MB)</p>
                            </div>
                            <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            />
                        </label>
                    </div>
                    {errors.image && <div className="text-xs text-red-600 mt-1">{errors.image}</div>}
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
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <MdSave />
                        Lưu sản phẩm
                    </button>
                </div>
            </form>
        </div>
    );
}
