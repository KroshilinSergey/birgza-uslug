// utils.js - общие вспомогательные функции

// Форматирование даты
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Валидация email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Валидация телефона
function validatePhone(phone) {
  const re = /^\+7\s?\(?\d{3}\)?\s?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
  return re.test(phone);
}

// Получение инициалов
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

// Склонение слова "отзыв"
function getReviewWord(count) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "отзыв";
  } else if (
    count % 10 >= 2 &&
    count % 10 <= 4 &&
    (count % 100 < 10 || count % 100 >= 20)
  ) {
    return "отзыва";
  } else {
    return "отзывов";
  }
}

// Генерация звезд для рейтинга
function getStarsHTML(rating) {
  let starsHTML = "";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHTML += "⭐";
    } else if (i === fullStars && hasHalfStar) {
      starsHTML += "½⭐";
    } else {
      starsHTML += "☆";
    }
  }

  return starsHTML;
}

// Сохранение в localStorage с обработкой ошибок
function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Ошибка сохранения в localStorage (${key}):`, error);
    return false;
  }
}

// Чтение из localStorage с обработкой ошибок
function safeLocalStorageGet(key, defaultValue = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.error(`Ошибка чтения из localStorage (${key}):`, error);
    return defaultValue;
  }
}

// Проверка авторизации
function checkAuth(requiredRole = null) {
  const userJson = localStorage.getItem("remont_user");
  const token = localStorage.getItem("remont_token");

  if (!userJson || !token) {
    return { isAuth: false, user: null };
  }

  try {
    const user = JSON.parse(userJson);

    if (requiredRole && user.role !== requiredRole) {
      return { isAuth: false, user: null };
    }

    return { isAuth: true, user };
  } catch (e) {
    return { isAuth: false, user: null };
  }
}

// Функция для создания тестовых сообщений
function createTestChats() {
  if (!localStorage.getItem("remont_chats")) {
    const testChats = [
      {
        id: "chat_1",
        orderId: 1,
        customerId: "client_1",
        masterId: "master_1",
        orderTitle: "Установка смесителя на кухне",
        messages: [
          {
            id: "msg_1",
            senderId: "client_1",
            senderName: "Иванов Иван",
            senderRole: "client",
            text: "Здравствуйте! Когда сможете приехать посмотреть кран?",
            timestamp: "2024-01-15T10:35:00Z",
            read: true,
          },
          {
            id: "msg_2",
            senderId: "master_1",
            senderName: "Петров Петр",
            senderRole: "master",
            text: "Добрый день! Могу подъехать сегодня после 18:00",
            timestamp: "2024-01-15T11:20:00Z",
            read: true,
          },
        ],
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T11:20:00Z",
        unreadCount: {
          client_1: 0,
          master_1: 0,
        },
      },
    ];

    localStorage.setItem("remont_chats", JSON.stringify(testChats));
  }
}

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Единый объект utils, экспортирующий все функции
window.utils = {
  formatDate,
  validateEmail,
  validatePhone,
  getInitials,
  getReviewWord,
  getStarsHTML,
  safeLocalStorageSet,
  safeLocalStorageGet,
  checkAuth,
  createTestChats, // ✅ теперь createTestChats включена сюда
};

function getYearWord(years) {
  if (!years) return "лет";
  const lastDigit = years % 10;
  const lastTwoDigits = years % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return "лет";
  if (lastDigit === 1) return "год";
  if (lastDigit >= 2 && lastDigit <= 4) return "года";
  return "лет";
}
