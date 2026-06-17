// routes/orders.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

router.get("/", orderController.getAllOrders);
router.post("/", protect, orderController.createOrder);
router.get("/my", protect, orderController.getMyOrders);
router.get("/available", protect, orderController.getAvailableOrders);
router.get("/:id", protect, orderController.getOrderById);
router.post("/:id/take", protect, orderController.takeOrder);
router.post("/:id/complete", protect, orderController.completeOrder);
router.post("/:id/confirm", protect, orderController.confirmOrderCompletion);
router.post("/:id/cancel", protect, orderController.cancelOrder);
router.put("/:id", protect, orderController.updateOrder);
router.get("/stats/master", protect, orderController.getMasterStats);
router.post("/:id/assign", protect, orderController.assignMaster);

module.exports = router;
