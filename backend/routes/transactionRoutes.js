import express from "express";
import { getTransactions, createTransaction } from "../controllers/transactionController.js";

const router = express.Router();

router.get("/", getTransactions);
router.post("/", createTransaction);

export default router;
