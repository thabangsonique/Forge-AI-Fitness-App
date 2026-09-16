import { Router } from "express";
import { getScheduledWorkouts } from "../controllers/workoutsController";

const router = Router();

// NEW: Fetch scheduled workouts for the current week
router.get("/scheduled-workouts", getScheduledWorkouts);

export default router;
