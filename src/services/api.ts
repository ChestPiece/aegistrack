import { supabase } from "@/integrations/supabase/client";
import { Project, Task, User, Notification, Comment } from "@/types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("No authentication token found");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.statusText}`);
  }

  return response.json();
};

export const api = {
  get: <T>(endpoint: string): Promise<T> =>
    apiRequest<T>(endpoint, { method: "GET" }),
  post: <T, B = unknown>(endpoint: string, body: B): Promise<T> =>
    apiRequest<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T, B = unknown>(endpoint: string, body: B): Promise<T> =>
    apiRequest<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string): Promise<T> =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};

export const projectService = {
  getAll: (): Promise<Project[]> => api.get<Project[]>("/projects"),
  getById: (id: string): Promise<Project> =>
    api.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>): Promise<Project> =>
    api.post<Project, Partial<Project>>("/projects", data),
  update: (id: string, data: Partial<Project>): Promise<Project> =>
    api.put<Project, Partial<Project>>(`/projects/${id}`, data),
  delete: (id: string): Promise<void> => api.delete<void>(`/projects/${id}`),
  addMembers: (id: string, memberIds: string[]): Promise<Project> =>
    api.post<Project, { memberIds: string[] }>(`/projects/${id}/members`, {
      memberIds,
    }),
  removeMember: (id: string, memberId: string): Promise<Project> =>
    api.delete<Project>(`/projects/${id}/members/${memberId}`),
};

export const taskService = {
  getAll: (): Promise<Task[]> => api.get<Task[]>("/tasks"),
  create: (data: Partial<Task>): Promise<Task> =>
    api.post<Task, Partial<Task>>("/tasks", data),
  update: (id: string, data: Partial<Task>): Promise<Task> =>
    api.put<Task, Partial<Task>>(`/tasks/${id}`, data),
  delete: (id: string): Promise<void> => api.delete<void>(`/tasks/${id}`),
};

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
  update: (
    id: string,
    data: { fullName?: string; role?: "admin" | "member" }
  ): Promise<User> => api.put<User, typeof data>(`/users/${id}`, data),
  delete: (id: string): Promise<{ message: string }> =>
    api.delete<{ message: string }>(`/users/${id}`),
};

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

export const commentService = {
  getTaskComments: (taskId: string): Promise<Comment[]> =>
    api.get<Comment[]>(`/comments/task/${taskId}`),
  addTaskComment: (taskId: string, content: string): Promise<Comment> =>
    api.post<Comment, { content: string }>(`/comments/task/${taskId}`, {
      content,
    }),
};
