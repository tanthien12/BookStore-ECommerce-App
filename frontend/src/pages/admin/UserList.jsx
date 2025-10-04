// import React, { useEffect, useRef, useState } from "react";
// import {
//     MdSearch,
//     MdDownload,
//     MdAdd,
//     MdEdit,
//     MdVisibility,
//     MdDelete,
//     MdMenu,
// } from "react-icons/md";
// import { Link } from "react-router-dom";
// import { toast } from "react-toastify";
// import summaryApi from "../../common";

// // ===== Helpers =====
// function dateVN(iso) {
//     try {
//         const d = new Date(iso);
//         return d.toLocaleDateString("vi-VN", {
//             day: "2-digit",
//             month: "2-digit",
//             year: "numeric",
//         });
//     } catch {
//         return "-";
//     }
// }

// const STATUS_BADGE = {
//     active:
//         "bg-emerald-100 text-emerald-700 border-emerald-200",
//     inactive:
//         "bg-red-100 text-red-700 border-red-200",
// };

// const COL_KEY = "admin.users.table.columns";

// export default function UserList() {
//     const [query, setQuery] = useState("");
//     const [page, setPage] = useState(1);
//     const pageSize = 7;

//     const [items, setItems] = useState([]);
//     const [total, setTotal] = useState(0);
//     const [loading, setLoading] = useState(false);

//     // toggle cột
//     const [showCols, setShowCols] = useState(() => {
//         const saved = localStorage.getItem(COL_KEY);
//         return saved
//             ? JSON.parse(saved)
//             : { user: true, email: true, role: true, status: true, createdAt: true };
//     });
//     useEffect(
//         () => localStorage.setItem(COL_KEY, JSON.stringify(showCols)),
//         [showCols]
//     );

//     // column chooser
//     const [openColMenu, setOpenColMenu] = useState(false);
//     const colBtnRef = useRef(null);
//     const colMenuRef = useRef(null);
//     useEffect(() => {
//         function onClickOutside(e) {
//             if (
//                 openColMenu &&
//                 colMenuRef.current &&
//                 !colMenuRef.current.contains(e.target) &&
//                 colBtnRef.current &&
//                 !colBtnRef.current.contains(e.target)
//             ) {
//                 setOpenColMenu(false);
//             }
//         }
//         function onEsc(e) {
//             if (e.key === "Escape") setOpenColMenu(false);
//         }
//         window.addEventListener("click", onClickOutside);
//         window.addEventListener("keydown", onEsc);
//         return () => {
//             window.removeEventListener("click", onClickOutside);
//             window.removeEventListener("keydown", onEsc);
//         };
//     }, [openColMenu]);

//     // fetch list
//     useEffect(() => {
//         let ignore = false;
//         const ctrl = new AbortController();

//         (async () => {
//             try {
//                 setLoading(true);
//                 const url = new URL(summaryApi.url(summaryApi.user.list));
//                 if (query.trim()) url.searchParams.set("q", query.trim());
//                 url.searchParams.set("page", String(page));
//                 url.searchParams.set("limit", String(pageSize));
//                 url.searchParams.set("sort", "newest");

//                 const res = await fetch(url.toString(), { signal: ctrl.signal });
//                 if (!res.ok) throw new Error(`Fetch users failed: ${res.status}`);
//                 const data = await res.json();
//                 if (ignore) return;

//                 setItems(data.items || []);
//                 setTotal(data.total ?? 0);
//             } catch (e) {
//                 if (e.name !== "AbortError") {
//                     console.error(e);
//                     toast.error(e.message || "Không tải được danh sách người dùng");
//                 }
//             } finally {
//                 if (!ignore) setLoading(false);
//             }
//         })();

//         return () => {
//             ignore = true;
//             ctrl.abort();
//         };
//     }, [query, page]);

//     const totalPages = Math.max(1, Math.ceil(total / pageSize));

//     return (
//         <div className="space-y-5">
//             {/* ==== Title + Add ==== */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <h1 className="text-2xl font-bold">Users</h1>
//                 <div className="flex items-center gap-2">
//                     <button
//                         onClick={() => toast.info("Export CSV coming soon")}
//                         className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                     >
//                         <MdDownload /> Export
//                     </button>
//                     <Link
//                         to="/admin/users-add"
//                         className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
//                     >
//                         <MdAdd /> Thêm người dùng
//                     </Link>
//                 </div>
//             </div>

