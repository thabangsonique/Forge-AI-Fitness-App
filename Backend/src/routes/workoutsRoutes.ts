import { Router } from "express";
import {
  createWorkout,
  getAllWorkouts,
  getWorkoutById,
  getWorkoutsBySearch,
} from "../controllers/workoutsController";

const router = Router();

router.post("/create", createWorkout); // -TESTED WORKING.
router.get("/get-workout/:id", getWorkoutById); // - TESTED WORKING
router.get("/", getAllWorkouts); // -TESTED WORKOING
router.get("/search", getWorkoutsBySearch);

export default router;
