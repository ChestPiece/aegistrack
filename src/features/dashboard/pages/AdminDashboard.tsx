import { useEffect, useState } from "react";
import {
  projectService,
  taskService,
  userService,
} from "@/shared/services/api";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { GlassCard } from "@/shared/components/ui/GlassCard";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import { Task } from "@/shared/types";
import { getErrorMessage } from "@/shared/utils/errors";

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
    {
      title: "Team Members",
      value: stats.totalMembers,
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Overview of all projects, tasks, and team performance
        </p>
      </div>

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
    </div>
  );
}
