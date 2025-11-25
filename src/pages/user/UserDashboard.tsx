import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Clock, FolderKanban, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  StatCardSkeleton,
  CompletionCardSkeleton,
  RecentTasksSkeleton,
} from "@/components/SkeletonLoaders";
import { taskService, projectService } from "@/services/api";
import { Task, Project } from "@/types";

interface UserStats {
  myTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  myProjects: number;
}

export default function UserDashboard() {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    myTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    myProjects: 0,
  });
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const [tasks, projects] = await Promise.all([
        taskService.getAll(),
        projectService.getAll(),
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
        myTasks: tasks.length,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        myProjects: projects.length,
      });
      setRecentTasks(tasks.slice(0, 5));
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate =
    stats.myTasks > 0
      ? Math.round((stats.completedTasks / stats.myTasks) * 100)
      : 0;

  const statCards = [
    {
      title: "My Tasks",
      value: stats.myTasks,
      icon: CheckSquare,
      color: "text-blue-500",
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
      title: "My Projects",
      value: stats.myProjects,
      icon: FolderKanban,
      color: "text-purple-500",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userData?.fullName || "User"}!
        </h1>
        <p className="text-muted-foreground">Here's an overview of your work</p>
      </div>

      {loading ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCardSkeleton />
          </div>
          <CompletionCardSkeleton />
          <RecentTasksSkeleton />
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  {stats.completedTasks} of {stats.myTasks} tasks completed
                </span>
                <span className="text-2xl font-bold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks assigned yet
                  </p>
                ) : (
                  recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{task.title}</p>
                        {task.deadline && (
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
