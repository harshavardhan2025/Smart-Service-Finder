import express from "express";
import { getNotifications, createNotification, markAllRead, updateNotification, getNotificationById } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.get("/:id", getNotificationById);
router.post("/", createNotification);
router.patch("/mark-read", markAllRead);
router.patch("/:id", updateNotification);

export default router;
