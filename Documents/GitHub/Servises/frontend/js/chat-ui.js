// chat-ui.js - финальная версия с принудительным созданием интерфейса
class ChatUI {
  constructor() {
    this.currentUserId = null;
    this.currentUserName = null;
    this.currentUserRole = null;
    this.currentChatId = null;
    this.currentChat = null;
    this.initialized = false;

    // DOM элементы
    this.chatListEl = null;
    this.chatMessagesEl = null;
    this.chatInputContainerEl = null;
    this.chatSearchEl = null;
    this.sendBtnEl = null;
    this.messageInputEl = null;
    this.userNameEl = null;
    this.statusEl = null;
    this.avatarEl = null;
  }

  init(userId, userName, userRole) {
    if (this.initialized && this.currentUserId === userId) {
      console.log("ChatUI уже инициализирован, пропускаем");
      return;
    }
    this.currentUserId = String(userId);
    this.currentUserName = userName;
    this.currentUserRole = userRole;
    this.initialized = true;
    console.log(`✅ ChatUI инициализирован: ${userName} (${userRole})`);
  }

  async renderMessagesTab() {
    const container = document.getElementById("chatContainer");
    if (!container) {
      console.error("Контейнер #chatContainer не найден");
      return;
    }

    if (!this.initialized) {
      container.innerHTML = `<div class="empty-chat-list">Ошибка инициализации. Перезагрузите страницу.</div>`;
      return;
    }

    const chats = await window.ChatSystem.getMyChats();
    console.log("renderMessagesTab: получены чаты", chats);

    if (!chats || chats.length === 0) {
      this.clearChatUI();
      container.innerHTML = `
        <div class="empty-chat-list">
          <i class="fas fa-comments fa-3x"></i>
          <p>Нет активных чатов</p>
          <p class="small-text">Чат автоматически создаётся при обращении к заказу</p>
        </div>
      `;
      window.dispatchEvent(
        new CustomEvent("chatRendered", { detail: { success: false } }),
      );
      return;
    }

    this.renderFullChatUI(container);
    this.renderChatList(chats);
    window.dispatchEvent(
      new CustomEvent("chatRendered", { detail: { success: true } }),
    );
  }

  clearChatUI() {
    this.chatListEl = null;
    this.chatMessagesEl = null;
    this.chatInputContainerEl = null;
    this.chatSearchEl = null;
    this.sendBtnEl = null;
    this.messageInputEl = null;
    this.userNameEl = null;
    this.statusEl = null;
    this.avatarEl = null;
    const container = document.getElementById("chatContainer");
    if (container) container.innerHTML = "";
  }

  renderFullChatUI(container) {
    this.clearChatUI();
    container.innerHTML = this._getChatHTML();

    this.chatListEl = document.getElementById("chatList");
    this.chatMessagesEl = document.getElementById("chatMessages");
    this.chatInputContainerEl = document.getElementById("chatInputContainer");
    this.chatSearchEl = document.getElementById("chatSearch");
    this.sendBtnEl = document.getElementById("sendMessageBtn");
    this.messageInputEl = document.getElementById("chatMessageInput");
    this.userNameEl = document.getElementById("chatUserName");
    this.statusEl = document.getElementById("chatStatus");
    this.avatarEl = document.getElementById("chatAvatar");

    this.setupEventListeners();
  }

