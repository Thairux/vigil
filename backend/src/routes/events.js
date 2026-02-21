import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/auth.js";
import { scoreEventRisk } from "../lib/risk.js";
import { supabase } from "../lib/supabase.js";

const createEventSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().min(1),
  amount: z.coerce.number().min(0),
  device: z.string().min(1),
  location: z.string().min(1),
  metadata: z.record(z.any()).optional(),
});

export const eventsRouter = Router();

eventsRouter.get("/", requireRole(["admin", "analyst"]), async (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    const safeLimit = Number.isNaN(limit) ? 50 : Math.min(Math.max(limit, 1), 200);
    const onlyFlagged = String(req.query.flagged ?? "false") === "true";

    let query = supabase
      .from("events")
      .select("id, user_id, type, amount, risk_score, risk_band, is_risky, reason, device, location, status, created_at")
      .order("created_at", { ascending: false })
      .limit(safeLimit);

    if (onlyFlagged) {
      query = query.eq("is_risky", true);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ events: data ?? [] });
  } catch (error) {
    next(error);
  }
});

eventsRouter.post("/", requireRole(["admin", "analyst", "customer"]), async (req, res, next) => {
  try {
    const payload = createEventSchema.parse(req.body);
    const risk = scoreEventRisk(payload);

    const eventToInsert = {
      user_id: payload.userId,
      type: payload.type,
      amount: payload.amount,
      device: payload.device,
      location: payload.location,
      metadata: payload.metadata ?? {},
      risk_score: risk.riskScore,
      risk_band: risk.riskBand,
      is_risky: risk.isRisky,
      reason: risk.reason,
      status: risk.isRisky ? "flagged" : "clear",
    };

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert(eventToInsert)
      .select("id, user_id, type, amount, risk_score, risk_band, is_risky, reason, device, location, status, created_at")
      .single();

    if (eventError) throw eventError;

    let alert = null;
    if (risk.isRisky && event) {
      const { data: insertedAlert, error: alertError } = await supabase
        .from("alerts")
        .insert({
          event_id: event.id,
          user_id: event.user_id,
          risk_score: event.risk_score,
          risk_band: event.risk_band,
          reason: event.reason,
          status: "open",
          is_read: false,
        })
        .select("id, event_id, user_id, risk_score, risk_band, reason, status, is_read, assigned_to, resolution_note, created_at")
        .single();

      if (alertError) throw alertError;
      alert = insertedAlert;
    }

    res.status(201).json({ event, alert });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    next(error);
  }
});
