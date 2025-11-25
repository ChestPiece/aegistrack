import { useEffect, useState } from "react";
import { projectService, taskService, userService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Task, Project, User } from "@/types";
import { getErrorMessage } from "@/lib/errors";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [projects, tasks, users] = await Promise.all([
        projectService.getAll(),
        taskService.getAll(),
        userService.getAll(),
      ]);

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

      setStats({
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        totalMembers: users.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  const statCards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      color: "text-blue-500",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: CheckSquare,
      color: "text-purple-500",
    },
    {
      title: "In Progress",
      value: stats.inProgressTasks,
      icon: TrendingUp,
      color: "text-amber-500",
    },
    {
      title: "Overdue",
      value: stats.overdueTasks,
      icon: Clock,
      color: "text-red-500",
    },
    {
      title: "Team Members",
      value: stats.totalMembers,
      icon: Users,
      color: "text-green-500",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of all projects and tasks
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Task Completion Rate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {stats.completedTasks} of {stats.totalTasks} tasks completed
            </span>
            <span className="text-2xl font-bold">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </CardContent>
      </Card>
    </div>
  );
}
