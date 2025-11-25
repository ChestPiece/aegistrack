import express from "express";
import { authenticateUser } from "../middleware/auth";
import {
  syncUser,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";

const router = express.Router();

router.post("/sync", authenticateUser, syncUser);
router.get("/me", authenticateUser, getCurrentUser);
router.get("/", authenticateUser, getAllUsers);
router.post("/", authenticateUser, createUser);
router.put("/:id", authenticateUser, updateUser);
router.delete("/:id", authenticateUser, deleteUser);

export default router;
