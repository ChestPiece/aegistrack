import { api } from "@/shared/services/api-client";
import { Notification } from "@/shared/types";

export const notificationService = {
  getAll: (): Promise<Notification[]> =>
    api.get<Notification[]>("/notifications"),
  markAsRead: (id: string): Promise<Notification> =>
    api.put<Notification, Record<string, never>>(
      `/notifications/${id}/read`,
      {}
    ),
  markAllAsRead: (): Promise<{ message: string }> =>
    api.put<{ message: string }, Record<string, never>>(
      "/notifications/read-all",
      {}
    ),
};
