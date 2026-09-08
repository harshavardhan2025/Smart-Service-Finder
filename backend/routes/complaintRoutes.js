import express from "express";
import { getComplaints, submitComplaint, resolveComplaint } from "../controllers/complaintController.js";
import { protect, adminOnly, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", optionalProtect, getComplaints);
router.post("/", optionalProtect, submitComplaint);
router.patch("/:id/resolve", protect, adminOnly, resolveComplaint);

export default router;
