// src/components/NotificationBell.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    FiBell,
    FiCheck,
    FiChevronRight,
    FiInfo,
    FiLoader,
    FiPackage,
} from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import summaryApi, { authHeaders } from "../../common";

const useClickOutside = (ref, handler) => {
    useEffect(() => {
        const onClick = (e) => {
            const el = ref.current;
            if (!el) return;
            if (!(e.target instanceof Node)) {
                handler?.();
                return;
            }
            if (!el.contains(e.target)) handler?.();
        };
        const onKey = (e) => e.key === "Escape" && handler?.();
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [ref, handler]);
};

const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
    });
};

const getIconByType = (type) => {
    if (!type) return <FiInfo className="h-4 w-4 text-gray-400" />;
    const t = String(type).toLowerCase();
    if (t.startsWith("order_") || t.includes("order")) {
        return <FiPackage className="h-4 w-4 text-blue-500" />;
    }
    if (t.includes("system") || t.includes("admin")) {
        return <FiInfo className="h-4 w-4 text-purple-500" />;
    }
    return <FiInfo className="h-4 w-4 text-gray-400" />;
};

const NotificationBell = ({ isAdmin = false, maxItems = 8 }) => {
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingUnread, setLoadingUnread] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const wrapRef = useRef(null);

    useClickOutside(wrapRef, () => setOpen(false));

    /** ====== FETCH UNREAD COUNT ====== */
    const fetchUnreadCount = useCallback(async () => {
        try {
            setLoadingUnread(true);
            const res = await fetch(
                summaryApi.url(summaryApi.notifications.unreadCount()),
                {
                    headers: {
                        Accept: "application/json",
                        ...authHeaders(),
                    },
                    credentials: "include",
                }
            );
            if (!res.ok) throw new Error("Không thể tải số thông báo chưa đọc");
            const data = await res.json();
            const count =
                Number(data.unread_count ?? data.count ?? data.total ?? 0) || 0;
            setUnreadCount(count);
        } catch (err) {
            console.error("Unread count error:", err);
        } finally {
            setLoadingUnread(false);
        }
    }, []);

    /** ====== FETCH LIST ====== */
    const fetchList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const query = `?page=1&limit=${maxItems}`;
            const res = await fetch(
                summaryApi.url(summaryApi.notifications.list(query)),
                {
                    headers: {
                        Accept: "application/json",
                        ...authHeaders(),
                    },
                    credentials: "include",
                }
            );
            if (!res.ok) throw new Error(`Không thể tải thông báo (${res.status})`);
            const data = await res.json();

            const arr =
                data.items ||
                data.data ||
                data.notifications ||
                (Array.isArray(data) ? data : []);
            const normalized = arr.map((n) => ({
                id: n.id,
                user_id: n.user_id,
                type: n.type,
                content: n.content,
                link_url: n.link_url,
                is_read: !!n.is_read,
                created_at: n.created_at,
                // nếu backend có metadata/data/order_id thì giữ lại
                order_id:
                    n.order_id ||
                    n.meta?.order_id ||
                    n.metadata?.order_id ||
                    n.data?.order_id ||
                    null,
            }));
            setItems(normalized);
        } catch (err) {
            console.error("Notification list error:", err);
            setError(err.message || "Không thể tải thông báo");
        } finally {
            setLoading(false);
        }
    }, [maxItems]);

    /** ====== MARK ONE READ ====== */
    const markOneRead = useCallback(async (id) => {
        try {
            await fetch(summaryApi.url(summaryApi.notifications.markRead(id)), {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    ...authHeaders(),
                },
                credentials: "include",
            });
            setItems((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (err) {
            console.error("Mark read error:", err);
        }
    }, []);

    /** ====== MARK ALL READ ====== */
    const handleMarkAllRead = useCallback(async () => {
        try {
            await fetch(summaryApi.url(summaryApi.notifications.markAllRead()), {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    ...authHeaders(),
                },
                credentials: "include",
            });
            setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("Mark all read error:", err);
        }
    }, []);

    /** ====== NAVIGATION LOGIC (THEO ROLE) ====== */
    const navigateByNotification = useCallback(
        (notif) => {
            const rawLink = notif.link_url || "";
            const type = (notif.type || "").toLowerCase();

            // Ưu tiên order_id (do backend trả về)
            const orderId = notif.order_id || (() => {
                // fallback: cố parse id từ link_url nếu có dạng .../orders/:id
                const m =
                    typeof rawLink === "string"
                        ? rawLink.match(/\/orders\/([0-9a-fA-F-]{8,})/)
                        : null;
                return m ? m[1] : null;
            })();

            if (isAdmin) {
                // ADMIN: luôn ưu tiên đi tới /admin/orders-detail/:id nếu là thông báo đơn hàng
                if (orderId && (type.includes("order") || type.startsWith("order_"))) {
                    navigate(`/admin/orders-detail/${orderId}`);
                    return;
                }

                // nếu không có order_id mà backend đã set sẵn link_url admin → dùng luôn
                if (rawLink && rawLink.startsWith("/admin")) {
                    navigate(rawLink);
                    return;
                }

                // fallback: vào danh sách đơn
                navigate("/admin/orders");
                return;
            }

            // USER: detail đơn hiển thị popup trong /account/orders
            if (type.includes("order") || type.startsWith("order_")) {
                if (orderId) {
                    navigate("/account/orders", {
                        state: { highlightOrderId: orderId },
                    });
                } else {
                    navigate("/account/orders");
                }
                return;
            }

            // nếu link_url là đường dẫn FE → navigate theo
            if (rawLink && rawLink.startsWith("/")) {
                navigate(rawLink);
                return;
            }

            // fallback: về trang account
            navigate("/account");
        },
        [isAdmin, navigate]
    );

    /** ====== CLICK ITEM ====== */
    const handleClickItem = useCallback(
        async (notif) => {
            setOpen(false);
            if (!notif.is_read && notif.id) {
                await markOneRead(notif.id);
            }
            navigateByNotification(notif);
        },
        [markOneRead, navigateByNotification]
    );

    /** ====== OPEN DROPDOWN ====== */
    const handleToggleOpen = () => {
        setOpen((o) => {
            const next = !o;
            if (!o && !items.length) {
                // lần đầu mở: load list
                fetchList();
            }
            return next;
        });
    };

    /** ====== INIT & POLLING UNREAD COUNT ====== */
    useEffect(() => {
        fetchUnreadCount();
        // Poll mỗi 2 phút
        const id = setInterval(fetchUnreadCount, 120000);
        return () => clearInterval(id);
    }, [fetchUnreadCount]);

    // Nếu đổi page (route) thì tự đóng dropdown
    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const badgeValue = loadingUnread ? "…" : unreadCount;

    return (
        <div className="relative" ref={wrapRef}>
            <button
                type="button"
                onClick={handleToggleOpen}
                className="relative inline-flex flex-col items-center gap-1 text-[13px] md:text-sm text-gray-600 hover:text-red-600 transition-colors"
                aria-label="Thông báo"
            >
                <span className="relative">
                    <FiBell className="h-6 w-6" />
                    {badgeValue ? (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white flex items-center justify-center shadow-sm">
                            {typeof badgeValue === "number" && badgeValue > 99
                                ? "99+"
                                : badgeValue}
                        </span>
                    ) : null}
                </span>
                <span className="hidden sm:block truncate max-w-24">
                    Thông báo
                </span>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl z-50 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Thông báo
                            </p>
                            <p className="text-xs text-gray-500">
                                {loading
                                    ? "Đang tải..."
                                    : unreadCount > 0
                                        ? `${unreadCount} thông báo chưa đọc`
                                        : "Bạn đã đọc hết tất cả 🎉"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${unreadCount === 0
                                    ? "border-gray-200 text-gray-300 cursor-default"
                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            <FiCheck className="h-3 w-3" />
                            <span>Đánh dấu đã đọc</span>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto">
                        {error && (
                            <div className="px-4 py-3 text-xs text-red-500">
                                {error}
                            </div>
                        )}

                        {loading && !items.length && (
                            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                                <FiLoader className="h-4 w-4 animate-spin" />
                                <span>Đang tải thông báo...</span>
                            </div>
                        )}

                        {!loading && items.length === 0 && !error && (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                Chưa có thông báo nào.
                            </div>
                        )}

                        {items.map((n) => (
                            <button
                                key={n.id}
                                type="button"
                                onClick={() => handleClickItem(n)}
                                className={`w-full flex items-start gap-3 px-4 py-3 text-left text-sm border-b border-gray-50 hover:bg-gray-50 transition ${!n.is_read ? "bg-red-50/40" : ""
                                    }`}
                            >
                                <div className="mt-0.5">{getIconByType(n.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-[13px] leading-snug ${!n.is_read
                                                ? "font-semibold text-gray-900"
                                                : "text-gray-700"
                                            }`}
                                    >
                                        {n.content || "Thông báo mới"}
                                    </p>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        {formatTime(n.created_at)}
                                    </p>
                                </div>
                                <FiChevronRight className="mt-1 h-4 w-4 text-gray-300" />
                            </button>
                        ))}
                    </div>

                    {/* Footer: Xem tất cả */}
                    <div className="border-t border-gray-100 px-4 py-2 bg-gray-50/60">
                        <button
                            type="button"
                            onClick={() => {
                                setOpen(false);
                                if (isAdmin) {
                                    // Admin: trang tổng quan noti → mình cho về danh sách đơn
                                    navigate("/admin/orders");
                                } else {
                                    navigate("/account/orders");
                                }
                            }}
                            className="w-full text-xs font-medium text-red-600 hover:text-red-700 hover:underline flex items-center justify-center gap-1"
                        >
                            Xem tất cả thông báo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
