import express from "express";
import { getUsers, updateUser, deleteUser, sendMoneyToCustomer } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getUsers);
router.patch("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);
router.post("/:id/send-money", protect, sendMoneyToCustomer);

export default router;
