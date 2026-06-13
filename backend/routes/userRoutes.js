import express from "express";
import { getUsers, updateUser, deleteUser, sendMoneyToCustomer } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, adminOnly, getUsers);
router.patch("/:id", protect, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);
router.post("/:id/send-money", protect, adminOnly, sendMoneyToCustomer);

export default router;
