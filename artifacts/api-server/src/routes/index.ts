import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import workoutsRouter from "./workouts";
import sessionsRouter from "./sessions";
import scheduleRouter from "./schedule";
import remindersRouter from "./reminders";
import streakRouter from "./streak";
import dashboardRouter from "./dashboard";
import trainerRouter from "./trainer";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(workoutsRouter);
router.use(sessionsRouter);
router.use(scheduleRouter);
router.use(remindersRouter);
router.use(streakRouter);
router.use(dashboardRouter);
router.use(trainerRouter);

export default router;
