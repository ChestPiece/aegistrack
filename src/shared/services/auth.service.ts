import { supabase } from "@/integrations/supabase/client";

export const authService = {
  /**
   * Send password reset email to user
   */
  forgotPassword: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Reset password for authenticated user
   */
  resetPassword: async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Resend verification email (for users who signed up but didn't verify)
   */
  resendVerificationEmail: async (email: string): Promise<void> => {
    // Supabase doesn't have a direct resend verification endpoint
    // We need to use the admin API through our backend
    // For now, we'll throw an error indicating this needs backend support
    throw new Error(
      "Resend verification is handled through user invitation flow"
    );
  },
};
