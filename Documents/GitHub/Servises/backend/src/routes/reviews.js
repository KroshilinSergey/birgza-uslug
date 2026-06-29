const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

router.post("/", protect, reviewController.createReview);
router.get("/master/:masterId", protect, reviewController.getMasterReviews);
router.get("/client/:clientId", protect, reviewController.getClientReviews);

module.exports = router;
