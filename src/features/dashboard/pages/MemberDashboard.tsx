import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/shared/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { GlassCard } from "@/shared/components/ui/GlassCard";
import {
  CheckSquare,
  Clock,
  FolderKanban,
  TrendingUp,
  Activity,
  Edit,
} from "lucide-react";
import { Progress } from "@/shared/components/ui/progress";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  StatCardSkeleton,
  CompletionCardSkeleton,
  RecentTasksSkeleton,
} from "@/shared/components/common/SkeletonLoaders";
import { taskService, projectService } from "@/shared/services/api";
import { Task, Project } from "@/types";
import { TaskEditDialog } from "@/features/tasks/components/TaskEditDialog";

export default function UserDashboard() {
  const { userData } = useAuth();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => taskService.getAll(),
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getAll(),
  });

  const completedTasks = tasks.filter(
    (t: Task) => t.status === "completed"
  ).length;
  const inProgressTasks = tasks.filter(
    (t: Task) => t.status === "in_progress"
  ).length;
  const overdueTasks = tasks.filter(
    (t: Task) =>
      t.deadline &&
      new Date(t.deadline) < new Date() &&
      t.status !== "completed"
  ).length;

  const stats = {
    myTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    myProjects: projects.length,
  };

  const completionRate =
    stats.myTasks > 0
      ? Math.round((stats.completedTasks / stats.myTasks) * 100)
      : 0;

  const recentTasks = tasks.slice(0, 5);

  const statCards = [
    {
      title: "My Tasks",
      value: stats.myTasks,
      icon: CheckSquare,
      color: "text-blue-500",
      bg: "bg-blue-500",
    },
    {
      title: "In Progress",
      value: stats.inProgressTasks,
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500",
    },
    {
      title: "Overdue",
      value: stats.overdueTasks,
      icon: Clock,
      color: "text-red-500",
      bg: "bg-red-500",
    },
    {
      title: "My Projects",
      value: stats.myProjects,
      icon: FolderKanban,
      color: "text-purple-500",
      bg: "bg-purple-500",
    },
  ];

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Welcome back, {userData?.fullName || "User"}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Here's an overview of your work and progress
        </p>
      </div>

      {/* Stats Grid */}
      {isLoadingTasks || isLoadingProjects ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <GlassCard
              key={stat.title}
              className="border-none ring-1 ring-white/20"
              gradient
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bg} bg-opacity-20`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Task Completion Rate */}
        {isLoadingTasks ? (
          <CompletionCardSkeleton />
        ) : (
          <Card className="col-span-4 glass">
            <CardHeader>
              <CardTitle>Task Completion</CardTitle>
              <CardDescription>
                Your overall task completion progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {stats.completedTasks} of {stats.myTasks} tasks completed
                  </span>
                  <span className="font-bold text-2xl">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-500">
                    {stats.myTasks}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total
                  </div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {stats.completedTasks}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Done</div>
                </div>
                <div className="text-center p-3 bg-muted/20 rounded-lg">
                  <div className="text-2xl font-bold text-amber-500">
                    {stats.inProgressTasks}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Active
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Projects List */}
        {isLoadingProjects ? (
          <div className="col-span-3">
            {/* Reusing RecentTasksSkeleton as placeholder or create a specific one if needed, 
                 but for now sticking to available skeletons */}
            <RecentTasksSkeleton />
          </div>
        ) : (
          <Card className="col-span-3 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                My Projects
              </CardTitle>
              <CardDescription>Projects you are a member of</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-4">
                  {projects.map((project: Project) => (
                    <div
                      key={project.id}
                      className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {project.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {project.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {project.status.replace("_", " ")}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No projects found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Tasks */}
      {isLoadingTasks ? (
        <RecentTasksSkeleton />
      ) : (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
            <CardDescription>Your most recently assigned tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task: Task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        task.status === "completed"
                          ? "bg-green-500/10 text-green-500"
                          : task.status === "in_progress"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      <CheckSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {typeof task.projectId === "object" &&
                        task.projectId?.title
                          ? task.projectId.title
                          : "No Project"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        task.status === "completed"
                          ? "default"
                          : task.status === "in_progress"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEditTask(task)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No recent tasks
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <TaskEditDialog
        task={editingTask}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}
