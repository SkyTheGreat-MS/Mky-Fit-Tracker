import {
  pgTable,
  text,
  uuid,
  integer,
  doublePrecision,
  timestamp,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const sexEnum = pgEnum("sex", ["male", "female", "other"]);
export const goalEnum = pgEnum("fitness_goal", [
  "lose_weight",
  "maintain",
  "build_muscle",
  "improve_endurance",
]);
export const activityEnum = pgEnum("activity_level", [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);
export const weekdayEnum = pgEnum("weekday", [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

export const profileTable = pgTable("profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
  sex: sexEnum("sex").notNull(),
  age: integer("age").notNull(),
  heightCm: doublePrecision("height_cm").notNull(),
  weightKg: doublePrecision("weight_kg").notNull(),
  goal: goalEnum("goal").notNull(),
  activityLevel: activityEnum("activity_level").notNull(),
  targetWeightKg: doublePrecision("target_weight_kg"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type ExerciseEntry = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weightKg?: number | null;
  durationSeconds?: number | null;
  notes?: string | null;
};

export const workoutTable = pgTable("workout", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  exercises: jsonb("exercises").$type<ExerciseEntry[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessionTable = pgTable("session", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id").notNull(),
  workoutName: text("workout_name").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedDate: date("completed_date").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  caloriesBurned: integer("calories_burned"),
  notes: text("notes"),
});

export const scheduleTable = pgTable("schedule_entry", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekday: weekdayEnum("weekday").notNull(),
  timeOfDay: text("time_of_day").notNull(),
  workoutId: uuid("workout_id").notNull(),
});

export type Profile = typeof profileTable.$inferSelect;
export type Workout = typeof workoutTable.$inferSelect;
export type WorkoutSession = typeof sessionTable.$inferSelect;
export type ScheduleEntryRow = typeof scheduleTable.$inferSelect;
