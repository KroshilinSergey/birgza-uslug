const { Op } = require("sequelize");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const { User, PasswordResetToken } = global.db;
const { generateToken } = require("../middleware/auth");

let transporter;
try {
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: "smtp.mail.ru",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: { rejectUnauthorized: false },
    });
    console.log("✅ Транспорт SMTP инициализирован");
  }
} catch (err) {
  console.error("❌ Ошибка SMTP:", err.message);
}

// Регистрация
exports.register = async (req, res) => {
  try {
    const errors = require("express-validator").validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      email,
      phone,
      password,
      role,
      experience,
      city,
      specializations,
    } = req.body;

    // Проверка существующего телефона
    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Пользователь с таким телефоном уже существует",
      });
    }

    if (email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Пользователь с таким email уже существует",
        });
      }
    }

    // Хэширование пароля
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      phone,
      password: hashedPassword,
      role,
      city: city || "",
      profile: {},
    };
    if (email) userData.email = email;

    if (role === "master") {
      userData.experience = experience || 0;
      userData.specializations = Array.isArray(specializations)
        ? specializations
        : [];
    } else {
      userData.specializations = [];
      userData.experience = 0;
    }

    const user = await User.create(userData);
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("❌ Ошибка регистрации:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при регистрации",
      error: error.message,
    });
  }
};

// Логин
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Введите телефон и пароль" });
    }

    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Неверный телефон или пароль" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Неверный телефон или пароль" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user.id);
    res.json({ success: true, token, user: user.toSafeObject() });
  } catch (error) {
    console.error("❌ Ошибка входа:", error);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

// Получить текущего пользователя
exports.getMe = async (req, res) => {
  try {
    // req.user уже должен быть установлен middleware protect
    // если нет - загружаем заново
    if (!req.user || !req.user.id) {
      const user = await User.findByPk(req.user?.id || req.user?._id, {
        attributes: { exclude: ["password"] },
      });
      return res.json({ success: true, user });
    }
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.error("❌ Ошибка getMe:", error);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};
// Выход
exports.logout = (req, res) => {
  res.json({ success: true, message: "Выход выполнен" });
};

// Забыли пароль
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Введите email" });

    if (!transporter) {
      return res.status(500).json({
        success: false,
        message: "Служба отправки писем временно недоступна",
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({
        success: true,
        message: "Если пользователь существует, письмо отправлено",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000);

    await PasswordResetToken.destroy({ where: { email, used: false } });
    await PasswordResetToken.create({ email, token, expiresAt });

    const baseUrl = process.env.FRONTEND_URL || "https://xn--80aqmb3c.xn--p1ai";
    const resetLink = `${baseUrl}/reset-password.html?token=${token}`;

    await transporter.sendMail({
      from: `"Биржа услуг" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Восстановление пароля на Бирже услуг",
      html: `<h2>Здравствуйте!</h2>
             <p>Вы запросили восстановление пароля.</p>
             <p><a href="${resetLink}">${resetLink}</a></p>
             <p>Ссылка действительна 1 час.</p>`,
    });

    res.json({ success: true, message: "Письмо отправлено" });
  } catch (error) {
    console.error("❌ Ошибка forgotPassword:", error);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};

// Сброс пароля
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Некорректные данные" });
    }

    const resetRecord = await PasswordResetToken.findOne({
      where: { token, used: false, expiresAt: { [Op.gt]: new Date() } },
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Недействительная или просроченная ссылка",
      });
    }

    const user = await User.findOne({ where: { email: resetRecord.email } });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Пользователь не найден" });
    }

    // Хэшируем новый пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    res.json({ success: true, message: "Пароль успешно изменён" });
  } catch (error) {
    console.error("❌ Ошибка resetPassword:", error);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
};
