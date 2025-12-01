import { Request, Response, NextFunction } from "express";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import User from "../modules/users/user.model";
import Project from "../modules/projects/project.model";
import Task from "../modules/tasks/task.model";
import Notification from "../modules/notifications/notification.model";
import { logger } from "../utils/logger";
import { ChangeStreamDocument } from "../shared/types/database.types";

let io: SocketIOServer;

/**
 * Initialize Socket.IO server for real-time updates
 */
export const initializeSocketIO = (socketServer: SocketIOServer) => {
  io = socketServer;

  io.on("connection", (socket) => {
    logger.info("Client connected:", { socketId: socket.id });

    socket.on("authenticate", (userId: string) => {
      // Join user-specific room for targeted updates
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} authenticated and joined room`);
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected:", { socketId: socket.id });
    });
  });

  // Set up MongoDB Change Streams
  setupChangeStreams();
};

/**
 * Set up MongoDB Change Streams to watch for database changes
 */
const setupChangeStreams = () => {
  // Watch Users collection
  const userChangeStream = User.watch();
  userChangeStream.on("change", (change) => {
    handleUserChange(change);
  });

  // Watch Projects collection
  const projectChangeStream = Project.watch();
  projectChangeStream.on("change", (change) => {
    handleProjectChange(change);
  });

  // Watch Tasks collection
  const taskChangeStream = Task.watch();
  taskChangeStream.on("change", (change) => {
    handleTaskChange(change);
  });

  // Watch Notifications collection
  const notificationChangeStream = Notification.watch();
  notificationChangeStream.on("change", (change) => {
    handleNotificationChange(change);
  });

  logger.info("MongoDB Change Streams initialized");
};

/**
 * Handle User collection changes
 */
const handleUserChange = (change: ChangeStreamDocument) => {
  const { operationType, documentKey, fullDocument } = change;

  // Broadcast to all clients
  io.emit("user:changed", {
    collection: "users",
    operation: operationType,
    id: documentKey._id.toString(),
    document: fullDocument,
  });

  // If user was deleted, notify that specific user to logout
  if (operationType === "delete" && documentKey._id) {
    io.to(`user:${documentKey._id.toString()}`).emit("user:deleted", {
      userId: documentKey._id.toString(),
    });
  }
};

/**
 * Handle Project collection changes
 */
const handleProjectChange = (change: ChangeStreamDocument) => {
  const { operationType, documentKey, fullDocument } = change;

  // Broadcast to all clients
  io.emit("project:changed", {
    collection: "projects",
    operation: operationType,
    id: documentKey._id.toString(),
    document: fullDocument,
  });

  // Notify project members specifically
  if (fullDocument?.members) {
    fullDocument.members.forEach((memberId: string) => {
      io.to(`user:${memberId}`).emit("project:changed", {
        projectId: documentKey._id.toString(),
        operation: operationType,
        document: fullDocument,
      });
    });
  }
};

/**
 * Handle Task collection changes
 */
const handleTaskChange = (change: ChangeStreamDocument) => {
  const { operationType, documentKey, fullDocument } = change;

  // Broadcast to all clients
  io.emit("task:changed", {
    collection: "tasks",
    operation: operationType,
    id: documentKey._id.toString(),
    document: fullDocument,
  });

  // Notify assigned users
  if (fullDocument?.assignedTo && Array.isArray(fullDocument.assignedTo)) {
    fullDocument.assignedTo.forEach((userId: string) => {
      io.to(`user:${userId}`).emit("task:changed", {
        taskId: documentKey._id.toString(),
        operation: operationType,
        document: fullDocument,
      });
    });
  }
};

/**
 * Handle Notification collection changes
 */
const handleNotificationChange = (change: ChangeStreamDocument) => {
  const { operationType, documentKey, fullDocument } = change;

  // Broadcast to all clients
  io.emit("notification:changed", {
    collection: "notifications",
    operation: operationType,
    id: documentKey._id.toString(),
    document: fullDocument,
  });

  // Notify specific user about their notification
  if (fullDocument?.userId) {
    io.to(`user:${fullDocument.userId}`).emit("notification:new", {
      notificationId: documentKey._id.toString(),
      notification: fullDocument,
    });
  }
};

/**
 * Middleware to attach io instance to request
 */
export const attachSocketIO = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.io = io;
  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      io?: SocketIOServer;
    }
  }
}
