import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import AdminLayout from "../pages/admin/AdminLayout.jsx";

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

const getRoleSlug = (user) => {
    const role =
        user?.role?.slug ||
        user?.role?.name ||
        user?.role ||
        (Array.isArray(user?.roles) ? user.roles[0] : null) ||
        (user?.is_admin ? "admin" : null) ||
        user?.role_id;
    const slug = String(role || "").toLowerCase();
    if (["1", "admin", "administrator", "quản trị"].includes(slug)) return "admin";
    return slug || "user";
};

export default function AdminRoute() {
    const location = useLocation();
    const storedUser = readStoredUser();
    const isAdmin = storedUser && getRoleSlug(storedUser) === "admin";

    if (!isAdmin) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname + location.search }}
            />
        );
    }

    return <AdminLayout />;
}