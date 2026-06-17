const mongoose = require("mongoose");
require("dotenv").config();

async function checkIndexes() {
  try {
    const mongoUri =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/remont_expert";
    await mongoose.connect(mongoUri);
    console.log("✅ Подключено к MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("reviews");

    const indexes = await collection.indexes();
    console.log("📋 Индексы коллекции reviews:");
    indexes.forEach((idx) => {
      console.log(
        ` - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? "(уникальный)" : ""}`,
      );
    });
  } catch (error) {
    console.error("❌ Ошибка:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Отключено от MongoDB");
  }
}

checkIndexes();
