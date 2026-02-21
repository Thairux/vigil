import { Router } from "express";
import { findUserProfileByAuth } from "../lib/profile.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const profile = await findUserProfileByAuth(req.auth);
    const role = profile?.role || req.auth.role;

    res.json({
      user: {
        id: req.auth.userId,
        email: req.auth.email,
        role,
        profile: profile
          ? {
              id: profile.id,
              auth_user_id: profile.auth_user_id,
              full_name: profile.full_name,
              email: profile.email,
              avatar: profile.avatar,
              device: profile.device,
              location: profile.location,
              role: profile.role,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});
