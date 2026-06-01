import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: String, required: true },
  desc: { type: String },
  expiry: { type: String },
  expiryDate: { type: Date }
}, { timestamps: true });

const Offer = mongoose.model("Offer", offerSchema);
export default Offer;
