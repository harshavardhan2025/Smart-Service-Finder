import express from "express";
import { createBooking, getBookings, updateBookingStatus, releaseEscrow, declineEscrow, cancelBooking, adminForceCancelBooking, getOverdueBookings } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/", protect, getBookings);
router.get("/overdue", protect, getOverdueBookings);
router.patch("/:id", protect, updateBookingStatus);
router.post("/:id/release", protect, releaseEscrow);
router.post("/:id/decline-escrow", protect, declineEscrow);
router.post("/:id/cancel", protect, cancelBooking);
router.post("/:id/admin-force-cancel", protect, adminForceCancelBooking);

export default router;
