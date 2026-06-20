import express from "express";
import { proxyChat, getBookingMessages, sendBookingMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", proxyChat);
router.get("/booking/:bookingId", protect, getBookingMessages);
router.post("/booking/:bookingId", protect, sendBookingMessage);

export default router;
