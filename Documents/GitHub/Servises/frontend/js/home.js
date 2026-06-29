// home.js - логика главной страницы (вход/регистрация)
document.addEventListener("DOMContentLoaded", function () {
  console.log("=== ЗАГРУЗКА ГЛАВНОЙ СТРАНИЦЫ ===");

  // Проверяем, может быть пользователь уже авторизован
  const token = localStorage.getItem("remont_token");
  const userJson = localStorage.getItem("remont_user");

  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      // Если пользователь уже авторизован, показываем кнопку "Мой кабинет"
      updateAuthButtons();
    } catch (e) {
      clearAuth();
    }
  } else {
    updateAuthButtons();
  }

  // Навешиваем обработчики на формы (если они есть на странице)
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister);
  }
});

async function handleLogin(e) {
  e.preventDefault();
  const identifier =
    document.getElementById("identifier")?.value ||
    document.getElementById("email")?.value;
  const password = document.getElementById("password").value;

  try {
    const result = await apiRequest(
      "POST",
      "/auth/login",
      { phone: identifier, password }, // Предполагаем, что используется телефон
      false,
    );
    setAuth(result.token, result.user);
    window.location.href =
      result.user.role === "master"
        ? "master-cabinet.html"
        : "client-cabinet.html";
  } catch (error) {
    alert("Ошибка входа: " + error.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value;
  const phone = form.phone.value;
  const password = form.password.value;
  const role = form.role.value;

  const data = { name, phone, password, role };

  // Добавляем email если есть
  if (form.email) {
    data.email = form.email.value;
  }

  try {
    const result = await apiRequest("POST", "/auth/register", data, false);
    setAuth(result.token, result.user);
    window.location.href =
      result.user.role === "master"
        ? "master-cabinet.html"
        : "client-cabinet.html";
  } catch (error) {
    alert("Ошибка регистрации: " + error.message);
  }
}

function updateAuthButtons() {
  const authButtons = document.getElementById("authButtons");
  if (!authButtons) return;

  const token = localStorage.getItem("remont_token");
  const userJson = localStorage.getItem("remont_user");

  if (token && userJson) {
    try {
      const user = JSON.parse(userJson);
      authButtons.innerHTML = `
        <a href="${user.role === "master" ? "master-cabinet.html" : "client-cabinet.html"}" class="btn-cabinet">
          <i class="fas fa-user-circle"></i> Мой кабинет
        </a>
      `;
    } catch (e) {
      showRegistrationButton();
    }
  } else {
    showRegistrationButton();
  }
}

function showRegistrationButton() {
  const authButtons = document.getElementById("authButtons");
  if (authButtons) {
    authButtons.innerHTML = `
      <a href="login.html" class="btn-login"><i class="fas fa-sign-in-alt"></i> Войти</a>
      <a href="register.html" class="btn-register"><i class="fas fa-pen-fancy"></i> Регистрация</a>
    `;
  }
}

// Функция очистки авторизации (должна быть глобальной)
window.clearAuth = function () {
  localStorage.removeItem("remont_token");
  localStorage.removeItem("remont_user");
  localStorage.removeItem("remont_user_city");
  localStorage.removeItem("remont_city");
  localStorage.removeItem("remont_city_pure");
};

document.addEventListener("DOMContentLoaded", function () {
  const contactsBtn = document.getElementById("contactsButton");
  const contactsPopup = document.getElementById("contactsPopup");

  if (contactsBtn && contactsPopup) {
    // Открыть/закрыть по клику на кнопку
    contactsBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      contactsPopup.classList.toggle("active");
    });

    // Закрыть при клике вне попапа
    document.addEventListener("click", function (e) {
      if (
        !contactsBtn.contains(e.target) &&
        !contactsPopup.contains(e.target)
      ) {
        contactsPopup.classList.remove("active");
      }
    });

    // Предотвратить закрытие при клике внутри попапа
    contactsPopup.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
});
