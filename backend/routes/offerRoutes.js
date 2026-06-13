import express from "express";
import { getOffers, createOffer, updateOffer, deleteOffer } from "../controllers/offerController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getOffers);
router.post("/", protect, adminOnly, createOffer);
router.patch("/:id", protect, adminOnly, updateOffer);
router.delete("/:id", protect, adminOnly, deleteOffer);

export default router;
