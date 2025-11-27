import { useEffect, useState } from "react";
import { useAuth } from "@/shared/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Calendar, CheckSquare, AlertCircle, ChevronDown } from "lucide-react";
import { TaskCardSkeleton } from "@/shared/components/common/SkeletonLoaders";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/ui/collapsible";
import { CommentSection } from "@/shared/components/common/CommentSection";
import { toast } from "sonner";
import { taskService } from "@/shared/services/api";

import { Task, Project } from "@/shared/types";

export default function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const data = await taskService.getAll();
      setTasks(data || []);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: "pending" | "in_progress" | "completed"
  ) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      toast.success("Task status updated");
      fetchTasks();
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "secondary";
      case "in_progress":
        return "default";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Pending";
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date() && true;
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    if (filter === "active")
      return task.status === "pending" || task.status === "in_progress";
    if (filter === "completed") return task.status === "completed";
    return true;
  });

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          Manage and track your assigned tasks
        </p>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "active" | "completed")}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All Tasks
            <Badge
              variant="secondary"
              className="rounded-full px-2 py-0 text-xs"
            >
              {tasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            Active
            <Badge
              variant="secondary"
              className="rounded-full px-2 py-0 text-xs"
            >
              {
                tasks.filter(
                  (t) => t.status === "pending" || t.status === "in_progress"
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            Completed
            <Badge
              variant="secondary"
              className="rounded-full px-2 py-0 text-xs"
            >
              {tasks.filter((t) => t.status === "completed").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <TaskCardSkeleton count={8} />
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTasks.map((task) => (
                <Collapsible
                  key={task.id}
                  open={expandedTasks.has(task.id)}
                  onOpenChange={() => toggleExpanded(task.id)}
                  className="h-full"
                >
                  <Card className="glass hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-1">
                          {task.title}
                        </CardTitle>
                        <Badge variant={getStatusVariant(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {task.description || "No description provided"}
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4 flex-1 flex flex-col">
                      {/* Priority and Tags */}
                      <div className="flex flex-wrap gap-2">
                        {task.priority && (
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {task.priority} Priority
                          </Badge>
                        )}
                        {task.status !== "completed" &&
                          isOverdue(task.deadline) && (
                            <Badge
                              variant="destructive"
                              className="text-xs gap-1"
                            >
                              <AlertCircle className="h-3 w-3" />
                              Overdue
                            </Badge>
                          )}
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t mt-auto">
                        <div className="flex items-center gap-1 truncate max-w-[60%]">
                          <CheckSquare className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {(task.projectId as Project)?.title || "No Project"}
                          </span>
                        </div>
                        {task.deadline && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex items-center justify-between gap-2">
                        <Select
                          value={task.status}
                          onValueChange={(value) =>
                            updateTaskStatus(
                              task.id,
                              value as "pending" | "in_progress" | "completed"
                            )
                          }
                        >
                          <SelectTrigger className="h-8 text-xs w-[110px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">
                              In Progress
                            </SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>

                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                          >
                            {expandedTasks.has(task.id) ? "Hide" : "Details"}
                            <ChevronDown
                              className={`h-3 w-3 transition-transform ${
                                expandedTasks.has(task.id) ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent>
                        <div className="pt-4 border-t border-border/50">
                          <CommentSection taskId={task.id} />
                        </div>
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              ))}
              {filteredTasks.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] py-12">
                  <CheckSquare className="h-24 w-24 text-muted-foreground/40 mb-6" />
                  <h3 className="text-2xl font-semibold mb-3">
                    {filter === "completed"
                      ? "No completed tasks"
                      : filter === "active"
                      ? "No active tasks"
                      : "No tasks yet"}
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md leading-relaxed">
                    {filter === "completed"
                      ? "You haven't completed any tasks yet. Keep working on your active tasks!"
                      : filter === "active"
                      ? "You don't have any active tasks. Great job staying on top of everything!"
                      : "You don't have any tasks assigned. Check back later or reach out to your project manager."}
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
