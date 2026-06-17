console.log("=== СТАРТ СКРИПТА ===");

require("dotenv").config();
console.log("ENV loaded");
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "***" : "not set");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("MYSQL_SOCKET:", process.env.MYSQL_SOCKET);

const { Sequelize } = require("sequelize");
console.log("Sequelize loaded");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      socketPath: process.env.MYSQL_SOCKET,
    },
  },
);

console.log("Sequelize instance created");

const Category = require("./src/models/Category")(sequelize);
console.log("Category model loaded");

const categories = [
  { name: "Сантехнические работы", icon: "fa-faucet" },
  { name: "Плиточные работы", icon: "fa-th-large" },
  { name: "Обустройство пола", icon: "fa-layer-group" },
  { name: "Ремонт потолка", icon: "fa-cloud" },
  { name: "Отделочные работы", icon: "fa-paint-roller" },
  { name: "Электротехнические работы", icon: "fa-bolt" },
  { name: "Демонтажные работы", icon: "fa-hammer" },
  { name: "Строительные работы", icon: "fa-tools" },
  { name: "Ремонт бытовой техники", icon: "fa-tv" },
  { name: "Компьютеры и программы", icon: "fa-laptop" },
  { name: "Грузоперевозки", icon: "fa-truck-moving" },
  { name: "Разное", icon: "fa-ellipsis-h" },
];

async function seedCategories() {
  try {
    console.log("Trying to authenticate...");
    await sequelize.authenticate();
    console.log("✅ Подключение к БД установлено");

    console.log("Syncing Category table...");
    await Category.sync({ force: true });
    console.log("Table synced");

    console.log("Inserting categories...");
    await Category.bulkCreate(categories);
    console.log(`✅ Добавлено ${categories.length} категорий`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  }
}

seedCategories();
