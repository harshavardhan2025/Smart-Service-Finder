import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  service: { type: String, required: true },
  city: { type: String, default: "Kakinada" },
  location: { type: String },
  rating: { type: Number, default: 2.7 },   // Bayesian starting baseline
  ratingSum: { type: Number, default: 0 },   // Running sum of customer star ratings
  reviews: { type: Number, default: 0 },     // Count of customer reviews
  price: { type: Number, default: 350 },     // Location-adjusted base price
  walletBalance: { type: Number, default: 0 },
  status: { type: String, default: "Active" },
  experience: { type: String, default: "2+ Years" }
}, { timestamps: true });


const Worker = mongoose.model("Worker", workerSchema);
export default Worker;
