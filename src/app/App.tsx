import { Toaster } from "@/shared/components/ui/toaster";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/shared/contexts/AuthContext";
import { ThemeProvider } from "@/shared/contexts/ThemeContext";
import { ProtectedRoute } from "@/shared/components/common/ProtectedRoute";
import { AppLayout } from "@/shared/components/layout/AppLayout";

// Auth pages
import Login from "../features/auth/pages/Login";
import Signup from "../features/auth/pages/Signup";
import ConfirmEmail from "../features/auth/pages/ConfirmEmail";
import UpdatePasswordPage from "../features/auth/pages/UpdatePasswordPage";
import ForgotPassword from "../features/auth/pages/ForgotPassword";
import ResetPassword from "../features/auth/pages/ResetPassword";

// Dashboard pages
import AdminDashboard from "../features/dashboard/pages/AdminDashboard";
import UserDashboard from "../features/dashboard/pages/UserDashboard";

// Admin pages
import Projects from "../features/projects/pages/ProjectsPage";
import Tasks from "../features/tasks/pages/TasksPage";
import Team from "../features/team/pages/TeamPage";
import ArchivedPage from "../features/admin/pages/ArchivedPage";

// User pages
import MyTasks from "../features/tasks/pages/TaskDetailPage";
import MyProjects from "../features/projects/pages/ProjectDetailPage";

// Common pages
import Notifications from "../features/notifications/pages/NotificationsPage";
import Profile from "../features/profile/pages/ProfilePage";

import NotFound from "../pages/NotFound";

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
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/confirm-email" element={<ConfirmEmail />} />
              <Route
                path="/auth/forgot-password"
                element={<ForgotPassword />}
              />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />

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
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
