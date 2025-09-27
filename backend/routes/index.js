// routes/index.js
const express = require("express");
const router = express.Router();

const AuthController = require("../controllers/auth.controller");
// const { authGuard } = require("../middlewares/auth.middleware");

router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);
router.post("/auth/forgot-password", AuthController.forgotPassword);
router.post("/auth/reset-password", AuthController.resetPassword);

// Ví dụ route bảo vệ (khi có):
// router.get("/me", authGuard, (req, res) => res.json({ userId: req.user.id }));

module.exports = router;
