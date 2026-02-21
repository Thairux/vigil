import { supabase } from "../lib/supabase.js";

const VALID_ROLES = new Set(["admin", "analyst", "customer"]);

function readBearerToken(authHeader) {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function resolveRole(user) {
  const roleFromApp = user?.app_metadata?.role;
  const roleFromUser = user?.user_metadata?.role;
  const role = roleFromApp || roleFromUser || "customer";
  return VALID_ROLES.has(role) ? role : "customer";
}

export async function requireAuth(req, res, next) {
  try {
    const token = readBearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "Missing bearer token" });
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.auth = {
      userId: data.user.id,
      email: data.user.email || null,
      role: resolveRole(data.user),
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ error: "Forbidden for this role" });
    }
    next();
  };
}

