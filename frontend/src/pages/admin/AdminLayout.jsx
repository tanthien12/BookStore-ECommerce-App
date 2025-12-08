// frontend/src/pages/admin/AdminLayout.jsx
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiMenu, FiSearch } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../../components/admin/Sidebar";
import summaryApi, { authHeaders } from "../../common";
import {
    clearUser,
    setUserDetails,
    setUserStatus,
} from "../../store/userSlice";
import { toast } from "react-toastify";
import NotificationBell from "../../components/layout/NotificationBell";

const SIDEBAR_PIN_KEY = "admin.ui.sidebar.pinned";

const readStoredUser = () => {
    if (typeof window === "undefined") return null;
    const keys = ["user", "profile", "account"];
    for (const key of keys) {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") return parsed;
        } catch (err) {
            console.warn("Cannot parse stored user", err);
        }
    }
    return null;
};

const normalizeUser = (payload) => {
    if (!payload || typeof payload !== "object") return null;
    if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
        if (payload.data.user && typeof payload.data.user === "object") {
            return payload.data.user;
        }
        return payload.data;
    }
    if (payload.user && typeof payload.user === "object") return payload.user;
    if (payload.result && typeof payload.result === "object") return payload.result;
    return payload;
};

const getDisplayName = (user) => {
    if (!user) return "Quản trị";
    const candidates = [
        user.name,
        user.fullName,
        user.fullname,
        user.displayName,
    ];
    for (const c of candidates) {
        if (typeof c === "string" && c.trim()) return c.trim();
    }
    if (user.firstName || user.lastName) {
        return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    if (typeof user.email === "string" && user.email.trim()) {
        return user.email.trim();
    }
    return "Quản trị";
};

const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.split(/\s+/).filter(Boolean);
    if (!parts.length) return "AD";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
};

const resolveAvatar = (user) =>
    user?.avatar ||
    user?.avatar_url ||
    user?.avatarUrl ||
    user?.photo ||
    user?.photoUrl ||
    user?.image ||
    user?.image_url ||
    user?.picture ||
    null;

