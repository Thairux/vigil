import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.auth.userId,
      email: req.auth.email,
      role: req.auth.role,
    },
  });
});

