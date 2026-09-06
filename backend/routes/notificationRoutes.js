import express from "express";
import { getNotifications, createNotification, markAllRead, updateNotification, getNotificationById } from "../controllers/notificationController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", optionalProtect, getNotifications);
router.patch("/mark-read", optionalProtect, markAllRead);
router.get("/:id", optionalProtect, getNotificationById);
router.patch("/:id", protect, updateNotification);
router.post("/", protect, createNotification);

export default router;

