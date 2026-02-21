import { Router } from "express";
import { supabase } from "../lib/supabase.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", async (_req, res, next) => {
  try {
    const [{ count: totalEvents, error: eventsError }, { count: flaggedEvents, error: flaggedError }, { count: openAlerts, error: alertsError }, { data: recentEvents, error: recentEventsError }, { data: recentAlerts, error: recentAlertsError }] =
      await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("is_risky", true),
        supabase.from("alerts").select("id", { count: "exact", head: true }).in("status", ["open", "in_review"]),
        supabase
          .from("events")
          .select("id, user_id, type, amount, risk_score, risk_band, is_risky, reason, status, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("alerts")
          .select("id, event_id, user_id, risk_score, risk_band, reason, status, is_read, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

    if (eventsError) throw eventsError;
    if (flaggedError) throw flaggedError;
    if (alertsError) throw alertsError;
    if (recentEventsError) throw recentEventsError;
    if (recentAlertsError) throw recentAlertsError;

    const volume = (recentEvents ?? []).reduce((sum, event) => sum + Number(event.amount || 0), 0);
    const averageRisk =
      (recentEvents ?? []).length > 0
        ? Math.round((recentEvents ?? []).reduce((sum, event) => sum + Number(event.risk_score || 0), 0) / (recentEvents ?? []).length)
        : 0;

    res.json({
      summary: {
        totalEvents: totalEvents ?? 0,
        flaggedEvents: flaggedEvents ?? 0,
        openAlerts: openAlerts ?? 0,
        recentVolume: volume,
        averageRisk,
      },
      recentEvents: recentEvents ?? [],
      recentAlerts: recentAlerts ?? [],
    });
  } catch (error) {
    next(error);
  }
});

