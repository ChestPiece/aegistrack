import { Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import Task from "./task.model";
import User from "../users/user.model";
import Notification from "../notifications/notification.model";
import { logger } from "../../utils/logger";

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await User.findOne({ supabaseId: userId });
    const isAdmin = user?.role === "admin";

    const isArchived = req.query.archived === "true";

    const query: any = {
      $or: [{ assignedTo: userId }, { createdBy: userId }],
    };

    // Add archive filter
    if (isArchived) {
      query.status = "archived";
    } else {
      query.status = { $ne: "archived" };
    }

    logger.debug("getTasks", { userId, isAdmin, query });

    const tasks = await Task.find(query)
      .populate("projectId", "title")
      .sort({ createdAt: -1 });

    logger.debug("getTasks results", { taskCount: tasks.length });

    res.json(tasks);
  } catch (error) {
    logger.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Error fetching tasks" });
  }
};

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, deadline, status, projectId, assignedTo } =
      req.body;
    const userId = req.user.id;

    logger.debug("createTask", { assignedTo, createdBy: userId });

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

    logger.debug("createTask saved", {
      taskId: savedTask.id,
      assignedTo: savedTask.assignedTo,
    });

    // Check project status and update if necessary
    if (projectId) {
      const project = await import("../projects/project.model")
        .then((m) => m.default)
        .then((model) => model.findById(projectId));

      if (project && project.status === "completed") {
        project.status = "active"; // Revert to active if new task is added
        await project.save();

        // Notify project members about status change
        const updater = await User.findOne({ supabaseId: userId });
        const notifyUsers = new Set<string>(project.members);
        notifyUsers.delete(userId);

        for (const memberId of notifyUsers) {
          await Notification.create({
            userId: memberId,
            title: "Project Re-activated",
            message: `Project "${project.title}" is active again due to a new task.`,
            type: "info",
          });
        }
      }
    }

    // Notify assigned users
    if (assignedTo && Array.isArray(assignedTo)) {
      for (const assigneeId of assignedTo) {
        if (assigneeId !== userId) {
          await Notification.create({
            userId: assigneeId,
            title: "New Task Assigned",
            message: `You have been assigned to task: ${title}`,
            type: "info",
          });
        }
      }
    }

    res.status(201).json(savedTask);
  } catch (error) {
    logger.error("Error creating task:", error);
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

    // Project Status Logic
    if (updatedTask.projectId) {
      const Project = (await import("../projects/project.model")).default;
      const project = await Project.findById(updatedTask.projectId);

      if (project) {
        const projectTasks = await Task.find({ projectId: project.id });
        const allCompleted = projectTasks.every(
          (t) => t.status === "completed"
        );
        const anyInProgress = projectTasks.some(
          (t) => t.status !== "completed"
        );

        let newStatus = project.status;
        let statusMessage = "";

        if (allCompleted && project.status !== "completed") {
          newStatus = "completed";
          statusMessage = `Project "${project.title}" is now completed!`;
        } else if (anyInProgress && project.status === "completed") {
          newStatus = "active"; // Or previous status if we tracked it, but active is safe
          statusMessage = `Project "${project.title}" is active again.`;
        }

        if (newStatus !== project.status) {
          project.status = newStatus;
          await project.save();

          // Notify project members
          const updater = await User.findOne({ supabaseId: req.user.id });
          const notifyUsers = new Set<string>(project.members);
          notifyUsers.delete(req.user.id);

          for (const memberId of notifyUsers) {
            await Notification.create({
              userId: memberId,
              title: "Project Status Updated",
              message: statusMessage,
              type: "success",
            });
          }
        }
      }
    }

    // Notify if status changed
    if (req.body.status && req.body.status !== updatedTask.status) {
      const updater = await User.findOne({ supabaseId: req.user.id });
      const notifyUsers = new Set<string>([updatedTask.createdBy]);

      if (updatedTask.assignedTo && Array.isArray(updatedTask.assignedTo)) {
        updatedTask.assignedTo.forEach((id) => notifyUsers.add(id));
      }

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

    // Notify if flagged
    if (
      req.body.flagged !== undefined &&
      req.body.flagged !== updatedTask.flagged
    ) {
      const updater = await User.findOne({ supabaseId: req.user.id });
      const notifyUsers = new Set<string>([updatedTask.createdBy]);

      if (updatedTask.assignedTo && Array.isArray(updatedTask.assignedTo)) {
        updatedTask.assignedTo.forEach((id) => notifyUsers.add(id));
      }

      notifyUsers.delete(req.user.id);

      for (const userId of notifyUsers) {
        await Notification.create({
          userId,
          title: req.body.flagged ? "Task Flagged" : "Task Unflagged",
          message: `${updater?.fullName || "Someone"} ${
            req.body.flagged ? "flagged" : "unflagged"
          } task "${updatedTask.title}"`,
          type: "warning",
        });
      }
    }

    res.json(updatedTask);
  } catch (error) {
    logger.error("Error updating task:", error);
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
