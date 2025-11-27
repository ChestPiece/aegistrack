import { useState } from "react";
import { projectService, userService } from "@/shared/services/api";
import { User, Project, Task } from "@/shared/types";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Plus,
  Calendar,
  Users,
  UserPlus,
  X,
  Pencil,
  Archive,
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
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { toast } from "sonner";

export default function Projects() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    deadline: string;
    priority: "low" | "medium" | "high";
  }>({
    title: "",
    description: "",
    deadline: "",
    priority: "medium",
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const data = await projectService.getAll();
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      return (data || []).sort((a: Project, b: Project) => {
        const priorityA =
          priorityOrder[a.priority as keyof typeof priorityOrder] || 2;
        const priorityB =
          priorityOrder[b.priority as keyof typeof priorityOrder] || 2;
        return priorityA - priorityB;
      });
    },
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
  });

  const loading = isLoadingProjects || isLoadingUsers;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectService.create({
        ...formData,
        deadline: formData.deadline || null,
        members: selectedMembers,
      });

      toast.success("Project created successfully");
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        deadline: "",
        priority: "medium",
      });
      setSelectedMembers([]);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error: any) {
      toast.error("Failed to create project");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "on_hold":
        return "outline";
      default:
        return "outline";
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

  const openMemberDialog = (project: Project) => {
    setSelectedProject(project);
    setMemberDialogOpen(true);
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedProject) return;

    try {
      await projectService.addMembers(selectedProject.id, [userId]);
      toast.success("Member added successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedProject) return;

    try {
      await projectService.removeMember(selectedProject.id, userId);
      toast.success("Member removed successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  const getCurrentMembers = () => {
    if (!selectedProject) return [];
    return users.filter((user) =>
      selectedProject.members?.includes(user.supabaseId)
    );
  };

  const getAvailableMembers = () => {
    if (!selectedProject) return [];
    return users.filter(
      (user) => !selectedProject.members?.includes(user.supabaseId)
    );
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await projectService.update(projectId, { status: "archived" });
      toast.success("Project archived successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error: any) {
      toast.error("Failed to archive project");
    }
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || "",
      deadline: project.deadline
        ? new Date(project.deadline).toISOString().split("T")[0]
        : "",
      priority: project.priority || "medium",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      await projectService.update(editingProject.id, {
        ...formData,
        deadline: formData.deadline || null,
      });
      toast.success("Project updated successfully");
      setIsEditDialogOpen(false);
      setEditingProject(null);
      setFormData({
        title: "",
        description: "",
        deadline: "",
        priority: "medium",
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error: any) {
      toast.error("Failed to update project");
    }
  };

  // Filter users for MultiSelect to exclude current user
  const availableUsersForSelect = users.filter(
    (u) => u.supabaseId !== currentUser?.id
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage all your projects</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to track tasks and collaborate with your team
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Title */}
                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Project Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter project title"
                    className="h-10"
                    required
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1.5 md:col-span-1">
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

                {/* Deadline */}
                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="deadline" className="text-sm font-medium">
                    Deadline (optional)
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="h-10"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your project..."
                    rows={3}
                    className="resize-none min-h-[80px]"
                  />
                </div>

                {/* Team Members */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium">
                    Team Members (optional)
                  </Label>
                  <MultiSelect
                    options={availableUsersForSelect.map((user) => ({
                      value: user.supabaseId,
                      label: user.fullName || user.email,
                      subtitle: user.fullName ? user.email : undefined,
                      badge: user.role === "admin" ? "Admin" : undefined,
                      avatar: (user.fullName || user.email || "?")
                        .charAt(0)
                        .toUpperCase(),
                    }))}
                    selected={selectedMembers}
                    onChange={setSelectedMembers}
                    placeholder="Select team members..."
                    emptyText="No members available"
                  />
                  <div className="flex justify-end">
                    <span className="text-xs text-muted-foreground">
                      {selectedMembers.length} member(s) selected
                    </span>
                  </div>
                </div>
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
                  Create Project
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProject} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title" className="text-sm font-medium">
                Project Title
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter project title"
                className="h-10"
                required
              />
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

            <div className="space-y-1.5">
              <Label htmlFor="edit-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your project..."
                rows={4}
                className="resize-none min-h-[80px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-deadline" className="text-sm font-medium">
                Deadline (optional)
              </Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                className="h-10"
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const totalTasks = project.tasks?.length || 0;
          const completedTasks =
            project.tasks?.filter((t: Task) => t.status === "completed")
              .length || 0;
          const completionRate =
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;

          return (
            <Card
              key={project.id}
              className="glass hover:shadow-lg transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMemberDialog(project)}
                      className="h-8 w-8 p-0"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(project)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchiveProject(project.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Badge variant={getStatusColor(project.status)}>
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      getPriorityColor(project.priority || "medium") as
                        | "default"
                        | "secondary"
                        | "destructive"
                        | "outline"
                    }
                    className="text-xs px-2 py-0.5 h-5"
                  >
                    {(project.priority || "medium").toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {project.description || "No description"}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {project.memberCount || 0} member
                      {project.memberCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {completedTasks} of {totalTasks} tasks completed
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No projects yet. Create your first project!
          </p>
        </div>
      )}

      {/* Member Management Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto gap-6">
          <DialogHeader>
            <DialogTitle>Manage Project Members</DialogTitle>
            <DialogDescription>{selectedProject?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Members */}
            <div className="space-y-2">
              <Label>Current Members ({getCurrentMembers().length})</Label>
              <ScrollArea className="h-48 w-full rounded-md border">
                <div className="p-4 space-y-2">
                  {getCurrentMembers().map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {(user.fullName || user.email)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {user.fullName || user.email}
                          </p>
                          {user.fullName && (
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(user.supabaseId)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {getCurrentMembers().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No members in this project
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Add Members */}
            <div className="space-y-2">
              <Label>Add Members</Label>
              <Select
                onValueChange={(value) => {
                  handleAddMember(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member to add..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMembers().map((user) => (
                    <SelectItem key={user.id} value={user.supabaseId}>
                      <div className="flex flex-col">
                        <span>{user.fullName || user.email}</span>
                        {user.fullName && (
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getAvailableMembers().length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  All users are already members
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
