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
    { name: "Blog & Tin tức", path: "/admin/blog", icon: <MdArticle size={20} /> },
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


//code 1
// import React, { useMemo } from "react";
// import { NavLink } from "react-router-dom";
// import {
//     MdSpaceDashboard,
//     MdShoppingCart,
//     MdCategory,
//     MdPeople,
//     MdInventory,
//     MdPushPin,
//     MdFlashOn,
// } from "react-icons/md";
// import { FiX } from "react-icons/fi";

// const menuItems = [
//     { name: "Dashboard", path: "/admin", icon: <MdSpaceDashboard size={20} /> },
//     { name: "Products", path: "/admin/products", icon: <MdInventory size={20} /> },
//     { name: "Categories", path: "/admin/categories", icon: <MdCategory size={20} /> },
//     { name: "Orders", path: "/admin/orders", icon: <MdShoppingCart size={20} /> },
//     { name: "Flash Sale", path: "/admin/flashsales", icon: <MdFlashOn size={20} /> },
//     { name: "Users", path: "/admin/users", icon: <MdPeople size={20} /> },
// ];

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

// const getInitials = (name) => {
//     if (!name) return "AD";
//     const parts = name.split(/\s+/).filter(Boolean);
//     if (!parts.length) return "AD";
//     if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//     return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
// };

// export default function Sidebar({ open, pinned, onClose, onTogglePin, onNavigate, user }) {
//     const displayName = useMemo(() => getDisplayName(user), [user]);
//     const avatarUrl = useMemo(() => resolveAvatar(user), [user]);
//     const initials = useMemo(() => getInitials(displayName), [displayName]);
//     const email = user?.email || user?.username || "";

//     return (
//         <aside
//             className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 transform flex-col bg-gray-900 text-gray-100 shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"
//                 } ${pinned ? "lg:translate-x-0" : ""}`}
//         >
//             {/* Header */}
//             <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
//                 <div>
//                     <p className="text-lg font-bold text-white">Admin Panel</p>
//                     <p className="text-xs text-gray-400">Quản lý cửa hàng</p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                     {/* Pin button (desktop) */}
//                     <button
//                         type="button"
//                         onClick={() => onTogglePin?.()}
//                         className={`hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-200 transition hover:bg-white/10 lg:inline-flex ${pinned ? "bg-white/10 text-white" : ""
//                             }`}
//                         aria-pressed={pinned}
//                         title={pinned ? "Gỡ ghim sidebar" : "Ghim sidebar"}
//                     >
//                         <MdPushPin className={`h-4 w-4 ${pinned ? "rotate-45" : ""}`} />
//                     </button>

//                     {/* Close (mobile) */}
//                     <button
//                         type="button"
//                         onClick={() => onClose?.()}
//                         className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-300 transition hover:bg-white/10 lg:hidden"
//                         aria-label="Đóng menu quản trị"
//                     >
//                         <FiX className="h-4 w-4" />
//                     </button>
//                 </div>
//             </div>

//             {/* Menu */}
//             <nav className="flex-1 overflow-y-auto px-4 py-6">
//                 <ul className="space-y-2">
//                     {menuItems.map((item) => (
//                         <li key={item.name}>
//                             <NavLink
//                                 to={item.path}
//                                 onClick={() => onNavigate?.()}
//                                 className={({ isActive }) =>
//                                     `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
//                                     }`
//                                 }
//                             >
//                                 <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/5 bg-white/5 text-white transition group-hover:border-white/20 group-hover:bg-white/10">
//                                     {item.icon}
//                                 </span>
//                                 <span className="truncate">{item.name}</span>
//                             </NavLink>
//                         </li>
//                     ))}
//                 </ul>
//             </nav>

//             {/* Footer */}
//             <div className="border-t border-white/5 px-4 py-4 text-xs text-gray-400">
//                 <div className="flex items-center gap-3">
//                     <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold uppercase text-white">
//                         {avatarUrl ? (
//                             <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
//                         ) : (
//                             initials
//                         )}
//                     </span>
//                     <div className="flex flex-col">
//                         <span className="text-sm font-semibold text-white">{displayName}</span>
//                         {email ? <span className="text-xs text-gray-400">{email}</span> : null}
//                     </div>
//                 </div>
//                 <p className="mt-4 text-[11px] leading-relaxed text-gray-500">
//                     © {new Date().getFullYear()} Bookstore Admin
//                 </p>
//             </div>
//         </aside>
//     );
// }

// import React, { useMemo } from "react";
// import { NavLink } from "react-router-dom";
// import {
//     MdSpaceDashboard,
//     MdShoppingCart,
//     MdCategory,
//     MdPeople,
//     MdInventory,
// } from "react-icons/md";
// // import { FiThumbtack, FiX } from "react-icons/fi";
// import { FiX } from "react-icons/fi";
// import { RiPushpin2Line, RiPushpin2Fill } from "react-icons/ri";
// const menuItems = [
//     { name: "Dashboard", path: "/admin", icon: <MdSpaceDashboard size={20} /> },
//     { name: "Products", path: "/admin/products", icon: <MdInventory size={20} /> },
//     { name: "Categories", path: "/admin/categories", icon: <MdCategory size={20} /> },
//     { name: "Orders", path: "/admin/orders", icon: <MdShoppingCart size={20} /> },
//     { name: "Users", path: "/admin/users", icon: <MdPeople size={20} /> },
// ];

// const getDisplayName = (user) => {
//     if (!user) return "admin";
//     const candidates = [user.name, user.fullName, user.fullname, user.displayName];
//     for (const candidate of candidates) {
//         if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
//     }
//     if (user.firstName || user.lastName) {
//         return `${user.firstName || ""} ${user.lastName || ""}`.trim();
//     }
//     if (typeof user.email === "string" && user.email.trim()) return user.email.trim();
//     return "admin";
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

