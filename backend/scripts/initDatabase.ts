import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/modules/users/user.model";
import Project from "../src/modules/projects/project.model";
import Task from "../src/modules/tasks/task.model";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/aegistrack";

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Create indexes (Mongoose will handle this automatically on first connection)
    await User.createIndexes();
    await Project.createIndexes();
    await Task.createIndexes();
    console.log("✅ Database indexes created/verified");

    // Verify collections exist
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not established");

    const collections = await db.listCollections().toArray();
    console.log(
      "\n📦 Existing collections:",
      collections.map((c) => c.name).join(", ")
    );

    // Collection stats
    const userCount = await User.countDocuments();
    const projectCount = await Project.countDocuments();
    const taskCount = await Task.countDocuments();

    console.log("\n📊 Collection counts:");
    console.log(`  - Users: ${userCount}`);
    console.log(`  - Projects: ${projectCount}`);
    console.log(`  - Tasks: ${taskCount}`);

    console.log("\n✨ Database initialization complete!");
    console.log("\n📝 User Sync Workflow:");
    console.log("  1. User signs up/logs in via Supabase");
    console.log("  2. Frontend calls POST /api/users/sync with JWT token");
    console.log("  3. Backend creates/updates user in MongoDB");
    console.log("  4. supabaseId links MongoDB user to Supabase auth");

    process.exit(0);
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    process.exit(1);
  }
}

initializeDatabase();
