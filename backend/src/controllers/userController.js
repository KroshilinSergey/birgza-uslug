const { Op } = require("sequelize");
const { User } = global.db;

exports.getMasters = async (req, res) => {
  try {
    const { city } = req.query;
    console.log("🔍 Поиск мастеров, город:", city);
    
    const where = { role: "master" };
    if (city && city.trim()) {
      where.city = { [Op.like]: `%${city.trim()}%` };
    }
    
    const masters = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
      order: [["rating", "DESC"]]
    });
    
    console.log(`✅ Найдено мастеров: ${masters.length}`);
    res.json({ success: true, data: masters });
  } catch (error) {
    console.error("❌ Ошибка:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
