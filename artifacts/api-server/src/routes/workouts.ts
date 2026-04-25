import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db, workoutTable, type ExerciseEntry } from "@workspace/db";
import {
  ListWorkoutsResponse,
  CreateWorkoutBody,
  GetWorkoutParams,
  GetWorkoutResponse,
  UpdateWorkoutParams,
  UpdateWorkoutBody,
  UpdateWorkoutResponse,
  DeleteWorkoutParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

type ExerciseInput = {
  name: string;
  sets: number;
  reps: number;
  weightKg?: number | null;
  durationSeconds?: number | null;
  notes?: string | null;
};

function withIds(exercises: ExerciseInput[]): ExerciseEntry[] {
  return exercises.map((e) => ({
    id: randomUUID(),
    name: e.name,
    sets: e.sets,
    reps: e.reps,
    weightKg: e.weightKg ?? null,
    durationSeconds: e.durationSeconds ?? null,
    notes: e.notes ?? null,
  }));
}

router.get("/workouts", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(workoutTable)
    .orderBy(desc(workoutTable.createdAt));
  res.json(ListWorkoutsResponse.parse(rows));
});

router.post("/workouts", async (req, res): Promise<void> => {
  const parsed = CreateWorkoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db
    .insert(workoutTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      estimatedMinutes: parsed.data.estimatedMinutes,
      exercises: withIds(parsed.data.exercises),
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "Failed to create workout" });
    return;
  }
  res.status(201).json(GetWorkoutResponse.parse(created));
});

router.get("/workouts/:workoutId", async (req, res): Promise<void> => {
  const params = GetWorkoutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(workoutTable)
    .where(eq(workoutTable.id, params.data.workoutId));
  if (!row) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }
  res.json(GetWorkoutResponse.parse(row));
});

router.put("/workouts/:workoutId", async (req, res): Promise<void> => {
  const params = UpdateWorkoutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateWorkoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(workoutTable)
    .set({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      estimatedMinutes: parsed.data.estimatedMinutes,
      exercises: withIds(parsed.data.exercises),
    })
    .where(eq(workoutTable.id, params.data.workoutId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }
  res.json(UpdateWorkoutResponse.parse(updated));
});

router.delete("/workouts/:workoutId", async (req, res): Promise<void> => {
  const params = DeleteWorkoutParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(workoutTable)
    .where(eq(workoutTable.id, params.data.workoutId))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Workout not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
