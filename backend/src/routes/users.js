import { Router } from "express";
import { supabase } from "../lib/supabase.js";

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
