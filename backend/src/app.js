import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import { alertsRouter } from "./routes/alerts.js";
import { authRouter } from "./routes/auth.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { eventsRouter } from "./routes/events.js";
import { healthRouter } from "./routes/health.js";
import { transactionsRouter } from "./routes/transactions.js";
import { usersRouter } from "./routes/users.js";
import { requireAuth, requireRole } from "./middleware/auth.js";

export const app = express();

const allowedOrigins =
  env.CORS_ORIGIN === "*"
    ? true
    : env.CORS_ORIGIN.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

app.set("trust proxy", env.TRUST_PROXY ? 1 : 0);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
app.use(cors({ origin: allowedOrigins, credentials: true }));
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
