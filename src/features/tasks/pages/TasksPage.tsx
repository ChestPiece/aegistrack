import { useEffect, useState } from "react";
import {
  taskService,
  projectService,
  userService,
} from "@/shared/services/api";
import { Task, Project, User } from "@/shared/types";
import { useAuth } from "@/shared/contexts/AuthContext";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { GlassCard } from "@/shared/components/ui/GlassCard";
import { Button } from "@/shared/components/ui/button";
import {
  Plus,
  Calendar,
  User as UserIcon,
  Clock,
  Pencil,
  Archive,
  Flag,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { MultiSelect } from "@/shared/components/ui/multi-select";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { DashboardSkeleton } from "@/shared/components/skeletons/DashboardSkeleton";

export default function Tasks() {
  const { user: currentUser, userRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectMembers, setProjectMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    project_id: string;

    assigned_to: string[];
    deadline: string;
    status: "pending" | "in_progress" | "completed" | "archived";
    priority: "low" | "medium" | "high";
  }>({
    title: "",
    description: "",
    project_id: "",
    assigned_to: [],
    deadline: "",
    status: "pending",
    priority: "medium",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasks, projects, users] = await Promise.all([
        taskService.getAll(),
        projectService.getAll(),
        userService.getAll(),
      ]);

      setTasks(tasks || []);
      setProjects(projects || []);
      setUsers(users || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Update project members when project is selected
  useEffect(() => {
    if (formData.project_id) {
      const selectedProject = projects.find(
        (p) => p.id === formData.project_id
      );
      if (selectedProject && selectedProject.members) {
        const members = users.filter((u) =>
          selectedProject.members.includes(u.supabaseId)
        );
        setProjectMembers(members);
      } else {
        setProjectMembers([]);
      }
    } else {
      setProjectMembers([]);
    }
  }, [formData.project_id, projects, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskService.create({
        ...formData,
        deadline: formData.deadline || null,
        assignedTo: formData.assigned_to,
        projectId: formData.project_id,
      });

      toast.success("Task created successfully");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        project_id: "",
        assigned_to: [],
        deadline: "",
        status: "pending",
        priority: "medium",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create task");
    }
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: "pending" | "in_progress" | "completed"
  ) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      toast.success("Task status updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      await taskService.update(taskId, { status: "archived" });
      toast.success("Task archived successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to archive task");
    }
  };

  const handleFlagTask = async (task: Task) => {
    try {
      await taskService.update(task.id, { flagged: !task.flagged });
      toast.success(task.flagged ? "Task unflagged" : "Task flagged");
      fetchData();
    } catch (error) {
      toast.error("Failed to update flag status");
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      project_id:
        (task.projectId as Project)?.id || (task.projectId as string) || "",
      assigned_to: task.assignedTo || [],
      deadline: task.deadline
        ? new Date(task.deadline).toISOString().split("T")[0]
        : "",
      status: task.status,
      priority: task.priority || "medium",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await taskService.update(editingTask.id, {
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline || null,
        assignedTo: formData.assigned_to,
        projectId: formData.project_id,
        priority: formData.priority,
      });
      toast.success("Task updated successfully");
      setIsEditDialogOpen(false);
      setEditingTask(null);
      setFormData({
        title: "",
        description: "",
        project_id: "",
        assigned_to: [],
        deadline: "",
        status: "pending",
        priority: "medium",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"; // Greenish usually
      case "in_progress":
        return "secondary"; // Yellowish/Orange usually
      default:
        return "outline"; // Gray usually
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getAssignedUsers = (userIds: string[] | undefined) => {
    if (!userIds || userIds.length === 0) return [];
    return users.filter((u) => userIds.includes(u.supabaseId));
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tasks
          </h1>
          <p className="text-muted-foreground">
            Manage all tasks across projects
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Task</DialogTitle>
              <DialogDescription>Add a new task to a project</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  Task Title
                </Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  className="h-10"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="project" className="text-sm font-medium">
                    Project
                  </Label>
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, project_id: value })
                    }
                    required
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-sm font-medium">
                    Priority
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        priority: value as "low" | "medium" | "high",
                      })
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Assign to (optional)
                  </Label>
                  <MultiSelect
                    options={projectMembers.map((user) => ({
                      value: user.supabaseId,
                      label: user.fullName || user.email,
                      subtitle: user.email,
                    }))}
                    selected={formData.assigned_to}
                    onChange={(selected) =>
                      setFormData({ ...formData, assigned_to: selected })
                    }
                    placeholder={
                      formData.project_id
                        ? "Select members..."
                        : "Select project first"
                    }
                    className={
                      !formData.project_id
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }
                  />
                  {formData.project_id && (
                    <p className="text-xs text-muted-foreground">
                      {projectMembers.length} member(s) in this project
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deadline" className="text-sm font-medium">
                    Deadline (optional)
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    className="h-10"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the task (optional)"
                  className="min-h-[80px] resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 px-5"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="h-10 px-5">
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTask} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-sm font-medium">
                Task Title
              </Label>
              <Input
                id="edit-title"
                placeholder="Enter task title"
                className="h-10"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-project" className="text-sm font-medium">
                  Project
                </Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_id: value })
                  }
                  required
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-priority" className="text-sm font-medium">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      priority: value as "low" | "medium" | "high",
                    })
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Assign to (optional)
                </Label>
                <MultiSelect
                  options={projectMembers.map((user) => ({
                    value: user.supabaseId,
                    label: user.fullName || user.email,
                    subtitle: user.email,
                  }))}
                  selected={formData.assigned_to}
                  onChange={(selected) =>
                    setFormData({ ...formData, assigned_to: selected })
                  }
                  placeholder={
                    formData.project_id
                      ? "Select members..."
                      : "Select project first"
                  }
                  className={
                    !formData.project_id ? "opacity-50 pointer-events-none" : ""
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-deadline" className="text-sm font-medium">
                  Deadline (optional)
                </Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  className="h-10"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="edit-description"
                placeholder="Describe the task (optional)"
                className="min-h-[80px] resize-none"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 px-5"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-10 px-5">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task, index) => {
          const assignedUsers = getAssignedUsers(task.assignedTo);
          const canEdit =
            userRole === "admin" ||
            (task.assignedTo &&
              task.assignedTo.includes(currentUser?.id || ""));

          return (
            <GlassCard
              key={task.id}
              className={`hover:shadow-lg transition-all duration-300 group ${
                task.flagged ? "ring-2 ring-red-500/50" : ""
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-semibold leading-tight">
                        {task.title}
                      </CardTitle>
                      {task.flagged && (
                        <Flag className="h-4 w-4 text-red-500 fill-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
                        {(task.projectId as Project)?.title || "No Project"}
                      </span>
                      <Badge
                        variant={
                          getPriorityColor(task.priority || "medium") as
                            | "default"
                            | "secondary"
                            | "destructive"
                            | "outline"
                        }
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {(task.priority || "medium").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFlagTask(task)}
                      className={`h-8 w-8 p-0 ${
                        task.flagged
                          ? "text-red-500"
                          : "text-muted-foreground hover:text-red-500"
                      }`}
                      title={task.flagged ? "Unflag task" : "Flag task"}
                    >
                      <Flag
                        className={`h-4 w-4 ${
                          task.flagged ? "fill-current" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(task)}
                      className="h-8 w-8 p-0"
                      disabled={!canEdit}
                      title={
                        !canEdit
                          ? "Only admins and assignees can edit"
                          : "Edit task"
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchiveTask(task.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Badge
                      variant={getStatusColor(task.status)}
                      className="capitalize shrink-0"
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                  {task.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <div className="flex -space-x-2 overflow-hidden">
                        {assignedUsers.length > 0 ? (
                          assignedUsers.map((user) => (
                            <Avatar
                              key={user.id}
                              className="inline-block h-6 w-6 rounded-full ring-2 ring-background"
                            >
                              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                                {(user.fullName || user.email || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Unassigned
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {assignedUsers.length > 0
                          ? `${assignedUsers.length} Assignee${
                              assignedUsers.length > 1 ? "s" : ""
                            }`
                          : "No Assignees"}
                      </span>
                    </div>
                  </div>

                  {task.deadline && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Deadline
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Select
                    value={task.status}
                    onValueChange={(value) =>
                      updateTaskStatus(
                        task.id,
                        value as "pending" | "in_progress" | "completed"
                      )
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger className="w-full h-8 text-xs bg-muted/50 border-none">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </GlassCard>
          );
        })}
      </div>

      {tasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-muted/30 mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-muted-foreground mt-1">
            Get started by creating your first task.
          </p>
        </div>
      )}
    </div>
  );
}
