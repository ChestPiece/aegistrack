import express from "express";
import { authenticateUser } from "../middleware/auth";
import {
  syncUser,
  getCurrentUser,
  getAllUsers,
} from "../controllers/userController";

const router = express.Router();

router.post("/sync", authenticateUser, syncUser);
router.get("/me", authenticateUser, getCurrentUser);
router.get("/", authenticateUser, getAllUsers);

export default router;
