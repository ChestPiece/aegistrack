import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Task from "../models/Task";
import User from "../models/User";
import Notification from "../models/Notification";

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({ supabaseId: userId });
    const isAdmin = user?.role === "admin";

    const query = isAdmin
      ? {}
      : {
          $or: [{ assignedTo: userId }, { createdBy: userId }],
        };

    const tasks = await Task.find(query)
      .populate("projectId", "title")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Error fetching tasks" });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, deadline, status, projectId, assignedTo } =
      req.body;
    const userId = req.user.id;

    const newTask = new Task({
      title,
      description,
      deadline,
      status,
      projectId,
      assignedTo,
      createdBy: userId,
    });

    const savedTask = await newTask.save();

    // Notify assigned user
    if (assignedTo && assignedTo !== userId) {
      await Notification.create({
        userId: assignedTo,
        title: "New Task Assigned",
        message: `You have been assigned to task: ${title}`,
        type: "info",
      });
    }

    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ error: "Error creating task" });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Notify if status changed
    if (req.body.status && req.body.status !== updatedTask.status) {
      const updater = await User.findOne({ supabaseId: req.user.id });
      const notifyUsers = new Set<string>([updatedTask.createdBy]);
      if (updatedTask.assignedTo) notifyUsers.add(updatedTask.assignedTo);
      notifyUsers.delete(req.user.id); // Don't notify yourself

      for (const userId of notifyUsers) {
        await Notification.create({
          userId,
          title: "Task Status Updated",
          message: `${updater?.fullName || "Someone"} changed "${
            updatedTask.title
          }" to ${req.body.status.replace("_", " ")}`,
          type: "info",
        });
      }
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Error updating task" });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting task" });
  }
};
