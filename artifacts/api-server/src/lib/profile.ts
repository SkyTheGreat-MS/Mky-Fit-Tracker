import { db, profileTable, type Profile } from "@workspace/db";

export async function getOrCreateProfile(): Promise<Profile> {
  const [existing] = await db.select().from(profileTable).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(profileTable)
    .values({
      displayName: "Athlete",
      sex: "other",
      age: 30,
      heightCm: 175,
      weightKg: 75,
      goal: "build_muscle",
      activityLevel: "moderate",
      targetWeightKg: null,
    })
    .returning();
  if (!created) throw new Error("Failed to create profile");
  return created;
}
