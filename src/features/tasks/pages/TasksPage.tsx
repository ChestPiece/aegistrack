import { useEffect, useState } from "react";
import { taskService, projectService, userService } from "@/shared/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Plus, Calendar } from "lucide-react";
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
import { toast } from "sonner";

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_id: "",
    assigned_to: "",
    deadline: "",
    status: "pending" as "pending" | "in_progress" | "completed",
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

      console.log("Fetched projects:", projects);
      console.log("Fetched users:", users);
      console.log("Fetched tasks:", tasks);

      // Debug: Check user data structure
      if (users && users.length > 0) {
        console.log("First user structure:", users[0]);
        console.log(
          "User supabaseIds:",
          users.map((u) => u.supabaseId)
        );
      }

      // Debug: Check task assignment data
      if (tasks && tasks.length > 0) {
        console.log(
          "Task assignedTo values:",
          tasks.map((t) => ({ id: t.id, assignedTo: t.assignedTo }))
        );
      }

      setTasks(tasks || []);
      setProjects(projects || []);
      setUsers(users || []);
    } catch (error: any) {
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
        assignedTo:
          formData.assigned_to === "__unassigned__"
            ? null
            : formData.assigned_to || null,
        projectId: formData.project_id,
      });

      toast.success("Task created successfully");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        project_id: "",
        assigned_to: "",
        deadline: "",
      });
      fetchData();
    } catch (error: any) {
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
    } catch (error: any) {
      toast.error("Failed to update task");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage all tasks across projects
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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
                  <Label htmlFor="assigned" className="text-sm font-medium">
                    Assign to (optional)
                  </Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assigned_to: value })
                    }
                    disabled={!formData.project_id}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue
                        placeholder={
                          formData.project_id
                            ? "Select member"
                            : "Select project first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unassigned__">Unassigned</SelectItem>
                      {projectMembers.map((user) => (
                        <SelectItem key={user.id} value={user.supabaseId}>
                          {user.fullName || user.email}
                        </SelectItem>
                      ))}
                      {projectMembers.length === 0 && formData.project_id && (
                        <SelectItem value="__no_members__" disabled>
                          No members in this project
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {formData.project_id && (
                    <p className="text-xs text-muted-foreground">
                      {projectMembers.length} member(s) in this project
                    </p>
                  )}
                </div>
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

      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="glass hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {task.projects?.title || "No project"}
                  </p>
                </div>
                <Select
                  value={task.status}
                  onValueChange={(value) => updateTaskStatus(task.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.description && (
                <p className="text-sm text-muted-foreground">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm">
                {task.assignedTo ? (
                  <span className="text-muted-foreground">
                    Assigned to:{" "}
                    {(() => {
                      const assignedUser = users.find(
                        (u) => u.supabaseId === task.assignedTo
                      );
                      if (!assignedUser) {
                        console.warn(
                          `User not found for task ${task.id}, assignedTo: ${task.assignedTo}`
                        );
                        console.warn(
                          "Available user IDs:",
                          users.map((u) => u.supabaseId)
                        );
                        return "Unknown User";
                      }
                      return (
                        assignedUser.fullName || assignedUser.email || "No Name"
                      );
                    })()}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
                {task.deadline && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(task.deadline).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No tasks yet. Create your first task!
          </p>
        </div>
      )}
    </div>
  );
}

