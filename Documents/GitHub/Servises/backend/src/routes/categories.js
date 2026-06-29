const express = require("express");
const router = express.Router();

// GET /api/categories
router.get("/", async (req, res) => {
  try {
    const Category = global.db.Category;
    if (!Category) {
      return res
        .status(500)
        .json({ success: false, message: "Модель Category не загружена" });
    }
    const categories = await Category.findAll({ where: { isActive: true } });
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error("Ошибка получения категорий:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
