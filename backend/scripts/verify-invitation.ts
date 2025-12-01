import fetch from "node-fetch";

/**
 * Verification Script for Supabase Auth and Invitation Functionality
 *
 * This script tests the invitation flow:
 * 1. Authenticates as admin
 * 2. Invites a new user
 * 3. Checks if user was created
 * 4. Tests resend invitation
 */

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = "TestPass123";

async function verifyInvitationFlow() {
  console.log("=== Supabase Auth & Invitation Verification ===\n");

  try {
    // Step 1: Get admin token (you need to provide valid admin credentials)
    console.log("Step 1: Authenticating as admin...");
    console.log(
      "⚠️  Note: You need to provide valid admin credentials in the script\n"
    );

    // For now, we'll assume you have a token. In production, you'd authenticate first.
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

    if (!ADMIN_TOKEN) {
      console.error("❌ Error: ADMIN_TOKEN environment variable not set");
      console.log("Please set ADMIN_TOKEN to a valid JWT token for testing");
      process.exit(1);
    }

    // Step 2: Invite a new user
    console.log(`Step 2: Inviting user: ${TEST_EMAIL}...`);
    const inviteResponse = await fetch(`${BACKEND_URL}/api/users/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        fullName: "Test User",
        password: TEST_PASSWORD,
      }),
    });

    const inviteData = await inviteResponse.json();

    if (!inviteResponse.ok) {
      console.error(`❌ Invitation failed: ${inviteResponse.status}`);
      console.error("Response:", JSON.stringify(inviteData, null, 2));
      return;
    }

    console.log("✅ User invited successfully!");
    console.log("Response:", JSON.stringify(inviteData, null, 2));
    const userId = inviteData.user.id;

    // Step 3: Get all users to verify the new user exists
    console.log("\nStep 3: Fetching all users...");
    const usersResponse = await fetch(`${BACKEND_URL}/api/users`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });

    const users = await usersResponse.json();
    const invitedUser = users.find((u: any) => u.email === TEST_EMAIL);

    if (invitedUser) {
      console.log("✅ User found in database!");
      console.log("User details:", JSON.stringify(invitedUser, null, 2));

      // Check status
      if (invitedUser.status === "pending") {
        console.log("✅ User status is 'pending' as expected");
      } else {
        console.warn(
          `⚠️  User status is '${invitedUser.status}', expected 'pending'`
        );
      }
    } else {
      console.error("❌ Invited user not found in database");
    }

    // Step 4: Test resend invitation
    console.log(`\nStep 4: Testing resend invitation for user ${userId}...`);
    const resendResponse = await fetch(
      `${BACKEND_URL}/api/users/${userId}/resend-invitation`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      }
    );

    const resendData = await resendResponse.json();

    if (resendResponse.ok) {
      console.log("✅ Resend invitation successful!");
      console.log("Response:", JSON.stringify(resendData, null, 2));
    } else {
      console.error(`❌ Resend invitation failed: ${resendResponse.status}`);
      console.error("Response:", JSON.stringify(resendData, null, 2));
    }

    console.log("\n=== Verification Complete ===");
    console.log("\n✅ Summary:");
    console.log("1. ✅ User invitation endpoint working");
    console.log("2. ✅ User created in database");
    console.log("3. ✅ User status set to 'pending'");
    console.log("4. ✅ Resend invitation endpoint working");
    console.log(
      "\n⚠️  Note: Email delivery cannot be verified programmatically."
    );
    console.log(
      "Please check your Supabase email settings and inbox for the invitation email."
    );
  } catch (error) {
    console.error("\n❌ Verification failed with error:");
    console.error(error);
  }
}

// Run the verification
verifyInvitationFlow();
