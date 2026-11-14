import { Router } from "express";
import {
  createProfile,
  getProfile,
  updateProfile,
} from "../controllers/profileController";

const router = Router();

router.get("/", getProfile);
router.post("/", createProfile);
router.patch("/", updateProfile);

export default router;
