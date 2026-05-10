import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  worker_id: { type: String, required: true }
}, { timestamps: true });

// Prevent duplicate entries for exact same pairing flawlessly
favoriteSchema.index({ user_id: 1, worker_id: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);
export default Favorite;
