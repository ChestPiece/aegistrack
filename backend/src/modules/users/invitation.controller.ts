import { Response } from "express";
import { supabase } from "../../config/supabase";
import { config } from "../../config/environment";
import User from "./user.model";
import { AuthRequest } from "../../shared/middleware/auth.middleware";

export const inviteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, fullName, password } = req.body;
    const requesterId = req.user.id; // Get the ID of the admin sending the invite
    const role = "member"; // Enforce member role for invited users

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Validate password strength
    if (password.length < 8 || !/\d/.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and contain a number",
      });
    }

    // 1. Invite user via Supabase Admin - this sends an invitation email
    const { data: authData, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          role,
          fullName,
          addedBy: requesterId,
        },
        redirectTo: `${config.frontendUrl}/auth/callback`,
      });

    if (authError) {
      console.error("Supabase invite user error:", authError);
      return res.status(400).json({ message: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ message: "Failed to invite user" });
    }

    // 2. Update the user's password in Supabase (they can use this to login after email confirmation)
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      { password }
    );

    if (updateError) {
      console.error("Supabase update password error:", updateError);
      // Continue anyway - user can still set password via invite link
    }

    // 3. Create or Update User in MongoDB
    const user = await User.findOneAndUpdate(
      { email },
      {
        supabaseId: authData.user.id,
        email,
        role,
        fullName,
        addedBy: requesterId,
        status: "pending", // Set to pending until email is verified
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message:
        "Team member invited successfully. They will receive an invitation email to activate their account.",
      user,
    });
  } catch (error: any) {
    console.error("Invite user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resendInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    console.log(
      `[ResendInvite] Request received for user ID: ${id} from admin: ${requesterId}`
    );

    // Verify requester is admin
    const requester = await User.findOne({ supabaseId: requesterId });
    if (requester?.role !== "admin") {
      console.log("[ResendInvite] Access denied: Requester is not admin");
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Find the user to resend invite to
    const user = await User.findById(id);
    if (!user) {
      console.log("[ResendInvite] User not found in MongoDB");
      return res.status(404).json({ message: "User not found" });
    }

    console.log(
      `[ResendInvite] Found user: ${user.email}, Status: ${user.status}`
    );

    // Only resend for pending users
    if (user.status !== "pending") {
      console.log("[ResendInvite] User is not pending");
      return res.status(400).json({
        message: "Can only resend invitations for pending users",
      });
    }

    // Resend invitation via Supabase
    console.log(
      `[ResendInvite] Calling Supabase inviteUserByEmail for ${user.email}`
    );
    const { error: authError } = await supabase.auth.admin.inviteUserByEmail(
      user.email
    );

    if (authError) {
      console.error("Supabase resend invite error:", authError);

      // If user is already registered (likely verified but pending in Mongo), send password reset
      if (
        authError.message?.toLowerCase().includes("already registered") ||
        authError.status === 422
      ) {
        console.log(
          "[ResendInvite] User already registered, sending password reset email instead"
        );
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          user.email
        );

        if (resetError) {
          console.error("Supabase reset password error:", resetError);
          return res.status(400).json({
            message: "Failed to resend invitation: " + resetError.message,
          });
        }

        console.log("[ResendInvite] Successfully sent password reset email");
        return res.status(200).json({
          message: "Invitation resent successfully (as password reset)",
          user,
        });
      }

      return res.status(400).json({ message: authError.message });
    }

    console.log("[ResendInvite] Successfully resent invitation");
    res.status(200).json({
      message: "Invitation resent successfully",
      user,
    });
  } catch (error: any) {
    console.error("Resend invite error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
