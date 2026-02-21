const HIGH_RISK_COUNTRIES = new Set(["RU", "KP", "IR", "SY"]);

function parseCountry(location) {
  if (!location) return null;
  const parts = location.split(",").map((part) => part.trim());
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : null;
}

export function scoreEventRisk(input) {
  const amount = Number(input.amount || 0);
  const type = String(input.type || "");
  const device = String(input.device || "").toLowerCase();
  const country = parseCountry(input.location);

  let score = 10;
  const reasons = [];

  if (amount >= 50000) {
    score += 50;
    reasons.push("Very large transaction amount");
  } else if (amount >= 20000) {
    score += 35;
    reasons.push("Large transaction amount");
  } else if (amount >= 8000) {
    score += 15;
    reasons.push("Elevated transaction amount");
  }

  if (type.toLowerCase().includes("international")) {
    score += 20;
    reasons.push("International transaction");
  }

  if (device.toLowerCase().includes("unknown")) {
    score += 15;
    reasons.push("Unknown device");
  }

  if (country && HIGH_RISK_COUNTRIES.has(country)) {
    score += 25;
    reasons.push("High risk geography");
  }

  const riskScore = Math.min(99, score);
  const riskBand = riskScore >= 80 ? "critical" : riskScore >= 60 ? "high" : riskScore >= 35 ? "medium" : "low";

  return {
    riskScore,
    riskBand,
    isRisky: riskScore >= 60,
    reason: reasons[0] || "Normal activity",
    reasons,
  };
}

