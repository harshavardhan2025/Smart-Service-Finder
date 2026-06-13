import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";

export const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter);
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: "Access denied. You can only update your own profile." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "User account deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const sendMoneyToCustomer = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount specified." });
    }

    const customer = await User.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found." });
    }

    customer.walletBalance = (customer.walletBalance || 0) + Number(amount);
    await customer.save();

    // Create Transaction record
    await Transaction.create({
      customer: customer.name,
      worker: "Admin Deposit",
      service: reason || "Admin Top-up / Compensation",
      amount: Number(amount),
      status: "Refunded",
      method: "Admin Adjustment"
    });

    // Create Notification for the customer
    await Notification.create({
      role: "user",
      user_id: customer._id.toString(),
      title: "💰 Money Received from Admin",
      message: `Admin has credited ₹${amount} to your wallet. Note: ${reason || "No reason specified."}`,
      type: "success",
      is_read: false
    });

    res.status(200).json({ success: true, message: `Successfully sent ₹${amount} to customer ${customer.name}.`, walletBalance: customer.walletBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
