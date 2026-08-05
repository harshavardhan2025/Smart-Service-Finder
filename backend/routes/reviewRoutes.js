import express from "express";
import { getReviews, createReview, replyReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getReviews);
router.post("/", protect, createReview);
router.post("/:id/reply", protect, replyReview);

export default router;
