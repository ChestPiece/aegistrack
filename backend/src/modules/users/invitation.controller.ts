import { Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import User from "./user.model";
import { supabase } from "../../config/supabase";
import { config } from "../../config/environment";
import { logger } from "../../utils/logger";

export const inviteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, fullName, password } = req.body;
    const requesterId = req.user.id;
    const role = "member";

    logger.info("InviteUser request received", {
      email,
      fullName,
      requesterId,
    });

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (password.length < 8 || !/\d/.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and contain a number",
      });
    }

    logger.info("Creating user in Supabase...");

    // 1. Create user with auto-confirm disabled so we can send a custom invite/confirm email
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // We will trigger the email manually with specific redirect
        user_metadata: {
          role,
          full_name: fullName,
          addedBy: requesterId,
        },
      });

    if (authError) {
      logger.error("Supabase create user error:", authError);
      return res.status(400).json({ message: authError.message });
    }

    if (!authData.user) {
      logger.error("Supabase returned no user data");
      return res.status(500).json({ message: "Failed to create user" });
    }

    logger.info("Supabase user created", { userId: authData.user.id });

    // 2. Send confirmation email with correct redirect
    // Redirect to /auth/callback which handles the token and redirects to login
    const redirectUrl = `${config.frontendUrl}/auth/callback`;
    logger.info("Sending confirmation email...", { redirectUrl });

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (resendError) {
      logger.error("Error sending confirmation email:", resendError);
      // We don't fail the request here, but we should log it.
      // The user exists, so the admin can try resending later.
    }

    // Create or update user in MongoDB
    // We handle potential duplicate key errors (e.g. if Supabase user exists but Mongo user has different email/ID mapping)
    let user;
    try {
      logger.info("Creating/Updating user in MongoDB...");
      user = await User.findOneAndUpdate(
        { email },
        {
          supabaseId: authData.user.id,
          email,
          role,
          fullName,
          addedBy: requesterId,
          status: "pending",
        },
        { new: true, upsert: true }
      );
      logger.info("MongoDB user updated successfully");
    } catch (mongoError: any) {
      logger.error("MongoDB error:", mongoError);
      // Handle duplicate key error (E11000)
      if (mongoError.code === 11000) {
        // If duplicate key is on supabaseId, it means we have a user with this ID but different email
        // We should try to find by supabaseId and update
        logger.warn(
          "Duplicate key error in Mongo, trying to find by supabaseId",
          mongoError
        );
        user = await User.findOneAndUpdate(
          { supabaseId: authData.user.id },
          {
            email,
            role,
            fullName,
            addedBy: requesterId,
            status: "pending",
          },
          { new: true, upsert: true }
        );
      } else {
        throw mongoError;
      }
    }

    res.status(200).json({
      message:
        "Team member invited successfully. They will receive an email to verify their account.",
      user,
    });
  } catch (error: any) {
    logger.error("Invite user error (Catch Block):", error);
    res.status(500).json({
      message: "Internal server error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

export const resendInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    logger.debug("ResendInvite request", { userId: id, requesterId });

    const requester = await User.findOne({ supabaseId: requesterId });
    if (requester?.role !== "admin") {
      logger.warn("ResendInvite access denied - not admin");
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const user = await User.findById(id);
    if (!user) {
      logger.warn("ResendInvite - user not found", { userId: id });
      return res.status(404).json({ message: "User not found" });
    }

    logger.debug("ResendInvite - found user", {
      email: user.email,
      status: user.status,
    });

    if (user.status !== "pending") {
      logger.warn("ResendInvite - user not pending", {
        userId: id,
        status: user.status,
      });
      return res.status(400).json({
        message: "Can only resend invitations for pending users",
      });
    }

    logger.debug("ResendInvite - calling Supabase", { email: user.email });

    // Use resend with type 'signup' to send the confirmation email again
    // This avoids the "already registered" error and sends the correct link
    const redirectUrl = `${config.frontendUrl}/auth/callback`;
    const { error: authError } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (authError) {
      logger.error("Supabase resend invite error:", authError);
      return res.status(400).json({ message: authError.message });
    }

    logger.info("ResendInvite - invitation sent", { email: user.email });
    res.status(200).json({
      message: "Invitation resent successfully",
      user,
    });
  } catch (error: any) {
    logger.error("Resend invite error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
