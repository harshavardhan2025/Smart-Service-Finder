import express from "express";
import { getUsers, updateUser, deleteUser, sendMoneyToCustomer, subscribeToPlan, getUserProfile } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getUserProfile);
router.get("/", protect, adminOnly, getUsers);
router.patch("/:id", protect, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);
router.post("/:id/send-money", protect, adminOnly, sendMoneyToCustomer);
router.post("/subscribe", protect, subscribeToPlan);

export default router;
