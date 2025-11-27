import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Loader2, Eye, EyeOff, Ban } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/shared/services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccountDisabled, setIsAccountDisabled] = useState(false);
  const { signIn, user, userRole, userData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole) {
      if (userData?.isActive === false) {
        setIsAccountDisabled(true);
        return;
      }
      const redirectPath =
        userRole === "admin" ? "/admin/dashboard" : "/dashboard";
      navigate(redirectPath, { replace: true });
    }
  }, [user, userRole, navigate, userData?.isActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsAccountDisabled(false);

    try {
      await signIn(email, password);
      // Success toast is shown in AuthContext
      // Navigation handled in useEffect
    } catch (error) {
      // Error is handled in AuthContext with toast notifications
      // But we can check if it's a disabled account error if the backend returns specific code
      // For now, we rely on the user object being updated after login attempt if successful but disabled
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReactivation = async () => {
    setIsLoading(true);
    try {
      await api.post("/users/request-reactivation", { email });
      toast.success("Reactivation request sent successfully");
      setIsAccountDisabled(false); // Reset state or show success message
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Failed to send request";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAccountDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md glass animate-scale-in border-red-500/20">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <Ban className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-red-600">
              Account Disabled
            </CardTitle>
            <CardDescription className="text-base">
              Your account has been disabled by the admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please submit a reactivation request if you believe this is a
              mistake or if you wish to regain access.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              onClick={handleRequestReactivation}
              className="w-full"
              disabled={isLoading}
              variant="destructive"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Request Account Activation
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsAccountDisabled(false);
                // signOut(); // Optional: sign out if session exists
              }}
              className="w-full"
            >
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md glass animate-scale-in">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight">
            Welcome back
          </CardTitle>
          <CardDescription>Sign in to your AegisTrack account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 active:scale-95"
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
            <div className="text-center space-y-2">
              <Link
                to="/auth/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary transition-colors block"
              >
                Forgot password?
              </Link>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/auth/signup"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
