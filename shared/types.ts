import type { TaskPriority } from "../drizzle/schema";

export type AvailabilityWindow = {
  day: number;
  start: string;
  end: string;
};

export type AiTaskProposal = {
  action: "create_task";
  title: string;
  description?: string | null;
  duration_minutes: number;
  scheduled_start: string | null;
  deadline: string | null;
  recurrence: string | null;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  assumptions: string[];
};

export type ScheduleConflict = {
  taskId: number;
  title: string;
  scheduledStart: string;
  durationMinutes: number;
};

export type SchedulePreview = {
  priority: TaskPriority;
  xpReward: number;
  conflicts: ScheduleConflict[];
  warnings: string[];
  reasons: string[];
  canCommit: boolean;
};

export type AiPreviewResponse =
  | {
      status: "preview";
      proposal: AiTaskProposal;
      schedule: SchedulePreview;
      conversationId: number | null;
    }
  | {
      status: "clarification";
      question: string;
      warnings: string[];
      conversationId: number | null;
    };

export const XP_CONFIG = {
  minutesPerXp: 6,
  minimumXp: 10,
  maximumXp: 100,
  levelBaseXp: 100,
  levelStepXp: 50,
} as const;

export function calculateXpReward(durationMinutes: number) {
  const raw = Math.ceil(durationMinutes / XP_CONFIG.minutesPerXp) * 5;
  return Math.min(XP_CONFIG.maximumXp, Math.max(XP_CONFIG.minimumXp, raw));
}

export function calculateLevel(totalXp: number) {
  if (totalXp < XP_CONFIG.levelBaseXp) return 1;
  return Math.floor((totalXp - XP_CONFIG.levelBaseXp) / XP_CONFIG.levelStepXp) + 2;
}

export function calculateRank(level: number) {
  if (level <= 10) return "E";
  if (level <= 20) return "D";
  if (level <= 30) return "C";
  if (level <= 50) return "B";
  if (level <= 75) return "A";
  return "S";
}

export function normalizePriority(value: unknown): TaskPriority {
  if (value === "critical" || value === "high" || value === "low") return value;
  return "medium";
}

export function priorityScore(input: {
  requested: TaskPriority;
  deadline?: Date | null;
  now?: Date;
  durationMinutes: number;
}) {
  const now = input.now ?? new Date();
  let score = { low: 20, medium: 40, high: 65, critical: 90 }[input.requested];

  if (input.deadline) {
    const hours = (input.deadline.getTime() - now.getTime()) / 3_600_000;
    if (hours <= 24) score += 20;
    else if (hours <= 72) score += 10;
  }

  if (input.durationMinutes >= 120) score += 5;
  if (score >= 90) return "critical" as const;
  if (score >= 60) return "high" as const;
  if (score <= 25) return "low" as const;
  return "medium" as const;
}

export function dateKey(date: Date, timezone = "UTC") {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function taskEnd(start: Date, durationMinutes: number) {
  return new Date(start.getTime() + durationMinutes * 60_000);
}

export function intervalsOverlap(
  aStart: Date,
  aDuration: number,
  bStart: Date,
  bDuration: number,
) {
  const aEnd = taskEnd(aStart, aDuration).getTime();
  const bEnd = taskEnd(bStart, bDuration).getTime();
  return aStart.getTime() < bEnd && bStart.getTime() < aEnd;
}
