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

  upload: {
    product: {
      single: "/upload/products",
      multiple: "/upload/products/multiple",
    },
    user: {
      single: "/upload/users",
      multiple: "/upload/users/multiple",
    },
    category: {
      single: "/upload/categories",
      multiple: "/upload/categories/multiple",
    },
    remove: "/upload", // body: { bucket, fileName }
  },

  // ====== Book ======
  book: {
    list: "/books",            // GET ?q=&page=&limit=&sort=&category_id=
    detail: (id) => `/books/${id}`, // GET by id
    create: "/books",          // POST
    update: (id) => `/books/${id}`, // PUT
    delete: (id) => `/books/${id}`, // DELETE
  },

  // ====== Category ======
  category: {
    list: "/categories",                // GET ?q=&page=&limit=&sort=
    detail: (id) => `/categories/${id}`,// GET by id
    create: "/categories",              // POST
    update: (id) => `/categories/${id}`,// PUT
    delete: (id) => `/categories/${id}`,// DELETE
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
