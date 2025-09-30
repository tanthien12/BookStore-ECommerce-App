// routes/index.js
const express = require("express");
const router = express.Router();
const uploadCtrl = require("../controllers/upload.controller");
// const { makeUploader } = require("../config/multer.config");
const { makeUploader } = require('../middlewares/upload.middleware');



const AuthController = require("../controllers/auth.controller");
const BookController = require("../controllers/book.controller");
const categoryCtrl = require("../controllers/category.controller");
const { validate } = require("../middlewares/validate.middleware");
// const { authGuard } = require("../middlewares/auth.middleware");

router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/reset-password", AuthController.resetPassword);

// Ví dụ route bảo vệ (khi có):
// router.get("/me", authGuard, (req, res) => res.json({ userId: req.user.id }));

// Upload file
// === Upload: PRODUCTS ===
router.post('/upload/products', makeUploader('products').single('file'), uploadCtrl.uploadSingle('products'));
router.post('/upload/products/multiple', makeUploader('products').array('files', 10), uploadCtrl.uploadMultiple('products'));

// === Upload: USERS (avatar) ===
router.post('/upload/users', makeUploader('users').single('file'), uploadCtrl.uploadSingle('users'));
router.post('/upload/users/multiple', makeUploader('users').array('files', 5), uploadCtrl.uploadMultiple('users'));

// === Upload: CATEGORIES ===
router.post('/upload/categories', makeUploader('categories').single('file'), uploadCtrl.uploadSingle('categories'));
router.post('/upload/categories/multiple', makeUploader('categories').array('files', 10), uploadCtrl.uploadMultiple('categories'));

// Delete (body: { bucket, fileName })
router.delete('/upload', uploadCtrl.remove);


// ====== Categories ======
router.get("/categories", categoryCtrl.list);
router.get("/categories/:id", categoryCtrl.detail);
router.post("/categories", express.json(), categoryCtrl.create);
router.put("/categories/:id", express.json(), categoryCtrl.update);
router.delete("/categories/:id", categoryCtrl.remove);



// =================== BOOKS (CRUD inline) ===================
// List (filter/paging/sort): GET /api/books?q=&category_id=&language=&format=&page=&limit=&sort=
router.get(
    "/books",
    validate(BookController.schema.listSchema, "query"),
    BookController.list
);

// Detail: GET /api/books/:id  (id: UUID)
router.get("/books/:id", BookController.detail);

// Create: POST /api/books
// Body khớp schema: title, author?, isbn?, publisher?, published_year?, language?, format?,
// price, stock, description?, image_url?, category_ids?: string[UUID]
router.post(
    "/books",
    validate(BookController.schema.bookSchema),
    BookController.create
);

// Update: PUT /api/books/:id
router.put(
    "/books/:id",
    validate(BookController.schema.bookSchema),
    BookController.update
);

// Delete: DELETE /api/books/:id
router.delete("/books/:id", BookController.remove);

// ----
module.exports = router;
