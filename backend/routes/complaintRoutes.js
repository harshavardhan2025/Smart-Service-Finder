import express from "express";
import { getComplaints, submitComplaint, resolveComplaint } from "../controllers/complaintController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getComplaints);
router.post("/", protect, submitComplaint);
router.patch("/:id/resolve", protect, adminOnly, resolveComplaint);

export default router;
