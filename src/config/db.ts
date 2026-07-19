import mongoose from "mongoose";
import { env } from "./env.js";

let isConnected = false;

/**
 * Connects once and reuses the connection across calls (important for
 * Vercel's serverless functions, where the module can be re-invoked in the
 * same warm container without re-running top-level setup).
 */
export async function connectDB(): Promise<void> {
  if (isConnected) {
    return;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(env.DATABASE_URL);

  isConnected = true;

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
    isConnected = false;
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
  });

  console.log("MongoDB connected");
}
