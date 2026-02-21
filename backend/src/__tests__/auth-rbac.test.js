import "./setup-env.js";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const fromMock = vi.fn((table) => {
  if (table !== "users") {
    throw new Error(`Unexpected table query in auth test: ${table}`);
  }

  const query = {
    select: vi.fn(() => query),
    or: vi.fn(() => query),
    eq: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({
      data: {
        id: "profile-1",
        auth_user_id: "11111111-1111-1111-1111-111111111111",
        full_name: "Analyst User",
        email: "analyst@example.com",
        role: "analyst",
      },
      error: null,
    })),
  };
  return query;
});

vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  },
}));

const { app } = await import("../app.js");

describe("auth and rbac middleware", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    fromMock.mockClear();
    getUserMock.mockImplementation(async (token) => {
      if (token === "analyst-token") {
        return {
          data: {
            user: {
              id: "11111111-1111-1111-1111-111111111111",
              email: "analyst@example.com",
              app_metadata: { role: "analyst" },
            },
          },
          error: null,
        };
      }

      if (token === "customer-token") {
        return {
          data: {
            user: {
              id: "22222222-2222-2222-2222-222222222222",
              email: "customer@example.com",
              user_metadata: { role: "customer" },
            },
          },
          error: null,
        };
      }

      return { data: { user: null }, error: new Error("Invalid token") };
    });
  });

  it("allows public health endpoint without auth", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
  });

  it("rejects protected endpoint without bearer token", async () => {
    const response = await request(app).get("/api/users");
    expect(response.status).toBe(401);
  });

  it("returns auth profile for valid token", async () => {
    const response = await request(app).get("/api/auth/me").set("Authorization", "Bearer analyst-token");
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("analyst");
    expect(response.body.user.profile.email).toBe("analyst@example.com");
  });

  it("blocks customer role from analyst dashboard route", async () => {
    const response = await request(app).get("/api/dashboard/summary").set("Authorization", "Bearer customer-token");
    expect(response.status).toBe(403);
  });

  it("allows only admin role for role management endpoint", async () => {
    const response = await request(app)
      .patch("/api/users/11111111-1111-1111-1111-111111111111/role")
      .set("Authorization", "Bearer analyst-token")
      .send({ role: "customer" });

    expect(response.status).toBe(403);
  });
});
