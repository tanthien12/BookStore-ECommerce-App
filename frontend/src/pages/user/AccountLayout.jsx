

// code 4 sau
// src/pages/user/AccountLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiUser, FiPackage, FiHeart, FiMapPin, FiGift, FiLock, FiMessageCircle, FiLogOut } from "react-icons/fi";
import summaryApi from "../../common";
import { toast } from "react-toastify";

const menu = [
    { to: "/account", label: "Tài khoản của tôi", icon: FiUser, end: true },
    { to: "/account/orders", label: "Đơn hàng của tôi", icon: FiPackage },
    { to: "/account/wishlist", label: "Sách yêu thích", icon: FiHeart },
    { to: "/account/addresses", label: "Địa chỉ giao hàng", icon: FiMapPin },
    { to: "/account/vouchers", label: "Voucher / Điểm thưởng", icon: FiGift },
    { to: "/account/security", label: "Cài đặt bảo mật", icon: FiLock },
    // { to: "/account/support", label: "Hỗ trợ / Chatbot", icon: FiMessageCircle },
];

const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};
const token = () => localStorage.getItem('access_token') || localStorage.getItem('token');

export default function AccountLayout() {
    const nav = useNavigate();
    const me = getUser();

    const logout = async () => {
        try {
            await fetch(summaryApi.url(summaryApi.auth.logout), { method: 'POST', headers: token() ? { Authorization: `Bearer ${token()}` } : {}, credentials: 'include' })
                .catch(() => { });
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('access_token');
            localStorage.removeItem('token');
            toast.info("Đã đăng xuất");
            nav("/login", { replace: true });
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-3 md:px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
                <aside className="rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <img src={me?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(me?.name || 'User')}`} alt="ava" className="w-12 h-12 rounded-full border object-cover" />
                        <div>
                            <div className="font-semibold">{me?.name || 'Tài khoản'}</div>
                            <div className="text-xs text-gray-500">{me?.email}</div>
                        </div>
                    </div>
                    <nav className="space-y-1">
                        {menu.map(m => {
                            const Icon = m.icon;
                            return (
                                <NavLink
                                    key={m.to}
                                    to={m.to}
                                    end={m.end}
                                    className={({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-red-600 text-white shadow' : 'border border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <Icon className="h-4 w-4" /> {m.label}
                                </NavLink>
                            );
                        })}
                        <button onClick={logout} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm border border-gray-200 hover:bg-gray-50 mt-1">
                            <FiLogOut className="h-4 w-4" /> Đăng xuất
                        </button>
                    </nav>
                </aside>
                <section>
                    <Outlet />
                </section>
            </div>
        </div>
    );
}
