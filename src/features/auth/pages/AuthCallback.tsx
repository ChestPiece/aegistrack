import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { userService } from "@/shared/services/api";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [countdown, setCountdown] = useState(1);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash from the URL
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken) {
          throw new Error("No access token found in URL");
        }

        // Set the session with Supabase
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (error) throw error;

        if (!data.session) {
          throw new Error("Failed to create session");
        }

        // Call backend to confirm the invite and update status to 'active'
        try {
          await userService.confirmInvite();
        } catch (confirmError) {
          console.error("Error confirming invite:", confirmError);
          // Continue anyway - user can still login
        }

        setStatus("success");
        toast.success("Email confirmed successfully!");

        // Start countdown
        let counter = 1;
        const interval = setInterval(async () => {
          counter--;
          setCountdown(counter);
          if (counter === 0) {
            clearInterval(interval);
            // Redirect to dashboard directly
            navigate("/dashboard");
          }
        }, 1000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error("Error handling callback:", error);
        setStatus("error");
        setErrorMessage((error as Error).message || "Failed to confirm email");
        toast.error("Failed to confirm email. Please try again.");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-md glass animate-scale-in">
        <CardHeader className="text-center space-y-3">
          {status === "loading" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                Confirming Your Email
              </CardTitle>
              <CardDescription>
                Please wait while we verify your account...
              </CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">
                Email Confirmed!
              </CardTitle>
              <CardDescription>
                Your email has been successfully verified.
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-destructive">
                Verification Failed
              </CardTitle>
              <CardDescription className="text-destructive">
                {errorMessage}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {status === "success" && (
            <div className="text-center bg-muted/50 rounded-lg p-4 border border-border/50">
              <p className="text-sm text-muted-foreground mb-2">
                You have been successfully verified. Redirecting you to the
                dashboard...
              </p>
              <p className="text-lg font-semibold">
                Redirecting in {countdown}...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <button
                onClick={() => navigate("/auth/login")}
                className="text-primary hover:underline text-sm font-medium"
              >
                Go to Login
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
