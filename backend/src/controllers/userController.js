const { Op } = require("sequelize");
const { User } = global.db;

exports.getMasters = async (req, res) => {
  try {
    const { city, spec } = req.query;
    console.log("🔍 Поиск мастеров:", { city, spec });
    
    let where = { role: "master" };
    
    if (city && city.trim()) {
      where.city = { [Op.like]: `%${city.trim()}%` };
    }
    
    // Если есть специализации — фильтруем ТОЛЬКО по ним
    if (spec) {
      const specs = Array.isArray(spec) ? spec : [spec];
      
      // Создаём условия для поиска
      const conditions = specs.map(s => ({
        specializations: { [Op.like]: `%"${s}"%` }
      }));
      
      where[Op.or] = conditions;
      console.log("Фильтр по специализациям:", specs);
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
