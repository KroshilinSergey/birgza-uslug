const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Chat = sequelize.define(
    "Chat",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: DataTypes.INTEGER, allowNull: false },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      masterId: { type: DataTypes.INTEGER, allowNull: true },
      orderTitle: { type: DataTypes.STRING },
      lastMessage: { type: DataTypes.TEXT },
      lastMessageAt: { type: DataTypes.DATE },
    },
    {
      timestamps: true,
    },
  );

  return Chat;
};
