import express from "express";
import { authenticateUser } from "../middleware/auth";
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectMembers,
  removeProjectMember,
} from "../controllers/projectController";

const router = express.Router();

router.use(authenticateUser);

router.get("/", getProjects);
router.post("/", createProject);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

// Member management routes
router.post("/:id/members", addProjectMembers);
router.delete("/:id/members/:memberId", removeProjectMember);

export default router;
