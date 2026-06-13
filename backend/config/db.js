import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/workzy", {
      // Increase connection pool from default 5 to 20 for higher concurrency
      maxPoolSize: 20,
      // Minimum connections kept open for instant availability
      minPoolSize: 5,
      // Timeout waiting for a connection from the pool (10 seconds)
      waitQueueTimeoutMS: 10000,
      // Socket timeout for inactive connections (45 seconds)
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host} (Pool: 20)`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
