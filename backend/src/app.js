import cors from "cors";
import express from "express";
import { alertsRouter } from "./routes/alerts.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { eventsRouter } from "./routes/events.js";
import { healthRouter } from "./routes/health.js";
import { transactionsRouter } from "./routes/transactions.js";
import { usersRouter } from "./routes/users.js";
import { requireAuth, requireRole } from "./middleware/auth.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "vigil-backend",
    version: "0.1.0",
  });
});

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/dashboard", requireAuth, requireRole(["admin", "analyst"]), dashboardRouter);
app.use("/api/users", requireAuth, requireRole(["admin", "analyst"]), usersRouter);
app.use("/api/events", requireAuth, eventsRouter);
app.use("/api/alerts", requireAuth, alertsRouter);
app.use("/api/transactions", requireAuth, transactionsRouter);

app.use((err, _req, res, _next) => {
  // Centralized error shape for frontend/API clients.
  const message = err?.message || "Unexpected server error";
  const details = err?.details || null;
  const statusCode = err?.status || 500;

  res.status(statusCode).json({
    error: message,
    details,
  });
});
