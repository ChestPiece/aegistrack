import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Comment from "../models/Comment";
import Task from "../models/Task";
import User from "../models/User";
import Notification from "../models/Notification";

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
    notifyUsers.delete(userId); // Don't notify yourself

    for (const notifyUserId of notifyUsers) {
      await Notification.create({
        userId: notifyUserId,
        title: "New Comment on Task",
        message: `${commenter?.fullName || "Someone"} commented on "${
          task.title
        }"`,
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
