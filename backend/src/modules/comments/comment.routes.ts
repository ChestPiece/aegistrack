import express from "express";
import { authenticateUser } from "../../shared/middleware/auth.middleware";
import { getTaskComments, addTaskComment } from "./comment.controller";

const router = express.Router();

router.get("/task/:taskId", authenticateUser, getTaskComments);
router.post("/task/:taskId", authenticateUser, addTaskComment);

export default router;
