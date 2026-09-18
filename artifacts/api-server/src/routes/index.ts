import { Router, type IRouter } from "express";
import adminRouter from "./admin";
import healthRouter from "./health";
import mediaRouter from "./media";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(mediaRouter);

export default router;
