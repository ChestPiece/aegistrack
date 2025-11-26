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
  Activity,
  Target,
} from "lucide-react";
import { Task, Project, User } from "@/types";
import { getErrorMessage } from "@/shared/utils/errors";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: CheckSquare,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "In Progress",
      value: stats.inProgressTasks,
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Overdue",
      value: stats.overdueTasks,
      icon: Clock,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Team Members",
      value: stats.totalMembers,
      icon: Users,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
  ];

  const pieData = [
    { name: "Completed", value: stats.completedTasks, color: "#10b981" },
    { name: "In Progress", value: stats.inProgressTasks, color: "#f59e0b" },
    {
      name: "Pending",
      value: stats.totalTasks - stats.completedTasks - stats.inProgressTasks,
      color: "#6366f1",
    },
  ];

  const barData = [
    { name: "Projects", value: stats.totalProjects },
    { name: "Tasks", value: stats.totalTasks },
    { name: "Members", value: stats.totalMembers },
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat, index) => (
          <GlassCard
            key={stat.title}
            gradient
            className="border-none ring-1 ring-white/20"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {stat.value}
              </div>
            </CardContent>
          </GlassCard>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <GlassCard className="col-span-4 border-none ring-1 ring-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{ fill: "transparent" }}
                />
                <Bar
                  dataKey="value"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                  barSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </GlassCard>

        <GlassCard className="col-span-3 border-none ring-1 ring-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Task Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold">{completionRate}%</span>
                <span className="text-sm text-muted-foreground">Complete</span>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