export default function AdminLayout() {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    const storedUserRef = useRef(readStoredUser());
    const user = useSelector((state) => state.user.data) || storedUserRef.current;
    const userStatus = useSelector((state) => state.user.status);

    const [sidebarPinned, setSidebarPinned] = useState(() => {
        if (typeof window === "undefined") return true;
        const saved = window.localStorage.getItem(SIDEBAR_PIN_KEY);
        if (saved === "true" || saved === "false") return saved === "true";
        return window.innerWidth >= 1024;
    });
    const [sidebarOpen, setSidebarOpen] = useState(() =>
        typeof window === "undefined" ? false : window.innerWidth >= 1024
    );

    // sync theo kích thước màn hình
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const onResize = () => {
            const isDesktop = window.innerWidth >= 1024;
            if (isDesktop) setSidebarOpen(true);
            else if (!sidebarPinned) setSidebarOpen(false);
        };
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [sidebarPinned]);

    // lưu trạng thái pin sidebar
    useEffect(() => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(
            SIDEBAR_PIN_KEY,
            sidebarPinned ? "true" : "false"
        );
        if (sidebarPinned) setSidebarOpen(true);
    }, [sidebarPinned]);

    // search term đồng bộ với query param ?q=
    const [searchTerm, setSearchTerm] = useState("");
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const next = params.get("q") || "";
        setSearchTerm(next);
    }, [location.pathname, location.search]);

    // phản chiếu event "admin:search:reflect" nếu có nơi khác bắn
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const syncHandler = (event) => {
            if (!event?.detail || typeof event.detail.query !== "string") return;
            setSearchTerm(event.detail.query);
        };
        window.addEventListener("admin:search:reflect", syncHandler);
        return () => window.removeEventListener("admin:search:reflect", syncHandler);
    }, []);

    // profile dropdown
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // đóng dropdown khi click ngoài / ESC
    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const onClick = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
        };
        const onEsc = (event) => {
            if (event.key === "Escape") {
                setProfileOpen(false);
            }
        };
        window.addEventListener("mousedown", onClick);
        window.addEventListener("keydown", onEsc);
        return () => {
            window.removeEventListener("mousedown", onClick);
            window.removeEventListener("keydown", onEsc);
        };
    }, []);

    // fetch thông tin user /me nếu chưa có
    const userFetchAttemptedRef = useRef(false);
    useEffect(() => {
        if (user || userStatus === "loading" || userFetchAttemptedRef.current)
            return undefined;
        let ignore = false;
        const ctrl = new AbortController();

        const loadMe = async () => {
            try {
                userFetchAttemptedRef.current = true;
                dispatch(setUserStatus("loading"));
                const res = await fetch(summaryApi.url(summaryApi.auth.me), {
                    headers: { Accept: "application/json", ...authHeaders() },
                    credentials: "include",
                    signal: ctrl.signal,
                });

                if (res.status === 401) {
                    dispatch(clearUser());
                    dispatch(setUserStatus("idle"));
                    storedUserRef.current = null;
                    if (typeof window !== "undefined") {
                        ["access_token", "token", "refresh_token", "refreshToken", "user"].forEach(
                            (key) => window.localStorage.removeItem(key)
                        );
                    }
                    return;
                }

                if (!res.ok) {
                    throw new Error(`Không thể tải thông tin tài khoản (${res.status})`);
                }

                const payload = await res.json();
                if (ignore) return;

                const normalized = normalizeUser(payload);
                if (normalized) {
                    dispatch(setUserDetails(normalized));
                    storedUserRef.current = normalized;
                    if (typeof window !== "undefined") {
                        try {
                            window.localStorage.setItem("user", JSON.stringify(normalized));
                        } catch (err) {
                            console.warn("Cannot persist user", err);
                        }
                    }
                } else {
                    dispatch(setUserDetails(null));
                    storedUserRef.current = null;
                }
            } catch (err) {
                if (err.name === "AbortError") return;
                console.error(err);
                dispatch(setUserStatus("error"));
                if (err.message) toast.error(err.message);
            }
        };

        loadMe();
        return () => {
            ignore = true;
            ctrl.abort();
        };
    }, [dispatch, user, userStatus]);

    // persist user khi thay đổi
    useEffect(() => {
        if (!user || typeof window === "undefined") return;
        try {
            window.localStorage.setItem("user", JSON.stringify(user));
        } catch (err) {
            console.warn("Cannot persist user", err);
        }
    }, [user]);

    const displayName = useMemo(() => getDisplayName(user), [user]);
    const userEmail = user?.email || user?.username || "";
    const avatarUrl = resolveAvatar(user);
    const initials = useMemo(() => getInitials(displayName), [displayName]);

    // submit search
    const handleSearchSubmit = useCallback(
        (event) => {
            event.preventDefault();
            const trimmed = searchTerm.trim();
            const params = new URLSearchParams(location.search);
            if (trimmed) params.set("q", trimmed);
            else params.delete("q");

            navigate({
                pathname: location.pathname,
                search: params.toString() ? `?${params.toString()}` : "",
            });

            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("admin:search", { detail: { query: trimmed } })
                );
            }
        },
        [location.pathname, location.search, navigate, searchTerm]
    );

    // logout
    const handleLogout = useCallback(async () => {
        try {
            await fetch(summaryApi.url(summaryApi.auth.logout), {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                credentials: "include",
            });
        } catch (error) {
            console.error(error);
        } finally {
            userFetchAttemptedRef.current = false;
            if (typeof window !== "undefined") {
                ["access_token", "token", "refresh_token", "refreshToken", "user"].forEach(
                    (key) => window.localStorage.removeItem(key)
                );
            }
            dispatch(clearUser());
            toast.success("Đã đăng xuất khỏi khu vực quản trị");
            navigate("/login");
        }
    }, [dispatch, navigate]);

    // khi click menu trong sidebar trên mobile -> đóng sidebar nếu không pin
    const handleSidebarNavigate = useCallback(() => {
        if (!sidebarPinned) setSidebarOpen(false);
    }, [sidebarPinned]);

    const mainOffsetClass = sidebarPinned ? "lg:ml-64" : "";

    return (
        <div className="relative min-h-screen bg-gray-100">
            {/* Sidebar Admin */}
            <Sidebar
                open={sidebarOpen}
                pinned={sidebarPinned}
                onClose={() => setSidebarOpen(false)}
                onTogglePin={() => setSidebarPinned((prev) => !prev)}
                onNavigate={handleSidebarNavigate}
                user={user}
            />

            {/* Overlay khi sidebar mở trên mobile */}
            {!sidebarPinned && sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                    role="button"
                    tabIndex={-1}
                    aria-label="Đóng menu"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Nội dung chính */}
            <div
                className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-200 ${mainOffsetClass}`}
            >
                {/* Topbar Admin */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 shadow-sm backdrop-blur">
                    <div className="flex items-center gap-2">
                        {/* Nút toggle sidebar trên mobile */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((prev) => !prev)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
                            aria-label="Toggle sidebar"
                            aria-expanded={sidebarOpen}
                        >
                            <FiMenu className="h-5 w-5" />
                        </button>

                        <div className="hidden flex-col lg:flex">
                            <span className="text-xs uppercase tracking-wide text-gray-400">
                                Quản trị
                            </span>
                            <span className="text-base font-semibold text-gray-900">
                                Bảng điều khiển
                            </span>
                        </div>
                    </div>

                    {/* Ô search trên desktop */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative hidden max-w-xl flex-1 items-center sm:flex"
                        role="search"
                    >
                        <FiSearch className="pointer-events-none absolute left-3 h-5 w-5 text-gray-400" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Tìm kiếm theo mã đơn, khách hàng, sản phẩm…"
                            className="w-full rounded-full border border-gray-200 py-2 pl-10 pr-12 text-sm text-gray-700 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <button
                            type="submit"
                            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow hover:bg-blue-700"
                        >
                            Tìm
                        </button>
                    </form>

                    {/* Khu vực bên phải: search mobile + chuông + profile */}
                    <div className="flex items-center gap-3">
                        {/* Search ngắn cho mobile */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="relative flex w-48 items-center sm:hidden"
                            role="search"
                        >
                            <FiSearch className="pointer-events-none absolute left-3 h-5 w-5 text-gray-400" />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Tìm kiếm…"
                                className="w-full rounded-full border border-gray-200 py-2 pl-10 pr-10 text-sm text-gray-700 shadow-inner focus:border-blue-500 focus:outline-none"
                            />
                        </form>

                        {/* Chuông thông báo dùng component chung */}
                        <NotificationBell isAdmin />

                        {/* Profile dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                type="button"
                                onClick={() => setProfileOpen((prev) => !prev)}
                                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-left shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-haspopup="menu"
                                aria-expanded={profileOpen}
                            >
                                <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold uppercase text-white">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={displayName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        initials
                                    )}
                                </span>
                                <span className="hidden min-w-[120px] flex-col sm:flex">
                                    <span className="truncate text-sm font-semibold text-gray-900">
                                        {displayName}
                                    </span>
                                    <span className="truncate text-xs text-gray-500">
                                        {userEmail || "Quản trị viên"}
                                    </span>
                                </span>
                                <FiChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                                    <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {displayName}
                                        </p>
                                        {userEmail ? (
                                            <p className="text-xs text-gray-500">{userEmail}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-col p-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigate("/account");
                                                setProfileOpen(false);
                                            }}
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                                        >
                                            Hồ sơ cá nhân
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigate("/admin");
                                                setProfileOpen(false);
                                            }}
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                                        >
                                            Bảng điều khiển
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileOpen(false);
                                                handleLogout();
                                            }}
                                            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <FiLogOut className="h-4 w-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Nội dung các trang con */}
                <main className="flex-1 p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}


// // frontend/src/pages/admin/AdminLayout.jsx
// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { Outlet, useLocation, useNavigate } from "react-router-dom";
// import { FiBell, FiChevronDown, FiLogOut, FiMenu, FiRefreshCw, FiSearch } from "react-icons/fi";
// import { useDispatch, useSelector } from "react-redux";
// import Sidebar from "../../components/admin/Sidebar";
// import summaryApi, { authHeaders } from "../../common";
// import { clearUser, setUserDetails, setUserStatus } from "../../store/userSlice";
// import { toast } from "react-toastify";

// const SIDEBAR_PIN_KEY = "admin.ui.sidebar.pinned";

// const readStoredUser = () => {
//     if (typeof window === "undefined") return null;
//     const keys = ["user", "profile", "account"];
//     for (const key of keys) {
//         try {
//             const raw = window.localStorage.getItem(key);
//             if (!raw) continue;
//             const parsed = JSON.parse(raw);
//             if (parsed && typeof parsed === "object") return parsed;
//         } catch (err) {
//             console.warn("Cannot parse stored user", err);
//         }
//     }
//     return null;
// };

// const normalizeUser = (payload) => {
//     if (!payload || typeof payload !== "object") return null;
//     if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
//         if (payload.data.user && typeof payload.data.user === "object") return payload.data.user;
//         return payload.data;
//     }
//     if (payload.user && typeof payload.user === "object") return payload.user;
//     if (payload.result && typeof payload.result === "object") return payload.result;
//     return payload;
// };

// const getDisplayName = (user) => {
//     if (!user) return "Quản trị";
//     const candidates = [user.name, user.fullName, user.fullname, user.displayName];
//     for (const c of candidates) {
//         if (typeof c === "string" && c.trim()) return c.trim();
//     }
//     if (user.firstName || user.lastName) {
//         return `${user.firstName || ""} ${user.lastName || ""}`.trim();
//     }
//     if (typeof user.email === "string" && user.email.trim()) return user.email.trim();
//     return "Quản trị";
// };

// const getInitials = (name) => {
//     if (!name) return "AD";
//     const parts = name.split(/\s+/).filter(Boolean);
//     if (!parts.length) return "AD";
//     if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//     return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
// };

// const resolveAvatar = (user) =>
//     user?.avatar ||
//     user?.avatar_url ||
//     user?.avatarUrl ||
//     user?.photo ||
//     user?.photoUrl ||
//     user?.image ||
//     user?.image_url ||
//     user?.picture ||
//     null;

// export default function AdminLayout() {
//     const dispatch = useDispatch();
//     const location = useLocation();
//     const navigate = useNavigate();

//     const storedUserRef = useRef(readStoredUser());
//     const user = useSelector((state) => state.user.data) || storedUserRef.current;
//     const userStatus = useSelector((state) => state.user.status);

//     const [sidebarPinned, setSidebarPinned] = useState(() => {
//         if (typeof window === "undefined") return true;
//         const saved = window.localStorage.getItem(SIDEBAR_PIN_KEY);
//         if (saved === "true" || saved === "false") return saved === "true";
//         return window.innerWidth >= 1024;
//     });
//     const [sidebarOpen, setSidebarOpen] = useState(() =>
//         typeof window === "undefined" ? false : window.innerWidth >= 1024
//     );

//     useEffect(() => {
//         if (typeof window === "undefined") return undefined;
//         const onResize = () => {
//             const isDesktop = window.innerWidth >= 1024;
//             if (isDesktop) setSidebarOpen(true);
//             else if (!sidebarPinned) setSidebarOpen(false);
//         };
//         onResize();
//         window.addEventListener("resize", onResize);
//         return () => window.removeEventListener("resize", onResize);
//     }, [sidebarPinned]);

//     useEffect(() => {
//         if (typeof window === "undefined") return;
//         window.localStorage.setItem(SIDEBAR_PIN_KEY, sidebarPinned ? "true" : "false");
//         if (sidebarPinned) setSidebarOpen(true);
//     }, [sidebarPinned]);

//     const [searchTerm, setSearchTerm] = useState("");
//     useEffect(() => {
//         const params = new URLSearchParams(location.search);
//         const next = params.get("q") || "";
//         setSearchTerm(next);
//     }, [location.pathname, location.search]);

//     useEffect(() => {
//         if (typeof window === "undefined") return undefined;
//         const syncHandler = (event) => {
//             if (!event?.detail || typeof event.detail.query !== "string") return;
//             setSearchTerm(event.detail.query);
//         };
//         window.addEventListener("admin:search:reflect", syncHandler);
//         return () => window.removeEventListener("admin:search:reflect", syncHandler);
//     }, []);

//     const [notifOpen, setNotifOpen] = useState(false);
//     const [notifCount, setNotifCount] = useState(0);
//     const [notifLoading, setNotifLoading] = useState(false);
//     const [notifError, setNotifError] = useState(null);
//     const [profileOpen, setProfileOpen] = useState(false);

//     const fetchNotifications = useCallback(async (signal) => {
//         try {
//             setNotifLoading(true);
//             setNotifError(null);
//             const url = new URL(summaryApi.url(summaryApi.order.list));
//             url.searchParams.set("status", "pending");
//             url.searchParams.set("limit", "1");
//             url.searchParams.set("page", "1");
//             const res = await fetch(url, {
//                 headers: { Accept: "application/json", ...authHeaders() },
//                 signal,
//             });
//             if (!res.ok) throw new Error(`Không tải được thông báo (${res.status})`);
//             const data = await res.json();
//             const total =
//                 [data?.total, data?.meta?.total, data?.pagination?.total, data?.count]
//                     .map((v) => Number(v))
//                     .find((v) => Number.isFinite(v)) ??
//                 (Array.isArray(data?.items) ? data.items.length : 0);
//             setNotifCount(Math.max(0, total || 0));
//         } catch (error) {
//             if (error.name === "AbortError") return;
//             console.error(error);
//             setNotifError(error.message || "Không thể tải thông báo");
//         } finally {
//             setNotifLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         if (typeof window === "undefined") return undefined;
//         const ctrl = new AbortController();
//         fetchNotifications(ctrl.signal);
//         const id = window.setInterval(() => fetchNotifications(ctrl.signal), 120000);
//         return () => {
//             ctrl.abort();
//             window.clearInterval(id);
//         };
//     }, [fetchNotifications]);

//     const userFetchAttemptedRef = useRef(false);

//     useEffect(() => {
//         if (user || userStatus === "loading" || userFetchAttemptedRef.current) return undefined;
//         let ignore = false;
//         const ctrl = new AbortController();
//         const loadMe = async () => {
//             try {
//                 userFetchAttemptedRef.current = true;
//                 dispatch(setUserStatus("loading"));
//                 const res = await fetch(summaryApi.url(summaryApi.auth.me), {
//                     headers: { Accept: "application/json", ...authHeaders() },
//                     credentials: "include",
//                     signal: ctrl.signal,
//                 });
//                 if (res.status === 401) {
//                     dispatch(clearUser());
//                     dispatch(setUserStatus("idle"));
//                     storedUserRef.current = null;
//                     if (typeof window !== "undefined") {
//                         ["access_token", "token", "refresh_token", "refreshToken", "user"].forEach((key) =>
//                             window.localStorage.removeItem(key)
//                         );
//                     }
//                     return;
//                 }
//                 if (!res.ok) throw new Error(`Không thể tải thông tin tài khoản (${res.status})`);
//                 const payload = await res.json();
//                 if (ignore) return;
//                 const normalized = normalizeUser(payload);
//                 if (normalized) {
//                     dispatch(setUserDetails(normalized));
//                     storedUserRef.current = normalized;
//                     if (typeof window !== "undefined") {
//                         try {
//                             window.localStorage.setItem("user", JSON.stringify(normalized));
//                         } catch (err) {
//                             console.warn("Cannot persist user", err);
//                         }
//                     }
//                 } else {
//                     dispatch(setUserDetails(null));
//                     storedUserRef.current = null;
//                 }
//             } catch (err) {
//                 if (err.name === "AbortError") return;
//                 console.error(err);
//                 dispatch(setUserStatus("error"));
//                 if (err.message) toast.error(err.message);
//             }
//         };
//         loadMe();
//         return () => {
//             ignore = true;
//             ctrl.abort();
//         };
//     }, [dispatch, user, userStatus]);

//     useEffect(() => {
//         if (!user || typeof window === "undefined") return;
//         try {
//             window.localStorage.setItem("user", JSON.stringify(user));
//         } catch (err) {
//             console.warn("Cannot persist user", err);
//         }
//     }, [user]);

//     const displayName = useMemo(() => getDisplayName(user), [user]);
//     const userEmail = user?.email || user?.username || "";
//     const avatarUrl = resolveAvatar(user);
//     const initials = useMemo(() => getInitials(displayName), [displayName]);

//     const profileRef = useRef(null);
//     const notifRef = useRef(null);

//     useEffect(() => {
//         if (typeof window === "undefined") return undefined;
//         const onClick = (event) => {
//             if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
//             if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
//         };
//         const onEsc = (event) => {
//             if (event.key === "Escape") {
//                 setProfileOpen(false);
//                 setNotifOpen(false);
//             }
//         };
//         window.addEventListener("mousedown", onClick);
//         window.addEventListener("keydown", onEsc);
//         return () => {
//             window.removeEventListener("mousedown", onClick);
//             window.removeEventListener("keydown", onEsc);
//         };
//     }, []);

//     const handleSearchSubmit = useCallback(
//         (event) => {
//             event.preventDefault();
//             const trimmed = searchTerm.trim();
//             const params = new URLSearchParams(location.search);
//             if (trimmed) params.set("q", trimmed);
//             else params.delete("q");
//             navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : "" });
//             if (typeof window !== "undefined") {
//                 window.dispatchEvent(new CustomEvent("admin:search", { detail: { query: trimmed } }));
//             }
//         },
//         [location.pathname, location.search, navigate, searchTerm]
//     );

//     const handleLogout = useCallback(async () => {
//         try {
//             await fetch(summaryApi.url(summaryApi.auth.logout), {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json", ...authHeaders() },
//                 credentials: "include",
//             });
//         } catch (error) {
//             console.error(error);
//         } finally {
//             userFetchAttemptedRef.current = false;
//             if (typeof window !== "undefined") {
//                 ["access_token", "token", "refresh_token", "refreshToken", "user"].forEach((key) =>
//                     window.localStorage.removeItem(key)
//                 );
//             }
//             dispatch(clearUser());
//             toast.success("Đã đăng xuất khỏi khu vực quản trị");
//             navigate("/login");
//         }
//     }, [dispatch, navigate]);

//     const handleSidebarNavigate = useCallback(() => {
//         if (!sidebarPinned) setSidebarOpen(false);
//     }, [sidebarPinned]);

//     const mainOffsetClass = sidebarPinned ? "lg:ml-64" : "";

//     return (
//         <div className="relative min-h-screen bg-gray-100">
//             <Sidebar
//                 open={sidebarOpen}
//                 pinned={sidebarPinned}
//                 onClose={() => setSidebarOpen(false)}
//                 onTogglePin={() => setSidebarPinned((prev) => !prev)}
//                 onNavigate={handleSidebarNavigate}
//                 user={user}
//             />

//             {!sidebarPinned && sidebarOpen && (
//                 <div
//                     className="fixed inset-0 z-30 bg-black/40 lg:hidden"
//                     role="button"
//                     tabIndex={-1}
//                     aria-label="Đóng menu"
//                     onClick={() => setSidebarOpen(false)}
//                 />
//             )}

//             <div className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-200 ${mainOffsetClass}`}>
//                 <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/95 px-4 shadow-sm backdrop-blur">
//                     <div className="flex items-center gap-2">
//                         <button
//                             type="button"
//                             onClick={() => setSidebarOpen((prev) => !prev)}
//                             className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
//                             aria-label="Toggle sidebar"
//                             aria-expanded={sidebarOpen}
//                         >
//                             <FiMenu className="h-5 w-5" />
//                         </button>
//                         <div className="hidden flex-col lg:flex">
//                             <span className="text-xs uppercase tracking-wide text-gray-400">Quản trị</span>
//                             <span className="text-base font-semibold text-gray-900">Bảng điều khiển</span>
//                         </div>
//                     </div>

