import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ProjectCardSkeleton } from "@/components/SkeletonLoaders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { projectService } from "@/services/api";

interface ProjectTask {
  status: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: "planning" | "active" | "on_hold" | "completed" | "archived";
  deadline?: string;
  tasks?: ProjectTask[];
  memberCount?: number;
}

export default function MyProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data || []);
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
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
      case "planning":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") return true;
    return project.status === filter;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
        <p className="text-muted-foreground">Projects you're contributing to</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">
              {projects.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-2">
              {projects.filter((p) => p.status === "active").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="planning">
            Planning
            <Badge variant="secondary" className="ml-2">
              {projects.filter((p) => p.status === "planning").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            <Badge variant="secondary" className="ml-2">
              {projects.filter((p) => p.status === "completed").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="on_hold">
            On Hold
            <Badge variant="secondary" className="ml-2">
              {projects.filter((p) => p.status === "on_hold").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <ProjectCardSkeleton count={6} />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => {
                const totalTasks = project.tasks?.length || 0;
                const completedTasks =
                  project.tasks?.filter((t) => t.status === "completed")
                    .length || 0;
                const inProgressTasks =
                  project.tasks?.filter((t) => t.status === "in_progress")
                    .length || 0;
                const pendingTasks =
                  project.tasks?.filter((t) => t.status === "pending").length ||
                  0;
                const completionRate =
                  totalTasks > 0
                    ? Math.round((completedTasks / totalTasks) * 100)
                    : 0;

                return (
                  <Card
                    key={project.id}
                    className="glass hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {project.title}
                        </CardTitle>
                        <Badge variant={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description || "No description"}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Task Breakdown */}
                      {totalTasks > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {pendingTasks > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {pendingTasks} Pending
                            </Badge>
                          )}
                          {inProgressTasks > 0 && (
                            <Badge variant="default" className="text-xs">
                              {inProgressTasks} Active
                            </Badge>
                          )}
                          {completedTasks > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {completedTasks} Done
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Progress Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-medium">{completionRate}%</span>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {completedTasks} of {totalTasks} tasks completed
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{project.memberCount || 0} members</span>
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
                    </CardContent>
                  </Card>
                );
              })}
              {filteredProjects.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20">
                  <FolderKanban className="h-20 w-20 text-muted-foreground/50 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {filter === "all"
                      ? "No projects yet"
                      : `No ${getStatusLabel(filter).toLowerCase()} projects`}
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {filter === "all"
                      ? "You haven't been added to any projects yet. Once a project manager adds you to a project, it will appear here."
                      : `You don't have any ${getStatusLabel(
                          filter
                        ).toLowerCase()} projects at the moment.`}
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
