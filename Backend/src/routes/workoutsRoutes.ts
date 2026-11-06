import { Router } from "express";
import {
  createWorkout,
  deleteWorkout,
  getAllWorkouts,
  getWorkoutById,
  getWorkoutsBySearch,
  updateWorkout,
} from "../controllers/workoutsController";

const router = Router();

router.post("/create", createWorkout); // -TESTED WORKING.
router.get("/get-workout/:id", getWorkoutById); // - TESTED WORKING
router.get("/", getAllWorkouts); // -TESTED WORKOING
router.get("/search", getWorkoutsBySearch);
router.put("/:id", updateWorkout);
router.delete("/:id", deleteWorkout);

export default router;
