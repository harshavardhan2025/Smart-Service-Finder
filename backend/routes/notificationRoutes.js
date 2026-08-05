import express from "express";
import { getNotifications, createNotification, markAllRead, updateNotification, getNotificationById } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/:id", protect, getNotificationById);
router.post("/", protect, createNotification);
router.patch("/mark-read", protect, markAllRead);
router.patch("/:id", protect, updateNotification);

export default router;