//                     <form onSubmit={handleSearchSubmit} className="relative hidden max-w-xl flex-1 items-center sm:flex" role="search">
//                         <FiSearch className="pointer-events-none absolute left-3 h-5 w-5 text-gray-400" />
//                         <input
//                             type="search"
//                             value={searchTerm}
//                             onChange={(event) => setSearchTerm(event.target.value)}
//                             placeholder="Tìm kiếm theo mã đơn, khách hàng, sản phẩm…"
//                             className="w-full rounded-full border border-gray-200 py-2 pl-10 pr-12 text-sm text-gray-700 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
//                         />
//                         <button
//                             type="submit"
//                             className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white shadow hover:bg-blue-700"
//                         >
//                             Tìm
//                         </button>
//                     </form>

//                     <div className="flex items-center gap-3">
//                         <form onSubmit={handleSearchSubmit} className="relative flex w-48 items-center sm:hidden" role="search">
//                             <FiSearch className="pointer-events-none absolute left-3 h-5 w-5 text-gray-400" />
//                             <input
//                                 type="search"
//                                 value={searchTerm}
//                                 onChange={(event) => setSearchTerm(event.target.value)}
//                                 placeholder="Tìm kiếm…"
//                                 className="w-full rounded-full border border-gray-200 py-2 pl-10 pr-10 text-sm text-gray-700 shadow-inner focus:border-blue-500 focus:outline-none"
//                             />
//                         </form>

