import { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { userService, authService } from "@/shared/services/api";
import { User } from "@/shared/types";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  userRole: "admin" | "member" | null;
  userData: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserRole = async (userId: string, retryCount = 0) => {
      try {
        // First, sync the user to MongoDB to ensure they exist
        try {
          await userService.sync();
        } catch (syncError) {
          console.error("Error syncing user to MongoDB:", syncError);
          // If sync fails on first attempt, retry once after a short delay
          if (retryCount < 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return fetchUserRole(userId, retryCount + 1);
          }
          // If sync fails after retry, we'll still try to fetch the user
          // in case they already exist in MongoDB
        }

        // Now fetch the user data from MongoDB
        const user = await userService.getCurrent();
        setUserRole(user.role || "admin");
        setUserData(user);
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Only set default role if this is not a "user not found" error
        // This prevents incorrectly assigning admin role to users who just haven't synced yet
        const errorMessage = (error as Error).message || "";
        setUserRole(null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Handle password recovery (invite links)
      if (event === "PASSWORD_RECOVERY") {
        navigate("/update-password");
        return;
      }

      if (session?.user) {
        setTimeout(() => {
          fetchUserRole(session.user.id);
        }, 0);
      } else {
        setUserRole(null);
        setUserData(null);
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const refreshUserData = async () => {
    try {
      // Sync user first to ensure latest data
      try {
        await userService.sync();
      } catch (syncError) {
        console.error("Error syncing user during refresh:", syncError);
        // Continue to fetch even if sync fails
      }

      const user = await userService.getCurrent();
      setUserRole(user.role || "admin");
      setUserData(user);
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if it's an email confirmation error
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error(
          "Please confirm your email before signing in. Check your inbox for the confirmation link."
        );
      } else {
        toast.error(error.message || "Failed to sign in");
      }
      throw error;
    }

    // User sync now happens in fetchUserRole, which is triggered by onAuthStateChange
    toast.success("Successfully signed in!");
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        toast.success(
          "Account created! Please check your email to confirm your account before signing in."
        );
      } else {
        toast.success("Account created! You can now sign in.");
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to create account");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      // Clear local state regardless of whether signOut succeeded
      // This handles cases where the session is already invalid
      setUser(null);
      setSession(null);
      setUserRole(null);
      setUserData(null);
      navigate("/auth/login");

      if (error && error.message !== "Auth session missing!") {
        console.error("Sign out error:", error);
        toast.error("Signed out with warnings");
      } else {
        toast.success("Signed out successfully");
      }
    } catch (error) {
      // Even if signOut fails, clear local state so user isn't stuck
      setUser(null);
      setSession(null);
      setUserRole(null);
      setUserData(null);
      navigate("/auth/login");

      console.error("Sign out error:", error);
      toast.error("Signed out (session was invalid)");
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authService.forgotPassword(email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      toast.error(
        (error as Error).message || "Failed to send password reset email"
      );
      throw error;
    }
  };

  const resetPassword = async (newPassword: string) => {
    try {
      await authService.resetPassword(newPassword);
      toast.success("Password updated successfully!");
    } catch (error) {
      toast.error((error as Error).message || "Failed to reset password");
      throw error;
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      await authService.resendVerificationEmail(email);
      toast.success("Verification email sent! Check your inbox.");
    } catch (error) {
      toast.error(
        (error as Error).message || "Failed to resend verification email"
      );
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        userData,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUserData,
        forgotPassword,
        resetPassword,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
