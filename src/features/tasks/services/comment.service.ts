import { api } from "@/shared/services/api-client";
import { Comment } from "@/shared/types";

export const commentService = {
  getTaskComments: (taskId: string): Promise<Comment[]> =>
    api.get<Comment[]>(`/comments/task/${taskId}`),
  addTaskComment: (taskId: string, content: string): Promise<Comment> =>
    api.post<Comment, { content: string }>(`/comments/task/${taskId}`, {
      content,
    }),
};
