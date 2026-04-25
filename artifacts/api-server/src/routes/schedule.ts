import { Router, type IRouter } from "express";
import { inArray } from "drizzle-orm";
import { db, scheduleTable, workoutTable } from "@workspace/db";
import {
  GetScheduleResponse,
  UpsertScheduleBody,
  UpsertScheduleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const WEEKDAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

async function loadScheduleWithNames() {
  const entries = await db.select().from(scheduleTable);
  if (entries.length === 0) return [];
  const ids = Array.from(new Set(entries.map((e) => e.workoutId)));
  const workouts = await db
    .select()
    .from(workoutTable)
    .where(inArray(workoutTable.id, ids));
  const nameById = new Map(workouts.map((w) => [w.id, w.name]));
  return entries
    .map((e) => ({
      id: e.id,
      weekday: e.weekday,
      timeOfDay: e.timeOfDay,
      workoutId: e.workoutId,
      workoutName: nameById.get(e.workoutId) ?? "Workout",
    }))
    .sort((a, b) => {
      const dayDiff =
        WEEKDAY_ORDER.indexOf(a.weekday) - WEEKDAY_ORDER.indexOf(b.weekday);
      if (dayDiff !== 0) return dayDiff;
      return a.timeOfDay.localeCompare(b.timeOfDay);
    });
}

router.get("/schedule", async (_req, res): Promise<void> => {
  const entries = await loadScheduleWithNames();
  res.json(GetScheduleResponse.parse(entries));
});

router.post("/schedule", async (req, res): Promise<void> => {
  const parsed = UpsertScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.delete(scheduleTable);
  if (parsed.data.entries.length > 0) {
    await db.insert(scheduleTable).values(parsed.data.entries);
  }
  const entries = await loadScheduleWithNames();
  res.json(UpsertScheduleResponse.parse(entries));
});

export default router;
