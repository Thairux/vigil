import { Router } from "express";
import { z } from "zod";
import { findUserProfileByAuth } from "../lib/profile.js";
import { requireRole } from "../middleware/auth.js";
import { scoreEventRisk } from "../lib/risk.js";
import { supabase } from "../lib/supabase.js";

const createTransactionSchema = z.object({
  userId: z.string().uuid(),
  recipient: z.string().min(1),
  amount: z.coerce.number().positive(),
  device: z.string().min(1),
  location: z.string().min(1),
  type: z.string().default("Transfer"),
});

export const transactionsRouter = Router();

transactionsRouter.post("/", requireRole(["admin", "analyst", "customer"]), async (req, res, next) => {
  try {
    const payload = createTransactionSchema.parse(req.body);
    if (req.auth.role === "customer") {
      const profile = await findUserProfileByAuth(req.auth);
      if (!profile) {
        return res.status(404).json({ error: "No profile mapped for authenticated customer" });
      }
      if (payload.userId !== profile.id) {
        return res.status(403).json({ error: "Customers can only create transactions for their mapped profile" });
      }
    }

    const risk = scoreEventRisk(payload);

    const transactionRecord = {
      user_id: payload.userId,
      recipient: payload.recipient,
      amount: payload.amount,
      type: payload.type,
      device: payload.device,
      location: payload.location,
      risk_score: risk.riskScore,
      risk_band: risk.riskBand,
      status: risk.isRisky ? "flagged" : "approved",
    };

    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert(transactionRecord)
      .select("id, user_id, recipient, amount, type, device, location, risk_score, risk_band, status, created_at")
      .single();

    if (txError) throw txError;

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        user_id: payload.userId,
        type: payload.type,
        amount: payload.amount,
        device: payload.device,
        location: payload.location,
        metadata: { recipient: payload.recipient, source: "transaction_api" },
        risk_score: risk.riskScore,
        risk_band: risk.riskBand,
        is_risky: risk.isRisky,
        reason: risk.reason,
        status: risk.isRisky ? "flagged" : "clear",
      })
      .select("id")
      .single();

    if (eventError) throw eventError;

    let alert = null;
    if (risk.isRisky && event) {
      const { data: insertedAlert, error: alertError } = await supabase
        .from("alerts")
        .insert({
          event_id: event.id,
          user_id: payload.userId,
          risk_score: risk.riskScore,
          risk_band: risk.riskBand,
          reason: risk.reason,
          status: "open",
          is_read: false,
        })
        .select("id, event_id, user_id, risk_score, risk_band, reason, status, is_read, assigned_to, resolution_note, created_at")
        .single();

      if (alertError) throw alertError;
      alert = insertedAlert;
    }

    res.status(201).json({ transaction, alert });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation failed", details: error.flatten() });
    }
    next(error);
  }
});
