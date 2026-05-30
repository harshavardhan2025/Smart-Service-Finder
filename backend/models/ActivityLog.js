import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  user_id: { type: String },
  email: { type: String, required: true },
  role: { type: String, required: true },
  action: { type: String, required: true }, // e.g. "LOGIN", "SIGNUP", "SOS_TRIGGERED", "BOOKING_CANCELLED"
  device: { type: String },
  ip: { type: String },
  city: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
