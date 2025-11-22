import { supabase } from "@/integrations/supabase/client";

const API_URL = "http://localhost:5000/api";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

const apiRequest = async (endpoint: string, options: RequestOptions = {}) => {
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
  get: (endpoint: string) => apiRequest(endpoint, { method: "GET" }),
  post: (endpoint: string, body: any) =>
    apiRequest(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) =>
    apiRequest(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  delete: (endpoint: string) => apiRequest(endpoint, { method: "DELETE" }),
};

export const projectService = {
  getAll: () => api.get("/projects"),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post("/projects", data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const taskService = {
  getAll: () => api.get("/tasks"),
  create: (data: any) => api.post("/tasks", data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const userService = {
  sync: () => api.post("/users/sync", {}),
  getCurrent: () => api.get("/users/me"),
  getAll: () => api.get("/users"),
};
