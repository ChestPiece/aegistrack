import { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { userService } from "@/shared/services/api";
import { User } from "@/types";
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
    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

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
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const user = await userService.getCurrent();
      setUserRole(user.role || "admin");
      setUserData(user);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("admin");
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      const user = await userService.getCurrent();
      setUserRole(user.role || "admin");
      setUserData(user);
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Sync user to MongoDB to ensure they exist with default admin role
      try {
        await userService.sync();
      } catch (syncError) {
        console.error("Error syncing user to MongoDB:", syncError);
        // Don't throw here - we still want the user to be signed in
      }

      toast.success("Successfully signed in!");
    } catch (error) {
      toast.error((error as Error).message || "Failed to sign in");
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      toast.success("Account created! You can now sign in.");
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
