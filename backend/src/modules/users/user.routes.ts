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
  disableUser,
  enableUser,
  requestReactivation,
  rejectReactivation,
} from "./user.controller";
import { inviteUser, resendInvite } from "./invitation.controller";

const router = express.Router();

router.post("/sync", authenticateUser, syncUser);
router.get("/me", authenticateUser, getCurrentUser);
router.put("/profile", authenticateUser, updateProfile);
router.get("/", authenticateUser, getAllUsers);
router.post("/", authenticateUser, createUser);
router.post("/invite", authenticateUser, inviteUser);
router.post("/confirm-invite", authenticateUser, confirmInvite);
router.post("/:id/resend-invitation", authenticateUser, resendInvite);
router.patch("/:id/disable", authenticateUser, disableUser);
router.patch("/:id/enable", authenticateUser, enableUser);
router.post("/request-reactivation", requestReactivation); // Public or authenticated? Login page uses it, user might be authenticated but disabled.
router.post("/:id/reject-reactivation", authenticateUser, rejectReactivation);
router.put("/:id", authenticateUser, updateUser);
router.delete("/:id", authenticateUser, deleteUser);

export default router;
