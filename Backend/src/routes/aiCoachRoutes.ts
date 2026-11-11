// Backend/src/routes/aiCoachRoutes.ts
import { Router } from "express";
import {
  getCoachInsight,
  getCoachStatus,
} from "../controllers/aiCoachController";

const router = Router();

// Endpoint to fetch or generate the 4 AI coach cards:
router.get("/coach/insights", getCoachInsight);

// Lightweight endpoint to see trial balance ("2 of 3 insights remaining"):
router.get("/coach/status", getCoachStatus);

export default router;