//                         <div className="relative" ref={notifRef}>
//                             <button
//                                 type="button"
//                                 onClick={() => setNotifOpen((prev) => !prev)}
//                                 className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 aria-haspopup="dialog"
//                                 aria-expanded={notifOpen}
//                                 title="Thông báo đơn hàng chờ duyệt"
//                             >
//                                 <FiBell className="h-5 w-5" />
//                                 {notifLoading ? (
//                                     <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
//                                         …
//                                     </span>
//                                 ) : notifCount > 0 ? (
//                                     <span className="absolute -top-1 -right-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
//                                         {notifCount > 99 ? "99+" : notifCount}
//                                     </span>
//                                 ) : null}
//                             </button>
//                             {notifOpen && (
//                                 <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-lg">
//                                     <div className="flex items-start justify-between gap-3">
//                                         <div>
//                                             <p className="text-sm font-semibold text-gray-900">Đơn hàng chờ xử lý</p>
//                                             <p className="mt-1 text-xs text-gray-500">
//                                                 {notifError
//                                                     ? "Không thể lấy dữ liệu hiện tại."
//                                                     : notifCount > 0
//                                                         ? `Có ${notifCount} đơn đang chờ xác nhận.`
//                                                         : "Không có đơn hàng cần xử lý."}
//                                             </p>
//                                         </div>
//                                         <button
//                                             type="button"
//                                             className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100"
//                                             onClick={() => fetchNotifications()}
//                                             title="Làm mới"
//                                         >
//                                             <FiRefreshCw className="h-4 w-4" />
//                                         </button>
//                                     </div>
//                                     <div className="mt-3 flex items-center justify-between">
//                                         <button
//                                             type="button"
//                                             className="text-sm font-medium text-blue-600 hover:underline"
//                                             onClick={() => {
//                                                 navigate("/admin/orders?q=status:pending");
//                                                 setNotifOpen(false);
//                                             }}
//                                         >
//                                             Xem chi tiết
//                                         </button>
//                                         {notifLoading && <span className="text-xs text-gray-400">Đang cập nhật…</span>}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>

