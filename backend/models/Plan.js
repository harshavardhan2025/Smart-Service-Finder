import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String, required: true },
  period: { type: String, default: "month" },
  popular: { type: Boolean, default: false },
  features: { type: [String] },
  color: { type: String },
  btnText: { type: String },
  workerId: { type: String },
  expiryDate: { type: Date }
}, { timestamps: true });

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