// const getInitials = (name) => {
//     if (!name) return "AD";
//     const parts = name.split(/\s+/).filter(Boolean);
//     if (!parts.length) return "AD";
//     if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
//     return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
// };

// export default function Sidebar({ open, pinned, onClose, onTogglePin, onNavigate, user }) {
//     const displayName = useMemo(() => getDisplayName(user), [user]);
//     const avatarUrl = useMemo(() => resolveAvatar(user), [user]);
//     const initials = useMemo(() => getInitials(displayName), [displayName]);
//     const email = user?.email || user?.username || "";

//     return (
//         <aside
//             className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 transform flex-col bg-gray-900 text-gray-100 shadow-2xl transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"
//                 } ${pinned ? "lg:translate-x-0" : ""}`}
//         >
//             <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
//                 <div>
//                     <p className="text-lg font-bold text-white">Admin Panel</p>
//                     <p className="text-xs text-gray-400">Quản lý cửa hàng</p>
//                 </div>
//                 <div className="flex items-center gap-2">
//                     <button
//                         type="button"
//                         onClick={() => onTogglePin?.()}
//                         className={`hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-200 transition hover:bg-white/10 lg:inline-flex ${pinned ? "bg-white/10 text-white" : ""
//                             }`}
//                         aria-pressed={pinned}
//                         title={pinned ? "Gỡ ghim sidebar" : "Ghim sidebar"}
//                     >
//                         {/* <FiThumbtack className={`h-4 w-4 ${pinned ? "rotate-45" : ""}`} /> */}
//                         {pinned ? (
//                             <RiPushpin2Fill className="h-4 w-4" />
//                         ) : (
//                             <RiPushpin2Line className="h-4 w-4" />
//                         )}
//                     </button>
//                     <button
//                         type="button"
//                         onClick={() => onClose?.()}
//                         className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-300 transition hover:bg-white/10 lg:hidden"
//                         aria-label="Đóng menu quản trị"
//                     >
//                         <FiX className="h-4 w-4" />
//                     </button>
//                 </div>
//             </div>

//             <nav className="flex-1 overflow-y-auto px-4 py-6">
//                 <ul className="space-y-2">
//                     {menuItems.map((item) => (
//                         <li key={item.name}>
//                             <NavLink
//                                 to={item.path}
//                                 onClick={() => onNavigate?.()}
//                                 className={({ isActive }) =>
//                                     `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5 hover:text-white"
//                                     }`
//                                 }
//                             >
//                                 <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/5 bg-white/5 text-white transition group-hover:border-white/20 group-hover:bg-white/10">
//                                     {item.icon}
//                                 </span>
//                                 <span className="truncate">{item.name}</span>
//                             </NavLink>
//                         </li>
//                     ))}
//                 </ul>
//             </nav>

//             <div className="border-t border-white/5 px-4 py-4 text-xs text-gray-400">
//                 <div className="flex items-center gap-3">
//                     <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-sm font-semibold uppercase text-white">
//                         {avatarUrl ? <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" /> : initials}
//                     </span>
//                     <div className="flex flex-col">
//                         <span className="text-sm font-semibold text-white">{displayName}</span>
//                         {email ? <span className="text-xs text-gray-400">{email}</span> : null}
//                     </div>
//                 </div>
//                 <p className="mt-4 text-[11px] leading-relaxed text-gray-500">
//                     © {new Date().getFullYear()} Bookstore Admin
//                 </p>
//             </div>
//         </aside>
//     );
// }

// code gốc
// import React from "react";
// import { NavLink } from "react-router-dom";
// import {
//     MdSpaceDashboard,
//     MdShoppingCart,
//     MdCategory,
//     MdPeople,
//     MdInventory
// } from "react-icons/md";

// const menuItems = [
//     { name: "Dashboard", path: "/admin", icon: <MdSpaceDashboard size={20} /> },
//     { name: "Products", path: "/admin/products", icon: <MdInventory size={20} /> },
//     { name: "Categories", path: "/admin/categories", icon: <MdCategory size={20} /> },
//     { name: "Orders", path: "/admin/orders", icon: <MdShoppingCart size={20} /> },
//     { name: "Users", path: "/admin/users", icon: <MdPeople size={20} /> },
// ];

// export default function Sidebar() {
//     return (
//         <aside className="w-64 bg-gray-900 text-gray-200 h-screen fixed left-0 top-0 shadow-lg flex flex-col">
//             {/* Logo / Brand */}
//             <div className="h-16 flex items-center justify-center border-b border-gray-700">
//                 <h1 className="text-xl font-bold text-white">Admin Panel</h1>
//             </div>

//             {/* Menu items */}
//             <nav className="flex-1 px-4 py-6">
//                 <ul className="space-y-2">
//                     {menuItems.map((item) => (
//                         <li key={item.name}>
//                             <NavLink
//                                 to={item.path}
//                                 className={({ isActive }) =>
//                                     `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${isActive
//                                         ? "bg-gray-700 text-white"
//                                         : "text-gray-300 hover:bg-gray-800 hover:text-white"
//                                     }`
//                                 }
//                             >
//                                 {item.icon}
//                                 <span className="text-sm font-medium">{item.name}</span>
//                             </NavLink>
//                         </li>
//                     ))}
//                 </ul>
//             </nav>

//             {/* Footer */}
//             <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
//                 © 2025 Bookstore Admin
//             </div>
//         </aside>
//     );
// }
