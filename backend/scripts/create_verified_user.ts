import mongoose from "mongoose";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import User from "../src/models/User";

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/aegistrack";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

const createVerifiedUser = async () => {
  try {
    const email = await question("Enter email: ");
    if (!email) throw new Error("Email is required");

    const password = await question("Enter password: ");
    if (!password) throw new Error("Password is required");

    const fullName = await question("Enter full name: ");
    if (!fullName) throw new Error("Full name is required");

    let roleInput = await question(
      "Enter role (admin/member) [default: member]: "
    );
    roleInput = roleInput.trim().toLowerCase();

    if (!roleInput) roleInput = "member";

    if (roleInput !== "admin" && roleInput !== "member") {
      console.log("Invalid role entered. Defaulting to 'member'.");
      roleInput = "member";
    }

    const role: "admin" | "member" = roleInput as "admin" | "member";

    console.log(`\nCreating user: ${email} with role: ${role}...`);

    // 1. Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 2. Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (authError) {
      console.error("Error creating Supabase user:", authError.message);
      // If user already exists, try to find them to sync
      if (authError.message.includes("already registered")) {
        console.log("User already exists in Supabase, attempting to fetch...");
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find((u) => u.email === email);
        if (existingUser) {
          console.log(`Found existing Supabase user ID: ${existingUser.id}`);
          await syncMongoUser(existingUser.id, email, fullName, role);
          rl.close();
          return;
        }
      }
      rl.close();
      process.exit(1);
    }

    if (!authData.user) {
      console.error("Supabase user creation failed (no data returned)");
      rl.close();
      process.exit(1);
    }

    const supabaseId = authData.user.id;
    console.log(`Created Supabase user with ID: ${supabaseId}`);

    // 3. Create user in MongoDB
    await syncMongoUser(supabaseId, email, fullName, role);
  } catch (error) {
    console.error("Unexpected error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    rl.close();
    process.exit(0);
  }
};

async function syncMongoUser(
  supabaseId: string,
  email: string,
  fullName: string,
  role: "admin" | "member"
) {
  try {
    let user = await User.findOne({ supabaseId });

    if (user) {
      console.log("User already exists in MongoDB. Updating...");
      user.email = email;
      user.fullName = fullName;
      user.role = role;
      await user.save();
      console.log(`MongoDB user updated with role: ${role}.`);
    } else {
      console.log("Creating new user in MongoDB...");
      user = new User({
        supabaseId,
        email,
        fullName,
        role: role,
      });
      await user.save();
      console.log(`MongoDB user created with role: ${role}.`);
    }
  } catch (error) {
    console.error("Error syncing MongoDB user:", error);
  }
}

createVerifiedUser();
