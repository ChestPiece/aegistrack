import express from "express";
import { authenticateUser } from "../../shared/middleware/auth.middleware";
import {
  syncUser,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  updateProfile,
  deleteUser,
  confirmInvite,
} from "./user.controller";
import { inviteUser } from "./invitation.controller";

const router = express.Router();

router.post("/sync", authenticateUser, syncUser);
router.get("/me", authenticateUser, getCurrentUser);
router.put("/profile", authenticateUser, updateProfile);
router.get("/", authenticateUser, getAllUsers);
router.post("/", authenticateUser, createUser);
router.post("/invite", authenticateUser, inviteUser);
router.post("/confirm-invite", authenticateUser, confirmInvite);
router.put("/:id", authenticateUser, updateUser);
router.delete("/:id", authenticateUser, deleteUser);

export default router;
