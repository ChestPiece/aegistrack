import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProjectCardSkeleton } from "@/components/SkeletonLoaders";
import { projectService } from "@/services/api";

interface ProjectTask {
  status: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  status: "active" | "completed" | "on_hold";
  deadline?: string;
  tasks?: ProjectTask[];
  memberCount?: number;
}

export default function MyProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

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
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <ProjectCardSkeleton count={6} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const totalTasks = project.tasks?.length || 0;
            const completedTasks =
              project.tasks?.filter((t) => t.status === "completed").length ||
              0;
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
          {projects.length === 0 && (
            <div className="text-center py-12 col-span-full">
              <p className="text-muted-foreground">
                No projects yet. You'll see projects here once you're added as a
                member.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
