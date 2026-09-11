import { Router } from "express";
import {
  createWorkout,
  getAllWorkouts,
  getWorkoutById,
} from "../controllers/workoutsController";

const router = Router();

router.post("/workouts", createWorkout);
router.get("/workouts/:id", getWorkoutById);
router.get("/workouts", getAllWorkouts);

export default router;
