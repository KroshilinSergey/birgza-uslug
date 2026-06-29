// migrate.js
require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Подключено к MongoDB");
  } catch (error) {
    console.error("❌ Ошибка подключения:", error);
    process.exit(1);
  }
};

const runMigration = async () => {
  await connectDB();

  // Обновление пользователей
  console.log("🔄 Обновление пользователей...");
  const userResult = await mongoose.connection.collection("users").updateMany(
    {},
    {
      $set: {
        city: "",
        specializations: [],
        profile: {},
        rating: 0,
        reviewsCount: 0,
      },
    },
  );
  console.log(
    `   Пользователи: найдено ${userResult.matchedCount}, изменено ${userResult.modifiedCount}`,
  );

  // Обновление заказов
  console.log("🔄 Обновление заказов...");
  const orderResult = await mongoose.connection.collection("orders").updateMany(
    {},
    {
      $set: {
        customerId: null,
        customerName: "",
        customerPhone: "",
        customerCity: "",
        categoryName: "",
        phoneVisible: true,
        masterId: null,
        masterName: null,
        takenAt: null,
        completedAt: null,
        cityData: {},
      },
    },
  );
  console.log(
    `   Заказы: найдено ${orderResult.matchedCount}, изменено ${orderResult.modifiedCount}`,
  );

  // Обновление отзывов
  console.log("🔄 Обновление отзывов...");
  const reviewResult = await mongoose.connection
    .collection("reviews")
    .updateMany(
      {},
      {
        $set: {
          orderTitle: "",
        },
      },
    );
  console.log(
    `   Отзывы: найдено ${reviewResult.matchedCount}, изменено ${reviewResult.modifiedCount}`,
  );

  console.log("✅ Миграция завершена");
  process.exit(0);
};

runMigration().catch((err) => {
  console.error("❌ Ошибка миграции:", err);
  process.exit(1);
});
