import { describe, expect, it } from "vitest";
import {
  calculateLevel,
  calculateRank,
  calculateXpReward,
  intervalsOverlap,
  priorityScore,
} from "../shared/types";

describe("AWAKEN progression rules", () => {
  it("calculates bounded XP from duration", () => {
    expect(calculateXpReward(5)).toBe(10);
    expect(calculateXpReward(60)).toBe(50);
    expect(calculateXpReward(480)).toBe(100);
  });

  it("maps XP to level and rank deterministically", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateRank(1)).toBe("E");
    expect(calculateRank(20)).toBe("D");
    expect(calculateRank(76)).toBe("S");
  });

  it("raises urgency when a deadline is close", () => {
    const now = new Date("2026-09-06T10:00:00Z");
    expect(priorityScore({ requested: "medium", durationMinutes: 30, now, deadline: new Date("2026-09-06T20:00:00Z") })).toBe("high");
  });
});

describe("AWAKEN scheduling rules", () => {
  it("detects overlapping intervals and permits adjacent intervals", () => {
    const start = new Date("2026-09-06T10:00:00Z");
    expect(intervalsOverlap(start, 60, new Date("2026-09-06T10:30:00Z"), 30)).toBe(true);
    expect(intervalsOverlap(start, 60, new Date("2026-09-06T11:00:00Z"), 30)).toBe(false);
  });
});
