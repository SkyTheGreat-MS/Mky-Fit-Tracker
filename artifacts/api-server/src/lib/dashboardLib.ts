import { desc, gte, inArray } from "drizzle-orm";
import {
  db,
  scheduleTable,
  sessionTable,
  workoutTable,
  type WorkoutSession,
  type ScheduleEntryRow,
} from "@workspace/db";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function todayKey(date = new Date()): typeof WEEKDAY_KEYS[number] {
  return WEEKDAY_KEYS[date.getDay()]!;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function buildWeekHistory(sessions: WorkoutSession[]): {
  date: string;
  completed: boolean;
}[] {
  const completedDates = new Set(sessions.map((s) => s.completedDate));
  const result: { date: string; completed: boolean }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = isoDate(d);
    result.push({ date: iso, completed: completedDates.has(iso) });
  }
  return result;
}

export function computeStreak(sessions: WorkoutSession[]): {
  currentDays: number;
  bestDays: number;
  lastActiveDate: string | null;
} {
  if (sessions.length === 0) {
    return { currentDays: 0, bestDays: 0, lastActiveDate: null };
  }
  const days = Array.from(new Set(sessions.map((s) => s.completedDate))).sort();
  // best streak
  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]!);
    const curr = new Date(days[i]!);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  // current streak — counting back from today (or yesterday if not done today)
  const todayIso = isoDate(new Date());
  const yesterdayIso = isoDate(new Date(Date.now() - 86400000));
  const daysSet = new Set(days);
  let cursor: Date;
  if (daysSet.has(todayIso)) {
    cursor = new Date();
  } else if (daysSet.has(yesterdayIso)) {
    cursor = new Date(Date.now() - 86400000);
  } else {
    return {
      currentDays: 0,
      bestDays: best,
      lastActiveDate: days[days.length - 1] ?? null,
    };
  }
  let current = 0;
  while (daysSet.has(isoDate(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    currentDays: current,
    bestDays: Math.max(best, current),
    lastActiveDate: days[days.length - 1] ?? null,
  };
}

function parseTime(timeOfDay: string, base: Date): Date {
  const [h, m] = timeOfDay.split(":").map((n) => Number(n));
  const d = new Date(base);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

function dateForWeekday(weekday: string): Date {
  const idx = WEEKDAY_KEYS.indexOf(weekday as typeof WEEKDAY_KEYS[number]);
  const today = new Date();
  const todayIdx = today.getDay();
  const diff = idx - todayIdx;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
}

export async function loadDashboardContext() {
  const [schedule, sessionsAll, workouts] = await Promise.all([
    db.select().from(scheduleTable),
    db
      .select()
      .from(sessionTable)
      .orderBy(desc(sessionTable.completedAt))
      .limit(60),
    db.select().from(workoutTable),
  ]);
  const workoutsById = new Map(workouts.map((w) => [w.id, w]));
  return { schedule, sessionsAll, workouts, workoutsById };
}

export function todaysScheduleEntry(schedule: ScheduleEntryRow[]) {
  const today = todayKey();
  const entries = schedule
    .filter((e) => e.weekday === today)
    .sort((a, b) => a.timeOfDay.localeCompare(b.timeOfDay));
  return entries[0] ?? null;
}

export function buildReminders(
  schedule: ScheduleEntryRow[],
  sessionsAll: WorkoutSession[],
  workoutsById: Map<string, { id: string; name: string }>,
) {
  const now = new Date();
  const completedToday = new Set(
    sessionsAll
      .filter((s) => s.completedDate === isoDate(now))
      .map((s) => s.workoutId),
  );
  const reminders: {
    id: string;
    kind: "missed" | "upcoming";
    message: string;
    workoutId: string;
    workoutName: string;
    scheduledFor: string;
  }[] = [];
  for (const entry of schedule) {
    const workout = workoutsById.get(entry.workoutId);
    const workoutName = workout?.name ?? "Workout";
    const dayDate = dateForWeekday(entry.weekday);
    const scheduled = parseTime(entry.timeOfDay, dayDate);
    if (entry.weekday === todayKey()) {
      if (completedToday.has(entry.workoutId)) continue;
      if (scheduled.getTime() < now.getTime()) {
        reminders.push({
          id: entry.id,
          kind: "missed",
          message: `You missed "${workoutName}" at ${entry.timeOfDay}. Knock it out before midnight to keep your streak.`,
          workoutId: entry.workoutId,
          workoutName,
          scheduledFor: scheduled.toISOString(),
        });
      } else {
        reminders.push({
          id: entry.id,
          kind: "upcoming",
          message: `"${workoutName}" is on for today at ${entry.timeOfDay}.`,
          workoutId: entry.workoutId,
          workoutName,
          scheduledFor: scheduled.toISOString(),
        });
      }
    }
  }
  reminders.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "missed" ? -1 : 1;
    return a.scheduledFor.localeCompare(b.scheduledFor);
  });
  return reminders;
}

