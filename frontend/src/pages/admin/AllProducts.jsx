// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//     MdSearch, MdDownload, MdAdd, MdFilterList, MdEdit, MdDelete, MdMenu
// } from "react-icons/md";
// import { Link } from "react-router-dom";

// // ===== Mock data (sau thay bằng API) =====
// const MOCK_BOOKS = [
//     { id: "b1", title: "Lập Trình JavaScript Hiện Đại", author: "Nguyễn Văn A", price: 189000, stock: 50, image_url: "https://picsum.photos/seed/js1/64/64", created_at: "2025-09-01T10:15:00Z" },
//     { id: "b2", title: "Cấu Trúc Dữ Liệu & Giải Thuật", author: "Trần B", price: 225000, stock: 18, image_url: "https://picsum.photos/seed/dsa/64/64", created_at: "2025-08-21T08:00:00Z" },
//     { id: "b3", title: "PostgreSQL Từ A-Z", author: "Lê C", price: 265000, stock: 0, image_url: "https://picsum.photos/seed/pg/64/64", created_at: "2025-08-10T12:30:00Z" },
//     { id: "b4", title: "React & Tailwind Thực Chiến", author: "Phạm D", price: 199000, stock: 24, image_url: "https://picsum.photos/seed/react/64/64", created_at: "2025-07-30T09:45:00Z" },
// ];

// // ===== Helpers =====
// const toVND = (n) => n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
// function stockLabel(stock) { if (stock === 0) return { text: "Hết hàng", color: "text-red-600" }; if (stock <= 20) return { text: `${stock} sắp hết`, color: "text-amber-600" }; return { text: `${stock} còn hàng`, color: "text-emerald-600" }; }
// function stockBarClass(stock) { if (stock === 0) return "bg-red-500"; if (stock <= 20) return "bg-amber-500"; return "bg-emerald-500"; }
// function dateVN(iso) { try { const d = new Date(iso); return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) } catch { return "-" } }

// export default function AllProducts() {
//     // tìm kiếm & phân trang
//     const [query, setQuery] = useState("");
//     const [page, setPage] = useState(1);
//     const pageSize = 7;

//     // toggle cột
//     const [showCols, setShowCols] = useState({
//         product: true,
//         author: true,
//         stock: true,
//         price: true,
//         createdAt: true,
//     });

//     // menu column chooser
//     const [openColMenu, setOpenColMenu] = useState(false);
//     const colBtnRef = useRef(null);
//     const colMenuRef = useRef(null);

//     useEffect(() => {
//         function onClickOutside(e) {
//             if (!openColMenu) return;
//             if (
//                 colMenuRef.current && !colMenuRef.current.contains(e.target) &&
//                 colBtnRef.current && !colBtnRef.current.contains(e.target)
//             ) {
//                 setOpenColMenu(false);
//             }
//         }
//         window.addEventListener("click", onClickOutside);
//         return () => window.removeEventListener("click", onClickOutside);
//     }, [openColMenu]);

//     const filtered = useMemo(() => {
//         const q = query.trim().toLowerCase();
//         if (!q) return MOCK_BOOKS;
//         return MOCK_BOOKS.filter(
//             (b) =>
//                 b.title.toLowerCase().includes(q) ||
//                 (b.author || "").toLowerCase().includes(q)
//         );
//     }, [query]);

//     const total = filtered.length;
//     const totalPages = Math.max(1, Math.ceil(total / pageSize));
//     const list = filtered.slice((page - 1) * pageSize, page * pageSize);

//     const handleDelete = (id) => {
//         if (confirm("Bạn chắc chắn muốn xóa sách này?")) {
//             console.log("Delete book:", id);
//             // TODO: gọi API xóa rồi reload
//         }
//     };

//     return (
//         <div className="space-y-5">
//             {/* ==== Hàng 1: Title + Export + Add ==== */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <h1 className="text-2xl font-bold">Books</h1>
//                 <div className="flex items-center gap-2">
//                     <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
//                         <MdDownload />
//                         Export
//                     </button>
//                     <Link
//                         to="/admin/products/create"
//                         className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
//                     >
//                         <MdAdd />
//                         Thêm sản phẩm
//                     </Link>
//                 </div>
//             </div>

