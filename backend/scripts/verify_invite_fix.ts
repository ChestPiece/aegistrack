import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY; // We might need this for signIn
const API_URL = "http://localhost:5000/api";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

// Admin client for creating users
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
// Client for signing in
const supabasePublic = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY
);

const TEST_ADMIN_EMAIL = "temp_admin_tester@example.com";
const TEST_ADMIN_PASSWORD = "Password123!";
const TEST_INVITEE_EMAIL = `test.invitee.${Date.now()}@gmail.com`;

async function main() {
  try {
    console.log("Starting verification...");

    // 1. Ensure Test Admin Exists
    console.log("Ensuring test admin exists...");
    const { data: adminUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { role: "admin", full_name: "Test Admin" },
      });

    if (createError) {
      console.log("Create admin error:", createError.message);
      if (!createError.message.toLowerCase().includes("already")) {
        throw new Error(`Failed to create admin: ${createError.message}`);
      }
      console.log("Admin already exists, proceeding to sign in...");
    }

    // 2. Sign In to get Token
    console.log("Signing in as admin...");
    const { data: signInData, error: signInError } =
      await supabasePublic.auth.signInWithPassword({
        email: TEST_ADMIN_EMAIL,
        password: TEST_ADMIN_PASSWORD,
      });

    if (signInError) {
      throw new Error(`Failed to sign in: ${signInError.message}`);
    }

    const token = signInData.session?.access_token;
    if (!token) throw new Error("No access token received");
    console.log("Got access token.");

    // 2.5 Sync Admin User to MongoDB
    console.log("Syncing admin user to MongoDB...");
    const syncResponse = await fetch(`${API_URL}/users/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!syncResponse.ok) {
      console.warn(
        "Sync failed, but proceeding (might fail if user not in DB):",
        await syncResponse.text()
      );
    } else {
      console.log("Admin synced successfully.");
    }

    // 3. Test Invite User
    console.log(`Inviting user: ${TEST_INVITEE_EMAIL}...`);
    const inviteResponse = await fetch(`${API_URL}/users/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: TEST_INVITEE_EMAIL,
        fullName: "Test Invitee",
        password: "InviteePassword123!", // Admin sets password now
      }),
    });

    const inviteData = await inviteResponse.json();

    if (!inviteResponse.ok) {
      throw new Error(
        `Invite failed: ${inviteResponse.status} - ${JSON.stringify(
          inviteData
        )}`
      );
    }

    console.log("Invite successful:", inviteData);
    // Fix: Check for id OR _id
    const invitedUserId = inviteData.user.id || inviteData.user._id;
    if (!invitedUserId)
      throw new Error("No user ID returned in invite response");

    // 4. Test Resend Invite
    console.log("Waiting 60 seconds to avoid Supabase rate limit...");
    await new Promise((resolve) => setTimeout(resolve, 60000));

    console.log(`Resending invite to user ID: ${invitedUserId}...`);
    const resendResponse = await fetch(
      `${API_URL}/users/${invitedUserId}/resend-invitation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(
        `Resend failed: ${resendResponse.status} - ${JSON.stringify(
          resendData
        )}`
      );
    }

    console.log("Resend successful:", resendData);

    // Check if message indicates success (and not password reset)
    if (resendData.message.includes("password reset")) {
      throw new Error("Resend triggered password reset! Fix failed.");
    }

    console.log("VERIFICATION PASSED!");
  } catch (error: any) {
    console.error("Verification FAILED:", error.message);
    process.exit(1);
  } finally {
    // Cleanup: Delete test users
    console.log("Cleaning up...");
    try {
      // Find admin ID to delete
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const admin = users.users.find((u) => u.email === TEST_ADMIN_EMAIL);
      if (admin) await supabaseAdmin.auth.admin.deleteUser(admin.id);

      // Delete invitee (if created in Supabase)
      const invitee = users.users.find((u) => u.email === TEST_INVITEE_EMAIL);
      if (invitee) await supabaseAdmin.auth.admin.deleteUser(invitee.id);

      // Note: MongoDB cleanup is not done here, but acceptable for test environment
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }
  }
}

main();
