import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import User from "../models/User";

export const syncUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id, email, user_metadata } = req.user;

    let user = await User.findOne({ supabaseId: id });

    if (!user) {
      user = new User({
        supabaseId: id,
        email: email,
        fullName: user_metadata?.full_name,
        avatarUrl: user_metadata?.avatar_url,
      });
      await user.save();
    } else {
      // Update user info if changed
      user.email = email;
      user.fullName = user_metadata?.full_name || user.fullName;
      user.avatarUrl = user_metadata?.avatar_url || user.avatarUrl;
      await user.save();
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error syncing user" });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ supabaseId: req.user.id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user profile" });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};
