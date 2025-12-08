// routes/index.js
const express = require("express");
const router = express.Router();

const uploadCtrl = require("../controllers/upload.controller");
const { makeUploader } = require("../middlewares/upload.middleware");

const ReviewController = require("../controllers/review.controller");

const authController = require("../controllers/auth.controller");
const bookController = require("../controllers/book.controller");
const flashsaleController = require("../controllers/flashsale.controller");
const categoryController = require("../controllers/category.controller");
const orderController = require("../controllers/order.controller");
const cartController = require("../controllers/cart.controller");
const postController = require("../controllers/post.controller");
const postCommentController = require("../controllers/post.comment.controller");

const NotificationController = require("../controllers/notification.controller");

const { authGuard: requireAuth, requireRole } = require("../middlewares/auth.middleware");
const adminUserCtrl = require("../controllers/admin.user.controller");
const adminRoleCtrl = require("../controllers/admin.role.controller");
const adminDashboardCtrl = require("../controllers/admin.dashboard.controller");
const AccountController = require("../controllers/account.controller");
const AddressController = require("../controllers/address.controller");
const WishlistController = require("../controllers/wishlist.controller");
// const VoucherController = require("../controllers/voucher.controller");

const voucherController = require('../controllers/voucher.controller');


const chatCtl = require("../controllers/chat.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const sseHeaders = require("../middlewares/sse.middleware");

const paymentController = require("../controllers/payment.controller");



// ========== AUTH ==========
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);
router.post("/auth/logout", authController.logout);
router.post('/auth/google', authController.googleLogin);


// ========== UPLOAD ==========
router.post("/upload/products", makeUploader("products").single("file"), uploadCtrl.uploadSingle("products"));
router.post("/upload/products/multiple", makeUploader("products").array("files", 10), uploadCtrl.uploadMultiple("products"));

router.post("/upload/users", makeUploader("users").single("file"), uploadCtrl.uploadSingle("users"));
router.post("/upload/users/multiple", makeUploader("users").array("files", 5), uploadCtrl.uploadMultiple("users"));

router.post("/upload/categories", makeUploader("categories").single("file"), uploadCtrl.uploadSingle("categories"));
router.post("/upload/categories/multiple", makeUploader("categories").array("files", 10), uploadCtrl.uploadMultiple("categories"));

router.post("/upload/posts", makeUploader("posts").single("file"), uploadCtrl.uploadSingle("posts"));
router.post("/upload/posts/multiple", makeUploader("posts").array("files", 5), uploadCtrl.uploadMultiple("posts"));

router.delete("/upload", uploadCtrl.remove);

// ========== CATEGORY ==========
router.get("/categories", categoryController.list);
router.get("/categories/:id", categoryController.detail);
router.post("/categories", categoryController.create);
router.put("/categories/:id", categoryController.update);
router.delete("/categories/:id", categoryController.remove);

// ========== ORDER ==========
router.get("/orders", orderController.list);
router.get("/orders/:id", orderController.detail);
router.post("/orders", orderController.create);
router.put("/orders/:id", orderController.update);
router.delete("/orders/:id", orderController.remove);
// NEW: Admin cập nhật trạng thái đơn hàng (state machine)
router.patch("/orders/:id/status", requireAuth, requireRole("admin"), orderController.updateStatus);

// ========== CART ==========
router.get("/cart", requireAuth, cartController.list);             // GET /api/cart
router.post("/cart", requireAuth, cartController.add);             // POST /api/cart
router.put("/cart/:id", requireAuth, cartController.update);       // PUT /api/cart/:id
router.delete("/cart/:id", requireAuth, cartController.remove);    // DELETE /api/cart/:id
router.delete("/cart", requireAuth, cartController.clear);         // DELETE /api/cart
router.post("/cart/apply-coupon", requireAuth, voucherController.applyCoupon);

