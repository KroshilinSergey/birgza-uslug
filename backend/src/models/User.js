// src/models/User.js
const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, unique: true },
      phone: { type: DataTypes.STRING, unique: true, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM("client", "master", "admin"),
        allowNull: false,
        defaultValue: "client",
      },
      city: { type: DataTypes.STRING, defaultValue: "" },
      experience: { type: DataTypes.INTEGER, defaultValue: 0 },
      specializations: { type: DataTypes.JSON, defaultValue: [] },
      profile: { type: DataTypes.JSON, defaultValue: {} },
      rating: { type: DataTypes.FLOAT, defaultValue: 0 },
      reviewsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      lastLogin: { type: DataTypes.DATE },
      isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false }, // ← Добавлено поле блокировки
    },
    {
      timestamps: true,
      indexes: [{ fields: ["phone"] }, { fields: ["email"] }],
    },
  );

  User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toSafeObject = function () {
    const obj = this.toJSON();
    delete obj.password;
    return obj;
  };

  return User;
};
