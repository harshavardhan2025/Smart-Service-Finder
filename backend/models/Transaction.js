import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  customer: { type: String },
  worker: { type: String },
  service: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, default: "Paid" },
  method: { type: String, default: "Wallet" }
}, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
