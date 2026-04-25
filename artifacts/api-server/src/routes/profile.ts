import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profileTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
  GetCalorieRecommendationResponse,
} from "@workspace/api-zod";
import { getOrCreateProfile } from "../lib/profile";
import { calculateCalories } from "../lib/calories";

const router: IRouter = Router();

router.get("/profile", async (_req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  res.json(GetProfileResponse.parse(profile));
});

router.put("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const existing = await getOrCreateProfile();
  const [updated] = await db
    .update(profileTable)
    .set(parsed.data)
    .where(eq(profileTable.id, existing.id))
    .returning();
  if (!updated) {
    res.status(500).json({ error: "Failed to update profile" });
    return;
  }
  res.json(UpdateProfileResponse.parse(updated));
});

router.get("/profile/calories", async (_req, res): Promise<void> => {
  const profile = await getOrCreateProfile();
  const result = calculateCalories(profile);
  res.json(GetCalorieRecommendationResponse.parse(result));
});

export default router;
