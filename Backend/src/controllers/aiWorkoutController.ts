import { fromNodeHeaders } from "better-auth/node";
import { Request, Response } from "express";
import { auth } from "../lib/auth";
import { checkUserEntitlement } from "../services/aiUsage/subscriptionService";
import {
  generateUserWorkout,
  saveAiWorkoutDraft,
} from "../services/aiWorkout/geminiWorkoutService";
import { GenerateWorkoutRequest } from "../services/aiWorkout/types";

//post request to create workout via AI
export const generateWorkout = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session || !session.user) {
      return res.status(401).json({
        error: "Unauthorized - no token found.",
      });
    }

    const userId = session.user.id;

    const {
      mode, //depending on insight drive or custom
      targetMuscles, //user selection
      insightFocus,
      scheduledDate,
      targetDurationMinutes, //user selection
      fitnessGoal, //userselection or database
      experienceLevel, //database
      preferredEquipment, //user selection
    } = req.body;

    if (!mode || (mode !== "custom" && mode !== "insight_driven")) {
      return res.status(400).json({
        error: "Invalid mode. Must be 'custom' or 'insight_driven'.",
      });
    }

    //workout Request structure to be sent to Google Gemini.
    const workoutRequest: GenerateWorkoutRequest = {
      mode,
      targetMuscles,
      insightFocus,
      scheduledDate,
      targetDurationMinutes,
      fitnessGoal,
      experienceLevel,
      preferredEquipment,
    };

    //Call workout and return workout as a draft. -before user approval
    const result = await generateUserWorkout(userId, workoutRequest);

    //check ai clearence error.
    if (!result.success) {
      const statusCode = result.retryAfterSeconds ? 429 : 400;

      return res.status(statusCode).json({
        success: false,
        error: result.error,
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    //If no error is found from clearance, return draft workout.

    return res.status(200).json({
      success: true,
      source: result.source,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in generateWorkout controller:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while generating workout.",
    });
  }
};

//Call to save the workout inside the workouts table after user approves the workout.

export const saveDraftWorkout = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const userId = session.user.id;

    const { draftId } = req.body;

    if (!draftId) {
      return res.status(400).json({ error: "draftId is required." });
    }

    const saved = await saveAiWorkoutDraft(userId, draftId);

    return res.status(200).json({
      success: true,
      workoutId: saved.workoutId,
      workoutName: saved.workoutName,
      message: "Workout saved successfully to your library!",
    });
  } catch (error: any) {
    console.error("Error in saveWorkoutDraft controller:", error);
    return res.status(403).json({
      success: false,
      error: "Failed to save draft workout.",
    });
  }
};

//report user generation slot remaining to front-end
export const getWorkoutAiStatus = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const userId = session.user.id;

    const entitlement = await checkUserEntitlement(
      userId,
      "workout_generation"
    );

    return res.status(200).json({
      success: true,
      tier: entitlement.tier,
      allowed: entitlement.allowed,
      reason: entitlement.reason,
      trialSummary: entitlement.trialSummary,
    });
  } catch (error: any) {
    console.error("Error in getWorkoutAiStatus controller:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve workout generation status.",
    });
  }
};
