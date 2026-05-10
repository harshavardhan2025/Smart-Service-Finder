import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
  provider: { type: String },
  price: { type: Number },
  location: { type: String },
  rating: { type: Number },
  parent_id: { type: String }
}, { timestamps: true });

const Service = mongoose.model("Service", serviceSchema);
export default Service;
