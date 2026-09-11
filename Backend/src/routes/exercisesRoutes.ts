import { Router } from "express";
import {
  getExerciseById,
  getExercises,
} from "../controllers/exercisesController";

const router = Router();

router.get("/exercises/:id", getExerciseById);
router.get("/exercises", getExercises);

export default router;
