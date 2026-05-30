import express from "express";
import { createBooking, getBookings, updateBookingStatus, releaseEscrow, cancelBooking } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/", protect, getBookings);
router.patch("/:id", protect, updateBookingStatus);
router.post("/:id/release", protect, releaseEscrow);
router.post("/:id/cancel", protect, cancelBooking);

export default router;
