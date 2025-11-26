import { api } from "@/shared/services/api-client";
import { Project } from "@/shared/types";

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
