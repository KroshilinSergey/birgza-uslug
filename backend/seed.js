const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Order = require("./src/models/Order");

dotenv.config();

async function seedDatabase() {
  try {
    // Подключаемся к базе данных
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Подключение к базе данных установлено");

    // Удаляем старые данные (опционально)
    await Order.deleteMany({});
    console.log("🗑️  Старые данные удалены");

    // Создаем тестовые заказы
    const testOrders = [
      {
        title: "Ремонт ванной комнаты",
        description: "Полная замена плитки, установка новой сантехники",
        clientName: "Иван Иванов",
        phone: "+79001234567",
        email: "ivan@example.com",
        address: "ул. Ленина, д. 10, кв. 5",
        status: "в работе",
        price: 25000
      },
      {
        title: "Установка розеток",
        description: "Монтаж 10 розеток в квартире",
        clientName: "Петр Петров",
        phone: "+79007654321",
        email: "petr@example.com",
        address: "пр. Мира, д. 25, кв. 12",
        status: "завершен",
        price: 8000
      },
      {
        title: "Монтаж натяжного потолка",
        description: "Установка натяжного потолка в гостиной",
        clientName: "Сергей Сергеев",
        phone: "+79005554433",
        email: "sergey@example.com",
        address: "ул. Советская, д. 45, кв. 8",
        status: "новый",
        price: 15000
      },
      {
        title: "Замена электропроводки",
        description: "Полная замена проводки в двухкомнатной квартире",
        clientName: "Мария Смирнова",
        phone: "+79009998877",
        email: "maria@example.com",
        address: "ул. Центральная, д. 15, кв. 3",
        status: "в работе",
        price: 30000
      },
      {
        title: "Установка межкомнатных дверей",
        description: "Установка 3-х межкомнатных дверей",
        clientName: "Александр Козлов",
        phone: "+79003332211",
        email: "alex@example.com",
        address: "пр. Победы, д. 30, кв. 10",
        status: "отменен",
        price: 12000
      }
    ];

    // Добавляем тестовые заказы в базу
    const createdOrders = await Order.insertMany(testOrders);
    console.log(`✅ Добавлено ${createdOrders.length} тестовых заказов`);

    // Выводим созданные заказы
    console.log("\n📋 Созданные заказы:");
    createdOrders.forEach(order => {
      console.log(`- ${order.title} (${order.status}) - ${order.price} руб.`);
    });

    // Закрываем соединение
    await mongoose.connection.close();
    console.log("\n🔌 Соединение с базой данных закрыто");

  } catch (error) {
    console.error("❌ Ошибка при добавлении тестовых данных:", error);
    process.exit(1);
  }
}

// Запускаем функцию
seedDatabase();
