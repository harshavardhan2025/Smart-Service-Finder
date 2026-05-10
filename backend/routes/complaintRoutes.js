import express from "express";
import { getComplaints, submitComplaint, resolveComplaint } from "../controllers/complaintController.js";

const router = express.Router();

router.get("/", getComplaints);
router.post("/", submitComplaint);
router.patch("/:id/resolve", resolveComplaint);

export default router;
