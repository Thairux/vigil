import "./setup-env.js";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();

vi.mock("../lib/supabase.js", () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
    },
    from: vi.fn(() => {
      throw new Error("Database access should not happen in this test");
    }),
  },
}));

const { app } = await import("../app.js");

describe("auth and rbac middleware", () => {
  beforeEach(() => {
    getUserMock.mockReset();
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
  });

  it("blocks customer role from analyst dashboard route", async () => {
    const response = await request(app).get("/api/events").set("Authorization", "Bearer customer-token");
    expect(response.status).toBe(403);
  });
});

