import {
  boolean,
  int,
  index,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  totalXp: int("totalXp").notNull().default(0),
  level: int("level").notNull().default(1),
  rank: varchar("rank", { length: 4 }).notNull().default("E"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  timezone: varchar("timezone", { length: 64 }).default("UTC").notNull(),
  availabilityWindows: text("availabilityWindows").notNull(),
  dailyCapacityMinutes: int("dailyCapacityMinutes").notNull().default(120),
  notificationPreferences: text("notificationPreferences").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tasks = mysqlTable(
  "tasks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 64 }).notNull().default("general"),
    priority: mysqlEnum("priority", ["low", "medium", "high", "critical"])
      .notNull()
      .default("medium"),
    durationMinutes: int("durationMinutes").notNull().default(30),
    scheduledStart: timestamp("scheduledStart"),
    deadline: timestamp("deadline"),
    recurrenceRule: varchar("recurrenceRule", { length: 128 }),
    status: mysqlEnum("status", ["planned", "in_progress", "completed", "postponed", "cancelled"])
      .notNull()
      .default("planned"),
    xpReward: int("xpReward").notNull().default(10),
    source: mysqlEnum("source", ["manual", "ai"]).notNull().default("manual"),
    completionIdempotencyKey: varchar("completionIdempotencyKey", { length: 128 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userScheduleIdx: index("tasks_user_schedule_idx").on(table.userId, table.scheduledStart),
    userStatusIdx: index("tasks_user_status_idx").on(table.userId, table.status),
    userDeadlineIdx: index("tasks_user_deadline_idx").on(table.userId, table.deadline),
  }),
);

export const xpTransactions = mysqlTable(
  "xp_transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    taskId: int("taskId"),
    amount: int("amount").notNull(),
    reason: varchar("reason", { length: 255 }).notNull(),
    idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    idempotencyIdx: uniqueIndex("xp_idempotency_idx").on(table.idempotencyKey),
    userCreatedIdx: index("xp_user_created_idx").on(table.userId, table.createdAt),
  }),
);

export const streaks = mysqlTable("streaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentStreak: int("currentStreak").notNull().default(0),
  longestStreak: int("longestStreak").notNull().default(0),
  lastQualifiedDate: varchar("lastQualifiedDate", { length: 16 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const aiConversations = mysqlTable(
  "ai_conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    message: text("message").notNull(),
    intent: varchar("intent", { length: 64 }),
    structuredAction: text("structuredAction"),
    validationResult: text("validationResult"),
    response: text("response"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index("ai_user_created_idx").on(table.userId, table.createdAt),
  }),
);

export const auditEvents = mysqlTable(
  "audit_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    actor: varchar("actor", { length: 32 }).notNull().default("user"),
    payloadSummary: text("payloadSummary"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userCreatedIdx: index("audit_user_created_idx").on(table.userId, table.createdAt),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type XpTransaction = typeof xpTransactions.$inferSelect;
export type Streak = typeof streaks.$inferSelect;
export type AiConversation = typeof aiConversations.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;

export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];
