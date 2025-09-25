// src/common/index.jsx

// Ưu tiên lấy từ .env (Vite): VITE_API_URL=http://localhost:4000/api
export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:4000/api";

/**
 * summaryApi: tập hợp các endpoint/path phía backend.
 * Dùng kèm API_URL khi gọi fetch/axios:
 *   fetch(summaryApi.url(summaryApi.auth.login), { ... })
 */
const summaryApi = {
  // ====== Health / System ======
  health: "/health",

  // ====== Auth ======
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    me: "/me", // cần header Authorization: Bearer <token>
    // refresh: "/auth/refresh",
    // logout: "/auth/logout",
  },

  // ====== Tiện ích: tạo full URL nhanh ======
  url: (path) => {
    // Ghép URL an toàn, tránh // trùng
    if (!path) return API_URL;
    const base = API_URL.replace(/\/+$/, "");
    const p = String(path).startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  },
};

export default summaryApi;
