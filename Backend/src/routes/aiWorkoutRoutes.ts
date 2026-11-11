// Backend/src/routes/aiWorkoutRoutes.ts
import { Router } from "express";
import {
  generateWorkout,
  getWorkoutAiStatus,
  saveDraftWorkout,
} from "../controllers/aiWorkoutController";

const router = Router();

// Generates a workout draft (Custom or Insight-driven):
router.post("/workout/generate", generateWorkout);

// Saves the approved draft into user's workouts & calendar:
router.post("/workout/save-draft", saveDraftWorkout);

// Status check (e.g. "2 of 2 workout generations remaining"):
router.get("/workout/status", getWorkoutAiStatus);

export default router;
