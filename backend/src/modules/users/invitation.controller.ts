import { Response } from "express";
import { supabase } from "../../config/supabase";
import User from "./user.model";
import { AuthRequest } from "../../shared/middleware/auth.middleware";

export const inviteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, fullName } = req.body;
    const requesterId = req.user.id; // Get the ID of the admin sending the invite
    const role = "member"; // Enforce member role for invited users

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 1. Invite user via Supabase Admin
    const { data: authData, error: authError } =
      await supabase.auth.admin.inviteUserByEmail(email);

    if (authError) {
      console.error("Supabase invite error:", authError);
      return res.status(400).json({ message: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ message: "Failed to create auth user" });
    }

    // 2. Create or Update User in MongoDB
    // We use findOneAndUpdate with upsert to handle cases where the user might exist in DB but not Auth (rare) or re-invites
    const user = await User.findOneAndUpdate(
      { email },
      {
        supabaseId: authData.user.id,
        email,
        role,
        fullName,
        addedBy: requesterId, // Track who added this user
        status: "pending",
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: "Invitation sent successfully",
      user,
    });
  } catch (error: any) {
    console.error("Invite user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
