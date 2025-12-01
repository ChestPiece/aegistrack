import { Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import User from "./user.model";
import { supabase } from "../../config/supabase";
import Notification from "../notifications/notification.model";
import { logger } from "../../utils/logger";

export const syncUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id, email, user_metadata } = req.user;

    // First, try to find user by supabaseId
    let user = await User.findOne({ supabaseId: id });

    // If not found by supabaseId, check if user exists by email
    // This handles cases where user was invited but supabaseId might not match
    if (!user) {
      user = await User.findOne({ email });
    }

    if (!user) {
      // Create new user
      // Use role from metadata if available (for invited users), otherwise default to admin (for self-signup)
      const role = user_metadata?.role || "admin";

      user = new User({
        supabaseId: id,
        email: email,
        fullName: user_metadata?.full_name,
        avatarUrl: user_metadata?.avatar_url,
        role: role,
        addedBy: user_metadata?.addedBy,
      });
      await user.save();
    } else {
      // Update existing user's info but preserve their role
      user.supabaseId = id; // Update supabaseId in case it was found by email
      user.email = email;
      user.fullName = user_metadata?.full_name || user.fullName;
      user.avatarUrl = user_metadata?.avatar_url || user.avatarUrl;

      // If user was pending and is now logging in, set them to active
      // (they must have confirmed their email to be able to login)
      if (user.status === "pending") {
        user.status = "active";
      }

      // Explicitly NOT updating role here - preserve existing role
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

    // Only show members (not admins) that this admin invited
    const users = await User.find({
      addedBy: requester.supabaseId,
      role: "member",
    }).sort({ createdAt: -1 });

    // Transform to ensure proper id field (toJSON should handle this, but being explicit)
    const transformedUsers = users.map((user) => user.toJSON());
    res.json(transformedUsers);
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

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // User must verify email before logging in
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
      addedBy: requesterId,
    });

    await newUser.save();

    // Notify admin
    await Notification.create({
      userId: requesterId,
      title: "Member Invited",
      message: `You invited ${fullName || email} to the team`,
      type: "success",
    });

    res.status(201).json(newUser);
  } catch (error) {
    logger.error("Error creating user:", error);
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

    // Notify admin
    await Notification.create({
      userId: requesterId,
      title: "User Updated",
      message: `You updated ${
        updatedUser.fullName || updatedUser.email
      }'s profile`,
      type: "info",
    });

    res.json(updatedUser);
  } catch (error) {
    logger.error("Error updating user:", error);
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
    logger.error("Error updating profile:", error);
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

    // Prevent admin from deleting their own account
    if (user.supabaseId === requesterId) {
      return res.status(403).json({
        error:
          "You cannot delete your own account. Please have another admin delete it if necessary.",
      });
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(
      user.supabaseId
    );

    if (authError) {
      logger.error("Error deleting from Supabase:", authError);
      // Continue with MongoDB deletion even if Supabase deletion fails
    }

    // Delete from MongoDB
    await User.findByIdAndDelete(id);

    // Notify admin
    await Notification.create({
      userId: requesterId,
      title: "Member Removed",
      message: `You removed ${user.fullName || user.email} from the team`,
      type: "warning",
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error("Error deleting user:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
};

export const confirmInvite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await User.findOne({ supabaseId: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.status = "active";
    await user.save();

    res.json({ message: "User confirmed successfully", user });
  } catch (error) {
    logger.error("Error confirming user:", error);
    res.status(500).json({ error: "Error confirming user" });
  }
};

export const disableUser = async (req: AuthRequest, res: Response) => {
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

    // Prevent admin from disabling their own account
    if (user.supabaseId === requesterId) {
      return res.status(403).json({
        error: "You cannot disable your own account.",
      });
    }

    user.isActive = false;
    user.disabledBy = requesterId;
    user.reactivationRequested = false; // Reset any previous request
    user.reactivationRequestedAt = undefined;
    await user.save();

    // Notify admin
    await Notification.create({
      userId: requesterId,
      title: "Account Disabled",
      message: `You disabled ${user.fullName || user.email}'s account`,
      type: "warning",
    });

    res.json({ message: "User disabled successfully", user });
  } catch (error) {
    logger.error("Error disabling user:", error);
    res.status(500).json({ error: "Error disabling user" });
  }
};

export const enableUser = async (req: AuthRequest, res: Response) => {
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

    user.isActive = true;
    await user.save();

    // Notify admin
    await Notification.create({
      userId: requesterId,
      title: "Account Enabled",
      message: `You enabled ${user.fullName || user.email}'s account`,
      type: "success",
    });

    // Notify the user
    await Notification.create({
      userId: user.supabaseId,
      title: "Account Activated",
      message:
        "Your account has been reactivated. You can now access the system.",
      type: "success",
    });

    res.json({ message: "User enabled successfully", user });
  } catch (error) {
    res.status(500).json({ error: "Error enabling user" });
  }
};

export const requestReactivation = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isActive) {
      return res.status(400).json({ error: "Account is already active" });
    }

    if (user.reactivationRequested) {
      return res
        .status(400)
        .json({ error: "Reactivation request already pending" });
    }

    user.reactivationRequested = true;
    user.reactivationRequestedAt = new Date();
    await user.save();

    // Notify the admin who disabled the user
    if (user.disabledBy) {
      await Notification.create({
        userId: user.disabledBy,
        title: "Reactivation Request",
        message: `${
          user.fullName || user.email
        } has requested account reactivation.`,
        type: "info",
      });
    }

    res.json({ message: "Reactivation request sent successfully" });
  } catch (error) {
    logger.error("Error requesting reactivation:", error);
    res.status(500).json({ error: "Error requesting reactivation" });
  }
};

export const rejectReactivation = async (req: AuthRequest, res: Response) => {
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

    user.reactivationRequested = false;
    user.reactivationRequestedAt = undefined;
    await user.save();

    // Notify the user? Maybe not necessary for rejection, or maybe "Request Denied"
    // For now, just clear the request.

    res.json({ message: "Reactivation request rejected" });
  } catch (error) {
    logger.error("Error rejecting reactivation:", error);
    res.status(500).json({ error: "Error rejecting reactivation" });
  }
};
