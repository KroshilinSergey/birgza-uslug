const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { User } = global.db;

// Все маршруты требуют авторизации и роли admin
router.use(protect, authorize("admin"));

// Получить всех пользователей
router.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Удалить пользователя
router.delete("/users/:id", async (req, res) => {
  try {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Заблокировать/разблокировать пользователя
router.put("/users/:id/block", async (req, res) => {
  try {
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Получить заказы пользователя
router.get("/users/:id/orders", async (req, res) => {
  try {
    const { Order } = global.db;
    const orders = await Order.findAll({
      where: { customerId: req.params.id },
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Получить категории
router.get("/categories", async (req, res) => {
  try {
    const { Category } = global.db;
    const categories = await Category.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
