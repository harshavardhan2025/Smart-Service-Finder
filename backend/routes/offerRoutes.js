import express from "express";
import { getOffers, createOffer, deleteOffer } from "../controllers/offerController.js";

const router = express.Router();

router.get("/", getOffers);
router.post("/", createOffer);
router.delete("/:id", deleteOffer);

export default router;
