// master-orders.js - ИСПРАВЛЕННАЯ ВЕРСИЯ С ОТЛАДКОЙ
class MasterOrders {
  constructor() {
    this.currentMaster = null;
  }

  async init(masterId) {
    console.log(
      "📦 Инициализация заказов, masterId:",
      masterId,
      "тип:",
      typeof masterId,
    );

    if (!masterId) {
      console.error("❌ masterId не передан!");
      return;
    }

    try {
      const url = `/users/${masterId}`;
      console.log("📡 Запрос к API:", url);

      const userResult = await apiRequest("GET", url);
      console.log("✅ Ответ API /users/:", userResult);

      this.currentMaster = userResult.user;
      console.log("👤 Текущий мастер:", this.currentMaster);

      this.loadAvailableOrders();
      this.loadMyOrders("active");
      this.updateMasterStats();
    } catch (error) {
      console.error("❌ Ошибка инициализации заказов мастера:", error);
      console.error("❌ Детали ошибки:", error.message);
    }
  }

  setupOrderDetailsModal() {
    const closeBtn = document.getElementById("closeOrderDetailsModalBtn");
    const modal = document.getElementById("orderDetailsModal");

    if (closeBtn) {
      closeBtn.addEventListener("click", () =>
        MasterOrders.hideOrderDetailsModal(),
      );
    }

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) MasterOrders.hideOrderDetailsModal();
      });
    }
  }

  async loadAvailableOrders(containerId = "availableOrdersList") {
    if (!this.currentMaster) {
      console.error("❌ Мастер не загружен");
      return;
    }
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      const params = new URLSearchParams();
      const cityForSearch = this.currentMaster.city
        ? this.currentMaster.city.split(",")[0].trim()
        : "";
      if (cityForSearch) {
        params.append("city", cityForSearch);
      }
      const specs = this.currentMaster.specializations || [];
      specs.forEach((s) => params.append("spec", s));

      console.log(
        "🔍 Запрос доступных заказов с параметрами:",
        params.toString(),
      );
      const result = await apiRequest("GET", `/orders/available?${params}`);
      const orders = result.data || [];
      console.log("📊 Найдено заказов:", orders.length);

      container.innerHTML = "";
      if (orders.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-briefcase fa-3x"></i>
            <h3>Нет доступных заказов</h3>
            <p>В городе ${cityForSearch || "не указан"} по вашим специализациям пока нет заказов</p>
          </div>
        `;
        return;
      }

      orders.forEach((order) => {
        const card = this._createOrderCard(order);
        container.appendChild(card);
      });
    } catch (error) {
      console.error("❌ Ошибка загрузки доступных заказов:", error);
      container.innerHTML = `<div class="error">Ошибка загрузки заказов</div>`;
    }
  }

  async loadMyOrders(status = "active", containerId = "masterOrdersList") {
    MasterOrders.setActiveFilter(status);

    if (!this.currentMaster) {
      console.error("❌ Мастер не загружен");
      return;
    }
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
      console.log("📋 Загрузка моих заказов, статус:", status);
      const result = await apiRequest("GET", `/orders/my`);
      let orders = result.data || [];
      console.log("📊 Всего заказов получено:", orders.length);

      if (status === "active") {
        orders = orders.filter((o) => o.status === "in_progress");
      } else if (status === "completed") {
        orders = orders.filter((o) => o.status === "completed");
      } else if (status === "cancelled") {
        orders = orders.filter((o) => o.status === "cancelled");
      }

      console.log(`📊 Заказов после фильтра (${status}):`, orders.length);

      container.innerHTML = "";
      if (orders.length === 0) {
        container.innerHTML = `<div class="empty-state">Нет заказов в статусе "${status}"</div>`;
        return;
      }

      orders.forEach((order) => {
        const card = this._createMyOrderCard(order);
        container.appendChild(card);
      });
    } catch (error) {
      console.error("❌ Ошибка загрузки моих заказов:", error);
      container.innerHTML = `<div class="error">Ошибка загрузки заказов</div>`;
    }
  }

  async updateMasterStats() {
    try {
      const result = await apiRequest("GET", `/orders/stats/master`);
      const stats = result.data || { active: 0, completed: 0, awaiting: 0 };
      const activeEl = document.getElementById("activeOrders");
      const completedEl = document.getElementById("completedOrders");
      const awaitingEl = document.getElementById("awaitingOrders");

      if (activeEl) activeEl.textContent = stats.active || 0;
      if (completedEl) completedEl.textContent = stats.completed || 0;
      if (awaitingEl) awaitingEl.textContent = stats.awaiting || 0;

      console.log("📊 Статистика мастера:", stats);
    } catch (error) {
      console.error("❌ Ошибка загрузки статистики:", error);
    }
  }

  static async openChatForOrder(orderId) {
    if (!window.chatUI) {
      alert("Чат не инициализирован");
      return;
    }
    MasterOrders.hideOrderDetailsModal();
    try {
      await window.chatUI.openOrderChat(orderId);
    } catch (error) {
      console.error("❌ Ошибка открытия чата:", error);
      alert("Не удалось открыть чат. Пожалуйста, попробуйте позже.");
    }
  }

  static async showOrderDetails(orderId) {
    try {
      const result = await apiRequest("GET", `/orders/${orderId}`);
      const order = result.data;

      const createdDate = new Date(order.createdAt).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const phoneDisplay = order.phoneVisible
        ? `<div class="detail-item"><i class="fas fa-phone"></i><span><strong>Телефон:</strong> ${escapeHtml(order.customerPhone)}</span></div>`
        : "";

      const modalContent = document.getElementById("orderDetailsContent");
      if (!modalContent) return;

      let statusText = "";
      if (order.status === "awaiting_confirmation") {
        statusText = "Ожидает подтверждения клиента";
      } else if (order.status === "in_progress") {
        statusText = "В работе";
      } else if (order.status === "new") {
        statusText = "Новый";
      }

      modalContent.innerHTML = `
        <div class="order-details-container">
          <div class="order-details-header">
            <h3>${escapeHtml(order.title)}</h3>
            <span class="order-price-badge">${order.budget ? order.budget + " ₽" : "Договорная"}</span>
          </div>
          <div class="order-status-indicator">
            <i class="fas fa-clock"></i>
            <span>${statusText}</span>
          </div>
          <div class="order-details-section">
            <div class="detail-item"><i class="fas fa-tag"></i><span><strong>Раздел:</strong> ${escapeHtml(MasterOrders._getCategoryName(order))}</span></div>
            <div class="detail-item"><i class="fas fa-map-marker-alt"></i><span><strong>Локация:</strong> ${escapeHtml(order.address || "Адрес не указан")}</span></div>
            <div class="detail-item"><i class="fas fa-calendar-alt"></i><span><strong>Опубликован:</strong> ${createdDate}</span></div>
            <div class="detail-item"><i class="fas fa-user"></i><span><strong>Заказчик:</strong> ${escapeHtml(order.customerName)}</span></div>
            ${phoneDisplay}
          </div>
          <div class="order-description-section">
            <h4><i class="fas fa-align-left"></i> Подробное описание:</h4>
            <div class="description-content">${escapeHtml(order.description) || "Описание не указано"}</div>
          </div>
          <div class="order-details-actions">
            <button class="btn-close" onclick="MasterOrders.hideOrderDetailsModal()">Закрыть</button>
            <button class="btn-write-customer" onclick="MasterOrders.openChatForOrder('${order._id}')">Написать заказчику</button>
          </div>
        </div>
      `;

      const modal = document.getElementById("orderDetailsModal");
      if (modal) {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
      }
    } catch (error) {
      console.error("❌ Ошибка загрузки деталей заказа:", error);
      alert("Не удалось загрузить детали заказа");
    }
  }

  static hideOrderDetailsModal() {
    const modal = document.getElementById("orderDetailsModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
    }
  }

  // ========== МЕТОДЫ ДЛЯ ЗАВЕРШЕНИЯ ЗАКАЗА ==========
  static openCompleteOrderModal(orderId) {
    window._currentCompletingOrderId = orderId;
    const modal = document.getElementById("completeOrderModal");
    if (modal) {
      modal.style.display = "block";
      document.body.style.overflow = "hidden";
      document.getElementById("completeOrderInitial").style.display = "block";
      document.getElementById("completeOrderReviewForm").style.display = "none";
    }
  }

  static showReviewForm() {
    document.getElementById("completeOrderInitial").style.display = "none";
    document.getElementById("completeOrderReviewForm").style.display = "block";

    const submitBtn = document.querySelector(
      "#completeOrderReviewForm .btn-primary",
    );
    const radios = document.querySelectorAll('input[name="reviewRating"]');

    if (!submitBtn) return;

    submitBtn.disabled = true;

    const enableSubmit = () => {
      submitBtn.disabled = false;
    };

    radios.forEach((radio) => {
      radio.removeEventListener("change", enableSubmit);
      radio.addEventListener("change", enableSubmit);
    });

    if (document.querySelector('input[name="reviewRating"]:checked')) {
      submitBtn.disabled = false;
    }
  }

  static hideCompleteOrderModal() {
    const modal = document.getElementById("completeOrderModal");
    if (modal) {
      modal.style.display = "none";
      document.body.style.overflow = "auto";
      window._currentCompletingOrderId = null;

      const radios = document.querySelectorAll('input[name="reviewRating"]');
      radios.forEach((r) => (r.checked = false));
      const comment = document.getElementById("reviewComment");
      if (comment) comment.value = "";
      const submitBtn = document.querySelector(
        "#completeOrderReviewForm .btn-primary",
      );
      if (submitBtn) submitBtn.disabled = true;
    }
  }

  static getCurrentOrderFilter() {
    const activeBtn = document.querySelector(".status-btn.active");
    return activeBtn ? activeBtn.dataset.status : "active";
  }

  static setActiveFilter(status) {
    const btn = document.querySelector(`.status-btn[data-status="${status}"]`);
    if (btn) {
      document
        .querySelectorAll(".status-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    }
  }

  static async _completeOrderApi(orderId) {
    try {
      console.log("📤 Отправка запроса на завершение заказа:", orderId);
      const result = await apiRequest("POST", `/orders/${orderId}/complete`);
      console.log("✅ Заказ успешно завершён:", result);
      return result;
    } catch (error) {
      console.error("❌ Ошибка при завершении заказа:", error);
      throw error;
    }
  }

  static async _sendReviewApi(orderId, rating, comment) {
    try {
      console.log("📤 Отправка отзыва на клиента:", {
        orderId,
        rating,
        comment,
      });

      const result = await apiRequest("POST", "/reviews", {
        orderId,
        rating,
        comment,
        photos: [],
      });

      console.log("✅ Отзыв успешно отправлен:", result);
      return result;
    } catch (error) {
      console.error("❌ Ошибка при отправке отзыва:", error);
      throw error;
    }
  }

  static async completeOrderOnly() {
    const orderId = window._currentCompletingOrderId;
    if (!orderId) return;

    try {
      const btn = event?.target;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Завершение...";
      }

      await this._completeOrderApi(orderId);
      this.hideCompleteOrderModal();
      alert("✅ Заказ отправлен на подтверждение клиенту!");

      if (window.masterOrdersInstance) {
        await window.masterOrdersInstance.loadMyOrders("active");
        await window.masterOrdersInstance.loadMyOrders("completed");
        await window.masterOrdersInstance.updateMasterStats();
      }
    } catch (error) {
      console.error("❌ Ошибка при завершении заказа:", error);
      alert(
        "❌ Не удалось завершить заказ. " +
          (error.message || "Попробуйте ещё раз."),
      );
    } finally {
      const btn = event?.target;
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Нет, просто завершить";
      }
    }
  }

  static async completeOrderFromCard(orderId) {
    window._currentCompletingOrderId = orderId;

    try {
      await this._completeOrderApi(orderId);
      alert("✅ Заказ отправлен на подтверждение клиенту!");

      if (window.masterOrdersInstance) {
        await window.masterOrdersInstance.updateMasterStats();

        const currentFilter = MasterOrders.getCurrentOrderFilter();
        await window.masterOrdersInstance.loadMyOrders(currentFilter);
      }

      setTimeout(() => {
        if (confirm("Желаете оставить отзыв о заказчике?")) {
          MasterOrders.openCompleteOrderModal(orderId);
          MasterOrders.showReviewForm();
        }
      }, 500);
    } catch (error) {
      console.error("❌ Ошибка при завершении заказа:", error);
      alert(
        "❌ Не удалось завершить заказ. " +
          (error.message || "Попробуйте ещё раз."),
      );
    }
  }

  static async submitReview() {
    const orderId = window._currentCompletingOrderId;
    if (!orderId) return;

    const ratingInput = document.querySelector(
      'input[name="reviewRating"]:checked',
    );
    if (!ratingInput) {
      alert("Пожалуйста, поставьте оценку");
      return;
    }

    const rating = parseInt(ratingInput.value);
    const comment = document.getElementById("reviewComment").value.trim();

    const submitBtn = document.querySelector(
      "#completeOrderReviewForm .btn-primary",
    );
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Отправка...";
    }

    try {
      await this._sendReviewApi(orderId, rating, comment);
      this.hideCompleteOrderModal();
      alert("✅ Отзыв о клиенте успешно отправлен!");

      if (window.masterOrdersInstance) {
        const currentFilter = MasterOrders.getCurrentOrderFilter();
        await window.masterOrdersInstance.loadMyOrders(currentFilter);
        await window.masterOrdersInstance.updateMasterStats();
      }
    } catch (error) {
      console.error("❌ Ошибка при отправке отзыва:", error);
      if (error.message && error.message.includes("уже существует")) {
        alert("Отзыв по этому заказу уже был оставлен ранее.");
        this.hideCompleteOrderModal();
      } else {
        alert("❌ Не удалось отправить отзыв. Попробуйте ещё раз.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Отправить отзыв";
        }
      }
    }
  }

  static async completeOrderWithoutReview() {
    return this.completeOrderOnly();
  }

  static async submitReviewAndComplete() {
    return this.submitReview();
  }

  static _getCategoryName(order) {
    if (order.categoryName) return order.categoryName;
    if (window.Categories) {
      const cat = window.Categories.find((c) => c.value === order.category);
      if (cat) return cat.label;
    }
    return order.category;
  }

  _createOrderCard(order) {
    const card = document.createElement("div");
    card.className = "order-card-simple";
    card.dataset.id = order.id || order._id;
    card.innerHTML = `
      <div class="order-simple-header">
        <div class="order-category-badge"><i class="fas fa-tag"></i><span>${escapeHtml(MasterOrders._getCategoryName(order))}</span></div>
        <div class="order-price-tag">${order.budget ? order.budget + " ₽" : "Договорная"}</div>
      </div>
      <div class="order-simple-body">
        <h3 class="order-title-simple">${escapeHtml(order.title)}</h3>
        <div class="order-location"><i class="fas fa-map-marker-alt"></i><span>${escapeHtml(order.address || "Адрес не указан")}</span></div>
        <div class="order-date-simple"><i class="fas fa-clock"></i><span>${new Date(order.createdAt).toLocaleDateString()}</span></div>
      </div>
      <div class="order-simple-actions">
        <button class="btn-details-simple" onclick="MasterOrders.showOrderDetails('${order.id || order._id}')">
          <i class="fas fa-info-circle"></i> Детали заказа
        </button>
        <button class="btn-chat-order" onclick="MasterOrders.openChatForOrder('${order.id || order._id}')">
          <i class="fas fa-comment"></i> Написать заказчику
        </button>
      </div>
    `;
    return card;
  }

  _createMyOrderCard(order) {
    const card = document.createElement("div");
    card.className = "order-card master-order";
    card.dataset.id = order.id || order._id;

    let statusClass = "",
      statusText = "",
      actionButton = "";

    switch (order.status) {
      case "in_progress":
        statusClass = "status-in-progress";
        statusText = "В работе";
        actionButton = `<button class="btn-complete" onclick="MasterOrders.completeOrderFromCard('${order.id || order._id}')">Завершить</button>`;
        break;
      case "awaiting_confirmation":
        statusClass = "status-awaiting";
        statusText = "Ожидает подтверждения";
        actionButton = `<span class="awaiting-badge"><i class="fas fa-clock"></i> Ждём подтверждения</span>`;
        break;
      case "completed":
        statusClass = "status-completed";
        statusText = "Выполнен";
        break;
      case "cancelled":
        statusClass = "status-cancelled";
        statusText = "Отменен";
        break;
      default:
        statusClass = "status-new";
        statusText = "Новый";
    }

    card.innerHTML = `
      <div class="order-card-header">
        <h3>${escapeHtml(order.title)}</h3>
        <div class="order-meta"><span class="order-status ${statusClass}">${statusText}</span></div>
      </div>
      <div class="order-card-body">
        <p class="order-description">${escapeHtml(order.description)}</p>
        <div class="order-details">
          <div><i class="fas fa-user"></i> ${escapeHtml(order.customerName)}</div>
          <div><i class="fas fa-phone"></i> ${escapeHtml(order.customerPhone)}</div>
        </div>
      </div>
      <div class="order-card-actions">
        ${actionButton}
        <button class="btn-chat-order" onclick="MasterOrders.openChatForOrder('${order.id || order._id}')">
          <i class="fas fa-comment"></i> Написать
        </button>
        <button class="btn-details" onclick="MasterOrders.showOrderDetails('${order.id || order._id}')">
          <i class="fas fa-info-circle"></i> Подробнее
        </button>
      </div>
    `;
    return card;
  }
}

window.MasterOrders = MasterOrders;

function escapeHtml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
