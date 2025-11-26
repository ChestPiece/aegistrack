import { supabase } from "@/integrations/supabase/client";

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
