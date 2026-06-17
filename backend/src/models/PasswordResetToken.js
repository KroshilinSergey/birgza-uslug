const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PasswordResetToken = sequelize.define(
    "PasswordResetToken",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false },
      token: { type: DataTypes.STRING, allowNull: false },
      used: { type: DataTypes.BOOLEAN, defaultValue: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      timestamps: true,
    },
  );

  return PasswordResetToken;
};
