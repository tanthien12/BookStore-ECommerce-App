import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    MdSearch, MdDownload, MdAdd, MdFilterList, MdEdit, MdDelete, MdMenu,
} from "react-icons/md";

// --- Mock data (giữ nguyên của bạn) ---
const MOCK_CATEGORIES = [
    { id: "c1", name: "Bag", slug: "bag", description: "Practical Granite Chicken", image_url: "https://picsum.photos/seed/cat1/64/64", productsCount: 19 },
    { id: "c2", name: "Programming", slug: "programming", description: "Books for developers", image_url: "https://picsum.photos/seed/cat2/64/64", productsCount: 35 },
    { id: "c3", name: "Database", slug: "database", description: "SQL, NoSQL, and more", image_url: "https://picsum.photos/seed/cat3/64/64", productsCount: 22 },
    { id: "c4", name: "AI/ML", slug: "ai-ml", description: "Artificial Intelligence", image_url: "https://picsum.photos/seed/cat4/64/64", productsCount: 18 },
];

const COL_KEY = "admin.categories.table.columns";

export default function CategoryList() {
    const [query, setQuery] = useState("");

    // ===== Toggle Columns (localStorage) =====
    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved ? JSON.parse(saved)
            : { image: true, name: true, description: true, slug: true, products: true };
    });
    useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

    // ===== Dropdown Toggle Columns =====
    const [openColMenu, setOpenColMenu] = useState(false);
    const colBtnRef = useRef(null);
    const colMenuRef = useRef(null);
    useEffect(() => {
        function onClickOutside(e) {
            if (
                openColMenu &&
                colMenuRef.current && !colMenuRef.current.contains(e.target) &&
                colBtnRef.current && !colBtnRef.current.contains(e.target)
            ) setOpenColMenu(false);
        }
        function onEsc(e) { if (e.key === "Escape") setOpenColMenu(false); }
        window.addEventListener("click", onClickOutside);
        window.addEventListener("keydown", onEsc);
        return () => { window.removeEventListener("click", onClickOutside); window.removeEventListener("keydown", onEsc); };
    }, [openColMenu]);

    // ===== Search =====
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return MOCK_CATEGORIES;
        return MOCK_CATEGORIES.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.slug.toLowerCase().includes(q) ||
                (c.description || "").toLowerCase().includes(q)
        );
    }, [query]);

    // ===== Pagination =====
    const [page, setPage] = useState(1);
    const pageSize = 4;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const slice = filtered.slice((page - 1) * pageSize, page * pageSize);
    useEffect(() => setPage(1), [query]);

    // ===== Select-All & Row Selection =====
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const headerCbRef = useRef(null);

    // cập nhật trạng thái indeterminate cho checkbox header
    useEffect(() => {
        const allIdsOnPage = slice.map((c) => c.id);
        const checkedCount = allIdsOnPage.filter((id) => selectedIds.has(id)).length;
        if (headerCbRef.current) {
            headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < slice.length;
            headerCbRef.current.checked = checkedCount === slice.length && slice.length > 0;
        }
    }, [slice, selectedIds]);

    const toggleSelectAllOnPage = (e) => {
        const checked = e.target.checked;
        const idsOnPage = slice.map((c) => c.id);
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) idsOnPage.forEach((id) => next.add(id));
            else idsOnPage.forEach((id) => next.delete(id));
            return next;
        });
    };

    const toggleRow = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleDelete = (id) => {
        if (confirm("Bạn chắc chắn muốn xóa danh mục này?")) {
            console.log("Delete category:", id);
            // TODO: gọi API xóa -> reload
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    return (
        <div className="space-y-5">
            {/* Row 1: Title + Export + Add */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Categories</h1>
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                        <MdDownload /> Export
                    </button>
                    <Link
                        to="/admin/categories-add"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <MdAdd /> Thêm danh mục
                    </Link>
                </div>
            </div>

            {/* Row 2: Search + Filters + Column Toggle */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-96">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MdSearch /></span>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm theo tên, slug, mô tả…"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                        <MdFilterList /> Filters
                    </button>

                    <div className="relative">
                        <button
                            ref={colBtnRef}
                            onClick={() => setOpenColMenu(v => !v)}
                            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                            title="Chọn cột hiển thị"
                            aria-expanded={openColMenu}
                        >
                            <MdMenu />
                        </button>

                        {openColMenu && (
                            <div
                                ref={colMenuRef}
                                className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-3 z-10"
                            >
                                <div className="font-semibold mb-2">Toggle Columns</div>
                                <div className="space-y-2">
                                    {[
                                        { key: "image", label: "Image" },
                                        { key: "name", label: "Category Name" },
                                        { key: "description", label: "Description" },
                                        { key: "slug", label: "Slug" },
                                        { key: "products", label: "Products" },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="accent-blue-600"
                                                checked={showCols[key]}
                                                onChange={(e) => setShowCols(s => ({ ...s, [key]: e.target.checked }))}
                                            />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                {/* Cột checkbox: cố định width + canh giữa */}
                                <th className="w-12 p-0">
                                    <div className="h-12 flex items-center justify-center">
                                        <input
                                            ref={headerCbRef}
                                            type="checkbox"
                                            className="accent-blue-600"
                                            onChange={toggleSelectAllOnPage}
                                        />
                                    </div>
                                </th>
                                {showCols.image && <th className="p-3 text-left">Image</th>}
                                {showCols.name && <th className="p-3 text-left">Category Name</th>}
                                {showCols.description && <th className="p-3 text-left">Description</th>}
                                {showCols.slug && <th className="p-3 text-left">Slug</th>}
                                {showCols.products && <th className="p-3 text-left">Products</th>}
                                <th className="w-24 p-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {slice.map((c) => {
                                const isChecked = selectedIds.has(c.id);
                                return (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        {/* Checkbox từng dòng: cùng width + canh giữa để thẳng hàng */}
                                        <td className="w-12 p-0">
                                            <div className="h-16 flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="accent-blue-600"
                                                    checked={isChecked}
                                                    onChange={() => toggleRow(c.id)}
                                                />
                                            </div>
                                        </td>

                                        {showCols.image && (
                                            <td className="p-3">
                                                <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-md object-cover border" />
                                            </td>
                                        )}
                                        {showCols.name && (
                                            <td className="p-3 align-middle">
                                                <Link to={`/admin/categories/${c.id}`} className="font-medium hover:underline">
                                                    {c.name}
                                                </Link>
                                            </td>
                                        )}
                                        {showCols.description && <td className="p-3 align-middle text-gray-700">{c.description || "—"}</td>}
                                        {showCols.slug && <td className="p-3 align-middle"><span className="text-gray-700">{c.slug}</span></td>}
                                        {showCols.products && <td className="p-3 align-middle font-medium">{c.productsCount ?? 0}</td>}

                                        <td className="p-3 align-middle">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/categories-edit/${c.id}`}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                    title="Sửa"
                                                >
                                                    <MdEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
                                                    title="Xóa"
                                                >
                                                    <MdDelete />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {slice.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Không có danh mục nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
                    <div className="text-sm text-gray-600">
                        Đang hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >←</button>
                        <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">{page}</span>
                        <button
                            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >→</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
