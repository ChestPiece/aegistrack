import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  projectService,
  taskService,
  userService,
} from "@/shared/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { GlassCard } from "@/shared/components/ui/GlassCard";
import { Button } from "@/shared/components/ui/button";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  TrendingUp,
  Shield,
  Activity,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { Task, User, Project } from "@/types";
import { getErrorMessage } from "@/shared/utils/errors";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Badge } from "@/shared/components/ui/badge";
import {
  StatsSkeleton,
  ProjectProgressSkeleton,
  AdminTeamSkeleton,
  RecentTasksSkeleton,
} from "@/shared/components/skeletons/DashboardSkeletons";
import { TaskEditDialog } from "@/features/tasks/components/TaskEditDialog";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getAll(),
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => taskService.getAll(),
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
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
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    totalMembers: users.length,
  };

  const admins = users.filter((u: User) => u.role === "admin");
  const recentTasks = tasks.slice(0, 5);

  const statCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      color: "text-blue-500",
      bg: "bg-blue-500",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: CheckSquare,
      color: "text-purple-500",
      bg: "bg-purple-500",
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
  ];

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Overview of all projects, tasks, and team performance
        </p>
      </div>

      {/* Stats Grid */}
      {isLoadingProjects || isLoadingTasks || isLoadingUsers ? (
        <StatsSkeleton />
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
        {/* Project Progress */}
        {isLoadingProjects ? (
          <ProjectProgressSkeleton />
        ) : (
          <Card className="col-span-4 glass">
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>
                Overview of project completion status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                  {projects.map((project: Project) => {
                    const totalTasks = project.tasks?.length || 0;
                    const completed =
                      project.tasks?.filter(
                        (t: Task) => t.status === "completed"
                      ).length || 0;
                    const progress =
                      totalTasks > 0
                        ? Math.round((completed / totalTasks) * 100)
                        : 0;

                    return (
                      <div key={project.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="font-medium">{project.title}</div>
                          <div className="text-muted-foreground">
                            {progress}%
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
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

        {/* Admin Team */}
        {isLoadingUsers ? (
          <AdminTeamSkeleton />
        ) : (
          <Card className="col-span-3 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Admin Team
              </CardTitle>
              <CardDescription>
                Administrators managing the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {admins.map((admin: User) => (
                  <div key={admin.id} className="flex items-center gap-4">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {(admin.fullName || admin.email)
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {admin.fullName || "No Name"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {admin.email}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-auto">
                      Admin
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reactivation Requests */}
      {users.some((u: User) => u.reactivationRequested) && (
        <Card className="glass border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <Activity className="h-5 w-5" />
              Reactivation Requests
            </CardTitle>
            <CardDescription>
              Members requesting to regain access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users
                .filter((u: User) => u.reactivationRequested)
                .map((user: User) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-orange-500/10 bg-orange-500/5"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-orange-100 text-orange-600">
                          {(user.fullName || user.email)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.fullName || "No Name"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs text-orange-500 mt-1">
                          Requested:{" "}
                          {user.reactivationRequestedAt
                            ? new Date(
                                user.reactivationRequestedAt
                              ).toLocaleDateString()
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          try {
                            await userService.rejectReactivation(user.id);
                            queryClient.invalidateQueries({
                              queryKey: ["users"],
                            });
                            toast.success("Reactivation request rejected");
                          } catch (error) {
                            console.error("Failed to reject", error);
                            toast.error("Failed to reject request");
                          }
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={async () => {
                          try {
                            await userService.enable(user.id);
                            queryClient.invalidateQueries({
                              queryKey: ["users"],
                            });
                            toast.success("User account enabled");
                          } catch (error) {
                            console.error("Failed to approve", error);
                            toast.error("Failed to enable user");
                          }
                        }}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity / Tasks */}
      {isLoadingTasks ? (
        <RecentTasksSkeleton />
      ) : (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
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
                  No recent activity
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
