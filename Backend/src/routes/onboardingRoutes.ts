import { Router } from "express";
import { completeOnboardingProfile } from "../controllers/onboardingController";

const router = Router();

router.post("/complete", completeOnboardingProfile);

export default router;
