import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, userRole, loading, userData } = useAuth();
  const location = window.location;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse-subtle">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requireAdmin && userRole !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
