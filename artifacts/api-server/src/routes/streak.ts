import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, sessionTable } from "@workspace/db";
import { GetStreakResponse } from "@workspace/api-zod";
import { buildWeekHistory, computeStreak } from "../lib/dashboardLib";

const router: IRouter = Router();

router.get("/streak", async (_req, res): Promise<void> => {
  const sessions = await db
    .select()
    .from(sessionTable)
    .orderBy(desc(sessionTable.completedAt))
    .limit(120);
  const counts = computeStreak(sessions);
  const weekHistory = buildWeekHistory(sessions);
  res.json(
    GetStreakResponse.parse({
      currentDays: counts.currentDays,
      bestDays: counts.bestDays,
      lastActiveDate: counts.lastActiveDate,
      weekHistory,
    }),
  );
});

export default router;
