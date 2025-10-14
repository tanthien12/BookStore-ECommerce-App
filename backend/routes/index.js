// routes/index.js
const express = require("express");
const router = express.Router();

const uploadCtrl = require("../controllers/upload.controller");
const { makeUploader } = require("../middlewares/upload.middleware");

const authController = require("../controllers/auth.controller");
const bookController = require("../controllers/book.controller");
const categoryController = require("../controllers/category.controller");
const orderController = require("../controllers/order.controller");

const { authGuard: requireAuth, requireRole } = require("../middlewares/auth.middleware");
const adminUserCtrl = require("../controllers/admin.user.controller");
const adminRoleCtrl = require("../controllers/admin.role.controller");
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

module.exports = router;
