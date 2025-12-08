import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
    MdSpaceDashboard,
    MdShoppingCart,
    MdCategory,
    MdPeople,
    MdInventory,
    MdPushPin,
    MdFlashOn,
} from "react-icons/md";
import { FaTicketAlt } from "react-icons/fa"; // 👈 icon cho Mã giảm giá
import { FiX } from "react-icons/fi";
import { MdArticle } from "react-icons/md";

const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <MdSpaceDashboard size={20} /> },
    { name: "Products", path: "/admin/products", icon: <MdInventory size={20} /> },
    { name: "Categories", path: "/admin/categories", icon: <MdCategory size={20} /> },
    { name: "Orders", path: "/admin/orders", icon: <MdShoppingCart size={20} /> },
    { name: "Flash Sale", path: "/admin/flashsales", icon: <MdFlashOn size={20} /> },
    // 👇 Mục mới: Mã giảm giá

    { name: "Mã giảm giá", path: "/admin/vouchers", icon: <FaTicketAlt size={20} /> },
    { name: "Blog", path: "/admin/blog", icon: <MdArticle size={20} /> },
    { name: "Users", path: "/admin/users", icon: <MdPeople size={20} /> },
];

const getDisplayName = (user) => {
    if (!user) return "Quản trị";
    const candidates = [user.name, user.fullName, user.fullname, user.displayName];
    for (const c of candidates) {
        if (typeof c === "string" && c.trim()) return c.trim();
    }
    if (user.firstName || user.lastName) {
        return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    if (typeof user.email === "string" && user.email.trim()) return user.email.trim();
    return "Quản trị";
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

const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.split(/\s+/).filter(Boolean);
    if (!parts.length) return "AD";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
};

export default function Sidebar({ open, pinned, onClose, onTogglePin, onNavigate, user }) {
    const displayName = useMemo(() => getDisplayName(user), [user]);
    const avatarUrl = useMemo(() => resolveAvatar(user), [user]);
    const initials = useMemo(() => getInitials(displayName), [displayName]);
    const email = user?.email || user?.username || "";

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 transform flex-col bg-gray-900 text-gray-100 shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"
                } ${pinned ? "lg:translate-x-0" : ""}`}
        >
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
                <div>
                    <p className="text-lg font-bold text-white">Admin Panel</p>
                    <p className="text-xs text-gray-400">Quản lý cửa hàng</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Pin button (desktop) */}
                    <button
                        type="button"
                        onClick={() => onTogglePin?.()}
                        className={`hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-200 transition hover:bg-white/10 lg:inline-flex ${pinned ? "bg-white/10 text-white" : ""
                            }`}
                        aria-pressed={pinned}
                        title={pinned ? "Gỡ ghim sidebar" : "Ghim sidebar"}
                    >
                        <MdPushPin className={`h-4 w-4 ${pinned ? "rotate-45" : ""}`} />
                    </button>

                    {/* Close (mobile) */}
                    <button
                        type="button"
                        onClick={() => onClose?.()}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-300 transition hover:bg-white/10 lg:hidden"
                        aria-label="Đóng menu quản trị"
                    >
                        <FiX className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                onClick={() => onNavigate?.()}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive
                                        ? "bg-white/10 text-white"
                                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                                    }`
                                }
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/5 bg-white/5 text-white transition group-hover:border-white/20 group-hover:bg-white/10">
                                    {item.icon}
                                </span>
                                <span className="truncate">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="border-t border-white/5 px-4 py-4 text-xs text-gray-400">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold uppercase text-white">
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
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{displayName}</span>
                        {email ? <span className="text-xs text-gray-400">{email}</span> : null}
                    </div>
                </div>
                <p className="mt-4 text-[11px] leading-relaxed text-gray-500">
                    © {new Date().getFullYear()} Bookstore Admin
                </p>
            </div>
        </aside>
    );
}
