const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Подключено к базе данных');
    
    // Очищаем коллекции (осторожно!)
    await User.deleteMany({});
    await Category.deleteMany({});
    
    // Создаем администратора
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const admin = await User.create({
      name: 'Администратор',
      email: 'admin@remont-expert.ru',
      phone: '+79991234567',
      password: hashedPassword,
      role: 'admin',
      isVerified: true
    });
    
    // Создаем категории
    const categories = [
      { name: 'Ремонт полов', icon: '🛠️' },
      { name: 'Сантехника', icon: '🚿' },
      { name: 'Электрика', icon: '💡' },
      { name: 'Отделочные работы', icon: '🎨' },
      { name: 'Установка дверей', icon: '🚪' },
      { name: 'Окна и балконы', icon: '🪟' },
      { name: 'Дизайн интерьера', icon: '🏠' },
      { name: 'Строительные работы', icon: '👷' }
    ];
    
    await Category.insertMany(categories);
    
    console.log('✅ База данных заполнена:');
    console.log(`   👑 Админ: ${admin.email} (пароль: admin123)`);
    console.log(`   🏷️  Категорий: ${categories.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  }
};

seedDatabase();