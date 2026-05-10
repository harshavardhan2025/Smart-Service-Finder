import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

const createAccount = async () => {
  try {
    await connectDB();

    // Remove previous test accounts if any
    await User.deleteOne({ email: "test@test.com" });

    // Insert primary testing user
    await User.create({
      name: "Test Automation User",
      email: "test@test.com",
      password: "password123", // Hashed via hook
      role: "user",
      phone: "5555555555"
    });

    console.log("🔥 HIGH-PRIORITY TEST ACCOUNT CREATED SUCCESSFULLY!");
    process.exit();
  } catch (error) {
    console.error(`❌ Creation Failed: ${error.message}`);
    process.exit(1);
  }
};

createAccount();
