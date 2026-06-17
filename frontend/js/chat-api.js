// chat-api.js - добавлено логирование
class ChatSystem {
  constructor() {
    // Нет локального хранилища
  }

  // Получить или создать чат для заказа
  async getOrCreateChat(orderId) {
    try {
      const result = await apiRequest("GET", `/chats/order/${orderId}`);
      return result.data;
    } catch (error) {
      console.error("Ошибка получения/создания чата:", error);
      return null;
    }
  }

  // Получить все чаты текущего пользователя
  async getMyChats() {
    try {
      const result = await apiRequest("GET", "/chats/my");
      console.log("📋 ChatSystem.getMyChats получил:", result.data);
      return result.data;
    } catch (error) {
      console.error("Ошибка получения чатов:", error);
      return [];
    }
  }

  // Получить сообщения чата
  async getMessages(chatId) {
    try {
      const result = await apiRequest("GET", `/chats/${chatId}/messages`);
      return result.data;
    } catch (error) {
      console.error("Ошибка получения сообщений:", error);
      return [];
    }
  }

  // Отправить сообщение
  async sendMessage(chatId, text) {
    try {
      const result = await apiRequest("POST", `/chats/${chatId}/messages`, {
        text,
      });
      return result.data;
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      return null;
    }
  }

  // Отметить сообщения как прочитанные
  async markAsRead(chatId) {
    try {
      await apiRequest("POST", `/chats/${chatId}/read`);
    } catch (error) {
      console.error("Ошибка отметки прочитанных:", error);
    }
  }

  // Получить количество непрочитанных сообщений (можно вычислить из списка чатов)
  async getUnreadCount() {
    const chats = await this.getMyChats();
    return chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  }
}

// Глобальный экземпляр
if (!window.ChatSystem) {
  window.ChatSystem = new ChatSystem();
}