// ========== BOOK ==========
router.get("/books", bookController.list); // ?q=&page=&limit=&sort=newest
router.get("/books/:id", bookController.detail);
router.get("/books/:id/related", bookController.getRelated);
router.post("/books", bookController.create);
router.put("/books/:id", bookController.update);
router.delete("/books/:id", bookController.remove);

// GET /api/flashsales/active
router.get("/flashsales/active", flashsaleController.getActiveFlashSale);
// === Admin Routes ===
router.post("/flashsales", flashsaleController.createCampaign);
router.get("/flashsales", flashsaleController.listCampaigns);
router.get("/flashsales/:id", flashsaleController.getCampaignDetails);
router.put("/flashsales/:id", flashsaleController.updateCampaign);
router.delete("/flashsales/:id", flashsaleController.deleteCampaign);

router.post("/flashsales/items", flashsaleController.addItemToCampaign);
router.delete("/flashsales/items/:id", flashsaleController.removeItemFromCampaign);


// ===== Admin: Users =====
// router.get('/admin/users', requireAuth, requireRole('admin'), adminUserCtrl.list);
// router.get('/admin/users/:id', requireAuth, requireRole('admin'), adminUserCtrl.getOne);
// router.post('/admin/users', requireAuth, requireRole('admin'), adminUserCtrl.create);
// router.put('/admin/users/:id', requireAuth, requireRole('admin'), adminUserCtrl.update);
// router.post('/admin/users/:id/reset-password', requireAuth, requireRole('admin'), adminUserCtrl.resetPassword);
// router.post('/admin/users/bulk', requireAuth, requireRole('admin'), adminUserCtrl.bulk);
// router.get('/admin/dashboard', adminDashboardCtrl.overview);

router.get('/admin/dashboard', requireAuth, requireRole('admin'), adminDashboardCtrl.overview);
router.get('/admin/dashboard/products', requireAuth, requireRole('admin'), adminDashboardCtrl.products);
router.get('/admin/dashboard/customers', requireAuth, requireRole('admin'), adminDashboardCtrl.customers);
router.get('/admin/dashboard/campaigns', adminDashboardCtrl.campaigns);


router.get('/admin/users', adminUserCtrl.list);
router.get('/admin/users/:id', adminUserCtrl.getOne);
router.post('/admin/users', adminUserCtrl.create);
router.put('/admin/users/:id', adminUserCtrl.update);
router.post('/admin/users/:id/reset-password', adminUserCtrl.resetPassword);
router.post('/admin/users/bulk', adminUserCtrl.bulk);


// ADMIN – Coupon CRUD
router.get(
    '/admin/coupons', requireAuth, requireRole('admin'), voucherController.adminListCoupons);

router.post(
    '/admin/coupons', requireAuth, requireRole('admin'), voucherController.adminCreateCoupon);

router.get(
    '/admin/coupons/:id', requireAuth, requireRole('admin'), voucherController.adminGetCoupon);

router.put(
    '/admin/coupons/:id', requireAuth, requireRole('admin'), voucherController.adminUpdateCoupon);

router.delete(
    '/admin/coupons/:id', requireAuth, requireRole('admin'), voucherController.adminDeleteCoupon);


// ===== Admin: Roles =====
// router.get('/admin/roles', requireAuth, requireRole('admin'), adminRoleCtrl.list);
router.get('/admin/roles', adminRoleCtrl.list);

// Account (cần đăng nhập)
// router.get('/me', requireAuth, AccountController.me);
// router.put('/me', requireAuth, AccountController.updateMe);
// router.put('/me/password', requireAuth, AccountController.changePassword);
// router.get('/me/orders', requireAuth, AccountController.myOrders);

// Account center
router.get('/me', requireAuth, AccountController.me);
router.put('/me', requireAuth, AccountController.updateMe);
router.put('/me/password', requireAuth, AccountController.changePassword);
router.get("/me/quick-stats", requireAuth, AccountController.quickStats);

