import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ConfirmEmail() {
  const [email, setEmail] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Try to get the email from localStorage or session
    const getEmailFromStorage = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email) {
        setEmail(data.session.user.email);
      }
    };
    getEmailFromStorage();
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success("Confirmation email sent! Please check your inbox.");
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      toast.error(
        (error as Error).message || "Failed to resend confirmation email"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-lg glass animate-scale-in">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Check Your Email
          </CardTitle>
          <CardDescription className="text-base">
            We've sent you a confirmation link to verify your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">What to do next:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Check your email inbox{email && ` at ${email}`}</li>
                  <li>Look for an email from AegisTrack</li>
                  <li>Click the confirmation link in the email</li>
                  <li>Return here to sign in</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email?
            </p>
            <Button
              variant="outline"
              onClick={handleResendConfirmation}
              disabled={resendLoading || resendCooldown > 0}
              className="w-full"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : resendLoading
                ? "Sending..."
                : "Resend confirmation email"}
            </Button>
          </div>

          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Make sure to check your spam folder if you don't see the email
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Link to="/auth/login" className="w-full">
            <Button variant="default" className="w-full group">
              Go to Sign In
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground text-center">
            Already confirmed?{" "}
            <Link
              to="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
