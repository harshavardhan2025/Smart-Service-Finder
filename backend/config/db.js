import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Singleton promise — prevents multiple parallel connection attempts
// across hot-reloaded serverless invocations (Vercel keeps the module cached).
let _connectionPromise = null;

const connectDB = async () => {
  // Already connected — reuse existing connection
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Return the in-flight connection promise if one is already running
  if (_connectionPromise) {
    return _connectionPromise;
  }

  _connectionPromise = mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/workzy", {
      maxPoolSize: 20,
      minPoolSize: 2,
      waitQueueTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 8000, // Fail fast on Vercel cold start
    })
    .then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host} (Pool: 20)`);
      _connectionPromise = null;
    })
    .catch((error) => {
      _connectionPromise = null;
      // ⚠️  Do NOT call process.exit() here — that kills the entire
      // Vercel serverless function and causes FUNCTION_INVOCATION_FAILED.
      // Instead throw so the Express error handler returns a 503 JSON response.
      console.error(`MongoDB connection error: ${error.message}`);
      throw error;
    });

  return _connectionPromise;
};

export default connectDB;
