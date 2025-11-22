import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Project from "../models/Project";
import User from "../models/User";

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    // Check if user is admin
    const user = await User.findOne({ supabaseId: userId });
    const isAdmin = user?.role === "admin";

    const matchStage = isAdmin
      ? {}
      : {
          $or: [{ createdBy: userId }, { members: userId }],
        };

    const projects = await Project.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "projectId",
          as: "tasks",
        },
      },
      {
        $addFields: {
          taskCount: { $size: "$tasks" },
          completedTaskCount: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.status", "completed"] },
              },
            },
          },
          memberCount: { $size: "$members" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Error fetching projects" });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, deadline, status } = req.body;
    const userId = req.user.id;

    const newProject = new Project({
      title,
      description,
      deadline,
      status,
      createdBy: userId,
      members: [userId], // Creator is automatically a member
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(500).json({ error: "Error creating project" });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Error fetching project" });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: "Error updating project" });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting project" });
  }
};
