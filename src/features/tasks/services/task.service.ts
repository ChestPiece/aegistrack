import { api } from "@/shared/services/api-client";
import { Task } from "@/shared/types";

export const taskService = {
  getAll: (params?: { archived?: boolean }): Promise<Task[]> =>
    api.get<Task[]>("/tasks", { params }),
  create: (data: Partial<Task>): Promise<Task> =>
    api.post<Task, Partial<Task>>("/tasks", data),
  update: (id: string, data: Partial<Task>): Promise<Task> =>
    api.put<Task, Partial<Task>>(`/tasks/${id}`, data),
  delete: (id: string): Promise<void> => api.delete<void>(`/tasks/${id}`),
};
