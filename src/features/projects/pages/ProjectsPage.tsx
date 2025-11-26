import { useEffect, useState } from "react";
import { projectService, userService } from "@/shared/services/api";
import { User } from "@/types";
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
import { Checkbox } from "@/shared/components/ui/checkbox";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { toast } from "sonner";

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
  });

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userService.getAll();
      setUsers(data || []);
    } catch (error: any) {
      console.error("Failed to load users:", error);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

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
      setFormData({ title: "", description: "", deadline: "" });
      setSelectedMembers([]);
      fetchProjects();
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

  const openMemberDialog = (project: any) => {
    setSelectedProject(project);
    setMemberDialogOpen(true);
    setMemberSearchTerm("");
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedProject) return;

    try {
      await projectService.addMembers(selectedProject.id, [userId]);
      toast.success("Member added successfully");
      fetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedProject) return;

    try {
      await projectService.removeMember(selectedProject.id, userId);
      toast.success("Member removed successfully");
      fetchProjects();
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
    const filtered = users.filter(
      (user) => !selectedProject.members?.includes(user.supabaseId)
    );
    if (!memberSearchTerm) return filtered;
    return filtered.filter(
      (user) =>
        user.fullName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
    );
  };

  const handleArchiveProject = async (projectId: string) => {
    try {
      await projectService.update(projectId, { status: "archived" });
      toast.success("Project archived successfully");
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to archive project");
    }
  };

  const openEditDialog = (project: any) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || "",
      deadline: project.deadline
        ? new Date(project.deadline).toISOString().split("T")[0]
        : "",
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
      setFormData({ title: "", description: "", deadline: "" });
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to update project");
    }
  };

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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to track tasks and collaborate with your team
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Team Members (optional)</Label>
                <ScrollArea className="h-32 w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={user.id}
                          checked={selectedMembers.includes(user.supabaseId)}
                          onCheckedChange={() => toggleMember(user.supabaseId)}
                        />
                        <label
                          htmlFor={user.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {user.fullName || user.email}
                          {user.role === "admin" && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (Admin)
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No members available
                      </p>
                    )}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {selectedMembers.length} member(s) selected
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update project details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Project Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Deadline (optional)</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const totalTasks = project.tasks?.length || 0;
          const completedTasks =
            project.tasks?.filter((t: any) => t.status === "completed")
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
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description || "No description"}
                </p>
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
        <DialogContent className="max-w-2xl">
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
              <Input
                placeholder="Search by name or email..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="mb-2"
              />
              <ScrollArea className="h-48 w-full rounded-md border">
                <div className="p-4 space-y-2">
                  {getAvailableMembers().map((user) => (
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
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddMember(user.supabaseId)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                  {getAvailableMembers().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {memberSearchTerm
                        ? "No users found"
                        : "All users are already members"}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
