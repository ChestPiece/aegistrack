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

interface Project {
  _id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  deadline?: string;
  projectId?: Project;
}

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          Manage and track your assigned tasks
        </p>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">
            All Tasks
            <Badge variant="secondary" className="ml-2">
              {tasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">
              {
                tasks.filter(
                  (t) => t.status === "pending" || t.status === "in_progress"
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge variant="secondary" className="ml-2">
              {tasks.filter((t) => t.status === "completed").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="grid gap-4">
              <TaskCardSkeleton count={5} />
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <Collapsible
                  key={task.id}
                  open={expandedTasks.has(task.id)}
                  onOpenChange={() => toggleExpanded(task.id)}
                >
                  <Card
                    className={`glass hover:shadow-md transition-all border-l-4 ${
                      task.status === "completed"
                        ? "border-l-green-500"
                        : task.status === "in_progress"
                        ? "border-l-blue-500"
                        : "border-l-gray-400"
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <CardTitle className="text-lg">
                            {task.title}
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getStatusVariant(task.status)}>
                              {getStatusLabel(task.status)}
                            </Badge>
                            {task.status !== "completed" &&
                              isOverdue(task.deadline) && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Overdue
                                </Badge>
                              )}
                            {task.projectId?.title && (
                              <Badge variant="outline">
                                {task.projectId.title}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={task.status}
                            onValueChange={(value) =>
                              updateTaskStatus(task.id, value as any)
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1">
                              <ChevronDown
                                className={`h-4 w-4 transition-transform ${
                                  expandedTasks.has(task.id) ? "rotate-180" : ""
                                }`}
                              />
                              {expandedTasks.has(task.id) ? "Hide" : "Details"}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {task.description && (
                        <p className="text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        {task.deadline && (
                          <div
                            className={`flex items-center gap-1 ${
                              isOverdue(task.deadline) &&
                              task.status !== "completed"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <CollapsibleContent>
                        <CommentSection taskId={task.id} />
                      </CollapsibleContent>
                    </CardContent>
                  </Card>
                </Collapsible>
              ))}
              {filteredTasks.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16">
                  <CheckSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {filter === "completed"
                      ? "No completed tasks"
                      : filter === "active"
                      ? "No active tasks"
                      : "No tasks yet"}
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md">
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
