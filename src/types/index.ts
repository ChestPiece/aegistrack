export interface User {
  id: string;
  supabaseId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role?: "admin" | "member";
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: "planning" | "active" | "on_hold" | "completed" | "archived";
  deadline?: string;
  createdBy: string;
  members: string[];
  tasks?: Task[];
  taskCount?: number;
  completedTaskCount?: number;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  deadline?: string;
  projectId?: Project | string;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

// Type helpers
export type TaskStatus = Task["status"];
export type ProjectStatus = Project["status"];
export type UserRole = User["role"];
