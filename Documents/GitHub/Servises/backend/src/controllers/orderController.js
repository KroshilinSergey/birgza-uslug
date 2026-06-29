// controllers/orderController.js - ИСПРАВЛЕННАЯ ВЕРСИЯ
const { Op } = require("sequelize");
const { Order, User, Chat } = global.db;

function isRealOrder(order) {
  if (!order) return false;
  if (!order.customerId) return false;
  if (!order.title) return false;
  if (order.title.toLowerCase().includes('чат')) return false;
  if (order.title.toLowerCase().includes('сообщение')) return false;
  if (order.title.trim() === '') return false;
  if (order.isTemporary === true) return false;
  if (!order.status) return false;
  return true;
}

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [["createdAt", "DESC"]] });
    const realOrders = orders.filter(o => isRealOrder(o));
    res.json({ success: true, count: realOrders.length, data: realOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = req.user;
    const {
      title,
      description,
      category,
      categoryName,
      address,
      phoneVisible,
      budget,
      phone,
    } = req.body;

    console.log("📦 Получены данные заказа:", {
      title,
      category,
      categoryName,
      phone,
    });

    let categoryId = null;
    if (category) {
      categoryId = parseInt(category);
      if (isNaN(categoryId)) {
        categoryId = null;
      }
    }

    const orderData = {
      title,
      description,
      category: categoryId,
      categoryName: categoryName || (categoryId ? `Категория ${categoryId}` : null),
      address: address || "",
      phoneVisible: phoneVisible !== false,
      budget: budget || null,
      customerId: userId,
      customerName: user.name,
      customerPhone: phone || user.phone,
      status: "new",
    };

    console.log("📦 Сохраняем заказ:", orderData);

    const newOrder = await Order.create(orderData);
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    console.error("❌ Ошибка создания заказа:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let where = {};
    if (userRole === "client") where.customerId = userId;
    else if (userRole === "master") where.masterId = userId;
    const orders = await Order.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    const realOrders = orders.filter(o => isRealOrder(o));
    res.json({ success: true, data: realOrders });
  } catch (error) {
    console.error("Ошибка getMyOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (!isRealOrder(order)) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Ошибка getOrderById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.takeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const masterId = req.user.id;
    const master = req.user;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (!isRealOrder(order)) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (order.status !== "new") {
      return res.status(400).json({ success: false, message: "Заказ уже взят" });
    }
    if (order.masterId) {
      return res.status(400).json({ success: false, message: "Заказ уже имеет мастера" });
    }

    order.status = "in_progress";
    order.masterId = masterId;
    order.masterName = master.name;
    order.takenAt = new Date();
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Ошибка takeOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const masterId = req.user.id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (!isRealOrder(order)) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (order.masterId !== masterId) {
      return res.status(403).json({ success: false, message: "Вы не можете завершить этот заказ" });
    }
    if (order.status !== "in_progress") {
      return res.status(400).json({ success: false, message: "Заказ не в работе" });
    }

    order.status = "awaiting_confirmation";
    order.masterCompletedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: order,
      message: "Заказ отправлен на подтверждение клиенту",
    });
  } catch (error) {
    console.error("Ошибка completeOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.confirmOrderCompletion = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (!isRealOrder(order)) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (order.customerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Вы не можете подтвердить выполнение этого заказа",
      });
    }
    if (order.status !== "awaiting_confirmation") {
      return res.status(400).json({ success: false, message: "Заказ не ожидает подтверждения" });
    }

    order.status = "completed";
    order.completedAt = new Date();
    await order.save();

    res.json({ success: true, data: order, message: "Заказ подтверждён" });
  } catch (error) {
    console.error("Ошибка подтверждения заказа:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (!isRealOrder(order)) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (order.customerId !== userId) {
      return res.status(403).json({ success: false, message: "Вы не можете отменить этот заказ" });
    }
    if (order.status !== "new") {
      return res.status(400).json({
        success: false,
        message: "Нельзя отменить заказ в текущем статусе",
      });
    }
    if (order.masterId) {
      return res.status(400).json({ success: false, message: "Нельзя отменить заказ, у которого есть мастер" });
    }

    order.status = "cancelled";
    await order.save();

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Ошибка cancelOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAvailableOrders = async (req, res) => {
  try {
    const { spec } = req.query;
    // Показываем только заказы со статусом new и без мастера
    let where = { 
      status: "new",
      masterId: null
    };

    if (spec) {
      const specs = Array.isArray(spec) ? spec : [spec];
      const numericSpecs = specs
        .map((s) => parseInt(s))
        .filter((s) => !isNaN(s));
      if (numericSpecs.length > 0) {
        where.category = { [Op.in]: numericSpecs };
      }
    }

    const orders = await Order.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    const realOrders = orders.filter(o => isRealOrder(o));
    console.log(`📊 Найдено доступных заказов: ${realOrders.length}`);
    res.json({ success: true, data: realOrders });
  } catch (error) {
    console.error("Ошибка в getAvailableOrders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMasterStats = async (req, res) => {
  try {
    const masterId = req.user.id;
    const active = await Order.count({
      where: { masterId, status: "in_progress" },
    });
    const completed = await Order.count({
      where: { masterId, status: "completed" },
    });
    const awaiting = await Order.count({
      where: { masterId, status: "awaiting_confirmation" },
    });
    res.json({ success: true, data: { active, completed, awaiting } });
  } catch (error) {
    console.error("Ошибка getMasterStats:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (!isRealOrder(order)) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (order.customerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Нет прав на редактирование этого заказа",
      });
    }
    if (order.status !== "new") {
      return res.status(400).json({
        success: false,
        message: "Нельзя редактировать заказ в текущем статусе",
      });
    }

    const allowedUpdates = ["title", "description", "address", "phoneVisible"];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    await order.update(updates);
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Ошибка updateOrder:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.assignMaster = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { masterId } = req.body;
    const userId = req.user.id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (!isRealOrder(order)) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (order.customerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Вы не можете назначить мастера для этого заказа",
      });
    }
    if (order.status !== "new") {
      return res.status(400).json({ success: false, message: "Заказ уже не в статусе new" });
    }
    if (order.masterId) {
      return res.status(400).json({ success: false, message: "У заказа уже есть мастер" });
    }

    const master = await User.findByPk(masterId);
    if (!master || master.role !== "master") {
      return res.status(404).json({ success: false, message: "Мастер не найден" });
    }

    order.status = "in_progress";
    order.masterId = masterId;
    order.masterName = master.name;
    order.takenAt = new Date();
    await order.save();

    await Chat.update({ masterId }, { where: { orderId: order.id } });
    const [chat] = await Chat.findOrCreate({
      where: { orderId: order.id },
      defaults: {
        orderId: order.id,
        customerId: order.customerId,
        orderTitle: order.title,
      },
    });
    if (chat && !chat.masterId) {
      chat.masterId = masterId;
      await chat.save();
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error("Ошибка назначения мастера:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Клиент завершает заказ (переводит в completed)
exports.completeByClient = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (!isRealOrder(order)) {
      return res.status(404).json({ success: false, message: "Заказ не найден" });
    }
    if (order.customerId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Вы не можете завершить этот заказ" 
      });
    }
    if (order.status !== "in_progress") {
      return res.status(400).json({ 
        success: false, 
        message: "Заказ не в работе" 
      });
    }
    if (!order.masterId) {
      return res.status(400).json({ 
        success: false, 
        message: "У заказа нет мастера" 
      });
    }

    order.status = "completed";
    order.completedAt = new Date();
    await order.save();

    res.json({ 
      success: true, 
      data: order, 
      message: "Заказ завершён" 
    });
  } catch (error) {
    console.error("Ошибка completeByClient:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
