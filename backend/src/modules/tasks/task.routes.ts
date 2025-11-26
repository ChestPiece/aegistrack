import express from "express";
import { authenticateUser } from "../../shared/middleware/auth.middleware";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "./task.controller";

const router = express.Router();

router.use(authenticateUser);

router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
