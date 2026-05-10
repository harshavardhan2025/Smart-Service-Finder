import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  booking_id: { type: String }, // Optional: can relate to an active service
  sender_id: { type: String, required: true },
  receiver_id: { type: String, required: true },
  text: { type: String, required: true },
  is_read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;
