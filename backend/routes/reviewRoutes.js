import express from "express";
import { getReviews, createReview, replyReview } from "../controllers/reviewController.js";

const router = express.Router();

router.get("/", getReviews);
router.post("/", createReview);
router.post("/:id/reply", replyReview);

export default router;
