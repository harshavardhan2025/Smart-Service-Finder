import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: String, required: true },
  desc: { type: String },
  expiry: { type: String },
  expiryDate: { type: Date },
  terms: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  cancellationPolicy: { type: String },
  city: { type: String, default: "" },
  validServices: { type: String, default: "" },
  minPrice: { type: Number, default: 0 },
  validPeriods: { type: String, default: "" },
  limitPerUser: { type: Number, default: null } // null means unlimited
}, { timestamps: true });

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
