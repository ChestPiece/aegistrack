import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketService } from "../services/socket.service";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface DatabaseChangeEvent {
  collection: string;
  operation: "insert" | "update" | "delete" | "replace";
  id: string;
  document?: any;
}

export const useDatabaseSync = (userId: string | null) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Connect to Socket.IO server
    socketService.connect(userId);

    // Handle general database changes
    const handleDatabaseChange = (event: DatabaseChangeEvent) => {
      console.log("Database change detected:", event);

      const { collection, operation, id } = event;

      // Invalidate relevant queries based on collection
      switch (collection) {
        case "users":
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["team"] });
          queryClient.invalidateQueries({ queryKey: ["user", id] });
          break;

        case "projects":
          queryClient.invalidateQueries({ queryKey: ["projects"] });
          queryClient.invalidateQueries({ queryKey: ["project", id] });
          // Also invalidate tasks if project was deleted
          if (operation === "delete") {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
          }
          break;

        case "tasks":
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          queryClient.invalidateQueries({ queryKey: ["task", id] });
          // Invalidate project tasks
          if (event.document?.projectId) {
            queryClient.invalidateQueries({
              queryKey: ["project", event.document.projectId.toString()],
            });
          }
          break;

        case "notifications":
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notification", id] });
          break;

        default:
          break;
      }
    };

    // Handle user deletion (force logout)
    const handleUserDeleted = () => {
      toast.error("Your account has been deleted", {
        description: "You have been logged out",
        duration: 5000,
      });

      // Sign out and redirect
      setTimeout(() => {
        localStorage.clear();
        navigate("/auth");
      }, 1000);
    };

    // Handle project changes
    const handleProjectChanged = ({
      projectId,
      operation,
    }: {
      projectId: string;
      operation: string;
    }) => {
      if (operation === "delete") {
        toast.info("A project you were part of has been removed");
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    };

    // Handle task changes
    const handleTaskChanged = ({ taskId }: { taskId: string }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
    };

    // Handle new notifications
    const handleNewNotification = ({
      notification,
    }: {
      notificationId: string;
      notification: any;
    }) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      toast.info(notification.title || "New notification", {
        description: notification.message,
      });
    };

    // Subscribe to events
    socketService.on("database:change", handleDatabaseChange);
    socketService.on("user:deleted", handleUserDeleted);
    socketService.on("project:changed", handleProjectChanged);
    socketService.on("task:changed", handleTaskChanged);
    socketService.on("notification:new", handleNewNotification);

    // Cleanup on unmount
    return () => {
      socketService.off("database:change", handleDatabaseChange);
      socketService.off("user:deleted", handleUserDeleted);
      socketService.off("project:changed", handleProjectChanged);
      socketService.off("task:changed", handleTaskChanged);
      socketService.off("notification:new", handleNewNotification);
      socketService.disconnect();
    };
  }, [userId, queryClient, navigate]);

  return {
    isConnected: socketService.isConnected(),
  };
};