//             {/* ==== Hàng 2: Search + Filters + Column Chooser ==== */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 {/* Search */}
//                 <div className="relative w-full sm:w-96">
//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                         <MdSearch />
//                     </span>
//                     <input
//                         value={query}
//                         onChange={(e) => { setQuery(e.target.value); setPage(1); }}
//                         placeholder="Tìm theo tên sách, tác giả…"
//                         className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                 </div>

//                 <div className="flex items-center gap-2">
//                     {/* Filters (placeholder) */}
//                     <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
//                         <MdFilterList />
//                         Filters
//                     </button>

//                     {/* Column chooser */}
//                     <div className="relative">
//                         <button
//                             ref={colBtnRef}
//                             onClick={() => setOpenColMenu((v) => !v)}
//                             className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                             title="Chọn cột hiển thị"
//                         >
//                             <MdMenu />
//                         </button>

//                         {openColMenu && (
//                             <div
//                                 ref={colMenuRef}
//                                 className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-3 z-10"
//                             >
//                                 <div className="font-medium mb-2">Toggle Columns</div>
//                                 <div className="space-y-2">
//                                     {[
//                                         { key: "product", label: "Product" },
//                                         { key: "author", label: "Author" },
//                                         { key: "stock", label: "Stock" },
//                                         { key: "price", label: "Price" },
//                                         { key: "createdAt", label: "Created At" },
//                                     ].map(({ key, label }) => (
//                                         <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
//                                             <input
//                                                 type="checkbox"
//                                                 className="accent-blue-600"
//                                                 checked={showCols[key]}
//                                                 onChange={(e) => setShowCols((s) => ({ ...s, [key]: e.target.checked }))}
//                                             />
//                                             <span>{label}</span>
//                                         </label>
//                                     ))}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* ==== Bảng ==== */}
//             <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm">
//                         <thead className="bg-gray-100 text-gray-600">
//                             <tr>
//                                 <th className="w-10 p-3">
//                                     <input type="checkbox" className="accent-blue-600" />
//                                 </th>
//                                 {showCols.product && <th className="p-3 text-left">Sách</th>}
//                                 {showCols.author && <th className="p-3 text-left">Tác giả</th>}
//                                 {showCols.stock && <th className="p-3 text-left">Tồn kho</th>}
//                                 {showCols.price && <th className="p-3 text-left">Giá</th>}
//                                 {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
//                                 <th className="w-24 p-3 text-right">Actions</th>
//                             </tr>
//                         </thead>

//                         <tbody className="divide-y">
//                             {list.map((b) => {
//                                 const s = stockLabel(b.stock);
//                                 const barClass = stockBarClass(b.stock);
//                                 const pct = Math.min(100, (b.stock / 50) * 100); // demo

//                                 return (
//                                     <tr key={b.id} className="hover:bg-gray-50">
//                                         <td className="p-3 align-middle">
//                                             <input type="checkbox" className="accent-blue-600" />
//                                         </td>

//                                         {showCols.product && (
//                                             <td className="p-3">
//                                                 <div className="flex items-center gap-3">
//                                                     <img src={b.image_url} alt={b.title} className="w-12 h-12 rounded-md object-cover border" />
//                                                     <div>
//                                                         <Link to={`/admin/products/${b.id}`} className="font-medium hover:underline">
//                                                             {b.title}
//                                                         </Link>
//                                                         <div className="text-xs text-gray-400">ID: {b.id}</div>
//                                                     </div>
//                                                 </div>
//                                             </td>
//                                         )}

//                                         {showCols.author && (
//                                             <td className="p-3 align-middle">{b.author || "-"}</td>
//                                         )}

//                                         {showCols.stock && (
//                                             <td className="p-3 align-middle">
//                                                 <div className="min-w-[180px]">
//                                                     <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
//                                                         <div className={`h-2 ${barClass}`} style={{ width: `${pct}%` }} />
//                                                     </div>
//                                                     <div className={`mt-1 text-xs ${s.color}`}>{s.text}</div>
//                                                 </div>
//                                             </td>
//                                         )}

//                                         {showCols.price && (
//                                             <td className="p-3 align-middle font-medium">{toVND(b.price)}</td>
//                                         )}

//                                         {showCols.createdAt && (
//                                             <td className="p-3 align-middle">{dateVN(b.created_at)}</td>
//                                         )}

