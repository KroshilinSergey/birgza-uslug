const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Message = sequelize.define(
    "Message",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      chatId: { type: DataTypes.INTEGER, allowNull: false },
      senderId: { type: DataTypes.INTEGER, allowNull: false },
      text: { type: DataTypes.TEXT, allowNull: false },
      read: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      timestamps: true,
    },
  );

  return Message;
};
