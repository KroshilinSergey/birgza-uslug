// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Обычная регистрация/логин
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", protect, authController.getMe);
router.post("/logout", protect, authController.logout);

// Восстановление пароля по email
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
