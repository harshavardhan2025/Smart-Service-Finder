import express from "express";
import { getServices, createService, deleteService } from "../controllers/serviceController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getServices);
router.post("/", protect, adminOnly, createService);
router.delete("/:id", protect, adminOnly, deleteService);

export default router;
