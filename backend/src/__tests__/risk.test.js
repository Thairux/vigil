import { describe, expect, it } from "vitest";
import { scoreEventRisk } from "../lib/risk.js";

describe("scoreEventRisk", () => {
  it("returns low risk for small local transfer", () => {
    const result = scoreEventRisk({
      amount: 120,
      type: "Transfer",
      device: "MacBook Pro",
      location: "New York, US",
    });

    expect(result.riskBand).toBe("low");
    expect(result.isRisky).toBe(false);
  });

  it("returns high or critical risk for large international transfer", () => {
    const result = scoreEventRisk({
      amount: 75000,
      type: "International",
      device: "Unknown Device",
      location: "Tehran, IR",
    });

    expect(result.riskScore).toBeGreaterThanOrEqual(80);
    expect(result.isRisky).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

