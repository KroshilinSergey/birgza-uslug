const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/auth");

// Публичный маршрут (не требует авторизации) — должен быть ПЕРВЫМ
router.get("/masters", userController.getMasters);

// Все остальные маршруты требуют авторизации
router.use(protect);

router.get("/:id", async (req, res) => {
  try {
    const { User } = global.db;
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "Пользователь не найден" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/profile", async (req, res) => {
  try {
    const { User } = global.db;
    const userId = req.user.id;
    const { name, city, specializations, experience, profile } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Пользователь не найден" });
    }

    if (name !== undefined) user.name = name;
    if (city !== undefined) user.city = city;
    if (specializations !== undefined) user.specializations = specializations;
    if (experience !== undefined) user.experience = experience;
    if (profile !== undefined) user.profile = { ...user.profile, ...profile };

    await user.save();
    const safeUser = user.toJSON();
    delete safeUser.password;

    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
