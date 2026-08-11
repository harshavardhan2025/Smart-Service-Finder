import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "worker", "admin"], default: "user" },
  phone: { type: String },
  city: { type: String },
  walletBalance: { type: Number, default: 1000 },
  status: { type: String, default: "Active" },
  // Dual-role support: a regular user can also be a service provider
  isWorker: { type: Boolean, default: false },
  workerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", default: null },
  subscriptions: [{
    planTitle: String,
    startDate: Date,
    expiryDate: Date,
    status: { type: String, enum: ["Active", "Expired"] }
  }]
}, { timestamps: true });

// Pre-save middleware to hash passwords
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return typeof next === "function" ? next() : undefined;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
