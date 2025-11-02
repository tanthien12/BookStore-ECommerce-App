// src/pages/admin/UserList.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    MdSearch,
    MdDownload,
    MdAdd,
    MdEdit,
    MdVisibility,
    MdDelete,
    MdMenu,
    MdFilterList,
} from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import summaryApi from "../../common";
import ViewUserDrawer from "../../components/admin/ViewUserDrawer";

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
const INITIAL_FILTERS = {
    status: "",
    roleId: "",
    dateFrom: "",
    dateTo: "",
};

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
    const location = useLocation();
    const navigate = useNavigate();

    const [query, setQuery] = useState(() => new URLSearchParams(location.search).get("q") || "");
    const [page, setPage] = useState(1);
    const pageSize = 7;

    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [filters, setFilters] = useState({ ...INITIAL_FILTERS });
    const [filterDraft, setFilterDraft] = useState({ ...INITIAL_FILTERS });
    const [openFilter, setOpenFilter] = useState(false);
    const filterBtnRef = useRef(null);
    const filterMenuRef = useRef(null);
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);

    // 👉 Quick View Drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerUserId, setDrawerUserId] = useState(null);

    // Toggle cột hiển thị
    const [showCols, setShowCols] = useState(() => {
        const saved = localStorage.getItem(COL_KEY);
        return saved ? JSON.parse(saved) : { user: true, email: true, role: true, status: true, createdAt: true };
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

    // Filter popover lifecycle
    useEffect(() => {
        if (!openFilter) return undefined;
        const onClickOutside = (e) => {
            if (
                filterMenuRef.current &&
                !filterMenuRef.current.contains(e.target) &&
                filterBtnRef.current &&
                !filterBtnRef.current.contains(e.target)
            ) {
                setOpenFilter(false);
            }
        };
        const onEsc = (e) => {
            if (e.key === "Escape") setOpenFilter(false);
        };
        window.addEventListener("click", onClickOutside);
        window.addEventListener("keydown", onEsc);
        return () => {
            window.removeEventListener("click", onClickOutside);
            window.removeEventListener("keydown", onEsc);
        };
    }, [openFilter]);

    useEffect(() => {
        if (openFilter) setFilterDraft({ ...filters });
    }, [openFilter, filters]);

    // Sync query from URL -> state
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlQuery = params.get("q") || "";
        setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
    }, [location.search]);

    // Sync state -> URL
    useEffect(() => {
        const trimmed = query.trim();
        const params = new URLSearchParams(location.search);
        const current = params.get("q") || "";
        if (trimmed === current) return;
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
        navigate(
            { pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" },
            { replace: true }
        );
    }, [query, location.pathname, location.search, navigate]);

    // Cross component admin search events
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const handler = (event) => {
            const nextValue = typeof event?.detail?.query === "string" ? event.detail.query : "";
            setQuery(nextValue);
        };
        window.addEventListener("admin:search", handler);
        return () => window.removeEventListener("admin:search", handler);
    }, []);
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        window.dispatchEvent(new CustomEvent("admin:search:reflect", { detail: { query } }));
    }, [query]);

    // Reset to page 1 when filters or query change
    useEffect(() => {
        setPage(1);
    }, [query, filters.status, filters.roleId, filters.dateFrom, filters.dateTo]);

    // Load Roles
    useEffect(() => {
        let ignore = false;
        const ctrl = new AbortController();

        (async () => {
            try {
                setRolesLoading(true);
                const url = new URL(summaryApi.url(summaryApi.role.list));
                url.searchParams.set("withCounts", "true");
                const res = await fetch(url.toString(), {
                    signal: ctrl.signal,
                    headers: { Accept: "application/json", ...authHeaders() },
                });
                if (!res.ok) throw new Error(`Fetch roles failed: ${res.status}`);
                const data = await res.json();
                if (!ignore)
                    setRoles(Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : []);
            } catch (error) {
                if (error.name !== "AbortError") console.error(error);
            } finally {
                if (!ignore) setRolesLoading(false);
            }
        })();

        return () => {
            ignore = true;
            ctrl.abort();
        };
    }, []);

    // Fetch Users
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
                if (filters.status) url.searchParams.set("is_active", filters.status === "active" ? "1" : "0");
                if (filters.roleId) url.searchParams.set("role_id", filters.roleId);
                if (filters.dateFrom) url.searchParams.set("created_from", filters.dateFrom);
                if (filters.dateTo) url.searchParams.set("created_to", filters.dateTo);

                const res = await fetch(url.toString(), {
                    signal: ctrl.signal,
                    method: "GET",
                    headers: { Accept: "application/json", ...authHeaders() },
                });

                if (res.status === 401) {
                    toast.error("Phiên đăng nhập hết hạn hoặc không có quyền. Vui lòng đăng nhập lại.");
                    throw new Error("Unauthorized (401)");
                }
                if (!res.ok) throw new Error(`Fetch users failed: ${res.status}`);

                const data = await res.json();
                if (ignore) return;

                setItems(Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : []);
                setTotal(
                    data?.meta?.total ??
                    data.total ??
                    data.count ??
                    (Array.isArray(data.items) ? data.items.length : 0)
                );
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
    }, [query, page, filters.status, filters.roleId, filters.dateFrom, filters.dateTo]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const dynamicColSpan =
        (showCols.user ? 1 : 0) +
        (showCols.email ? 1 : 0) +
        (showCols.role ? 1 : 0) +
        (showCols.status ? 1 : 0) +
        (showCols.createdAt ? 1 : 0) +
        1; // + Actions

    const visibleItems = useMemo(() => items, [items]);

    // 👉 handler mở/đóng drawer
    const openQuickView = (id) => {
        setDrawerUserId(id);
        setDrawerOpen(true);
    };
    const closeQuickView = () => setDrawerOpen(false);

    // Export CSV (server-side filtered)
    const handleExportCsv = async () => {
        try {
            const url = new URL(summaryApi.url(summaryApi.user.list));
            if (query.trim()) url.searchParams.set("q", query.trim());
            url.searchParams.set("page", "1");
            url.searchParams.set("limit", "5000");
            url.searchParams.set("sort", "newest");
            if (filters.status) url.searchParams.set("is_active", filters.status === "active" ? "1" : "0");
            if (filters.roleId) url.searchParams.set("role_id", filters.roleId);
            if (filters.dateFrom) url.searchParams.set("created_from", filters.dateFrom);
            if (filters.dateTo) url.searchParams.set("created_to", filters.dateTo);

            const res = await fetch(url.toString(), { headers: { Accept: "application/json", ...authHeaders() } });
            if (!res.ok) throw new Error(`Export failed: ${res.status}`);
            const data = await res.json();
            const rows = Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : [];

            const header = ["id", "name", "email", "role", "status", "created_at"];
            const esc = (v) => {
                const s = (v ?? "").toString().replace(/"/g, '""');
                return `"${s}"`;
            };
            const lines = [header.join(",")];
            for (const r of rows) {
                lines.push(
                    [esc(r.id), esc(r.name), esc(r.email), esc(r.role_name || r.role || ""), esc(r.is_active ? "active" : "inactive"), esc(r.created_at || "")]
                        .join(",")
                );
            }
            const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `users_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toast.success(`Đã xuất ${rows.length} người dùng`);
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Không xuất được CSV");
        }
    };

    // Filters handlers
    const applyFilters = (e) => {
        e.preventDefault();
        if (filterDraft.dateFrom && filterDraft.dateTo) {
            const from = new Date(filterDraft.dateFrom);
            const to = new Date(filterDraft.dateTo);
            if (from > to) {
                toast.error("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
                return;
            }
        }
        setFilters({ ...filterDraft });
        setOpenFilter(false);
    };

    const clearFilters = () => {
        setFilters({ ...INITIAL_FILTERS });
        setFilterDraft({ ...INITIAL_FILTERS });
        setOpenFilter(false);
    };

    const activeFilterCount = useMemo(
        () => [filters.status, filters.roleId, filters.dateFrom, filters.dateTo].filter(Boolean).length,
        [filters]
    );

    const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
    const pageEnd = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + visibleItems.length);

    return (
        <>
            <div className="space-y-5">
                {/* ==== Title + Add ==== */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-bold">Users</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportCsv}
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

                {/* ==== Search + Filters + Column chooser ==== */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-96">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <MdSearch />
                        </span>
                        <input
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                            }}
                            placeholder="Tìm theo tên, email, role…"
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filters */}
                        <div className="relative">
                            <button
                                ref={filterBtnRef}
                                onClick={() => setOpenFilter((v) => !v)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                                aria-expanded={openFilter}
                            >
                                <MdFilterList /> Filters
                                {activeFilterCount > 0 && (
                                    <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-medium text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>
                            {openFilter && (
                                <form
                                    ref={filterMenuRef}
                                    onSubmit={applyFilters}
                                    className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-20 space-y-3"
                                >
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-600">Trạng thái</label>
                                        <select
                                            value={filterDraft.status}
                                            onChange={(e) => setFilterDraft((prev) => ({ ...prev, status: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Tất cả</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-600">Role</label>
                                        <select
                                            value={filterDraft.roleId}
                                            onChange={(e) => setFilterDraft((prev) => ({ ...prev, roleId: e.target.value }))}
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Tất cả</option>
                                            {rolesLoading ? (
                                                <option disabled>Đang tải…</option>
                                            ) : (
                                                roles.map((role) => {
                                                    const count = role.users_count ?? role.usersCount ?? role.count;
                                                    return (
                                                        <option key={role.id} value={role.id}>
                                                            {role.name} {count ? `(${count})` : ""}
                                                        </option>
                                                    );
                                                })
                                            )}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-600">Từ ngày</label>
                                            <input
                                                type="date"
                                                value={filterDraft.dateFrom}
                                                onChange={(e) => setFilterDraft((prev) => ({ ...prev, dateFrom: e.target.value }))}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-gray-600">Đến ngày</label>
                                            <input
                                                type="date"
                                                value={filterDraft.dateTo}
                                                onChange={(e) => setFilterDraft((prev) => ({ ...prev, dateTo: e.target.value }))}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                        >
                                            Xóa lọc
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setOpenFilter(false)}
                                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                                            >
                                                Đóng
                                            </button>
                                            <button
                                                type="submit"
                                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                            >
                                                Áp dụng
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>

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
                                ) : visibleItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={dynamicColSpan} className="p-8 text-center text-gray-500">
                                            Không có người dùng nào.
                                        </td>
                                    </tr>
                                ) : (
                                    visibleItems.map((u) => (
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
                                                <td className="p-3 align-middle">{u.role_name || u.role || "-"}</td>
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
                                                    {/* Xem nhanh: mở Drawer */}
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
                    <div className="flex flex-col gap-3 px-4 py-3 bg-white border-t text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            {total > 0 ? <>Đang hiển thị {pageStart}–{pageEnd} / {total}</> : <>Không có dữ liệu</>}
                            {activeFilterCount > 0 && total > 0 && (
                                <span className="ml-2 text-xs text-gray-500">(Đang áp dụng {activeFilterCount} bộ lọc)</span>
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
            <ViewUserDrawer open={drawerOpen} userId={drawerUserId} onClose={closeQuickView} />
        </>
    );
}


//code goc
// // src/pages/admin/UserList.jsx
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
// import ViewUserDrawer from "../../components/admin/ViewUserDrawer"; // ⬅️ thêm

// /* ================= Helpers ================= */
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
//     active: "bg-emerald-100 text-emerald-700 border-emerald-200",
//     inactive: "bg-red-100 text-red-700 border-red-200",
// };

// const COL_KEY = "admin.users.table.columns";

// const getAccessToken = () => {
//     let t = localStorage.getItem("token") || localStorage.getItem("access_token");
//     if (!t) return null;
//     try {
//         const parsed = JSON.parse(t);
//         if (typeof parsed === "string") t = parsed;
//     } catch { }
//     t = String(t).trim();
//     if (!t || t === "null" || t === "undefined") return null;
//     return t;
// };
// const authHeaders = () => {
//     const token = getAccessToken();
//     return token ? { Authorization: `Bearer ${token}` } : {};
// };

// /* ================= Component ================= */
// export default function UserList() {
//     const [query, setQuery] = useState("");
//     const [page, setPage] = useState(1);
//     const pageSize = 7;

//     const [items, setItems] = useState([]);
//     const [total, setTotal] = useState(0);
//     const [loading, setLoading] = useState(false);

//     // 👉 State cho Quick View Drawer
//     const [drawerOpen, setDrawerOpen] = useState(false);
//     const [drawerUserId, setDrawerUserId] = useState(null);

//     // Toggle cột hiển thị
//     const [showCols, setShowCols] = useState(() => {
//         const saved = localStorage.getItem(COL_KEY);
//         return saved
//             ? JSON.parse(saved)
//             : { user: true, email: true, role: true, status: true, createdAt: true };
//     });
//     useEffect(() => localStorage.setItem(COL_KEY, JSON.stringify(showCols)), [showCols]);

//     // Column chooser
//     const [openColMenu, setOpenColMenu] = useState(false);
//     const colBtnRef = useRef(null);
//     const colMenuRef = useRef(null);
//     useEffect(() => {
//         const onClickOutside = (e) => {
//             if (
//                 openColMenu &&
//                 colMenuRef.current &&
//                 !colMenuRef.current.contains(e.target) &&
//                 colBtnRef.current &&
//                 !colBtnRef.current.contains(e.target)
//             ) {
//                 setOpenColMenu(false);
//             }
//         };
//         const onEsc = (e) => e.key === "Escape" && setOpenColMenu(false);
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

//                 const res = await fetch(url.toString(), {
//                     signal: ctrl.signal,
//                     method: "GET",
//                     headers: { ...authHeaders() },
//                 });

//                 if (res.status === 401) {
//                     toast.error("Phiên đăng nhập hết hạn hoặc không có quyền. Vui lòng đăng nhập lại.");
//                     throw new Error("Unauthorized (401)");
//                 }
//                 if (!res.ok) throw new Error(`Fetch users failed: ${res.status}`);

//                 const data = await res.json();
//                 if (ignore) return;

//                 setItems(Array.isArray(data.items) ? data.items : []);
//                 setTotal(data?.meta?.total ?? 0);
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
//     const dynamicColSpan =
//         (showCols.user ? 1 : 0) +
//         (showCols.email ? 1 : 0) +
//         (showCols.role ? 1 : 0) +
//         (showCols.status ? 1 : 0) +
//         (showCols.createdAt ? 1 : 0) +
//         1; // + Actions

//     // 👉 handler mở/đóng drawer
//     const openQuickView = (id) => {
//         setDrawerUserId(id);
//         setDrawerOpen(true);
//     };
//     const closeQuickView = () => setDrawerOpen(false);

//     return (
//         <>
//             <div className="space-y-5">
//                 {/* ==== Title + Add ==== */}
//                 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                     <h1 className="text-2xl font-bold">Users</h1>
//                     <div className="flex items-center gap-2">
//                         <button
//                             onClick={() => toast.info("Export CSV coming soon")}
//                             className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                         >
//                             <MdDownload /> Export
//                         </button>
//                         <Link
//                             to="/admin/users-add"
//                             className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
//                         >
//                             <MdAdd /> Thêm người dùng
//                         </Link>
//                     </div>
//                 </div>

//                 {/* ==== Search + Column chooser ==== */}
//                 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
//                     <div className="relative w-full sm:w-96">
//                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
//                             <MdSearch />
//                         </span>
//                         <input
//                             value={query}
//                             onChange={(e) => {
//                                 setQuery(e.target.value);
//                                 setPage(1);
//                             }}
//                             placeholder="Tìm theo tên, email, role…"
//                             className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         />
//                     </div>

//                     <div className="flex items-center gap-2">
//                         <div className="relative">
//                             <button
//                                 ref={colBtnRef}
//                                 onClick={() => setOpenColMenu((v) => !v)}
//                                 className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
//                                 title="Chọn cột hiển thị"
//                                 aria-expanded={openColMenu}
//                             >
//                                 <MdMenu />
//                             </button>

//                             {openColMenu && (
//                                 <div
//                                     ref={colMenuRef}
//                                     className="absolute right-0 mt-2 w-64 rounded-xl border bg-white shadow-lg p-3 z-10"
//                                 >
//                                     <div className="font-medium mb-2">Toggle Columns</div>
//                                     <div className="space-y-2">
//                                         {[
//                                             { key: "user", label: "Người dùng" },
//                                             { key: "email", label: "Email" },
//                                             { key: "role", label: "Role" },
//                                             { key: "status", label: "Trạng thái" },
//                                             { key: "createdAt", label: "Ngày tạo" },
//                                         ].map(({ key, label }) => (
//                                             <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
//                                                 <input
//                                                     type="checkbox"
//                                                     className="accent-blue-600"
//                                                     checked={!!showCols[key]}
//                                                     onChange={(e) =>
//                                                         setShowCols((s) => ({
//                                                             ...s,
//                                                             [key]: e.target.checked,
//                                                         }))
//                                                     }
//                                                 />
//                                                 <span>{label}</span>
//                                             </label>
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>

//                 {/* ==== Table ==== */}
//                 <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
//                     <div className="overflow-x-auto">
//                         <table className="min-w-full text-sm">
//                             <thead className="bg-gray-100 text-gray-600">
//                                 <tr>
//                                     {showCols.user && <th className="p-3 text-left">Người dùng</th>}
//                                     {showCols.email && <th className="p-3 text-left">Email</th>}
//                                     {showCols.role && <th className="p-3 text-left">Role</th>}
//                                     {showCols.status && <th className="p-3 text-left">Trạng thái</th>}
//                                     {showCols.createdAt && <th className="p-3 text-left">Ngày tạo</th>}
//                                     <th className="w-28 p-3 text-right">Actions</th>
//                                 </tr>
//                             </thead>

//                             <tbody className="divide-y">
//                                 {loading ? (
//                                     <tr>
//                                         <td colSpan={dynamicColSpan} className="p-8 text-center text-gray-500">
//                                             Đang tải…
//                                         </td>
//                                     </tr>
//                                 ) : items.length === 0 ? (
//                                     <tr>
//                                         <td colSpan={dynamicColSpan} className="p-8 text-center text-gray-500">
//                                             Không có người dùng nào.
//                                         </td>
//                                     </tr>
//                                 ) : (
//                                     items.map((u) => (
//                                         <tr key={u.id} className="hover:bg-gray-50">
//                                             {showCols.user && (
//                                                 <td className="p-3">
//                                                     <div className="flex items-center gap-3">
//                                                         <img
//                                                             src={u.avatar_url || "/no-avatar.png"}
//                                                             alt={u.name}
//                                                             className="w-10 h-10 rounded-full object-cover border"
//                                                         />
//                                                         <div>
//                                                             <div className="font-medium">{u.name}</div>
//                                                             <div className="text-xs text-gray-400">ID: {u.id}</div>
//                                                         </div>
//                                                     </div>
//                                                 </td>
//                                             )}

//                                             {showCols.email && <td className="p-3 align-middle">{u.email}</td>}

//                                             {showCols.role && (
//                                                 <td className="p-3 align-middle">{u.role_name || "-"}</td>
//                                             )}

//                                             {showCols.status && (
//                                                 <td className="p-3 align-middle">
//                                                     <span
//                                                         className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${u.is_active ? STATUS_BADGE.active : STATUS_BADGE.inactive
//                                                             }`}
//                                                     >
//                                                         {u.is_active ? "Active" : "Inactive"}
//                                                     </span>
//                                                 </td>
//                                             )}

//                                             {showCols.createdAt && (
//                                                 <td className="p-3 align-middle">{dateVN(u.created_at)}</td>
//                                             )}

//                                             <td className="p-3 align-middle">
//                                                 <div className="flex items-center justify-end gap-2">
//                                                     {/* 👇 Nút xem nhanh: mở Drawer */}
//                                                     <button
//                                                         onClick={() => openQuickView(u.id)}
//                                                         className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
//                                                         title="Xem nhanh"
//                                                         type="button"
//                                                     >
//                                                         <MdVisibility />
//                                                     </button>

//                                                     {/* Sửa */}
//                                                     <Link
//                                                         to={`/admin/users-edit/${u.id}`}
//                                                         className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100"
//                                                         title="Sửa"
//                                                     >
//                                                         <MdEdit />
//                                                     </Link>

//                                                     {/* Xóa (TODO) */}
//                                                     <button
//                                                         onClick={() => toast.info("Delete user coming soon")}
//                                                         className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 hover:bg-gray-100 text-red-600"
//                                                         title="Xóa"
//                                                         type="button"
//                                                     >
//                                                         <MdDelete />
//                                                     </button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))
//                                 )}
//                             </tbody>
//                         </table>
//                     </div>

//                     {/* Pagination */}
//                     <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
//                         <div className="text-sm text-gray-500">
//                             {total > 0 ? (
//                                 <>
//                                     Đang hiển thị {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} / {total}
//                                 </>
//                             ) : (
//                                 <>Không có dữ liệu</>
//                             )}
//                         </div>
//                         <div className="flex items-center gap-2">
//                             <button
//                                 className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
//                                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                                 disabled={page === 1}
//                             >
//                                 ←
//                             </button>
//                             <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white">
//                                 {page} / {Math.max(1, Math.ceil(total / pageSize))}
//                             </span>
//                             <button
//                                 className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
//                                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                                 disabled={page === totalPages}
//                             >
//                                 →
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* 👉 Drawer xem nhanh */}
//             <ViewUserDrawer
//                 open={drawerOpen}
//                 onClose={closeQuickView}
//                 userId={drawerUserId}
//             />
//         </>
//     );
// }
