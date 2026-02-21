import { Router } from "express";
import { z } from "zod";
import { supabase } from "../lib/supabase.js";

const updateAlertSchema = z.object({
  status: z.enum(["open", "in_review", "resolved"]).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  resolutionNote: z.string().max(2000).nullable().optional(),
  isRead: z.boolean().optional(),
});

export const alertsRouter = Router();

alertsRouter.get("/", async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : null;
    const limit = Number(req.query.limit ?? 50);
    const safeLimit = Number.isNaN(limit) ? 50 : Math.min(Math.max(limit, 1), 200);

    let query = supabase
      .from("alerts")
      .select("id, event_id, user_id, risk_score, risk_band, reason, status, is_read, assigned_to, resolution_note, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ alerts: data ?? [] });
  } catch (error) {
    next(error);
  }
});

alertsRouter.patch("/:alertId", async (req, res, next) => {
  try {
    const alertId = z.string().uuid().parse(req.params.alertId);
    const payload = updateAlertSchema.parse(req.body);

    const updates = {};
    if (payload.status !== undefined) updates.status = payload.status;
    if (payload.assignedTo !== undefined) updates.assigned_to = payload.assignedTo;
    if (payload.resolutionNote !== undefined) updates.resolution_note = payload.resolutionNote;
    if (payload.isRead !== undefined) updates.is_read = payload.isRead;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("alerts")
      .update(updates)
      .eq("id", alertId)
      .select("id, event_id, user_id, risk_score, risk_band, reason, status, is_read, assigned_to, resolution_note, created_at, updated_at")
      .single();

    if (error) throw error;

    res.json({ alert: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    next(error);
  }
});