//                         <div className="relative" ref={profileRef}>
//                             <button
//                                 type="button"
//                                 onClick={() => setProfileOpen((prev) => !prev)}
//                                 className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2 py-1 text-left shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                                 aria-haspopup="menu"
//                                 aria-expanded={profileOpen}
//                             >
//                                 <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-sm font-semibold uppercase text-white">
//                                     {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : initials}
//                                 </span>
//                                 <span className="hidden min-w-[120px] flex-col sm:flex">
//                                     <span className="truncate text-sm font-semibold text-gray-900">{displayName}</span>
//                                     <span className="truncate text-xs text-gray-500">{userEmail || "Quản trị viên"}</span>
//                                 </span>
//                                 <FiChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
//                             </button>
//                             {profileOpen && (
//                                 <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
//                                     <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
//                                         <p className="text-sm font-semibold text-gray-900">{displayName}</p>
//                                         {userEmail ? <p className="text-xs text-gray-500">{userEmail}</p> : null}
//                                     </div>
//                                     <div className="flex flex-col p-2">
//                                         <button
//                                             type="button"
//                                             onClick={() => {
//                                                 navigate("/account");
//                                                 setProfileOpen(false);
//                                             }}
//                                             className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
//                                         >
//                                             Hồ sơ cá nhân
//                                         </button>
//                                         <button
//                                             type="button"
//                                             onClick={() => {
//                                                 navigate("/admin");
//                                                 setProfileOpen(false);
//                                             }}
//                                             className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
//                                         >
//                                             Bảng điều khiển
//                                         </button>
//                                         <button
//                                             type="button"
//                                             onClick={() => {
//                                                 setProfileOpen(false);
//                                                 handleLogout();
//                                             }}
//                                             className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
//                                         >
//                                             <FiLogOut className="h-4 w-4" /> Đăng xuất
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </header>

//                 <main className="flex-1 p-4 sm:p-6">
//                     <Outlet />
//                 </main>
//             </div>
//         </div>
//     );
// }

