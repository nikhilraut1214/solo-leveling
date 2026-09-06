import { and, desc, eq, gte, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertTask,
  InsertUser,
  aiConversations,
  auditEvents,
  streaks,
  tasks,
  userPreferences,
  users,
  xpTransactions,
} from "../drizzle/schema";
import { calculateLevel, calculateRank, dateKey } from "../shared/types";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function ensurePreferences(userId: number) {
  const existing = await getPreferences(userId);
  if (existing) return existing;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userPreferences).values({ userId, availabilityWindows: "[]", notificationPreferences: "{}" });
  return getPreferences(userId);
}

export async function updatePreferences(
  userId: number,
  values: Partial<{
    timezone: string;
    availabilityWindows: string;
    dailyCapacityMinutes: number;
    notificationPreferences: string;
  }>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensurePreferences(userId);
  await db.update(userPreferences).set(values).where(eq(userPreferences.userId, userId));
  return getPreferences(userId);
}

export async function listTasks(userId: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const filters = [eq(tasks.userId, userId)];
  if (from) filters.push(gte(tasks.scheduledStart, from));
  if (to) filters.push(lt(tasks.scheduledStart, to));
  return db.select().from(tasks).where(and(...filters)).orderBy(tasks.scheduledStart);
}

export async function getTaskById(userId: number, taskId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
    .limit(1);
  return result[0];
}

export async function findTaskConflicts(
  userId: number,
  scheduledStart: Date,
  durationMinutes: number,
  excludeTaskId?: number,
) {
  const dayStart = new Date(scheduledStart);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const scheduled = await listTasks(userId, dayStart, dayEnd);
  const end = scheduledStart.getTime() + durationMinutes * 60_000;
  return scheduled.filter((task) => {
    if (!task.scheduledStart || task.id === excludeTaskId) return false;
    if (task.status === "completed" || task.status === "cancelled") return false;
    const taskEnd = task.scheduledStart.getTime() + task.durationMinutes * 60_000;
    return scheduledStart.getTime() < taskEnd && task.scheduledStart.getTime() < end;
  });
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return Number(result[0]?.insertId);
}

export async function updateTask(userId: number, taskId: number, values: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(tasks)
    .set(values)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)));
  return getTaskById(userId, taskId);
}

export async function completeTaskWithXp(userId: number, taskId: number, idempotencyKey: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.transaction(async (tx) => {
    const taskResult = await tx
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.id, taskId)))
      .limit(1);
    const task = taskResult[0];
    if (!task) throw new Error("Task not found");

    const prior = await tx
      .select()
      .from(xpTransactions)
      .where(eq(xpTransactions.idempotencyKey, idempotencyKey))
      .limit(1);
    if (prior[0]) return { task, xp: prior[0], duplicate: true };

    if (task.status === "completed") {
      const existing = await tx
        .select()
        .from(xpTransactions)
        .where(eq(xpTransactions.taskId, taskId))
        .limit(1);
      if (existing[0]) return { task, xp: existing[0], duplicate: true };
    }

    await tx.update(tasks).set({ status: "completed" }).where(eq(tasks.id, taskId));
    await tx.insert(xpTransactions).values({
      userId,
      taskId,
      amount: task.xpReward,
      reason: `Completed: ${task.title}`,
      idempotencyKey,
    });
    const userResult = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    const currentUser = userResult[0];
    const nextTotalXp = (currentUser?.totalXp ?? 0) + task.xpReward;
    const nextLevel = calculateLevel(nextTotalXp);
    await tx
      .update(users)
      .set({ totalXp: nextTotalXp, level: nextLevel, rank: calculateRank(nextLevel) })
      .where(eq(users.id, userId));

    const today = dateKey(new Date(), "UTC");
    const streakResult = await tx.select().from(streaks).where(eq(streaks.userId, userId)).limit(1);
    const currentStreak = streakResult[0];
    if (!currentStreak) {
      await tx.insert(streaks).values({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastQualifiedDate: today,
      });
    } else if (currentStreak.lastQualifiedDate !== today) {
      const previous = currentStreak.lastQualifiedDate
        ? new Date(`${currentStreak.lastQualifiedDate}T00:00:00Z`)
        : null;
      const todayDate = new Date(`${today}T00:00:00Z`);
      const dayDelta = previous ? Math.round((todayDate.getTime() - previous.getTime()) / 86_400_000) : 0;
      const nextStreak = dayDelta === 1 ? currentStreak.currentStreak + 1 : 1;
      await tx
        .update(streaks)
        .set({
          currentStreak: nextStreak,
          longestStreak: Math.max(currentStreak.longestStreak, nextStreak),
          lastQualifiedDate: today,
        })
        .where(eq(streaks.userId, userId));
    }
    const xpResult = await tx
      .select()
      .from(xpTransactions)
      .where(eq(xpTransactions.idempotencyKey, idempotencyKey))
      .limit(1);
    return { task: { ...task, status: "completed" as const }, xp: xpResult[0], duplicate: false };
  });
}

export async function listXpTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(xpTransactions)
    .where(eq(xpTransactions.userId, userId))
    .orderBy(desc(xpTransactions.createdAt));
}

export async function getProgressData(userId: number) {
  const [user, allTasks, xp, streak] = await Promise.all([
    getUserById(userId),
    listTasks(userId),
    listXpTransactions(userId),
    getStreak(userId),
  ]);
  const completedTasks = allTasks.filter((task) => task.status === "completed").length;
  return {
    user,
    completedTasks,
    totalTasks: allTasks.length,
    totalXpEarned: xp.reduce((sum, entry) => sum + entry.amount, 0),
    xpTransactions: xp,
    streak,
  };
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function getStreak(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(streaks).where(eq(streaks.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getTodayContext(userId: number, timezone = "UTC") {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const key = formatter.format(now);
  const start = new Date(`${key}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const [todayTasks, preferences] = await Promise.all([
    listTasks(userId, start, end),
    getPreferences(userId),
  ]);
  return { todayTasks, preferences };
}

export async function saveAiConversation(data: {
  userId: number;
  message: string;
  intent?: string;
  structuredAction?: string;
  validationResult?: string;
  response?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(aiConversations).values(data);
  return Number(result[0]?.insertId) || null;
}

export async function saveAuditEvent(data: {
  userId: number;
  action: string;
  actor?: string;
  payloadSummary?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values({ ...data, actor: data.actor ?? "user" });
}
