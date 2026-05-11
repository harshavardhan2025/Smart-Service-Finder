import express from "express";
import { createBooking, getBookings, updateBookingStatus, releaseEscrow } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/", getBookings);
router.patch("/:id", updateBookingStatus);
router.post("/:id/release", releaseEscrow);

export default router;