//             {/* ==== Search + Column chooser ==== */}
//             <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                 <div className="relative w-full sm:w-96">
//                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                         <MdSearch />
//                     </span>
//                     <input
//                         value={query}
//                         onChange={(e) => {
//                             setQuery(e.target.value);
//                             setPage(1);
//                         }}
//                         placeholder="Tìm theo tên, email, role…"
//                         className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     />
//                 </div>

//                 <div className="flex items-center gap-2">
//                     <div className="relative">
//                         <button
//                             ref={colBtnRef}
//                             onClick={() => setOpenColMenu((v) => !v)}
//                             className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                             title="Chọn cột hiển thị"
//                             aria-expanded={openColMenu}
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
//                                         { key: "user", label: "Người dùng" },
//                                         { key: "email", label: "Email" },
//                                         { key: "role", label: "Role" },
//                                         { key: "status", label: "Trạng thái" },
//                                         { key: "createdAt", label: "Ngày tạo" },
//                                     ].map(({ key, label }) => (
//                                         <label
//                                             key={key}
//                                             className="flex items-center gap-2 text-sm cursor-pointer"
//                                         >
//                                             <input
//                                                 type="checkbox"
//                                                 className="accent-blue-600"
//                                                 checked={showCols[key]}
//                                                 onChange={(e) =>
//                                                     setShowCols((s) => ({
//                                                         ...s,
//                                                         [key]: e.target.checked,
//                                                     }))
//                                                 }
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

//             {/* ==== Table ==== */}
//             <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm">
//                         <thead className="bg-gray-100 text-gray-600">
//                             <tr>
//                                 {showCols.user && <th className="p-3 text-left">Người dùng</th>}
//                                 {showCols.email && <th className="p-3 text-left">Email</th>}
//                                 {showCols.role && <th className="p-3 text-left">Role</th>}
//                                 {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
//                                 {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
//                                 <th className="w-28 p-3 text-right">Actions</th>
//                             </tr>
//                         </thead>

//                         <tbody className="divide-y">
//                             {loading ? (
//                                 <tr>
//                                     <td colSpan={6} className="p-8 text-center text-gray-500">
//                                         Đang tải…
//                                     </td>
//                                 </tr>
//                             ) : items.length === 0 ? (
//                                 <tr>
//                                     <td colSpan={6} className="p-8 text-center text-gray-500">
//                                         Không có người dùng nào.
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 items.map((u) => (
//                                     <tr key={u.id} className="hover:bg-gray-50">
//                                         {showCols.user && (
//                                             <td className="p-3">
//                                                 <div className="flex items-center gap-3">
//                                                     <img
//                                                         src={u.avatar_url || "/no-avatar.png"}
//                                                         alt={u.name}
//                                                         className="w-10 h-10 rounded-full object-cover border"
//                                                     />
//                                                     <div>
//                                                         <div className="font-medium">{u.name}</div>
//                                                         <div className="text-xs text-gray-400">ID: {u.id}</div>
//                                                     </div>
//                                                 </div>
//                                             </td>
//                                         )}

//                                         {showCols.email && (
//                                             <td className="p-3 align-middle">{u.email}</td>
//                                         )}

//                                         {showCols.role && (
//                                             <td className="p-3 align-middle">{u.role || "-"}</td>
//                                         )}

//                                         {showCols.status && (
//                                             <td className="p-3 align-middle">
//                                                 <span
//                                                     className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${u.is_active ? STATUS_BADGE.active : STATUS_BADGE.inactive
//                                                         }`}
//                                                 >
//                                                     {u.is_active ? "Active" : "Inactive"}
//                                                 </span>
//                                             </td>
//                                         )}

//                                         {showCols.createdAt && (
//                                             <td className="p-3 align-middle">{dateVN(u.created_at)}</td>
//                                         )}

//                                         <td className="p-3 align-middle">
//                                             <div className="flex items-center justify-end gap-2">
//                                                 <Link
//                                                     to={`/admin/users/${u.id}`}
//                                                     className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
//                                                     title="Xem chi tiết"
//                                                 >
//                                                     <MdVisibility />
//                                                 </Link>
//                                                 <Link
//                                                     to={`/admin/users-edit/${u.id}`}
//                                                     className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
//                                                     title="Sửa"
//                                                 >
//                                                     <MdEdit />
//                                                 </Link>
//                                                 <button
//                                                     onClick={() => toast.info("Delete user coming soon")}
//                                                     className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
//                                                     title="Xóa"
//                                                 >
//                                                     <MdDelete />
//                                                 </button>
//                                             </div>
//                                         </td>
//                                     </tr>
//                                 ))
//                             )}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* Pagination */}
//                 <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
//                     <div className="text-sm text-gray-500">
//                         {total > 0 ? (
//                             <>
//                                 Đang hiển thị {(page - 1) * pageSize + 1}–
//                                 {Math.min(page * pageSize, total)} / {total}
//                             </>
//                         ) : (
//                             <>Không có dữ liệu</>
//                         )}
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

// src/pages/admin/UserList.jsx
import React, { useEffect, useRef, useState } from "react";
import {
    MdSearch,
    MdDownload,
    MdAdd,
    MdEdit,
    MdVisibility,
    MdDelete,
    MdMenu,
} from "react-icons/md";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import summaryApi from "../../common";
import ViewUserDrawer from "../../components/admin/ViewUserDrawer"; // ⬅️ thêm

/* ================= Helpers ================= */
function dateVN(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return "-";
    }
}

const STATUS_BADGE = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    inactive: "bg-red-100 text-red-700 border-red-200",
};

