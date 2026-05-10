import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  role: { type: String, default: "all" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: "info" },
  user_id: { type: String },
  is_read: { type: Boolean, default: false }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
