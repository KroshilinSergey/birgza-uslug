// master-cabinet-integrated.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
document.addEventListener("DOMContentLoaded", async function () {
  console.log("=== ЗАГРУЗКА КАБИНЕТА МАСТЕРА ===");

  window._currentCompletingOrderId = null;

  try {
    const result = await apiRequest("GET", "/auth/me");
    const user = result.user;
    if (!user.id && user._id) {
      user.id = user._id;
    }
    if (!user._id && user.id) {
      user._id = user.id;
    }
    console.log("🔑 user.id:", user.id, "user._id:", user._id);

    // Sequelize использует id, а не _id
    const userId = user.id || user._id;
    console.log("🔑 ID пользователя:", userId);

    if (user.role !== "master" && user.role !== "admin") {
      window.location.href =
        user.role === "client" ? "client-cabinet.html" : "index.html";
      return;
    }

    console.log("✅ Мастер авторизован:", user.name);
    localStorage.setItem("remont_user", JSON.stringify(user));

    // Загружаем категории
    if (!window.Categories || window.Categories.length === 0) {
      try {
        const catResult = await apiRequest("GET", "/categories", null, false);
        window.Categories = catResult.data.map((c) => ({
          value: String(c.id || c._id),
          label: c.name,
          icon: c.icon || "fa-wrench",
        }));
        console.log("✅ Категории загружены:", window.Categories.length);
      } catch (e) {
        console.warn("Не удалось загрузить категории", e);
        window.Categories = [];
      }
    }

    if (window.MasterProfileNew) {
      window.MasterProfileNew.init(user);
    }

    await fillUserData(user);
    await loadMasterReviews(userId);

    if (window.MasterOrders) {
      window.masterOrdersInstance = new MasterOrders();
      await window.masterOrdersInstance.init(userId);
      window.masterOrdersInstance.setupOrderDetailsModal();
    }

    if (window.chatUI && !window.chatUI.initialized) {
      window.chatUI.init(userId, user.name, "master");
    }

    updateUnreadBadge();
    setupTabsSimple();
    updateCityDisplay();
    setupSimpleHandlers();

    console.log("=== КАБИНЕТ МАСТЕРА ЗАГРУЖЕН ===");
  } catch (error) {
    console.error("❌ Ошибка авторизации:", error);
    clearAuth();
    window.location.href = "login.html";
  }
});

async function fillUserData(user) {
  console.log("📝 Заполнение данных пользователя:", user.name);
  console.log("📝 Специализации:", user.specializations);

  const nameEl = document.getElementById("userName");
  const welcomeEl = document.getElementById("welcomeName");
  if (nameEl) nameEl.textContent = user.name || "Мастер";
  if (welcomeEl) welcomeEl.textContent = user.name || "Мастер";

  const avatarEl = document.getElementById("userAvatar");
  if (avatarEl) {
    if (user.profile?.photo) {
      avatarEl.innerHTML = "";
      avatarEl.style.backgroundImage = `url('${user.profile.photo}')`;
      avatarEl.style.backgroundSize = "cover";
      avatarEl.style.backgroundPosition = "center";
    } else {
      avatarEl.style.backgroundImage = "";
      avatarEl.style.background =
        "linear-gradient(135deg, #4299e1 0%, #3182ce 100%)";
      avatarEl.textContent = (user.name || "М").charAt(0).toUpperCase();
    }
  }

  const ratingVal = document.getElementById("sidebarRatingValue");
  const ratingStars = document.getElementById("sidebarRatingStars");
  const ratingCount = document.getElementById("sidebarRatingCount");

  if (ratingVal) ratingVal.textContent = (user.rating || 0).toFixed(1);
  if (ratingStars)
    ratingStars.textContent = starsFromRating(parseFloat(user.rating) || 0);
  if (ratingCount)
    ratingCount.textContent = `${user.reviewsCount || 0} ${getReviewWord(user.reviewsCount || 0)}`;

  const specsGrid = document.getElementById("rightSpecializationsGrid");
  if (specsGrid) {
    specsGrid.innerHTML = "";
    const specs = user.specializations || [];
    if (specs.length === 0) {
      specsGrid.innerHTML = '<p class="no-specs">Специализации не выбраны</p>';
    } else {
      await loadSpecializationsAndRender(specs, specsGrid);
    }
  }
}

