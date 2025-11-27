import { Response } from "express";
import { AuthRequest } from "../../shared/middleware/auth.middleware";
import Project from "./project.model";
import User from "../users/user.model";
import Notification from "../notifications/notification.model";

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    // Check if user is admin
    const user = await User.findOne({ supabaseId: userId });
    const isAdmin = user?.role === "admin";

    const isArchived = req.query.archived === "true";

    const matchStage: any = {
      $or: [{ createdBy: userId }, { members: userId }],
    };

    // Add archive filter
    if (isArchived) {
      matchStage.status = "archived";
    } else {
      matchStage.status = { $ne: "archived" };
    }

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

    const transformedProjects = projects.map((project) => {
      const { _id, __v, ...rest } = project;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    res.json(transformedProjects);
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
      members: [userId, ...(req.body.members || [])], // Creator + added members
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

export const addProjectMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { memberIds } = req.body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: "memberIds array is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Add only unique members (avoid duplicates)
    const uniqueNewMembers = memberIds.filter(
      (id) => !project.members.includes(id)
    );

    if (uniqueNewMembers.length === 0) {
      return res.status(400).json({ error: "All members already in project" });
    }

    project.members.push(...uniqueNewMembers);
    const savedProject = await project.save();

    // Notify new members
    const adder = await User.findOne({ supabaseId: req.user.id });
    for (const userId of uniqueNewMembers) {
      await Notification.create({
        userId,
        title: "Added to Project",
        message: `${adder?.fullName || "An admin"} added you to project "${
          project.title
        }"`,
        type: "success",
      });
    }

    res.json(savedProject);
  } catch (error) {
    res.status(500).json({ error: "Error adding members to project" });
  }
};

export const removeProjectMember = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Check if member exists in project
    if (!project.members.includes(memberId)) {
      return res.status(400).json({ error: "Member not found in project" });
    }

    // Remove the member
    project.members = project.members.filter((id) => id !== memberId);
    const savedProject = await project.save();

    // Notify removed member
    const remover = await User.findOne({ supabaseId: req.user.id });
    await Notification.create({
      userId: memberId,
      title: "Removed from Project",
      message: `${remover?.fullName || "An admin"} removed you from project "${
        project.title
      }"`,
      type: "warning",
    });

    res.json(savedProject);
  } catch (error) {
    res.status(500).json({ error: "Error removing member from project" });
  }
};
