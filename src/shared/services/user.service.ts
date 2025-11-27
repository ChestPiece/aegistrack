import { api } from "./api-client";
import { User } from "@/shared/types";

export const userService = {
  getProfile: (): Promise<User> => api.get<User>("/users/me"),
  getCurrent: (): Promise<User> => api.get<User>("/users/me"),
  sync: (): Promise<User> => api.post<User>("/users/sync", {}),
  updateProfile: (data: {
    fullName?: string;
    avatarUrl?: string;
    phoneNumber?: string;
    company?: string;
    bio?: string;
    location?: string;
  }): Promise<User> => api.put<User, typeof data>("/users/profile", data),
  getAll: (): Promise<User[]> => api.get<User[]>("/users"),
  create: (data: {
    email: string;
    password: string;
    fullName?: string;
    role?: "admin" | "member";
  }): Promise<User> => api.post<User, typeof data>("/users", data),
  invite: (data: {
    email: string;
    role: string;
    fullName: string;
    password: string;
  }): Promise<{ message: string; user: User }> =>
    api.post<{ message: string; user: User }, typeof data>(
      "/users/invite",
      data
    ),
  confirmInvite: (): Promise<{ message: string; user: User }> =>
    api.post<{ message: string; user: User }, Record<string, never>>(
      "/users/confirm-invite",
      {}
    ),
  update: (
    id: string,
    data: { fullName?: string; role?: "admin" | "member" }
  ): Promise<User> => api.put<User, typeof data>(`/users/${id}`, data),
  delete: (id: string): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/users/${id}`),
  resendInvitation: (id: string): Promise<{ message: string; user: User }> =>
    api.post<{ message: string; user: User }, Record<string, never>>(
      `/users/${id}/resend-invitation`,
      {}
    ),
  disable: (id: string): Promise<{ message: string; user: User }> =>
    api.patch<{ message: string; user: User }, Record<string, never>>(
      `/users/${id}/disable`,
      {}
    ),
  enable: (id: string): Promise<{ message: string; user: User }> =>
    api.patch<{ message: string; user: User }, Record<string, never>>(
      `/users/${id}/enable`,
      {}
    ),
  rejectReactivation: (id: string): Promise<{ message: string; user: User }> =>
    api.patch<{ message: string; user: User }, Record<string, never>>(
      `/users/${id}/reject-reactivation`,
      {}
    ),
};
