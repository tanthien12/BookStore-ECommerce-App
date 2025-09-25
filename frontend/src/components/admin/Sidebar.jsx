import React from "react";
import { NavLink } from "react-router-dom";
import {
    MdSpaceDashboard,
    MdShoppingCart,
    MdCategory,
    MdPeople,
    MdInventory
} from "react-icons/md";

const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <MdSpaceDashboard size={20} /> },
    { name: "Products", path: "/admin/products", icon: <MdInventory size={20} /> },
    { name: "Categories", path: "/admin/categories", icon: <MdCategory size={20} /> },
    { name: "Orders", path: "/admin/orders", icon: <MdShoppingCart size={20} /> },
    { name: "Users", path: "/admin/users", icon: <MdPeople size={20} /> },
];

export default function Sidebar() {
    return (
        <aside className="w-64 bg-gray-900 text-gray-200 h-screen fixed left-0 top-0 shadow-lg flex flex-col">
            {/* Logo / Brand */}
            <div className="h-16 flex items-center justify-center border-b border-gray-700">
                <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>

            {/* Menu items */}
            <nav className="flex-1 px-4 py-6">
                <ul className="space-y-2">
                    {menuItems.map((item) => (
                        <li key={item.name}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${isActive
                                        ? "bg-gray-700 text-white"
                                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    }`
                                }
                            >
                                {item.icon}
                                <span className="text-sm font-medium">{item.name}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
                © 2025 Bookstore Admin
            </div>
        </aside>
    );
}
