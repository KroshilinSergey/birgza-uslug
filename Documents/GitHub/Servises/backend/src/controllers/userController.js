const { Op } = require("sequelize");
const { User } = global.db;

exports.getMasters = async (req, res) => {
  try {
    const { city, spec } = req.query;
    console.log("========================================");
    console.log("🔍 ПОИСК МАСТЕРОВ");
    console.log("📌 Город:", city);
    console.log("📌 Специализации (raw):", spec);
    console.log("========================================");
    
    const where = { role: "master" };
    if (city && city.trim()) {
      where.city = { [Op.like]: `%${city.trim()}%` };
    }
    
    const masters = await User.findAll({
      where,
      attributes: { exclude: ["password"] },
    });
    
    // Преобразуем spec в массив чисел
    let selectedSpecs = [];
    if (spec) {
      const specs = Array.isArray(spec) ? spec : [spec];
      selectedSpecs = specs.map(s => {
        const num = parseInt(s);
        return isNaN(num) ? null : num;
      }).filter(s => s !== null);
    }
    
    console.log("📋 Выбранные ID специализаций:", selectedSpecs);
    console.log(`📊 Всего мастеров в городе: ${masters.length}`);
    
    // ФИЛЬТРУЕМ: оставляем только тех, у кого есть хотя бы одна выбранная специализация
    let filteredMasters = masters;
    if (selectedSpecs.length > 0) {
      filteredMasters = masters.filter(master => {
        const masterSpecs = master.specializations || [];
        const masterSpecsNumbers = masterSpecs.map(s => typeof s === 'string' ? parseInt(s) : s);
        // Проверяем, есть ли хотя бы одно совпадение
        const hasMatch = selectedSpecs.some(specId => masterSpecsNumbers.includes(specId));
        return hasMatch;
      });
      console.log(`✅ После фильтрации по специализациям: ${filteredMasters.length} мастеров`);
    } else {
      console.log(`✅ Специализации не выбраны, показываем всех ${filteredMasters.length} мастеров`);
    }
    
    // Сортируем отфильтрованных мастеров по рейтингу
    const sortedMasters = filteredMasters.map(master => {
      return {
        ...master.toJSON(),
      };
    });
    
    // Сортируем по рейтингу (по убыванию)
    sortedMasters.sort((a, b) => {
      return (b.rating || 0) - (a.rating || 0);
    });
    
    console.log(`✅ Отправлено мастеров: ${sortedMasters.length}`);
    console.log("========================================");
    
    res.json({ success: true, data: sortedMasters });
  } catch (error) {
    console.error("❌ Ошибка:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