// Orders (của tôi)
router.get('/me/orders', requireAuth, AccountController.myOrders);
router.get('/me/orders/:id', requireAuth, orderController.detailMine);     // CHI TIẾT ĐƠN CỦA TÔI
router.post('/me/orders/:id/cancel', requireAuth, orderController.cancelMine); // HỦY ĐƠN (nếu cho phép)

// Address book
router.get('/me/addresses', requireAuth, AddressController.list);
router.post('/me/addresses', requireAuth, AddressController.create);
router.put('/me/addresses/:id', requireAuth, AddressController.update);
router.delete('/me/addresses/:id', requireAuth, AddressController.remove);

// Wishlist
router.get('/me/wishlist', requireAuth, WishlistController.list);
router.post('/me/wishlist/:bookId', requireAuth, WishlistController.add);
router.delete('/me/wishlist/:bookId', requireAuth, WishlistController.remove);

// Vouchers
// router.get('/me/vouchers', requireAuth, voucherController.available); // đang hoạt động + hợp lệ
// router.get('/me/vouchers/used', requireAuth, voucherController.used);  // đã dùng
// Vouchers
router.get(
    '/me/vouchers',
    requireAuth,
    voucherController.listMyVouchers
);

router.get(
    '/me/vouchers/used',
    requireAuth,
    voucherController.listUsedVouchers
);

// ========== NOTIFICATIONS ==========
router.get(
    "/notifications",
    requireAuth,
    NotificationController.list
);

router.get(
    "/notifications/unread-count",
    requireAuth,
    NotificationController.unreadCount
);

router.post(
    "/notifications/:id/read",
    requireAuth,
    NotificationController.markRead
);

router.post(
    "/notifications/read-all",
    requireAuth,
    NotificationController.markAllRead
);
// HẾT NHÓM NOTIFICATIONS

// chatbot
// ========== CHATBOT (Gemini + SSE) ==========
// Rate-limit cho SSE
const rateLimit = require("express-rate-limit");
const sseLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút
    max: 30,                  // tối đa 30 request/5 phút/IP
    standardHeaders: true,
    legacyHeaders: false,
});

//vnpay
router.post("/vnpay/create-payment-url", paymentController.createVNPayUrl);
router.get("/vnpay/return", paymentController.vnpayReturn);

// ===== Chatbot
router.get("/chat/health", chatCtl.health);
router.get("/chat/stream-test", sseHeaders, chatCtl.streamTest);

// KHÔNG ép login ở 2 route dưới (EventSource không gửi được Bearer header).
router.post("/chat/start", chatCtl.start);
router.get("/chat/stream", sseHeaders, sseLimiter, chatCtl.stream);



//Province, District, Ward
router.get("/provinces", AddressController.provinces);
router.get("/districts", AddressController.districts);
router.get("/wards", AddressController.wards);

// ========== REVIEWS ==========
// public
router.get("/books/:bookId/reviews", ReviewController.listByBook);

// private
router.get("/books/:bookId/my-review", requireAuth, ReviewController.getMine);
router.post("/reviews", requireAuth, ReviewController.upsertRoot);
router.post("/reviews/:id/replies", requireAuth, ReviewController.addReply);
router.put("/replies/:id", requireAuth, ReviewController.updateReply);
router.delete("/reviews/:id", requireAuth, ReviewController.deleteAny);

// ========== BLOG ==========
router.get("/blog-categories", postController.getCategories); // Lấy danh mục
router.get("/posts", postController.list);
router.get("/posts/:slugOrId", postController.detail);

router.post("/posts", requireAuth, requireRole("admin"), postController.create);
router.put("/posts/:id", requireAuth, requireRole("admin"), postController.update);
router.delete("/posts/:id", requireAuth, requireRole("admin"), postController.remove);

// ========== POST COMMENTS ==========
router.get("/posts/:postId/comments", postCommentController.list);
// router.get("/admin/comments", requireAuth, requireRole("admin"), postCommentController.adminList);
router.post("/posts/comments", requireAuth, postCommentController.create); // Cần login
router.delete("/posts/comments/:id", requireAuth, postCommentController.remove); // Cần login

module.exports = router;