// controllers/reviewController.js
const { Op } = require("sequelize");
const { Review, Order, User } = global.db;

exports.createReview = async (req, res) => {
  try {
    const { orderId, rating, comment, pros, cons, photos } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findByPk(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Заказ не найден" });

    let targetRole;
    if (userRole === "client") {
      if (order.customerId !== userId)
        return res.status(403).json({ success: false, message: "Нет доступа" });
      if (!order.masterId)
        return res
          .status(400)
          .json({ success: false, message: "У заказа нет мастера" });
      targetRole = "master";
    } else if (userRole === "master") {
      if (order.masterId !== userId)
        return res
          .status(403)
          .json({ success: false, message: "Вы не исполнитель" });
      targetRole = "client";
    } else {
      return res
        .status(403)
        .json({ success: false, message: "Неизвестная роль" });
    }

    const existing = await Review.findOne({ where: { orderId, targetRole } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Отзыв по этому заказу уже был оставлен ранее",
      });
    }

    const reviewData = {
      orderId,
      orderTitle: order.title,
      targetRole,
      rating,
      comment: comment || "",
      isVerified: true,
    };

    if (userRole === "client") {
      reviewData.clientId = userId;
      reviewData.masterId = order.masterId;
      reviewData.pros = pros || [];
      reviewData.cons = cons || [];
    } else {
      reviewData.masterId = userId;
      reviewData.clientId = order.customerId;
      reviewData.photos = photos || [];
    }

    const review = await Review.create(reviewData);

    if (targetRole === "master") {
      await updateMasterRating(order.masterId);
    } else {
      await updateClientRating(order.customerId);
    }

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error("Ошибка в createReview:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Отзыв уже существует" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMasterReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { masterId: req.params.masterId, targetRole: "master" },
      order: [["createdAt", "DESC"]],
    });

    const reviewsWithNames = await Promise.all(
      reviews.map(async (review) => {
        const client = await User.findByPk(review.clientId, {
          attributes: ["name"],
        });
        return {
          ...review.toJSON(),
          client: client ? { name: client.name } : null,
        };
      }),
    );

    res.json({ success: true, data: reviewsWithNames });
  } catch (error) {
    console.error("Ошибка getMasterReviews:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getClientReviews = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { clientId: req.params.clientId, targetRole: "client" },
      order: [["createdAt", "DESC"]],
    });

    const reviewsWithNames = await Promise.all(
      reviews.map(async (review) => {
        const master = await User.findByPk(review.masterId, {
          attributes: ["name"],
        });
        return {
          ...review.toJSON(),
          master: master ? { name: master.name } : null,
        };
      }),
    );

    res.json({ success: true, data: reviewsWithNames });
  } catch (error) {
    console.error("Ошибка getClientReviews:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

async function updateMasterRating(masterId) {
  try {
    const reviews = await Review.findAll({
      where: { masterId, targetRole: "master" },
    });
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = total > 0 ? sum / total : 0;
    await User.update(
      { rating: avg, reviewsCount: total },
      { where: { id: masterId } },
    );
  } catch (error) {
    console.error("Ошибка обновления рейтинга мастера:", error);
  }
}

async function updateClientRating(clientId) {
  try {
    const reviews = await Review.findAll({
      where: { clientId, targetRole: "client" },
    });
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = total > 0 ? sum / total : 0;
    await User.update(
      { rating: avg, reviewsCount: total },
      { where: { id: clientId } },
    );
  } catch (error) {
    console.error("Ошибка обновления рейтинга клиента:", error);
  }
}

exports.checkReview = async (req, res) => {
  try {
    const { orderId } = req.params;
    const existing = await Review.findOne({ where: { orderId } });
    const order = await Order.findByPk(orderId);
    res.json({
      success: true,
      data: {
        orderExists: !!order,
        orderStatus: order?.status,
        orderMasterId: order?.masterId,
        reviewExists: !!existing,
        review: existing,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
