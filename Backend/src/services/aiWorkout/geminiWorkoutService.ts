import { GoogleGenAI } from "@google/genai";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import {
  aiGeneratedWorkouts,
  scheduledWorkouts,
  workoutExercises,
  workouts,
} from "../../db/schema";
import { loadAiConfig } from "../aiUsage/aiUsageConfig";
import {
  abortAiExecution,
  completeAiExecution,
  prepareAiExecution,
} from "../aiUsage/usageManagerservice";
import { getUserFitnessProfile } from "../fitnessAnalytics/profileService";
import {
  fetchExercisesCandidates,
  resolveTargetMuscles,
} from "./exerciseCandidate";
import {
  GeneratedWorkoutPlan,
  GenerateWorkoutRequest,
  GenerateWorkoutResult,
} from "./types";
import {
  buildWorkout,
  validateGeneratedWorkout,
  WORKOUT_RESPONSE_JSON_SCHEMA,
  WORKOUT_SYSTEM_INSTRUCTION,
} from "./workoutPromptBuilder";

export const generateUserWorkout = async (
  userId: string,
  request: GenerateWorkoutRequest
): Promise<GenerateWorkoutResult> => {
  const config = loadAiConfig();

  //fetch target muscles.
  const targetMuscles = await resolveTargetMuscles(userId, request);

  //fetch relavent database exercises.
  const candidates = await fetchExercisesCandidates(
    targetMuscles,
    request.preferredEquipment
  );

  //if no exercises found
  if (candidates.length === 0) {
    return {
      success: false,
      error: `No exercises found in the database for muscles: ${targetMuscles.join(", ")}.`,
    };
  }

  //ask for ai generation clearence.
  const gate = await prepareAiExecution({
    userId,
    feature: "workout_generation",
  });

  if (!gate.shouldExecute) {
    return {
      success: false,
      error:
        gate.blockedReason || "AI workout generation is currently unavailable.",
      retryAfterSeconds: gate.retryAfterSeconds,
    };
  }

  //Reservation created automatically when prepare execution passes. Get the reservation.
  const reservation = gate.reservation!; //request pending.

  //actual prompt sending to Gemini.
  try {
    const userProfile = await getUserFitnessProfile(userId);

    const ai = new GoogleGenAI({
      apiKey: config.apiKey,
    });

    const promptText = await buildWorkout({
      targetMuscles,
      candidates, //exercises
      request,
      userGoal: userProfile.goal,
      userExperience: userProfile.experience,
    });

    //content and data we are sending to gemini.
    const response = await ai.models.generateContent({
      model: config.model,
      contents: promptText,
      config: {
        systemInstruction: WORKOUT_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: WORKOUT_RESPONSE_JSON_SCHEMA as any,
        temperature: 0.7,
      },
    });

    //convert gemini response to string.
    const rawJsonText = response.text || "{}";
    const parsedData = JSON.parse(rawJsonText) as GeneratedWorkoutPlan;

    if (request.scheduledDate) {
      parsedData.scheduledDate = request.scheduledDate;
    }

    //verify and filter out hellucinated exercises.
    const validatedWorkout = validateGeneratedWorkout(parsedData, candidates);

    if (validatedWorkout.exercises.length < 2) {
      throw new Error(
        "AI generation returned insufficient valid exercises from the database allowlist."
      );
    }

    //save generated workout as draft.
    const [draftRow] = await db
      .insert(aiGeneratedWorkouts)
      .values({
        userId,
        targetMuscles,
        status: "draft",
        workoutData: validatedWorkout as any,
      })
      .returning({
        id: aiGeneratedWorkouts.id,
        createdAt: aiGeneratedWorkouts.createdAt,
      });

    //tokens used from the generation.
    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;

    await completeAiExecution({
      reservationId: reservation.reservationId,
      userId,
      feature: "workout_generation",
      tokens: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    });

    return {
      success: true,
      source: "gemini",
      data: {
        draftId: draftRow.id,
        status: "draft",
        workout: validatedWorkout,
        createdAt: draftRow.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("❌ [Gemini Workout Error]:", error);

    //refund user generation slot.
    await abortAiExecution({
      reservationId: reservation.reservationId,
      userId,
      feature: "workout_generation",
      errorMessage: error.message || "Failed to generate workout.",
    });

    return {
      success: false,
      error:
        "Unable to generate workout right now. Your trial allowance has been preserved. Please try again.",
    };
  }
};

//After user confirms the workout, save it officially in the workouts table.
export const saveAiWorkoutDraft = async (userId: string, draftId: string) => {
  //fetch draft from draft table.
  const draft = await db.query.aiGeneratedWorkouts.findFirst({
    where: eq(aiGeneratedWorkouts.id, draftId),
  });

  if (!draft || draft.userId !== userId) {
    throw new Error("Draft workout not found or unauthorized.");
  }

  const workoutData = draft.workoutData as GeneratedWorkoutPlan;

  const [newWorkout] = await db
    .insert(workouts)
    .values({
      userId,
      name: workoutData.name,
      description: workoutData.description,
      workoutType: "user",
    })
    .returning({ id: workouts.id });

  //insert relevent exercises. into workout Exercises table.
  for (let i = 0; i < workoutData.exercises.length; i++) {
    const ex = workoutData.exercises[i];
    await db.insert(workoutExercises).values({
      userId,
      workoutId: newWorkout.id,
      exerciseId: ex.exerciseId,
      position: i + 1,
      sets: ex.sets,
      reps: ex.reps,
      restSeconds: ex.restSeconds,
    });
  }

  //if workout was scheduled add into the scheduled workouts table.
  if (workoutData.scheduledDate) {
    const scheduledDateObj = new Date(workoutData.scheduledDate);
    await db.insert(scheduledWorkouts).values({
      userId,
      workoutId: newWorkout.id,
      scheduledDate: scheduledDateObj,
      createdAt: new Date(),
    });
  }

  //update save status.
  await db
    .update(aiGeneratedWorkouts)
    .set({
      status: "saved",
      savedWorkoutId: newWorkout.id,
    })
    .where(eq(aiGeneratedWorkouts.id, draftId));

  return {
    success: true,
    workoutId: newWorkout.id,
    workoutName: workoutData.name,
  };
};
