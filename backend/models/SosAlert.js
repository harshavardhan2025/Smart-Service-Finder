import mongoose from "mongoose";

const sosAlertSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true }, // "user" or "worker"
  booking_id: { type: String }, // Optional, linked active booking
  lat: { type: Number },
  lng: { type: Number },
  location_name: { type: String }, // Reverse-geocoded or input location
  worker_name: { type: String },
  worker_phone: { type: String },
  worker_email: { type: String },
  worker_profession: { type: String },
  worker_location: { type: String },
  customer_name: { type: String },
  customer_phone: { type: String },
  customer_email: { type: String },
  booking_address: { type: String },
  status: { type: String, enum: ["Triggered", "Resolved"], default: "Triggered" },
  resolvedAt: { type: Date }
}, { timestamps: true });

const SosAlert = mongoose.model("SosAlert", sosAlertSchema);
export default SosAlert;