  _getChatHTML() {
    return `
      <div class="chat-container">
        <div class="chat-sidebar">
          <div class="chat-search">
            <i class="fas fa-search"></i>
            <input type="text" id="chatSearch" placeholder="Поиск чатов...">
          </div>
          <div class="chat-list" id="chatList"></div>
        </div>
        <div class="chat-main">
          <div class="chat-window" id="chatWindow">
            <div class="chat-header">
              <div class="chat-participant-info">
                <div class="chat-participant-name" id="chatUserName">Выберите чат</div>
                <div class="chat-order-title" id="chatStatus"></div>
              </div>
              <div class="chat-avatar" id="chatAvatar"></div>
            </div>
            <div class="chat-messages" id="chatMessages">
              <div class="no-chat-selected">
                <i class="fas fa-comment-alt fa-3x"></i>
                <h3>Выберите чат</h3>
                <p>Нажмите на чат слева, чтобы начать общение</p>
              </div>
            </div>
            <div class="chat-input-area">
              <div class="chat-input-container" id="chatInputContainer" style="display: none;">
                <div class="chat-input-row">
                  <input type="text" id="chatMessageInput" class="chat-input" placeholder="Введите сообщение...">
                  <button id="sendMessageBtn" class="chat-send-btn">
                    <i class="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    if (this.chatSearchEl) {
      this.chatSearchEl.addEventListener("input", (e) =>
        this.filterChats(e.target.value),
      );
    }

    if (this.sendBtnEl && this.messageInputEl) {
      this.sendBtnEl.addEventListener("click", () => this.sendMessage());
      this.messageInputEl.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendMessage();
      });
    }
  }

  async renderChatList(chats) {
    if (!this.chatListEl) {
      console.error("renderChatList: this.chatListEl не существует");
      return;
    }

    let html = "";
    for (let chat of chats) {
      const lastMsg = chat.lastMessage || "Нет сообщений";
      const unread = chat.unreadCount || 0;
      const otherParty =
        this.currentUserRole === "master"
          ? chat.customerId?.name || "Заказчик"
          : chat.masterId?.name || "Мастер";
      const time = chat.lastMessageAt
        ? this._formatTime(chat.lastMessageAt)
        : "";

      html += `
        <div class="chat-item ${this.currentChatId === chat._id ? "active" : ""}"
       data-chat-id="${chat._id}"
       onclick="window.chatUI.openChat('${chat._id}')">
    <div class="chat-item-header">
      <div class="chat-item-user">${chat.orderTitle}</div>
      <div class="chat-item-time">${time}</div>
    </div>
    <div class="chat-item-preview">
      <strong>${otherParty}</strong>
      ${unread ? `<span class="unread-badge">${unread}</span>` : ""}
    </div>
  </div>
      `;
    }
    this.chatListEl.innerHTML = html;
  }

  // chat-ui.js - исправленная версия с учётом orderStatus

  // ... (внутри класса ChatUI)

  async renderChatWindow(chat) {
    if (!this.userNameEl || !this.chatMessagesEl) {
      console.error(
        "renderChatWindow: userNameEl или chatMessagesEl не существует",
      );
      return;
    }

    this.userNameEl.textContent = chat.orderTitle;
    const otherParty =
      this.currentUserRole === "master"
        ? chat.customerId?.name || "Заказчик"
        : chat.masterId?.name || "Мастер";
    this.statusEl.textContent = otherParty;

    if (this.avatarEl) {
      this.avatarEl.textContent = otherParty.charAt(0).toUpperCase();
    }

    const messages = await window.ChatSystem.getMessages(chat._id);
    if (messages.length === 0) {
      this.chatMessagesEl.innerHTML = `
      <div class="no-chat-selected">
        <i class="fas fa-comment-alt fa-3x"></i>
        <h3>Начните общение</h3>
        <p>Напишите сообщение для обсуждения деталей заказа</p>
      </div>
    `;
    } else {
      let html = "";
      messages.forEach((msg) => {
        const isMy = String(msg.senderId) === String(this.currentUserId);
        const time = this._formatTime(msg.createdAt);
        html += `
        <div class="message ${isMy ? "outgoing" : "incoming"}">
          <div class="message-content">${escapeHtml(msg.text)}</div>
          <div class="message-time">${time}</div>
        </div>
      `;
      });
      this.chatMessagesEl.innerHTML = html;
      setTimeout(() => {
        this.chatMessagesEl.scrollTo({
          top: this.chatMessagesEl.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }

    if (this.chatInputContainerEl) {
      // Мастер может писать, если:
      // - он клиент (не наш случай) ИЛИ
      // - у чата уже есть masterId (он назначен) ИЛИ
      // - он мастер и заказ ещё новый (orderStatus === 'new')
      const canSend =
        this.currentUserRole === "client" ||
        chat.masterId ||
        (this.currentUserRole === "master" && chat.orderStatus === "new");

      this.chatInputContainerEl.style.display = canSend ? "block" : "none";
      if (canSend && this.messageInputEl) {
        setTimeout(() => this.messageInputEl.focus(), 200);
      }
    }
  }

  async openChat(chatId) {
    console.log("openChat вызван с chatId:", chatId);
    if (!chatId) {
      console.error("openChat: chatId не указан");
      return;
    }
    this.currentChatId = chatId;
    const chats = await window.ChatSystem.getMyChats();
    console.log("openChat: получены чаты", chats);
    const chat = chats.find((c) => c._id === chatId);
    if (!chat) {
      console.error("Чат не найден среди моих чатов. Список чатов:", chats);
      return;
    }
    this.currentChat = chat;
    await this.renderChatWindow(chat);
    await window.ChatSystem.markAsRead(chatId);
    await this.refreshChatList();
  }

  async openChatWithObject(chat) {
    console.log("openChatWithObject вызван с чатом:", chat);
    // Если интерфейс не создан, создаём его принудительно
    if (!this.chatListEl) {
      console.log("Интерфейс чата не существует, создаём принудительно");
      const container = document.getElementById("chatContainer");
      if (container) {
        this.renderFullChatUI(container);
        this.renderChatList([chat]); // передаём массив с одним чатом
      } else {
        console.error("Контейнер чата не найден");
        return;
      }
    }
    this.currentChatId = chat._id;
    this.currentChat = chat;
    const chats = await window.ChatSystem.getMyChats();
    console.log("openChatWithObject: получены чаты", chats);
    if (this.chatListEl) {
      this.renderChatList(chats); // обновляем список (может быть пустым)
    }
    await this.renderChatWindow(chat);
    await window.ChatSystem.markAsRead(chat._id);
    await this.refreshChatList();
  }

  async openOrderChat(orderId) {
    console.log("openOrderChat вызван для orderId:", orderId);
    try {
      const chat = await window.ChatSystem.getOrCreateChat(orderId);
      if (!chat) throw new Error("Чат не создан");
      console.log("Получен чат:", chat);

      const messagesTab = document.querySelector('[data-tab="messages"]');
      if (!messagesTab) throw new Error("Вкладка сообщений не найдена");
      messagesTab.click();

      // Ждём событие chatRendered или таймаут
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener("chatRendered", handler);
          resolve(); // даже если не дождались, всё равно пытаемся открыть
        }, 3000);

        const handler = (e) => {
          clearTimeout(timeout);
          window.removeEventListener("chatRendered", handler);
          resolve();
        };
        window.addEventListener("chatRendered", handler, { once: true });
      });

      await this.openChatWithObject(chat);
    } catch (error) {
      console.error("Ошибка в openOrderChat:", error);
      alert("Не удалось открыть чат. Попробуйте открыть вручную.");
    }
  }

  async sendMessage() {
    if (!this.messageInputEl || !this.currentChatId) return;
    const text = this.messageInputEl.value.trim();
    if (!text) return;

    const msg = await window.ChatSystem.sendMessage(this.currentChatId, text);
    if (msg) {
      this.messageInputEl.value = "";
      await this.refreshChatList();
      await this.renderChatWindow(this.currentChat);
    }
  }

  filterChats(searchText) {
    document.querySelectorAll(".chat-item").forEach((item) => {
      item.style.display = item.textContent
        .toLowerCase()
        .includes(searchText.toLowerCase())
        ? "flex"
        : "none";
    });
  }

  async refreshChatList() {
    const chats = await window.ChatSystem.getMyChats();
    console.log("refreshChatList: получены чаты", chats);
    if (this.chatListEl) {
      this.renderChatList(chats);
    }
    const totalUnread = chats.reduce(
      (sum, chat) => sum + (chat.unreadCount || 0),
      0,
    );
    window.dispatchEvent(
      new CustomEvent("chat:unreadCountUpdate", { detail: { totalUnread } }),
    );
  }

  _truncate(str, len) {
    if (str.length > len) return str.slice(0, len) + "…";
    return str;
  }

  _formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000 / 60 / 60 / 24;
    if (diff < 1)
      return date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (diff < 2) return "вчера";
    if (diff < 7) return date.toLocaleDateString("ru-RU", { weekday: "short" });
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  }

  _switchToMessagesTab() {
    const messagesTab = document.querySelector('[data-tab="messages"]');
    if (messagesTab) {
      messagesTab.click();
    }
  }
}

window.chatUI = new ChatUI();
