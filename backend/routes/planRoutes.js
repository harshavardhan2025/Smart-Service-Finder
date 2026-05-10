import express from "express";
import { getPlans, createPlan, deletePlan } from "../controllers/planController.js";

const router = express.Router();

router.get("/", getPlans);
router.post("/", createPlan);
router.delete("/:id", deletePlan);

export default router;