async function loadMasterReviews(masterId) {
  try {
    console.log("📥 Загрузка отзывов о мастере ID:", masterId);
    if (!masterId) {
      console.error("❌ masterId не передан");
      return [];
    }
    const result = await apiRequest("GET", `/reviews/master/${masterId}`);
    const reviews = result.data || [];
    console.log("✅ Загружены отзывы:", reviews.length);

    window._masterReviews = reviews;

    let totalRating = 0;
    reviews.forEach((r) => (totalRating += r.rating));
    const avgRating =
      reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

    const ratingValue = document.getElementById("sidebarRatingValue");
    const ratingStars = document.getElementById("sidebarRatingStars");
    const ratingCount = document.getElementById("sidebarRatingCount");

    if (ratingValue) ratingValue.textContent = avgRating;
    if (ratingStars)
      ratingStars.textContent = starsFromRating(parseFloat(avgRating) || 0);
    if (ratingCount)
      ratingCount.textContent = `${reviews.length} ${getReviewWord(reviews.length)}`;

    return reviews;
  } catch (error) {
    console.error("❌ Ошибка загрузки отзывов:", error);
    return [];
  }
}

function updateMasterReviewsModal(reviews) {
  console.log("📊 Обновление модального окна, отзывов:", reviews.length);

  const modalRatingValue = document.getElementById("modalRatingValue");
  const modalRatingStars = document.getElementById("modalRatingStars");
  const modalRatingCount = document.getElementById("modalRatingCount");
  const modalReviewsCount = document.getElementById("modalReviewsCount");
  const reviewsList = document.getElementById("modalReviewsList");

  if (!reviewsList) {
    console.error("❌ modalReviewsList не найден");
    return;
  }

  let totalRating = 0;
  reviews.forEach((r) => (totalRating += r.rating));
  const avgRating =
    reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

  if (modalRatingValue) modalRatingValue.textContent = avgRating;
  if (modalRatingStars)
    modalRatingStars.textContent = starsFromRating(parseFloat(avgRating) || 0);
  if (modalRatingCount)
    modalRatingCount.textContent = `на основании ${reviews.length} ${getReviewWord(reviews.length)}`;
  if (modalReviewsCount) modalReviewsCount.textContent = reviews.length;

  if (reviews.length === 0) {
    reviewsList.innerHTML = '<p class="no-reviews">У вас пока нет отзывов.</p>';
    return;
  }

  let html = "";
  reviews.forEach((review) => {
    const stars = starsFromRating(review.rating);
    const date = new Date(review.createdAt).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const clientName = review.client?.name || "Клиент";
    html += `
      <div class="review-item">
        <div class="review-header">
          <span class="review-author">${escapeHtml(clientName)}</span>
          <span class="review-date">${date}</span>
        </div>
        <div class="review-rating">${stars}</div>
        <div class="review-comment">${escapeHtml(review.comment || "")}</div>
      </div>
    `;
  });
  reviewsList.innerHTML = html;
}

// ========== ПРОСТЫЕ ОБРАБОТЧИКИ ==========
function setupSimpleHandlers() {
  console.log("🔧 Настройка простых обработчиков");

  // 1. Отзывы
  const reviewsLink = document.getElementById("openReviewsModalBtn");
  if (reviewsLink) {
    const newReviewsLink = reviewsLink.cloneNode(true);
    reviewsLink.parentNode.replaceChild(newReviewsLink, reviewsLink);

    newReviewsLink.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("📊 Клик по ссылке отзывы");

      const modal = document.getElementById("ratingModal");
      if (modal) {
        if (window._masterReviews) {
          updateMasterReviewsModal(window._masterReviews);
        } else {
          const user = JSON.parse(localStorage.getItem("remont_user") || "{}");
          const userId = user.id || user._id;
          loadMasterReviews(userId).then((reviews) => {
            updateMasterReviewsModal(reviews);
          });
        }
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
      } else {
        console.error("❌ Модальное окно не найдено");
        alert("Ошибка: модальное окно не найдено");
      }
    });
    console.log("✅ Обработчик на ссылку отзывы");
  }

  // 2. Закрытие модального окна отзывов
  const closeModalBtn = document.querySelector("#ratingModal .close-modal");
  if (closeModalBtn) {
    const newCloseBtn = closeModalBtn.cloneNode(true);
    closeModalBtn.parentNode.replaceChild(newCloseBtn, closeModalBtn);

    newCloseBtn.addEventListener("click", function () {
      const modal = document.getElementById("ratingModal");
      if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    });
    console.log("✅ Обработчик на закрытие отзывов");
  }

  // 3. Анкета
  const profileBtn = document.getElementById("openProfileModalBtn");
  if (profileBtn) {
    const newProfileBtn = profileBtn.cloneNode(true);
    profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);

    newProfileBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("📋 Клик по кнопке анкеты");
      if (window.MasterProfileNew) {
        window.MasterProfileNew.openModal();
      } else {
        alert("Ошибка: система анкеты не инициализирована");
      }
    });
    console.log("✅ Обработчик на анкету");
  }

  // 4. Выход
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);

    newLogoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("🚪 Выход из кабинета");
      if (confirm("Вы уверены, что хотите выйти?")) {
        clearAuth();
        window.location.href = "index.html";
      }
    });
    console.log("✅ Обработчик на выход");
  }
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
async function loadSpecializationsAndRender(specIds, container) {
  console.log("📋 Загрузка специализаций для отображения:", specIds);

  if (!window.Categories || window.Categories.length === 0) {
    try {
      const catResult = await apiRequest("GET", "/categories", null, false);
      window.Categories = catResult.data.map((c) => ({
        value: String(c.id || c._id),
        label: c.name,
        icon: c.icon || "fa-wrench",
      }));
      console.log("✅ Категории загружены:", window.Categories.length);
    } catch (error) {
      console.error("❌ Ошибка загрузки категорий:", error);
      container.innerHTML = '<p class="error">Ошибка загрузки категорий</p>';
      return;
    }
  }

  container.innerHTML = "";

  if (!specIds || specIds.length === 0) {
    container.innerHTML = '<p class="no-specs">Специализации не выбраны</p>';
    return;
  }

  const catMap = {};
  window.Categories.forEach((cat) => {
    catMap[String(cat.value)] = cat;
  });

  specIds.forEach((id) => {
    const stringId = String(id);
    const cat = catMap[stringId];

    if (cat) {
      const div = document.createElement("div");
      div.className = "specialization-card";
      div.innerHTML = `<i class="fas ${cat.icon || "fa-check-circle"}"></i><span>${escapeHtml(cat.label)}</span>`;
      container.appendChild(div);
    } else {
      const div = document.createElement("div");
      div.className = "specialization-card error";
      div.innerHTML = `<i class="fas fa-question-circle"></i><span>${escapeHtml(stringId)}</span>`;
      container.appendChild(div);
    }
  });
}

