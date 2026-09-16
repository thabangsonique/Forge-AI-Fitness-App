import { Router } from "express";
import {
  createWorkout,
  getAllWorkouts,
  getWorkoutById,
} from "../controllers/workoutsController";

const router = Router();

router.post("/create", createWorkout); // -TESTED WORKING.
router.get("/get-workout/:id", getWorkoutById); // - TESTED WORKING
router.get("/", getAllWorkouts); // -TESTED WORKOING

export default router;
