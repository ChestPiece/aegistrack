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

    const { data: authData, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role, fullName, addedBy: requesterId },
        redirectTo: `${config.frontendUrl}/auth/callback`,
      });

    if (authError) {
      logger.error("Supabase invite user error:", authError);
      return res.status(400).json({ message: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ message: "Failed to invite user" });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      { password }
    );

    if (updateError) {
      logger.error("Supabase update password error:", updateError);
    }

    const user = await User.findOneAndUpdate(
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

    res.status(200).json({
      message:
        "Team member invited successfully. They will receive an invitation email to activate their account.",
      user,
    });
  } catch (error: any) {
    logger.error("Invite user error:", error);
    res.status(500).json({ message: "Internal server error" });
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
    const { error: authError } = await supabase.auth.admin.inviteUserByEmail(
      user.email
    );

    if (authError) {
      logger.error("Supabase resend invite error:", authError);

      if (
        authError.message?.toLowerCase().includes("already registered") ||
        authError.status === 422
      ) {
        logger.info("ResendInvite - sending password reset instead");
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          user.email
        );

        if (resetError) {
          logger.error("Supabase reset password error:", resetError);
          return res.status(400).json({
            message: "Failed to resend invitation: " + resetError.message,
          });
        }

        logger.info("ResendInvite - password reset sent");
        return res.status(200).json({
          message: "Invitation resent successfully (as password reset)",
          user,
        });
      }

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