function starsFromRating(rating) {
  const full = Math.floor(rating);
  let stars = "";
  for (let i = 0; i < 5; i++) stars += i < full ? "★" : "☆";
  return stars;
}

function setupTabsSimple() {
  document.querySelectorAll(".menu-item[data-tab]").forEach((item) => {
    const newItem = item.cloneNode(true);
    item.parentNode.replaceChild(newItem, item);

    newItem.addEventListener("click", function (e) {
      e.preventDefault();
      const tab = this.dataset.tab;

      document
        .querySelectorAll(".menu-item")
        .forEach((m) => m.classList.remove("active"));
      this.classList.add("active");

      document
        .querySelectorAll(".tab-content")
        .forEach((t) => t.classList.remove("active"));

      let targetId = "availableOrdersTab";
      if (tab === "my-orders") targetId = "myOrdersTab";
      if (tab === "messages") targetId = "messagesTab";

      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add("active");

      if (tab === "available-orders" && window.masterOrdersInstance) {
        window.masterOrdersInstance.loadAvailableOrders();
      }
      if (tab === "my-orders" && window.masterOrdersInstance) {
        const activeBtn = document.querySelector(
          '.status-btn[data-status="active"]',
        );
        if (activeBtn) {
          document
            .querySelectorAll(".status-btn")
            .forEach((b) => b.classList.remove("active"));
          activeBtn.classList.add("active");
        }
        window.masterOrdersInstance.loadMyOrders("active");
      }
      if (tab === "messages" && window.chatUI) {
        window.chatUI.renderMessagesTab();
      }
    });
  });

  document.querySelectorAll(".status-btn[data-status]").forEach((btn) => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", function (e) {
      e.preventDefault();
      document
        .querySelectorAll(".status-btn")
        .forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      window.masterOrdersInstance?.loadMyOrders(this.dataset.status);
    });
  });
}

function updateCityDisplay() {
  const cityElement = document.getElementById("currentCity");
  if (!cityElement) return;

  if (window.CityManager) {
    const city = window.CityManager.getCity();
    cityElement.textContent =
      city.data?.name || city.name?.split(",")[0].trim() || "Город не выбран";
  } else {
    const userJson = localStorage.getItem("remont_user");
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        cityElement.textContent = user.city || "Город не выбран";
      } catch {
        cityElement.textContent =
          localStorage.getItem("remont_city")?.split(",")[0].trim() ||
          "Город не выбран";
      }
    }
  }
}

function getReviewWord(count) {
  if (!count) return "отзывов";
  count = parseInt(count);
  if (count % 10 === 1 && count % 100 !== 11) return "отзыв";
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100))
    return "отзыва";
  return "отзывов";
}

async function updateUnreadBadge() {
  const badge = document.getElementById("unreadMessagesBadge");
  if (!badge) return;
  try {
    const unreadCount = await window.ChatSystem.getUnreadCount();
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? "99+" : unreadCount;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  } catch (e) {
    console.error("Ошибка получения непрочитанных:", e);
  }
}

window.addEventListener("chat:unreadCountUpdate", updateUnreadBadge);

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
