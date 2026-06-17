const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Review = sequelize.define(
    "Review",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      orderId: { type: DataTypes.INTEGER, allowNull: false },
      rating: { type: DataTypes.INTEGER, allowNull: false },
      comment: { type: DataTypes.TEXT },
      pros: { type: DataTypes.JSON, defaultValue: [] },
      cons: { type: DataTypes.JSON, defaultValue: [] },
      photos: { type: DataTypes.JSON, defaultValue: [] },
      targetRole: { type: DataTypes.ENUM("client", "master") },
      clientId: { type: DataTypes.INTEGER, allowNull: false },
      masterId: { type: DataTypes.INTEGER, allowNull: false },
      isVerified: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      timestamps: true,
      indexes: [{ fields: ["orderId"] }],
    },
  );

  return Review;
};