export async function buildDashboard() {
  const ctx = await loadDashboardContext();
  const today = new Date();
  const weekStart = startOfWeek(today);
  const recentSessions = ctx.sessionsAll.slice(0, 8);
  const weekSessions = ctx.sessionsAll.filter(
    (s) => s.completedAt.getTime() >= weekStart.getTime(),
  );
  const sessionsThisWeek = weekSessions.length;
  const minutesThisWeek = weekSessions.reduce(
    (acc, s) => acc + s.durationMinutes,
    0,
  );
  const caloriesThisWeek = weekSessions.reduce(
    (acc, s) => acc + (s.caloriesBurned ?? 0),
    0,
  );
  const goalSessions = Math.max(
    3,
    new Set(ctx.schedule.map((e) => e.weekday)).size,
  );
  const todayEntry = todaysScheduleEntry(ctx.schedule);
  const todaysWorkout = todayEntry
    ? {
        id: todayEntry.id,
        weekday: todayEntry.weekday,
        timeOfDay: todayEntry.timeOfDay,
        workoutId: todayEntry.workoutId,
        workoutName:
          ctx.workoutsById.get(todayEntry.workoutId)?.name ?? "Workout",
      }
    : null;
  const todayCompleted = todayEntry
    ? ctx.sessionsAll.some(
        (s) =>
          s.completedDate === isoDate(today) &&
          s.workoutId === todayEntry.workoutId,
      )
    : ctx.sessionsAll.some((s) => s.completedDate === isoDate(today));
  const streakCounts = computeStreak(ctx.sessionsAll);
  const weekHistory = buildWeekHistory(ctx.sessionsAll);
  const reminders = buildReminders(
    ctx.schedule,
    ctx.sessionsAll,
    ctx.workoutsById,
  );
  const hours = today.getHours();
  const greeting =
    hours < 5
      ? "Late session, athlete"
      : hours < 12
        ? "Good morning"
        : hours < 17
          ? "Good afternoon"
          : "Good evening";

  return {
    greeting,
    todayDate: isoDate(today),
    todaysWorkout,
    todayCompleted,
    streak: {
      currentDays: streakCounts.currentDays,
      bestDays: streakCounts.bestDays,
      lastActiveDate: streakCounts.lastActiveDate,
      weekHistory,
    },
    weeklyStats: {
      sessionsThisWeek,
      minutesThisWeek,
      caloriesThisWeek,
      goalSessions,
    },
    recentSessions: recentSessions.map((s) => ({
      id: s.id,
      workoutId: s.workoutId,
      workoutName: s.workoutName,
      completedAt: s.completedAt.toISOString(),
      durationMinutes: s.durationMinutes,
      caloriesBurned: s.caloriesBurned,
      notes: s.notes,
    })),
    activeReminders: reminders,
  };
}
