import { Router } from "express";
import {} from "../controllers/workoutsController";
import {
  creatWorkoutSession,
  getSessionDates,
  getWorkoutSessionById,
  getWorkoutSessionHistory,
} from "../controllers/workoutSessionsController";

const router = Router();

router.get("/session/:id", getWorkoutSessionById);
router.get("/session-dates", getSessionDates);
router.get("/session-history", getWorkoutSessionHistory);
router.post("/session", creatWorkoutSession);

export default router;
