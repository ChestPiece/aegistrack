import { useEffect, useState } from "react";
import { taskService, projectService } from "@/shared/services/api";
import { GlassCard } from "@/shared/components/ui/GlassCard";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Archive, RotateCcw, Trash2, FolderOpen, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

export default function ArchivedPage() {
  const [archivedProjects, setArchivedProjects] = useState<any[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "project" | "task";
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    fetchArchivedItems();
  }, []);

  const fetchArchivedItems = async () => {
    try {
      const [projects, tasks] = await Promise.all([
        projectService.getAll({ archived: true }),
        taskService.getAll({ archived: true }),
      ]);

      setArchivedProjects(projects || []);
      setArchivedTasks(tasks || []);
    } catch (error: any) {
      console.error("Error fetching archived items:", error);
      toast.error("Failed to load archived items");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      await projectService.update(projectId, { status: "active" });
      toast.success("Project restored successfully");
      fetchArchivedItems();
    } catch (error: any) {
      toast.error("Failed to restore project");
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    try {
      await taskService.update(taskId, { status: "pending" });
      toast.success("Task restored successfully");
      fetchArchivedItems();
    } catch (error: any) {
      toast.error("Failed to restore task");
    }
  };

  const openDeleteDialog = (
    type: "project" | "task",
    id: string,
    title: string
  ) => {
    setItemToDelete({ type, id, title });
    setDeleteDialogOpen(true);
  };

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "project") {
        await projectService.delete(itemToDelete.id);
        toast.success("Project permanently deleted");
      } else {
        await taskService.delete(itemToDelete.id);
        toast.success("Task permanently deleted");
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchArchivedItems();
    } catch (error: any) {
      toast.error("Failed to delete item");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading archived items...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          <Archive className="inline-block h-8 w-8 mb-1 mr-2" />
          Archived Items
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage your archived projects and tasks. Restore or permanently delete
          them.
        </p>
      </div>

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="projects">
            Projects ({archivedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({archivedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {archivedProjects.length === 0 ? (
            <Card className="glass">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No archived projects
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedProjects.map((project, index) => (
                <GlassCard
                  key={project.id}
                  className="hover:shadow-lg transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        Archived
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description || "No description"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreProject(project.id)}
                        className="flex-1"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          openDeleteDialog("project", project.id, project.title)
                        }
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {archivedTasks.length === 0 ? (
            <Card className="glass">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No archived tasks
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedTasks.map((task, index) => (
                <GlassCard
                  key={task.id}
                  className="hover:shadow-lg transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        Archived
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {task.description || "No description"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreTask(task.id)}
                        className="flex-1"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          openDeleteDialog("task", task.id, task.title)
                        }
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {itemToDelete?.type}{" "}
              <span className="font-semibold">"{itemToDelete?.title}"</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
