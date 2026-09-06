import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  role: { type: String, default: "all" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "info" },
  user_id: { type: String },
  is_read: { type: Boolean, default: false },
  lat: { type: Number },
  lng: { type: Number }
}, { timestamps: true });

notificationSchema.index({ role: 1, user_id: 1, is_read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