//                                         <td className="p-3 align-middle">
//                                             <div className="flex items-center justify-end gap-2">
//                                                 <Link
//                                                     to={`/admin/products/${b.id}/edit`}
//                                                     className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
//                                                     title="Sửa"
//                                                 >
//                                                     <MdEdit />
//                                                 </Link>
//                                                 <button
//                                                     onClick={() => handleDelete(b.id)}
//                                                     className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
//                                                     title="Xóa"
//                                                 >
//                                                     <MdDelete />
//                                                 </button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 );
//                             })}

//                             {list.length === 0 && (
//                                 <tr>
//                                     <td colSpan={7} className="p-8 text-center text-gray-500">
//                                         Không có sách nào.
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination */}
//                 <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
//                     <div className="text-sm text-gray-500">
//                         Đang hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
//                     </div>

//                     <div className="flex items-center gap-2">
//                         <button
//                             className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
//                             onClick={() => setPage((p) => Math.max(1, p - 1))}
//                             disabled={page === 1}
//                         >
//                             ←
//                         </button>
//                         <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">
//                             {page}
//                         </span>
//                         <button
//                             className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
//                             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                             disabled={page === totalPages}
//                         >
//                             →
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    MdSearch, MdDownload, MdAdd, MdFilterList, MdEdit, MdDelete, MdMenu
} from "react-icons/md";
import { Link } from "react-router-dom";

// ===== Mock data (sau thay bằng API) =====
const MOCK_BOOKS = [
    { id: "b1", title: "Lập Trình JavaScript Hiện Đại", author: "Nguyễn Văn A", price: 189000, stock: 50, image_url: "https://picsum.photos/seed/js1/64/64", created_at: "2025-09-01T10:15:00Z" },
    { id: "b2", title: "Cấu Trúc Dữ Liệu & Giải Thuật", author: "Trần B", price: 225000, stock: 18, image_url: "https://picsum.photos/seed/dsa/64/64", created_at: "2025-08-21T08:00:00Z" },
    { id: "b3", title: "PostgreSQL Từ A-Z", author: "Lê C", price: 265000, stock: 0, image_url: "https://picsum.photos/seed/pg/64/64", created_at: "2025-08-10T12:30:00Z" },
    { id: "b4", title: "React & Tailwind Thực Chiến", author: "Phạm D", price: 199000, stock: 24, image_url: "https://picsum.photos/seed/react/64/64", created_at: "2025-07-30T09:45:00Z" },
];

// ===== Helpers =====
const toVND = (n) => n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
function stockLabel(stock) { if (stock === 0) return { text: "Hết hàng", color: "text-red-600" }; if (stock <= 20) return { text: `${stock} sắp hết`, color: "text-amber-600" }; return { text: `${stock} còn hàng`, color: "text-emerald-600" }; }
function stockBarClass(stock) { if (stock === 0) return "bg-red-500"; if (stock <= 20) return "bg-amber-500"; return "bg-emerald-500"; }
function dateVN(iso) { try { const d = new Date(iso); return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) } catch { return "-" } }

// key lưu cấu hình cột
const COL_KEY = "admin.products.table.columns";

