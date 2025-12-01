import mongoose from "mongoose";
import { config } from "./environment";
import { logger } from "../utils/logger";

export const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info("Connected to MongoDB");
  } catch (err) {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
