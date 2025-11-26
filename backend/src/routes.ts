import { Router } from "express";
import userRoutes from "./modules/users/user.routes";
import projectRoutes from "./modules/projects/project.routes";
import taskRoutes from "./modules/tasks/task.routes";
import commentRoutes from "./modules/comments/comment.routes";
import notificationRoutes from "./modules/notifications/notification.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/comments", commentRoutes);
router.use("/notifications", notificationRoutes);

export { router as routes };
