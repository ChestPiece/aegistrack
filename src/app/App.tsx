import { lazy, Suspense } from "react";
import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { ThemeProvider } from "@/shared/contexts/ThemeContext";
import { ProtectedRoute } from "@/shared/components/common/ProtectedRoute";
import { AppLayout } from "@/shared/components/layout/AppLayout";

// Lazy load all page components for code splitting
const Login = lazy(() => import("../features/auth/pages/Login"));
const Signup = lazy(() => import("../features/auth/pages/Signup"));
const ConfirmEmail = lazy(() => import("../features/auth/pages/ConfirmEmail"));
const ForgotPassword = lazy(
  () => import("../features/auth/pages/ForgotPassword")
);
const ResetPassword = lazy(
  () => import("../features/auth/pages/ResetPassword")
);
const AdminDashboard = lazy(
  () => import("../features/dashboard/pages/AdminDashboard")
);
const UserDashboard = lazy(
  () => import("../features/dashboard/pages/UserDashboard")
);
const Projects = lazy(() => import("../features/projects/pages/ProjectsPage"));
const Tasks = lazy(() => import("../features/tasks/pages/TasksPage"));
const Team = lazy(() => import("../features/team/pages/TeamPage"));
const ArchivedPage = lazy(() => import("../features/admin/pages/ArchivedPage"));
const MyTasks = lazy(() => import("../features/tasks/pages/TaskDetailPage"));
const MyProjects = lazy(
  () => import("../features/projects/pages/ProjectDetailPage")
);
const Notifications = lazy(
  () => import("../features/notifications/pages/NotificationsPage")
);
const Profile = lazy(() => import("../features/profile/pages/ProfilePage"));
const NotFound = lazy(() => import("../pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/confirm-email" element={<ConfirmEmail />} />
                <Route
                  path="/auth/forgot-password"
                  element={<ForgotPassword />}
                />
                <Route
                  path="/auth/reset-password"
                  element={<ResetPassword />}
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AppLayout>
                        <AdminDashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/projects"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AppLayout>
                        <Projects />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tasks"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AppLayout>
                        <Tasks />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/team"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AppLayout>
                        <Team />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/archived"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AppLayout>
                        <ArchivedPage />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                {/* User Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <UserDashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tasks"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MyTasks />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <MyProjects />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Notifications />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Profile />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
