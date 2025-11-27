import { supabase } from "@/integrations/supabase/client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
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

  // Build query string from params
  let url = `${API_URL}${endpoint}`;
  if (options.params) {
    const queryString = new URLSearchParams(
      Object.entries(options.params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ).toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
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
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    apiRequest<T>(endpoint, { method: "GET", ...options }),
  post: <T, B = unknown>(endpoint: string, body: B): Promise<T> =>
    apiRequest<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
  put: <T, B = unknown>(endpoint: string, body: B): Promise<T> =>
    apiRequest<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T, B = unknown>(endpoint: string, body: B): Promise<T> =>
    apiRequest<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(endpoint: string): Promise<T> =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};
