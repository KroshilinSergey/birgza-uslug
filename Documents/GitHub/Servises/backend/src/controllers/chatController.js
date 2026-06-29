// controllers/chatController.js
const { Op } = require("sequelize");
const { Chat, Message, Order, User } = global.db;

// Получить или создать чат для заказа
exports.getOrCreateChat = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Заказ не найден" });
    }

    // Проверка доступа
    if (
      userRole !== "master" &&
      order.customerId !== userId &&
      userRole !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Нет доступа" });
    }

    if (!order.customerId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Заказ не содержит идентификатора заказчика",
        });
    }

    let chat = await Chat.findOne({ where: { orderId } });
    if (!chat) {
      chat = await Chat.create({
        orderId,
        orderTitle: order.title,
        customerId: order.customerId,
        masterId: null,
      });
      console.log("✅ Чат создан без мастера:", chat.id);
    } else {
      console.log("✅ Чат уже существует:", chat.id);
    }

    const chatData = chat.toJSON();
    chatData.orderStatus = order.status;
    res.json({ success: true, data: chatData });
  } catch (error) {
    console.error("❌ Ошибка в getOrCreateChat:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Получить все чаты пользователя
exports.getMyChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.findAll({
      where: { [Op.or]: [{ customerId: userId }, { masterId: userId }] },
      order: [["updatedAt", "DESC"]],
    });

    const chatsWithInfo = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await Message.findOne({
          where: { chatId: chat.id },
          order: [["createdAt", "DESC"]],
        });
        const unreadCount = await Message.count({
          where: {
            chatId: chat.id,
            senderId: { [Op.ne]: userId },
            read: false,
          },
        });
        const order = await Order.findByPk(chat.orderId, {
          attributes: ["status"],
        });
        return {
          ...chat.toJSON(),
          lastMessage: lastMessage ? lastMessage.text : null,
          unreadCount,
          orderStatus: order ? order.status : null,
        };
      }),
    );

    res.json({ success: true, data: chatsWithInfo });
  } catch (error) {
    console.error("❌ Ошибка в getMyChats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Получить сообщения чата
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const chat = await Chat.findByPk(chatId);
    if (!chat)
      return res.status(404).json({ success: false, message: "Чат не найден" });

    const order = await Order.findByPk(chat.orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Заказ не найден" });

    const isParticipant =
      chat.customerId === userId || chat.masterId === userId;
    const isMasterAllowed = userRole === "master" && order.status === "new";

    if (!isParticipant && !isMasterAllowed && userRole !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Нет доступа к этому чату" });
    }

    const messages = await Message.findAll({
      where: { chatId },
      order: [["createdAt", "ASC"]],
    });
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("❌ Ошибка в getMessages:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Отправить сообщение
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;
    const userRole = req.user.role;

    let chat = await Chat.findByPk(chatId);
    if (!chat)
      return res.status(404).json({ success: false, message: "Чат не найден" });

    // Восстановим недостающие поля
    if (!chat.orderTitle || !chat.customerId) {
      const order = await Order.findByPk(chat.orderId);
      if (order) {
        chat.orderTitle = order.title;
        chat.customerId = order.customerId;
      } else {
        return res
          .status(400)
          .json({
            success: false,
            message: "Данные чата повреждены (заказ не найден)",
          });
      }
    }

    const order = await Order.findByPk(chat.orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Заказ не найден" });

    // Если мастер и в чате нет masterId — добавляем
    if (userRole === "master" && !chat.masterId) {
      chat.masterId = userId;
    }

    const isParticipant =
      chat.customerId === userId || chat.masterId === userId;
    const isMasterAllowed = userRole === "master" && order.status === "new";

    if (!isParticipant && !isMasterAllowed && userRole !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Нет доступа к этому чату" });
    }

    const message = await Message.create({
      chatId,
      senderId: userId,
      text,
    });

    chat.lastMessage = text;
    chat.lastMessageAt = new Date();
    await chat.save();

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error("❌ Ошибка в sendMessage:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Отметить сообщения как прочитанные
exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    await Message.update(
      { read: true },
      { where: { chatId, senderId: { [Op.ne]: userId }, read: false } },
    );

    res.json({ success: true, message: "Сообщения отмечены как прочитанные" });
  } catch (error) {
    console.error("❌ Ошибка в markAsRead:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
