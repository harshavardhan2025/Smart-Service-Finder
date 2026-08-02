import express from "express";
import { createBooking, getBookings, updateBookingStatus, releaseEscrow, declineEscrow, cancelBooking, adminForceCancelBooking, getOverdueBookings, approveRefund, declineRefund, rescheduleBooking } from "../controllers/bookingController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/", protect, getBookings);
router.get("/overdue", protect, adminOnly, getOverdueBookings);
router.patch("/:id", protect, updateBookingStatus);
router.post("/:id/release", protect, releaseEscrow);
router.post("/:id/decline-escrow", protect, declineEscrow);
router.post("/:id/cancel", protect, cancelBooking);
router.post("/:id/reschedule", protect, rescheduleBooking);
router.post("/:id/approve-refund", protect, adminOnly, approveRefund);
router.post("/:id/decline-refund", protect, adminOnly, declineRefund);
router.post("/:id/admin-force-cancel", protect, adminOnly, adminForceCancelBooking);

export default router;