const COL_KEY = "admin.users.table.columns";

const getAccessToken = () => {
    let t = localStorage.getItem("token") || localStorage.getItem("access_token");
    if (!t) return null;
    try {
        const parsed = JSON.parse(t);
        if (typeof parsed === "string") t = parsed;
    } catch { }
    t = String(t).trim();
    if (!t || t === "null" || t === "undefined") return null;
    return t;
};
const authHeaders = () => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ================= Component ================= */
export default function UserList() {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 7;

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    // 👉 State cho Quick View Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerUserId, setDrawerUserId] = useState(null);

    // Toggle cột hiển thị
    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved
            ? JSON.parse(saved)
            : { user: true, email: true, role: true, status: true, createdAt: true };
    });
    useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

    // Column chooser
    const [openColMenu, setOpenColMenu] = useState(false);
    const colBtnRef = useRef(null);
    const colMenuRef = useRef(null);
    useEffect(() => {
        const onClickOutside = (e) => {
            if (
                openColMenu &&
                colMenuRef.current &&
                !colMenuRef.current.contains(e.target) &&
                colBtnRef.current &&
                !colBtnRef.current.contains(e.target)
            ) {
                setOpenColMenu(false);
            }
        };
        const onEsc = (e) => e.key === "Escape" && setOpenColMenu(false);
        window.addEventListener("click", onClickOutside);
        window.addEventListener("keydown", onEsc);
        return () => {
            window.removeEventListener("click", onClickOutside);
            window.removeEventListener("keydown", onEsc);
        };
    }, [openColMenu]);

    // fetch list
    useEffect(() => {
        let ignore = false;
        const ctrl = new AbortController();

        (async () => {
            try {
                setLoading(true);
                const url = new URL(summaryApi.url(summaryApi.user.list));
                if (query.trim()) url.searchParams.set("q", query.trim());
                url.searchParams.set("page", String(page));
                url.searchParams.set("limit", String(pageSize));
                url.searchParams.set("sort", "newest");

                const res = await fetch(url.toString(), {
                    signal: ctrl.signal,
                    method: "GET",
                    headers: { ...authHeaders() },
                });

                if (res.status === 401) {
                    toast.error("Phiên đăng nhập hết hạn hoặc không có quyền. Vui lòng đăng nhập lại.");
                    throw new Error("Unauthorized (401)");
                }
                if (!res.ok) throw new Error(`Fetch users failed: ${res.status}`);

                const data = await res.json();
                if (ignore) return;

                setItems(Array.isArray(data.items) ? data.items : []);
                setTotal(data?.meta?.total ?? 0);
            } catch (e) {
                if (e.name !== "AbortError") {
                    console.error(e);
                    toast.error(e.message || "Không tải được danh sách người dùng");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        })();

        return () => {
            ignore = true;
            ctrl.abort();
        };
    }, [query, page]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const dynamicColSpan =
        (showCols.user ? 1 : 0) +
        (showCols.email ? 1 : 0) +
        (showCols.role ? 1 : 0) +
        (showCols.status ? 1 : 0) +
        (showCols.createdAt ? 1 : 0) +
        1; // + Actions

    // 👉 handler mở/đóng drawer
    const openQuickView = (id) => {
        setDrawerUserId(id);
        setDrawerOpen(true);
    };
    const closeQuickView = () => setDrawerOpen(false);

    return (
        <>
            <div className="space-y-5">
                {/* ==== Title + Add ==== */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">Users</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toast.info("Export CSV coming soon")}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                        >
                            <MdDownload /> Export
                        </button>
                        <Link
                            to="/admin/users-add"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                        >
                            <MdAdd /> Thêm người dùng
                        </Link>
                    </div>
                </div>

                {/* ==== Search + Column chooser ==== */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-96">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <MdSearch />
                        </span>
                        <input
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Tìm theo tên, email, role…"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
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
                                            { key: "user", label: "Người dùng" },
                                            { key: "email", label: "Email" },
                                            { key: "role", label: "Role" },
                                            { key: "status", label: "Trạng thái" },
                                            { key: "createdAt", label: "Ngày tạo" },
                                        ].map(({ key, label }) => (
                                            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="accent-blue-600"
                                                    checked={!!showCols[key]}
                                                    onChange={(e) =>
                                                        setShowCols((s) => ({
                                                            ...s,
                                                            [key]: e.target.checked,
                                                        }))
                                                    }
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

                {/* ==== Table ==== */}
                <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    {showCols.user && <th className="p-3 text-left">Người dùng</th>}
                                    {showCols.email && <th className="p-3 text-left">Email</th>}
                                    {showCols.role && <th className="p-3 text-left">Role</th>}
                                    {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
                                    {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
                                    <th className="w-28 p-3 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={dynamicColSpan} className="p-8 text-center text-gray-500">
                                            Đang tải…
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={dynamicColSpan} className="p-8 text-center text-gray-500">
                                            Không có người dùng nào.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            {showCols.user && (
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={u.avatar_url || "/no-avatar.png"}
                                                            alt={u.name}
                                                            className="w-10 h-10 rounded-full object-cover border"
                                                        />
                                                        <div>
                                                            <div className="font-medium">{u.name}</div>
                                                            <div className="text-xs text-gray-400">ID: {u.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}

                                            {showCols.email && <td className="p-3 align-middle">{u.email}</td>}

                                            {showCols.role && (
                                                <td className="p-3 align-middle">{u.role_name || "-"}</td>
                                            )}

                                            {showCols.status && (
                                                <td className="p-3 align-middle">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${u.is_active ? STATUS_BADGE.active : STATUS_BADGE.inactive
                                                            }`}
                                                    >
                                                        {u.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                            )}

                                            {showCols.createdAt && (
                                                <td className="p-3 align-middle">{dateVN(u.created_at)}</td>
                                            )}

                                            <td className="p-3 align-middle">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* 👇 Nút xem nhanh: mở Drawer */}
                                                    <button
                                                        onClick={() => openQuickView(u.id)}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                        title="Xem nhanh"
                                                        type="button"
                                                    >
                                                        <MdVisibility />
                                                    </button>

                                                    {/* Sửa */}
                                                    <Link
                                                        to={`/admin/users-edit/${u.id}`}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
                                                        title="Sửa"
                                                    >
                                                        <MdEdit />
                                                    </Link>

                                                    {/* Xóa (TODO) */}
                                                    <button
                                                        onClick={() => toast.info("Delete user coming soon")}
                                                        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
                                                        title="Xóa"
                                                        type="button"
                                                    >
                                                        <MdDelete />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
                        <div className="text-sm text-gray-500">
                            {total > 0 ? (
                                <>
                                    Đang hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
                                </>
                            ) : (
                                <>Không có dữ liệu</>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                ←
                            </button>
                            <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">
                                {page} / {Math.max(1, Math.ceil(total / pageSize))}
                            </span>
                            <button
                                className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 👉 Drawer xem nhanh */}
            <ViewUserDrawer
                open={drawerOpen}
                onClose={closeQuickView}
                userId={drawerUserId}
            />
        </>
    );
}
