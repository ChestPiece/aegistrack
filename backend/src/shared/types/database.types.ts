import { Document } from "mongoose";

/**
 * MongoDB Change Stream Event Types
 */
export type ChangeStreamOperationType =
  | "insert"
  | "update"
  | "replace"
  | "delete"
  | "drop"
  | "rename"
  | "dropDatabase"
  | "invalidate";

export interface ChangeStreamDocument<T = any> {
  _id: {
    _data: string;
  };
  operationType: ChangeStreamOperationType;
  clusterTime: any;
  ns: {
    db: string;
    coll: string;
  };
  documentKey: {
    _id: string;
  };
  fullDocument?: T;
  updateDescription?: {
    updatedFields: Partial<T>;
    removedFields: string[];
  };
}

/**
 * Query filter types for database operations
 */
export interface UserQuery {
  role?: string;
  status?: string;
  supabaseId?: string;
  email?: string;
  isActive?: boolean;
}

export interface TaskQuery {
  $or?: Array<{ assignedTo: string } | { createdBy: string }>;
  status?: string | { $ne: string };
  projectId?: string;
  assignedTo?: string;
  createdBy?: string;
}

export interface ProjectQuery {
  createdBy?: string;
  members?: string | { $in: string[] };
  status?: string;
}

export interface NotificationQuery {
  userId: string;
  read?: boolean;
}

/**
 * Request body types for API endpoints
 */
export interface CreateTaskBody {
  title: string;
  description?: string;
  deadline?: Date;
  status?: string;
  priority?: string;
  projectId?: string;
  assignedTo?: string[];
}

export interface UpdateTaskBody extends Partial<CreateTaskBody> {
  flagged?: boolean;
}

export interface CreateProjectBody {
  title: string;
  description?: string;
  deadline?: Date;
  status?: string;
  members?: string[];
}

export interface UpdateUserBody {
  fullName?: string;
  role?: string;
  status?: string;
  profilePic?: string;
  company?: string;
  bio?: string;
  location?: string;
}

/**
 * Error response types
 */
export interface ErrorResponse {
  error: string;
  details?: any;
}

export interface SuccessResponse<T = any> {
  message: string;
  data?: T;
}
