import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, sessionTable, workoutTable } from "@workspace/db";
import {
  ListSessionsQueryParams,
  ListSessionsResponse,
  CompleteSessionBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sessions", async (req, res): Promise<void> => {
  const query = ListSessionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const limit = query.data.limit ?? 30;
  const rows = await db
    .select()
    .from(sessionTable)
    .orderBy(desc(sessionTable.completedAt))
    .limit(limit);
  res.json(ListSessionsResponse.parse(rows));
});

router.post("/sessions", async (req, res): Promise<void> => {
  const parsed = CompleteSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [workout] = await db
    .select()
    .from(workoutTable)
    .where(eq(workoutTable.id, parsed.data.workoutId));
  if (!workout) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }
  const today = new Date();
  const completedDate = today.toISOString().slice(0, 10);
  const [created] = await db
    .insert(sessionTable)
    .values({
      workoutId: workout.id,
      workoutName: workout.name,
      completedAt: today,
      completedDate,
      durationMinutes: parsed.data.durationMinutes,
      caloriesBurned: parsed.data.caloriesBurned ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "Failed to log session" });
    return;
  }
  res.status(201).json(created);
});

export default router;
