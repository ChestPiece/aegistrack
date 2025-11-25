import express from "express";
import { authenticateUser } from "../middleware/auth";
import {
  getTaskComments,
  addTaskComment,
} from "../controllers/commentController";

const router = express.Router();

router.get("/task/:taskId", authenticateUser, getTaskComments);
router.post("/task/:taskId", authenticateUser, addTaskComment);

export default router;
