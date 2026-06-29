const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");

// Используем ту же переменную окружения, что и раньше, но теперь она должна указывать на PostgreSQL/MySQL.
// На хостинге у нас, скорее всего, MySQL. Если в .env прописана MONGODB_URI, нужно заменить на DATABASE_URL.
// Для простоты пока будем использовать SQLite для теста (но в продакшене нужна MySQL).
// Предположим, что у нас есть DATABASE_URL в .env.
// Если нет, создадим SQLite файл.

let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "mysql",
    logging: false,
  });
} else {
  // Для разработки: SQLite
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: path.join(__dirname, "../../database.sqlite"),
    logging: false,
  });
}

// Загружаем модели
const db = {};
const modelsPath = path.join(__dirname, "../models");
fs.readdirSync(modelsPath)
  .filter((file) => file.endsWith(".js") && file !== "index.js")
  .forEach((file) => {
    const model = require(path.join(modelsPath, file))(sequelize);
    db[model.name] = model;
  });

// Ассоциации
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
