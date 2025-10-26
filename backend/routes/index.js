// routes/index.js
const express = require("express");
const router = express.Router();

const uploadCtrl = require("../controllers/upload.controller");
const { makeUploader } = require("../middlewares/upload.middleware");

const ReviewController = require("../controllers/review.controller");

const authController = require("../controllers/auth.controller");
const bookController = require("../controllers/book.controller");
const categoryController = require("../controllers/category.controller");
const orderController = require("../controllers/order.controller");

const { authGuard: requireAuth, requireRole } = require("../middlewares/auth.middleware");
const adminUserCtrl = require("../controllers/admin.user.controller");
const adminRoleCtrl = require("../controllers/admin.role.controller");
const AccountController = require("../controllers/account.controller");
const AddressController = require("../controllers/address.controller");
const WishlistController = require("../controllers/wishlist.controller");
const VoucherController = require("../controllers/voucher.controller");



// ========== AUTH ==========
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);
router.post("/auth/logout", authController.logout);

// ========== UPLOAD ==========
router.post("/upload/products", makeUploader("products").single("file"), uploadCtrl.uploadSingle("products"));
router.post("/upload/products/multiple", makeUploader("products").array("files", 10), uploadCtrl.uploadMultiple("products"));

router.post("/upload/users", makeUploader("users").single("file"), uploadCtrl.uploadSingle("users"));
router.post("/upload/users/multiple", makeUploader("users").array("files", 5), uploadCtrl.uploadMultiple("users"));

router.post("/upload/categories", makeUploader("categories").single("file"), uploadCtrl.uploadSingle("categories"));
router.post("/upload/categories/multiple", makeUploader("categories").array("files", 10), uploadCtrl.uploadMultiple("categories"));

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

// ========== BOOK ==========
router.get("/books", bookController.list); // ?q=&page=&limit=&sort=newest
router.get("/books/:id", bookController.detail);
router.post("/books", bookController.create);
router.put("/books/:id", bookController.update);
router.delete("/books/:id", bookController.remove);

// ===== Admin: Users =====
// router.get('/admin/users', requireAuth, requireRole('admin'), adminUserCtrl.list);
// router.get('/admin/users/:id', requireAuth, requireRole('admin'), adminUserCtrl.getOne);
// router.post('/admin/users', requireAuth, requireRole('admin'), adminUserCtrl.create);
// router.put('/admin/users/:id', requireAuth, requireRole('admin'), adminUserCtrl.update);
// router.post('/admin/users/:id/reset-password', requireAuth, requireRole('admin'), adminUserCtrl.resetPassword);
// router.post('/admin/users/bulk', requireAuth, requireRole('admin'), adminUserCtrl.bulk);
router.get('/admin/users', adminUserCtrl.list);
router.get('/admin/users/:id', adminUserCtrl.getOne);
router.post('/admin/users', adminUserCtrl.create);
router.put('/admin/users/:id', adminUserCtrl.update);
router.post('/admin/users/:id/reset-password', adminUserCtrl.resetPassword);
router.post('/admin/users/bulk', adminUserCtrl.bulk);

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
router.get('/me/vouchers', requireAuth, VoucherController.available); // đang hoạt động + hợp lệ
router.get('/me/vouchers/used', requireAuth, VoucherController.used);  // đã dùng
module.exports = router;

//Province, District, Ward
router.get("/provinces", AddressController.provinces);          
router.get("/districts", AddressController.districts);          
router.get("/wards", AddressController.wards); 

// ========== REVIEWS ==========
// Lấy tất cả review gốc + replies cho 1 sản phẩm
router.get("/books/:bookId/reviews", ReviewController.listByBook);

// Lấy review gốc của chính user cho sản phẩm
router.get("/books/:bookId/my-review", requireAuth, ReviewController.myReview);

// User tạo / update đánh giá gốc
router.post("/reviews", requireAuth, ReviewController.upsertRoot);

// Xóa 1 review gốc hoặc 1 reply (chủ sở hữu hoặc admin)
router.delete("/reviews/:id", requireAuth, ReviewController.remove);

// Thêm reply dưới review gốc (chỉ admin hoặc owner review gốc)
router.post("/reviews/:id/replies", requireAuth, ReviewController.addReply);

// Sửa reply (chỉ người tạo reply)
router.put("/replies/:replyId", requireAuth, ReviewController.updateReply);