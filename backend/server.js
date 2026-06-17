require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, Op } = require('sequelize');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  }
);

const User = require('./src/models/User')(sequelize);
const Order = require('./src/models/Order')(sequelize);
const Category = require('./src/models/Category')(sequelize);
const Review = require('./src/models/Review')(sequelize);
const Chat = require('./src/models/Chat')(sequelize);
const Message = require('./src/models/Message')(sequelize);
const PasswordResetToken = require('./src/models/PasswordResetToken')(sequelize);

User.hasMany(Order, { as: 'clientOrders', foreignKey: 'customerId' });
User.hasMany(Order, { as: 'masterOrders', foreignKey: 'masterId' });
Order.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
Order.belongsTo(User, { as: 'master', foreignKey: 'masterId' });

User.hasMany(Review, { as: 'reviewsGiven', foreignKey: 'clientId' });
User.hasMany(Review, { as: 'reviewsReceived', foreignKey: 'masterId' });
Review.belongsTo(User, { as: 'client', foreignKey: 'clientId' });
Review.belongsTo(User, { as: 'master', foreignKey: 'masterId' });

Chat.belongsTo(Order, { foreignKey: 'orderId' });
Chat.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
Chat.belongsTo(User, { as: 'master', foreignKey: 'masterId' });
Message.belongsTo(Chat, { foreignKey: 'chatId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

global.db = { User, Order, Category, Review, Chat, Message, PasswordResetToken, sequelize };

// Только тестовый маршрут
app.get('/api/ping', (req, res) => res.json({ pong: true }));

// Все маршруты через роутеры
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/chats', require('./src/routes/chats'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/reviews', require('./src/routes/reviews'));
app.use('/api/admin', require('./src/routes/admin'));

const PORT = process.env.PORT || 3005;
sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL connected');
    app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on port ${PORT}`));
  })
  .catch(err => console.error('❌ DB error:', err));
