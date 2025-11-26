import { useEffect, useState } from "react";
import { projectService, userService } from "@/services/api";
import { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
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
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status.replace("_", " ")}
                  </Badge>
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
    </div>
  );
}
