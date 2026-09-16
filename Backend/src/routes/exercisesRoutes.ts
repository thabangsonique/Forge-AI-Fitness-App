import { Router } from "express";
import {
  getExerciseById,
  getExercises,
} from "../controllers/exercisesController";

const router = Router();

router.get("/exercises/:id", getExerciseById); // -TESTED WORKING
router.get("/exercises", getExercises); //- TESTED WORKING

export default router;
