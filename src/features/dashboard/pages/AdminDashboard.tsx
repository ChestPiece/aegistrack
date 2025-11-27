import { useEffect, useState } from "react";
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
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  TrendingUp,
  Shield,
  Activity,
} from "lucide-react";
import { Task, Project, User } from "@/shared/types";
import { getErrorMessage } from "@/shared/utils/errors";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Badge } from "@/shared/components/ui/badge";

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalMembers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalMembers: 0,
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsData, tasksData, usersData] = await Promise.all([
        projectService.getAll(),
        taskService.getAll(),
        userService.getAll(),
      ]);

      const completedTasks = tasksData.filter(
        (t: Task) => t.status === "completed"
      ).length;
      const inProgressTasks = tasksData.filter(
        (t: Task) => t.status === "in_progress"
      ).length;
      const overdueTasks = tasksData.filter(
        (t: Task) =>
          t.deadline &&
          new Date(t.deadline) < new Date() &&
          t.status !== "completed"
      ).length;

      setStats({
        totalProjects: projectsData.length,
        totalTasks: tasksData.length,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        totalMembers: usersData.length,
      });

      setProjects(projectsData);
      setAdmins(usersData.filter((u: User) => u.role === "admin"));
      setRecentTasks(tasksData.slice(0, 5)); // Get first 5 tasks (assuming sorted by date)
    } catch (error) {
      console.error("Error fetching stats:", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Project Progress */}
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
                {projects.map((project) => {
                  const totalTasks = project.tasks?.length || 0;
                  const completed =
                    project.tasks?.filter((t: any) => t.status === "completed")
                      .length || 0;
                  const progress =
                    totalTasks > 0
                      ? Math.round((completed / totalTasks) * 100)
                      : 0;

                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium">{project.title}</div>
                        <div className="text-muted-foreground">{progress}%</div>
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

        {/* Admin Team */}
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
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center gap-4">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(admin.fullName || admin.email).charAt(0).toUpperCase()}
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
      </div>

      {/* Recent Activity / Tasks */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card/50"
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
                      {task.projectId?.title || "No Project"}
                    </p>
                  </div>
                </div>
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
    </div>
  );
}
