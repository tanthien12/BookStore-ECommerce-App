// src/common/index.jsx

// Ưu tiên lấy từ .env (Vite): VITE_API_URL=http://localhost:4000/api
export const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:4000/api";

// Helpers
const getToken = () => localStorage.getItem("access_token") || localStorage.getItem("token") || null;
export const authHeaders = () => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};
const qs = (obj = {}) =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
export const joinUrl = (path = "") => {
  const base = API_URL.replace(/\/+$/, "");
  const p = String(path).startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

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
    google: "/auth/google",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    me: "/me", // cần header Authorization: Bearer <token>
    // refresh: "/auth/refresh",
    logout: "/auth/logout",
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
    post: {
      single: "/upload/posts",
      multiple: "/upload/posts/multiple"
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
  // ====== Flashsale ======
  flashsale: {
    getActive: "/flashsales/active", // GET ?limit=...

    // (Admin)
    list: "/flashsales",
    create: "/flashsales",
    detail: (id) => `/flashsales/${id}`,
    update: (id) => `/flashsales/${id}`, // PUT (Admin update campaign)
    delete: (id) => `/flashsales/${id}`, // DELETE (Admin delete campaign)
    addItem: "/flashsales/items",
    removeItem: (id) => `/flashsales/items/${id}`,
  },

  // ====== Admin: Coupon (Mã giảm giá) ======
  coupon: {
    list: "/admin/coupons",
    create: "/admin/coupons",
    detail: (id) => `/admin/coupons/${id}`,
    update: (id) => `/admin/coupons/${id}`,
    delete: (id) => `/admin/coupons/${id}`,
  },

  // ====== Order ======
  order: {
    list: "/orders",                // GET ?q=&status=&page=&limit=
    detail: (id) => `/orders/${id}`,// GET by id
    create: "/orders",              // POST
    update: (id) => `/orders/${id}`,// PUT
    delete: (id) => `/orders/${id}`,// DELETE
    // NEW: chỉ đổi trạng thái (PATCH)
    updateStatus: (id) => `/orders/${id}/status`,
  },

  // ====== Cart ======

  cart: {
    list: "/cart",                 // GET
    add: "/cart",                  // POST
    update: (id) => `/cart/${id}`, // PUT
    remove: (id) => `/cart/${id}`, // DELETE
    clear: "/cart",                // DELETE all
    applyCoupon: "/cart/apply-coupon", // áp mã giảm giá cho cart hiện tại
  },

  // ====== Admin: Users ======
  user: {
    list: "/admin/users",                 // GET ?q=&page=&limit=&sort=newest&role_id=&is_active=&created_from=&created_to=
    detail: (id) => `/admin/users/${id}`, // GET
    create: "/admin/users",               // POST  {name,email,password,role_id,is_active?,avatar_url?}
    update: (id) => `/admin/users/${id}`, // PUT/PATCH {name?,email?,role_id?,is_active?,avatar_url?}
    resetPassword: (id) => `/admin/users/${id}/reset-password`, // POST {password?}
    bulk: "/admin/users/bulk",            // POST {action: 'activate'|'deactivate'|'assignRole'|'resetPassword', ids:[], role_id?}
  },

  notifications: {
    list: (params = '') => `/notifications${params}`,
    unreadCount: () => '/notifications/unread-count',
    markRead: (id) => `/notifications/${id}/read`,
    markAllRead: () => `/notifications/read-all`,
  },

  dashboard: {
    adminOverview: "/admin/dashboard",
    productAnalytics: "/admin/dashboard/products",
    customerAnalytics: "/admin/dashboard/customers",
    campaignAnalytics: "/admin/dashboard/campaigns",
  },

  // ====== Admin: Roles (tùy chọn) ======
  role: {
    list: "/admin/roles",                 // GET ?withCounts=true|false
  },

  // ====== Account (tài khoản hiện tại) ======
  account: {
    profile: "/me",
    update: "/me",
    changePassword: "/me/password",
    stats: "/me/quick-stats",
    // myOrders: "/me/orders",
  },
  ordersMe: {
    list: "/me/orders",
    detail: (id) => `/me/orders/${id}`,
    cancel: (id) => `/me/orders/${id}/cancel`,
  },
  address: {
    list: "/me/addresses",
    create: "/me/addresses",
    update: (id) => `/me/addresses/${id}`,
    delete: (id) => `/me/addresses/${id}`,
  },
  wishlist: {
    list: "/me/wishlist",
    add: (bookId) => `/me/wishlist/${bookId}`,
    remove: (bookId) => `/me/wishlist/${bookId}`,
  },
  voucher: {
    available: "/me/vouchers",
    used: "/me/vouchers/used",
  },
  blogCategories: {
    list: "/blog-categories",
  },
  posts: {
    list: "/posts",
    create: "/posts",
    detail: (slug) => `/posts/${slug}`,
    update: (id) => `/posts/${id}`,
    delete: (id) => `/posts/${id}`,
  },
  postComments: {
    list: (postId) => `/posts/${postId}/comments`,
    create: "/posts/comments",
    delete: (id) => `/posts/comments/${id}`,
  },
  // // ====== Chatbot ======
  // url: (p) => `${API_URL}${p}`,
  // authHeaders: () => authHeaders(),
  // chat: {
  //   start: "/chat/start",
  //   stream: (q, id) => `/chat/stream?q=${encodeURIComponent(q)}&conversationId=${id}`,
  // },

  // ====== Chatbot (Gemini + SSE) ======
  chat: {
    // POST /chat/start  (headers: Authorization nếu có)
    start: "/chat/start",

    // GET /chat/stream?q=...&conversationId=...
    // ⚠️ EventSource KHÔNG gửi được header Authorization tuỳ ý.
    // -> Khuyên dùng httpOnly cookie cho auth; hoặc cho phép anonymous route rồi kiểm tra quyền trong tool.
    streamPath: "/chat/stream",
    streamUrl: (q, conversationId) => {
      const h = authHeaders?.() || {};
      const raw = (h.Authorization || h.authorization || "").replace(/^Bearer\s+/i, "");
      const params = { q, conversationId };
      if (raw) params.token = raw;        // <--- ĐÍNH KÈM TOKEN VÀO QUERY
      return joinUrl(`/chat/stream?${qs(params)}`);
    },
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
