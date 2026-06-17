const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.mail.ru", // <--- исправлено
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

transporter
  .sendMail({
    from: `"Test" <${process.env.SMTP_USER}>`,
    to: "birgza-uslug@mail.ru", // убрал лишний пробел
    subject: "Тест SMTP",
    text: "Если вы это видите, SMTP работает",
  })
  .then((info) => console.log("✅ Письмо отправлено:", info.response))
  .catch((err) => console.error("❌ Ошибка:", err));
