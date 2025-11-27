import { Request, Response, NextFunction } from "express";
import { supabase } from "../../config/supabase";
import User from "../../modules/users/user.model";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if user account is active (skip for sync endpoint as user might not exist in DB yet)
    if (!req.path.includes("/sync")) {
      const dbUser = await User.findOne({ supabaseId: user.id });
      if (dbUser && !dbUser.isActive) {
        return res.status(403).json({
          error:
            "Your account has been disabled. Please contact an administrator.",
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res
      .status(500)
      .json({ error: "Internal server error during authentication" });
  }
};
