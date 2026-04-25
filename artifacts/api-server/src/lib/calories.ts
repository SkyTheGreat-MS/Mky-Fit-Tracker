import type { Profile } from "@workspace/db";

const ACTIVITY_FACTORS: Record<Profile["activityLevel"], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export type CalorieResult = {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  explanation: string;
};

export function calculateCalories(profile: Profile): CalorieResult {
  const sexOffset = profile.sex === "male" ? 5 : profile.sex === "female" ? -161 : -78;
  const bmr = Math.round(
    10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexOffset,
  );
  const factor = ACTIVITY_FACTORS[profile.activityLevel];
  const tdee = Math.round(bmr * factor);

  let target = tdee;
  let goalCopy = "";
  let proteinPerKg = 1.6;

  switch (profile.goal) {
    case "lose_weight":
      target = Math.round(tdee - 500);
      goalCopy = "a 500 kcal daily deficit for steady, sustainable fat loss";
      proteinPerKg = 2.0;
      break;
    case "build_muscle":
      target = Math.round(tdee + 300);
      goalCopy = "a moderate 300 kcal surplus to support lean muscle gain";
      proteinPerKg = 2.0;
      break;
    case "improve_endurance":
      target = Math.round(tdee + 150);
      goalCopy = "a small 150 kcal surplus to fuel longer training sessions";
      proteinPerKg = 1.6;
      break;
    case "maintain":
    default:
      target = tdee;
      goalCopy = "energy balance to maintain your current weight";
      proteinPerKg = 1.6;
      break;
  }

  const proteinGrams = Math.round(profile.weightKg * proteinPerKg);
  const fatGrams = Math.round((target * 0.25) / 9);
  const carbGrams = Math.max(
    0,
    Math.round((target - proteinGrams * 4 - fatGrams * 9) / 4),
  );

  const explanation = `Based on the Mifflin–St Jeor equation, your basal metabolic rate is around ${bmr} kcal. Multiplied by your activity level (${profile.activityLevel.replace("_", " ")}), your daily expenditure is roughly ${tdee} kcal. For your goal we target ${target} kcal — ${goalCopy}. Protein is set to ${proteinPerKg.toFixed(1)} g per kg of body weight to protect lean mass.`;

  return {
    bmr,
    tdee,
    targetCalories: target,
    proteinGrams,
    carbGrams,
    fatGrams,
    explanation,
  };
}
