const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Order = sequelize.define(
    "Order",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: false },
      category: { type: DataTypes.STRING },
      categoryName: { type: DataTypes.STRING },
      status: {
        type: DataTypes.ENUM(
          "new",
          "in_progress",
          "awaiting_confirmation",
          "completed",
          "cancelled",
        ),
        defaultValue: "new",
      },
      customerId: { type: DataTypes.INTEGER, allowNull: false },
      masterId: { type: DataTypes.INTEGER, allowNull: true },
      customerName: { type: DataTypes.STRING },
      customerPhone: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING, defaultValue: "" },
      phoneVisible: { type: DataTypes.BOOLEAN, defaultValue: true },
      takenAt: { type: DataTypes.DATE },
      completedAt: { type: DataTypes.DATE },
      masterCompletedAt: { type: DataTypes.DATE },
      budget: { type: DataTypes.DECIMAL(10, 2) },
      cityData: { type: DataTypes.JSON },
      isTemporary: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      timestamps: true,
    },
  );

  return Order;
};
