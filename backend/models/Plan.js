import mongoose from "mongoose";

const planSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String, required: true },
  features: { type: [String] },
  color: { type: String },
  btnText: { type: String },
  workerId: { type: String }
}, { timestamps: true });

const Plan = mongoose.model("Plan", planSchema);
export default Plan;
