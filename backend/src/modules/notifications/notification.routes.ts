import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "./notification.controller";
import { authenticateUser } from "../../shared/middleware/auth.middleware";

const router = express.Router();

router.use(authenticateUser);

router.get("/", getNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

export default router;
