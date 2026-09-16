import { Router } from "express";
import {} from "../controllers/workoutsController";
import {
  createWorkoutSession,
  getSessionDates,
  getWorkoutSessionById,
  getWorkoutSessionHistory,
} from "../controllers/workoutSessionsController";

const router = Router();

router.get("/session/:id", getWorkoutSessionById); //-TESTED WORKOING
router.get("/session-dates", getSessionDates); //-TESTED WORKING
router.get("/session-history", getWorkoutSessionHistory); //- TESTED WORKING
router.post("/session", createWorkoutSession); //-TESTED WORKING.

export default router;
