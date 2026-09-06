export function formatTime(value: string | Date | null | undefined, timezone?: string) {
  if (!value) return "Unscheduled";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Unscheduled";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(date);
}

export function formatDate(value: string | Date | null | undefined, timezone?: string) {
  if (!value) return "No date";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: timezone }).format(date);
}

export function formatDayHeading(value: Date = new Date()) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(value);
}

export function priorityTone(priority: string) {
  if (priority === "critical" || priority === "high") return "warning" as const;
  if (priority === "low") return "muted" as const;
  return "primary" as const;
}

export function idempotencyKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
