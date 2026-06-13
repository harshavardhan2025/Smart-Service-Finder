import express from "express";
import { getPlans, createPlan, updatePlan, deletePlan } from "../controllers/planController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getPlans);
router.post("/", protect, adminOnly, createPlan);
router.patch("/:id", protect, adminOnly, updatePlan);
router.delete("/:id", protect, adminOnly, deletePlan);

export default router;
