import type { GenerateContentResponse } from "@google/genai";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import {
  aiGeneratedWorkouts,
  scheduledWorkouts,
  workoutExercises,
  workouts,
} from "../../db/schema";
import {
  getGeminiClient,
  getGeminiThinkingConfig,
  isGemini3Model,
} from "../ai/geminiClient";
import { loadAiConfig } from "../aiUsage/aiUsageConfig";
import {
  abortAiExecution,
  completeAiExecution,
  prepareAiExecution,
} from "../aiUsage/usageManagerservice";
import { getUserFitnessProfile } from "../fitnessAnalytics/profileService";
import { getFitnessContext } from "../fitnessAnalytics/fitnessAnalyticsService";
import { generateFingerPrint } from "../aiCoach/promptBuilder";
import { getCachedInsight } from "../aiUsage/usageManagerservice";
import type { AiCoachInsightResponse } from "../aiCoach/types";
import {
  fetchExercisesCandidates,
} from "./exerciseCandidate";
import {
  GeneratedWorkoutPlan,
  GenerateWorkoutRequest,
  GenerateWorkoutResult,
} from "./types";
import {
  buildWorkout,
  selectSessionPriorities,
  validateWorkoutAgainstRequirements,
  WORKOUT_RESPONSE_JSON_SCHEMA,
  WORKOUT_SYSTEM_INSTRUCTION,
} from "./workoutPromptBuilder";

// Safely extract the HTTP status from an unknown Gemini/network error.
const getGeminiErrorStatus = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const possibleStatuses = [
    (error as { status?: unknown }).status,
    (error as { statusCode?: unknown }).statusCode,
    (error as { cause?: { status?: unknown } }).cause?.status,
  ];

  for (const status of possibleStatuses) {
    if (typeof status === "number") {
      return status;
    }
  }

  return undefined;
};

export const generateUserWorkout = async (
  userId: string,
  request: GenerateWorkoutRequest
): Promise<GenerateWorkoutResult> => {
  const config = loadAiConfig();

  const fitnessContext = await getFitnessContext(userId);
  let insight: AiCoachInsightResponse | undefined;
  let targetMuscles: string[];
  if (request.mode === "insight_driven") {
    const cached = await getCachedInsight<AiCoachInsightResponse>(userId, generateFingerPrint(userId, fitnessContext));
    insight = cached.hit ? cached.data : undefined;
    if (!insight?.muscleFocus || !Array.isArray(insight.muscleFocus.neglectedMuscles)) {
      return { success: false, error: "Generate a current Forge Coach insight before requesting an insight-driven workout." };
    }
    targetMuscles = selectSessionPriorities(
      insight.muscleFocus.neglectedMuscles,
      fitnessContext.trainingGaps.filter((gap) => gap.severity !== "balanced"),
      request.targetDurationMinutes ?? request.durationMinutes ?? 45
    );
  } else {
    targetMuscles = (request.targetMuscles ?? []).map((muscle) => muscle.trim().toLowerCase()).filter(Boolean);
  }
  if (!targetMuscles.length) return { success: false, error: "Choose at least one target muscle or provide a current coaching insight." };

  //fetch relavent database exercises.
  const candidates = await fetchExercisesCandidates(
    targetMuscles,
    request.preferredEquipment,
    request.excludedExerciseIds,
    request.excludedExercises
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

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, config.requestTimeoutMs);
  const startedAt = Date.now();

  //actual prompt sending to Gemini.
  try {
    const userProfile = await getUserFitnessProfile(userId);

    const ai = getGeminiClient(config.apiKey);

    const promptText = await buildWorkout({
      targetMuscles,
      candidates, //exercises
      request,
      userGoal: userProfile.goal,
      userExperience: userProfile.experience,
      insight,
      fitnessContext,
    });

    // Try the primary model first, then the fallback model if the primary is
    // temporarily overloaded (503/429/5xx).
    const modelsToTry = Array.from(
      new Set([config.model, config.fallbackModel].filter(Boolean))
    );

    let response: GenerateContentResponse | undefined;
    let selectedModel = modelsToTry[0];
    let lastError: unknown;

    for (const model of modelsToTry) {
      try {
        //content and data we are sending to gemini.
        response = await ai.models.generateContent({
          model,
          contents: promptText,
          config: {
            systemInstruction: WORKOUT_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseJsonSchema: WORKOUT_RESPONSE_JSON_SCHEMA as any,
            thinkingConfig: getGeminiThinkingConfig(
              model,
              config.thinkingLevel
            ),
            maxOutputTokens: config.maxOutputTokens,
            abortSignal: timeoutController.signal,

            ...(isGemini3Model(model) ? {} : { temperature: 0.7 }),
          },
        });
        selectedModel = model;
        break;
      } catch (error) {
        lastError = error;

        // If the overall timeout fired, do not try another model.
        if (timeoutController.signal.aborted) {
          throw error;
        }

        const status = getGeminiErrorStatus(error);
        const isTemporary = [408, 429, 500, 502, 503, 504].includes(
          status ?? -1
        );

        if (!isTemporary) {
          throw error;
        }

        console.warn(
          `[Gemini Workout] ${model} is overloaded right now; trying the fallback model.`
        );
      }
    }

    if (!response) {
      throw lastError ?? new Error("Gemini did not return a response.");
    }

    //convert gemini response to string.
    const rawJsonText = response.text || "{}";
    let parsedData = JSON.parse(rawJsonText) as GeneratedWorkoutPlan;

    if (request.scheduledDate) {
      parsedData.scheduledDate = request.scheduledDate;
    }

    let validation = validateWorkoutAgainstRequirements(parsedData, candidates, request.mode === "insight_driven" ? targetMuscles : [], request.targetDurationMinutes ?? request.durationMinutes ?? 45);
    if (!validation.workout) {
      console.warn(`[Gemini Workout] validation failed: ${validation.errors.join("; ")}; attempting repair`);
      const repair = await ai.models.generateContent({
        model: selectedModel,
        contents: `${promptText}\n\nREPAIR REQUIRED: The previous workout failed backend validation: ${validation.errors.join("; ")}. Keep valid choices where possible and correct each issue. Respond only with the complete JSON workout.`,
        config: {
          systemInstruction: WORKOUT_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseJsonSchema: WORKOUT_RESPONSE_JSON_SCHEMA as any,
          maxOutputTokens: config.maxOutputTokens,
          abortSignal: timeoutController.signal,
        },
      });
      parsedData = JSON.parse(repair.text || "{}") as GeneratedWorkoutPlan;
      if (request.scheduledDate) parsedData.scheduledDate = request.scheduledDate;
      validation = validateWorkoutAgainstRequirements(parsedData, candidates, request.mode === "insight_driven" ? targetMuscles : [], request.targetDurationMinutes ?? request.durationMinutes ?? 45);
    }
    if (!validation.workout) throw new Error(`Workout validation failed after repair: ${validation.errors.join("; ")}`);
    const validatedWorkout = validation.workout;

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

    console.log(
      `[Gemini Workout] completed in ${Date.now() - startedAt}ms (thoughts: ${
        usage?.thoughtsTokenCount ?? 0
      })`
    );

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

    const timedOut = timeoutController.signal.aborted;

    return {
      success: false,
      error: timedOut
        ? "The AI took too long to respond. Your trial allowance has been preserved. Please try again."
        : "Unable to generate workout right now. Your trial allowance has been preserved. Please try again.",
      retryAfterSeconds: timedOut ? 30 : undefined,
    };
  } finally {
    clearTimeout(timeoutId);
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
