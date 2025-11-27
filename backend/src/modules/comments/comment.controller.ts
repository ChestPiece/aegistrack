import { Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import Comment from "./comment.model";
import Task from "../tasks/task.model";
import User from "../users/user.model";
import Notification from "../notifications/notification.model";

// Get comments for a task
export const getTaskComments = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ taskId }).sort({ createdAt: 1 });

    // Populate user info
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await User.findOne({ supabaseId: comment.userId });
        return {
          ...comment.toJSON(),
          user: {
            fullName: user?.fullName || "Unknown User",
            email: user?.email || "",
            role: user?.role || "member",
          },
        };
      })
    );

    res.json(commentsWithUsers);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Error fetching comments" });
  }
};

// Add comment to task
export const addTaskComment = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const newComment = new Comment({
      taskId,
      userId,
      content: content.trim(),
    });

    const savedComment = await newComment.save();

    // Get commenter info
    const commenter = await User.findOne({ supabaseId: userId });

    // Notify task creator and assigned user
    const notifyUsers = new Set<string>([task.createdBy]);
    if (task.assignedTo) notifyUsers.add(task.assignedTo);

    // Check for mentions
    // Simple regex to find @Name or @Email
    // We will fetch project members to match against
    const project = await Task.findById(taskId).populate("projectId");
    // Note: This assumes we can access project members.
    // If not directly available, we might need to fetch Project model.
    // For now, let's just match against all users since we don't have easy access to project members here without importing Project model
    // and we want to avoid circular dependencies if possible.
    // Actually, let's just fetch all users for now as the user base is likely small.
    const allUsers = await User.find({});

    allUsers.forEach((user) => {
      const mentionName = `@${user.fullName}`;
      const mentionEmail = `@${user.email}`;
      const mentionFirstName = `@${user.fullName?.split(" ")[0]}`;

      if (
        content.includes(mentionName) ||
        content.includes(mentionEmail) ||
        content.includes(mentionFirstName)
      ) {
        notifyUsers.add(user.supabaseId);
      }
    });

    notifyUsers.delete(userId); // Don't notify yourself

    for (const notifyUserId of notifyUsers) {
      const isMention = allUsers.find(
        (u) =>
          u.supabaseId === notifyUserId &&
          (content.includes(`@${u.fullName}`) ||
            content.includes(`@${u.email}`) ||
            content.includes(`@${u.fullName?.split(" ")[0]}`))
      );

      await Notification.create({
        userId: notifyUserId,
        title: isMention ? "You were mentioned" : "New Comment on Task",
        message: isMention
          ? `${
              commenter?.fullName || "Someone"
            } mentioned you in a comment on "${task.title}"`
          : `${commenter?.fullName || "Someone"} commented on "${task.title}"`,
        type: "info",
      });
    }

    // Return comment with user info
    res.status(201).json({
      ...savedComment.toJSON(),
      user: {
        fullName: commenter?.fullName || "Unknown User",
        email: commenter?.email || "",
        role: commenter?.role || "member",
      },
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Error adding comment" });
  }
};