export default function AllProducts() {
    // tìm kiếm & phân trang
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 7;

    // toggle cột (load/ghi localStorage)
    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved ? JSON.parse(saved) : { product: true, author: true, stock: true, price: true, createdAt: true };
    });
    useEffect(() => { localStorage.setItem(COL_KEY, JSON.stringify(showCols)); }, [showCols]);

    // menu column chooser
    const [openColMenu, setOpenColMenu] = useState(false);
    const colBtnRef = useRef(null);
    const colMenuRef = useRef(null);
    useEffect(() => {
        function onClickOutside(e) {
            if (!openColMenu) return;
            if (colMenuRef.current && !colMenuRef.current.contains(e.target) &&
                colBtnRef.current && !colBtnRef.current.contains(e.target)) {
                setOpenColMenu(false);
            }
        }
        function onEsc(e) { if (e.key === "Escape") setOpenColMenu(false); }
        window.addEventListener("click", onClickOutside);
        window.addEventListener("keydown", onEsc);
        return () => { window.removeEventListener("click", onClickOutside); window.removeEventListener("keydown", onEsc); };
    }, [openColMenu]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return MOCK_BOOKS;
        return MOCK_BOOKS.filter(
            (b) => b.title.toLowerCase().includes(q) || (b.author || "").toLowerCase().includes(q)
        );
    }, [query]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);
    useEffect(() => setPage(1), [query]);

    // ===== Select-All & Row selection (theo trang) =====
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const headerCbRef = useRef(null);

    // cập nhật checked + indeterminate của checkbox header
    useEffect(() => {
        const idsOnPage = list.map((b) => b.id);
        const checkedCount = idsOnPage.filter((id) => selectedIds.has(id)).length;
        if (headerCbRef.current) {
            headerCbRef.current.indeterminate = checkedCount > 0 && checkedCount < idsOnPage.length;
            headerCbRef.current.checked = checkedCount === idsOnPage.length && idsOnPage.length > 0;
        }
    }, [list, selectedIds]);

    const toggleSelectAllOnPage = (e) => {
        const checked = e.target.checked;
        const idsOnPage = list.map((b) => b.id);
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
        if (confirm("Bạn chắc chắn muốn xóa sách này?")) {
            console.log("Delete book:", id);
            // TODO: gọi API xóa rồi reload
            setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }
    };

    return (
        <div className="space-y-5">
            {/* ==== Hàng 1: Title + Export + Add ==== */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Books</h1>
                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                        <MdDownload /> Export
                    </button>
                    <Link
                        to="/admin/products-add"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                        <MdAdd /> Thêm sản phẩm
                    </Link>
                </div>
            </div>

            {/* ==== Hàng 2: Search + Filters + Column Chooser ==== */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                <div className="relative w-full sm:w-96">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MdSearch /></span>
                    <input
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        placeholder="Tìm theo tên sách, tác giả…"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                        <MdFilterList /> Filters
                    </button>

                    {/* Column chooser */}
                    <div className="relative">
                        <button
                            ref={colBtnRef}
                            onClick={() => setOpenColMenu((v) => !v)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
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
                                <div className="font-medium mb-2">Toggle Columns</div>
                                <div className="space-y-2">
                                    {[
                                        { key: "product", label: "Product" },
                                        { key: "author", label: "Author" },
                                        { key: "stock", label: "Stock" },
                                        { key: "price", label: "Price" },
                                        { key: "createdAt", label: "Created At" },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="accent-blue-600"
                                                checked={showCols[key]}
                                                onChange={(e) => setShowCols((s) => ({ ...s, [key]: e.target.checked }))}
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

            {/* ==== Bảng ==== */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600">
                            <tr>
                                {/* Checkbox header: cố định width + canh giữa + select all */}
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
                                {showCols.product && <th className="p-3 text-left">Sách</th>}
                                {showCols.author && <th className="p-3 text-left">Tác giả</th>}
                                {showCols.stock && <th className="p-3 text-left">Tồn kho</th>}
                                {showCols.price && <th className="p-3 text-left">Giá</th>}
                                {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
                                <th className="w-24 p-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {list.map((b) => {
                                const s = stockLabel(b.stock);
                                const barClass = stockBarClass(b.stock);
                                const pct = Math.min(100, (b.stock / 50) * 100); // demo
                                const checked = selectedIds.has(b.id);

                                return (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        {/* Checkbox row: cùng width + canh giữa để thẳng hàng */}
                                        <td className="w-12 p-0">
                                            <div className="h-16 flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="accent-blue-600"
                                                    checked={checked}
                                                    onChange={() => toggleRow(b.id)}
                                                />
                                            </div>
                                        </td>

                                        {showCols.product && (
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <img src={b.image_url} alt={b.title} className="w-12 h-12 rounded-md object-cover border" />
                                                    <div>
                                                        <Link to={`/admin/products/${b.id}`} className="font-medium hover:underline">
                                                            {b.title}
                                                        </Link>
                                                        <div className="text-xs text-gray-400">ID: {b.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {showCols.author && <td className="p-3 align-middle">{b.author || "-"}</td>}

                                        {showCols.stock && (
                                            <td className="p-3 align-middle">
                                                <div className="min-w-[180px]">
                                                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                                        <div className={`h-2 ${barClass}`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <div className={`mt-1 text-xs ${s.color}`}>{s.text}</div>
                                                </div>
                                            </td>
                                        )}

                                        {showCols.price && <td className="p-3 align-middle font-medium">{toVND(b.price)}</td>}

                                        {showCols.createdAt && <td className="p-3 align-middle">{dateVN(b.created_at)}</td>}

                                        <td className="p-3 align-middle">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/products-edit/${b.id}`}
                                                    className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                    title="Sửa"
                                                >
                                                    <MdEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(b.id)}
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

                            {list.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">Không có sách nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
                    <div className="text-sm text-gray-500">
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

