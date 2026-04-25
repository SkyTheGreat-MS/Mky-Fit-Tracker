import { Router, type IRouter } from "express";
import { GetDashboardResponse } from "@workspace/api-zod";
import { buildDashboard } from "../lib/dashboardLib";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res): Promise<void> => {
  const data = await buildDashboard();
  res.json(GetDashboardResponse.parse(data));
});

export default router;
