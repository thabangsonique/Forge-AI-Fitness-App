import { Router } from "express";
import {} from "../controllers/workoutsController";

import { getUserStats } from "../controllers/statsController";

const router = Router();

router.get("/stats", getUserStats);

export default router;
