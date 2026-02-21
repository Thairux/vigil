import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/auth.js";
import { supabase } from "../lib/supabase.js";

const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "analyst", "customer"]),
});

export const usersRouter = Router();

usersRouter.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, auth_user_id, full_name, email, avatar, device, location, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ users: data ?? [] });
  } catch (error) {
    next(error);
  }
});

usersRouter.patch("/:userId/role", requireRole(["admin"]), async (req, res, next) => {
  try {
    const userId = z.string().uuid().parse(req.params.userId);
    const payload = updateUserRoleSchema.parse(req.body);

    const { data, error } = await supabase
      .from("users")
      .update({ role: payload.role })
      .eq("id", userId)
      .select("id, auth_user_id, full_name, email, avatar, device, location, role, created_at")
      .single();

    if (error) throw error;
    res.json({ user: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    next(error);
  }
});
