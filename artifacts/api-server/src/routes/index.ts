import { Router, type IRouter } from "express";
import healthRouter from "./health";
import resumesRouter from "./resumes";
import jobsRouter from "./jobs";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(resumesRouter);
router.use(jobsRouter);
router.use(dashboardRouter);

export default router;
