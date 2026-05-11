import express from "express";
import { getPlans, createPlan, updatePlan, deletePlan } from "../controllers/planController.js";

const router = express.Router();

router.get("/", getPlans);
router.post("/", createPlan);
router.patch("/:id", updatePlan);
router.delete("/:id", deletePlan);

export default router;
