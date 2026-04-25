import { Router, type IRouter } from "express";
import { TrainerChatBody, TrainerChatResponse } from "@workspace/api-zod";
import { openai } from "../lib/openai";
import { getOrCreateProfile } from "../lib/profile";
import { calculateCalories } from "../lib/calories";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are Mky's in-app personal trainer — calm, knowledgeable, and disciplined. You help the user with:
- Designing or refining workout structure (splits, volume, frequency, progression schemes).
- Form cues and common technique mistakes for major lifts and cardio modalities.
- Programming advice tied to their stated goal (fat loss, muscle gain, endurance, maintenance).
- Nutrition guidance grounded in their calculated daily calorie and macro targets — refer to the numbers when relevant, never invent new ones.

Tone: confident, plain-spoken, second-person, no hype, no emojis. Keep replies tight — usually 3 to 6 short paragraphs or a compact bulleted list. When the user asks something outside training, nutrition, recovery, or motivation around workouts, gently redirect.`;

router.post("/trainer/chat", async (req, res): Promise<void> => {
  const parsed = TrainerChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const profile = await getOrCreateProfile();
  const calories = calculateCalories(profile);
  const profileSummary = `User profile — name: ${profile.displayName}; sex: ${profile.sex}; age: ${profile.age}; height: ${profile.heightCm} cm; weight: ${profile.weightKg} kg; goal: ${profile.goal}; activity level: ${profile.activityLevel}; target weight: ${profile.targetWeightKg ?? "not set"} kg.\nDaily targets — calories: ${calories.targetCalories} kcal, protein: ${calories.proteinGrams} g, carbs: ${calories.carbGrams} g, fat: ${calories.fatGrams} g. BMR: ${calories.bmr} kcal, TDEE: ${calories.tdee} kcal.`;

  const history = (parsed.data.history ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 1200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: profileSummary },
        ...history,
        { role: "user", content: parsed.data.message },
      ],
    });
    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      "I had trouble generating a reply just now. Try asking again in a moment.";
    res.json(TrainerChatResponse.parse({ reply }));
  } catch (err) {
    req.log.error({ err }, "Trainer chat failed");
    res.status(502).json({ error: "Trainer is unavailable right now." });
  }
});

export default router;
