import { api } from "@/shared/services/api-client";
import { User } from "@/shared/types";

export const userService = {
  sync: (): Promise<User> =>
    api.post<User, Record<string, never>>("/users/sync", {}),
  getCurrent: (): Promise<User> => api.get<User>("/users/me"),
  updateProfile: (data: {
    fullName?: string;
    phoneNumber?: string;
    company?: string;
    bio?: string;
    location?: string;
    avatarUrl?: string;
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
};
