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
    const requesterId = req.user.id;
    const requester = await User.findOne({ supabaseId: requesterId });

    if (requester?.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.user.id;
    const requester = await User.findOne({ supabaseId: requesterId });

    if (requester?.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { email, fullName, role, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Create user in Supabase Auth
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Create user in MongoDB
    const newUser = new User({
      supabaseId: authData.user.id,
      email,
      fullName,
      role: role || "admin",
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Error creating user" });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.user.id;
    const requester = await User.findOne({ supabaseId: requesterId });

    if (requester?.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { id } = req.params;
    const { fullName, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { fullName, role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Error updating user" });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { fullName, phoneNumber, company, bio, location, avatarUrl } =
      req.body;

    const user = await User.findOne({ supabaseId: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update only the fields that are provided
    if (fullName !== undefined) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (company !== undefined) user.company = company;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Error updating profile" });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.user.id;
    const requester = await User.findOne({ supabaseId: requesterId });

    if (requester?.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete from Supabase Auth
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Supabase configuration missing" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      user.supabaseId
    );

    if (authError) {
      console.error("Error deleting from Supabase:", authError);
      // Continue with MongoDB deletion even if Supabase deletion fails
    }

    // Delete from MongoDB
    await User.findByIdAndDelete(id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
};
