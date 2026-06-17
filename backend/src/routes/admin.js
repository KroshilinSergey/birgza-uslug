const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");

// Все маршруты требуют авторизации и роли admin
router.use(protect, authorize("admin"));

// Получить всех пользователей
router.get("/users", async (req, res) => {
  try {
    const { User } = global.db;
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Удалить пользователя
router.delete("/users/:id", async (req, res) => {
  try {
    const { User } = global.db;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Пользователь не найден" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Нельзя удалить админа" });
    }
    await user.destroy();
    res.json({ success: true, message: "Пользователь удалён" });
  } catch (error) {
    console.error("Admin delete error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Блокировка пользователя
router.put("/users/:id/block", async (req, res) => {
  try {
    const { User } = global.db;
    const { isBlocked } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Пользователь не найден" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Нельзя блокировать админа" });
    }
    user.isBlocked = isBlocked;
    await user.save();
    res.json({
      success: true,
      message: isBlocked ? "Пользователь заблокирован" : "Пользователь разблокирован",
    });
  } catch (error) {
    console.error("Admin block error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Заказы пользователя
router.get("/users/:id/orders", async (req, res) => {
  try {
    const { Order } = global.db;
    const orders = await Order.findAll({
      where: { customerId: req.params.id },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("Admin orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Категории
router.get("/categories", async (req, res) => {
  try {
    const { Category } = global.db;
    const categories = await Category.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Admin categories error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
