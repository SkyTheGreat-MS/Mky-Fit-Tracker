import { Router, type IRouter } from "express";
import { GetRemindersResponse } from "@workspace/api-zod";
import { buildReminders, loadDashboardContext } from "../lib/dashboardLib";

const router: IRouter = Router();

router.get("/reminders", async (_req, res): Promise<void> => {
  const ctx = await loadDashboardContext();
  const reminders = buildReminders(ctx.schedule, ctx.sessionsAll, ctx.workoutsById);
  res.json(GetRemindersResponse.parse(reminders));
});

export default router;
