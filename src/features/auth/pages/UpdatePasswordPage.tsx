import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { userService } from "@/shared/services/api";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { GlassCard } from "@/shared/components/ui/GlassCard";
import { toast } from "sonner";
import { Lock, Check, ArrowRight, ShieldCheck } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validations, setValidations] = useState({
    length: false,
    number: false,
    special: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a session (which happens after clicking the invite link)
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Invalid or expired invitation link");
        navigate("/auth/login");
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    setValidations({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!validations.length || !validations.number) {
      toast.error("Please meet all password requirements");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Confirm the invitation status in backend
      await userService.confirmInvite();

      // Fetch user data to get role
      const userData = await userService.getCurrent();

      toast.success("Account activated successfully!");

      // Redirect based on role
      if (userData.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <GlassCard className="w-full max-w-md p-8 border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to AegisTrack
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up your password to activate your account and access the
            workspace.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a strong password"
                  className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat your password"
                  className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Password Strength Indicators */}
          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-white/5">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Password Requirements:
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center ${
                    validations.length
                      ? "bg-green-500/20 text-green-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span
                  className={
                    validations.length
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center ${
                    validations.number
                      ? "bg-green-500/20 text-green-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span
                  className={
                    validations.number
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  Contains a number
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center ${
                    validations.special
                      ? "bg-green-500/20 text-green-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span
                  className={
                    validations.special
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  Contains special character (optional)
                </span>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base shadow-lg hover:shadow-primary/25 transition-all duration-300"
            disabled={loading}
          >
            {loading ? (
              "Activating Account..."
            ) : (
              <span className="flex items-center gap-2">
                Set Password & Login <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
