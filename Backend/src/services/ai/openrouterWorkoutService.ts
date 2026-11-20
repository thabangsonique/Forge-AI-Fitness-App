// OpenRouter-based workout generation service

import { db } from "../../db";
import { aiGeneratedWorkouts } from "../../db/schema";
import { generateFingerPrint } from "../aiCoach/promptBuilder";
import type { AiCoachInsightResponse } from "../aiCoach/types";
import { loadAiConfig } from "../aiUsage/aiUsageConfig";
import {
  abortAiExecution,
  completeAiExecution,
  getCachedInsight,
  prepareAiExecution,
} from "../aiUsage/usageManagerservice";
import { fetchExercisesCandidates } from "../aiWorkout/exerciseCandidate";
import {
  missingCandidatePriorities,
  muscleMatchesPriority,
  requiredMuscleComponents,
} from "../aiWorkout/muscleGroups";
import {
  GeneratedWorkoutPlan,
  GenerateWorkoutRequest,
  GenerateWorkoutResult,
} from "../aiWorkout/types";
import {
  buildWorkout,
  selectSessionPriorities,
  validateWorkoutAgainstRequirements,
  WORKOUT_SYSTEM_INSTRUCTION,
} from "../aiWorkout/workoutPromptBuilder";
import { getFitnessContext } from "../fitnessAnalytics/fitnessAnalyticsService";
import { getUserFitnessProfile } from "../fitnessAnalytics/profileService";

interface OpenrouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
    index: number;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_MAX_ATTEMPTS = 2;

// OpenRouter API endpoint
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const summarizeProviderError = (body: string): string => {
  try {
    const parsed = JSON.parse(body);
    const error = parsed?.error;
    const message = typeof error === "string" ? error : error?.message;
    const code = error?.code;
    return [code, message].filter(Boolean).join(": ") || body;
  } catch {
    return body;
  }
};

/**
 * Generate a workout plan using OpenRouter
 */
export const generateUserWorkoutOpenrouter = async (
  userId: string,
  request: GenerateWorkoutRequest
): Promise<GenerateWorkoutResult> => {
  const config = loadAiConfig();

  // Only proceed if config is valid
  if (!config.isValid) {
    return {
      success: false,
      error: "AI is not properly configured. Please contact support.",
    };
  }

  const fitnessContext = await getFitnessContext(userId);
  let insight: AiCoachInsightResponse | undefined;
  let targetMuscles: string[];
  if (request.mode === "insight_driven") {
    const fingerprint = generateFingerPrint(userId, fitnessContext);
    const cached = await getCachedInsight<AiCoachInsightResponse>(
      userId,
      fingerprint
    );
    insight = cached.hit ? cached.data : undefined;
    if (
      !insight?.muscleFocus ||
      !Array.isArray(insight.muscleFocus.neglectedMuscles)
    ) {
      console.info(
        "[OpenRouter Workout] insight-driven request has no current saved coaching insight"
      );
      return {
        success: false,
        error:
          "Generate a current Forge Coach insight before requesting an insight-driven workout.",
      };
    }
    targetMuscles = selectSessionPriorities(
      insight.muscleFocus.neglectedMuscles,
      fitnessContext.trainingGaps.filter((gap) => gap.severity !== "balanced"),
      request.targetDurationMinutes ?? request.durationMinutes ?? 45
    );
  } else {
    targetMuscles = (request.targetMuscles ?? [])
      .map((muscle) => muscle.trim().toLowerCase())
      .filter(Boolean);
  }
  if (!targetMuscles.length)
    return {
      success: false,
      error:
        "Choose at least one target muscle or provide a current coaching insight.",
    };
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
  const unavailablePriorities = missingCandidatePriorities(
    targetMuscles,
    candidates.map((candidate) => candidate.muscle)
  );
  console.info(
    `[OpenRouter Workout] mode=${request.mode} insight=${Boolean(insight)} priorities=${targetMuscles.join(",")} candidates=${candidates.length} byPriority=${targetMuscles.map((priority) => `${priority}:${candidates.filter((candidate) => !missingCandidatePriorities([priority], [candidate.muscle]).length).length}`).join(",")}`
  );
  if (unavailablePriorities.length) {
    return {
      success: false,
      error: `No approved exercise candidates match these coaching priorities: ${unavailablePriorities.join(", ")}${request.preferredEquipment?.length ? ` with the selected equipment (${request.preferredEquipment.join(", ")})` : ""}. Adjust equipment or ask for a different session focus.`,
    };
  }

  //ask for ai generation clearance
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

  const reservation = gate.reservation!;
  let lastError: unknown;
  let timedOut = false;

  const startedAt = Date.now();

  try {
    const userProfile = await getUserFitnessProfile(userId);

    // Build the prompt
    const basePrompt = await buildWorkout({
      targetMuscles,
      candidates,
      request,
      userGoal: userProfile.goal,
      userExperience: userProfile.experience,
      insight,
      fitnessContext,
    });

    const repairCoverageInstructions =
      request.mode === "insight_driven"
        ? targetMuscles
            .flatMap((priority) =>
              requiredMuscleComponents(priority).map((component) => {
                const approvedOptions = candidates
                  .filter((candidate) =>
                    muscleMatchesPriority(candidate.muscle, component)
                  )
                  .map(
                    (candidate) =>
                      `${candidate.name} (ID: ${candidate.id}, primary muscle: ${candidate.muscle})`
                  );

                return `
Priority: ${priority}
Required component: ${component}
Approved exercises: ${approvedOptions.join("; ")}
Requirement: Include at least ONE exercise from these approved options.
`;
              })
            )
            .join("\n")
        : "";

    // Keep a working router available even when an old OPENROUTER_MODEL value
    // or fallback remains in the deployed environment.
    const modelsToTry = Array.from(
      new Set(
        [config.model, config.fallbackModel, "openrouter/free"].filter(Boolean)
      )
    );

    const requestModel = async (
      model: string,
      userPrompt: string
    ): Promise<OpenrouterResponse> => {
      const controller = new AbortController();
      let abortedByTimeout = false;
      const requestTimeout = setTimeout(() => {
        abortedByTimeout = true;
        controller.abort();
      }, config.requestTimeoutMs);
      try {
        const aiResponse = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://your-domain.com",
            "X-Title": "Forge AI Fitness App",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: WORKOUT_SYSTEM_INSTRUCTION },
              { role: "user", content: userPrompt },
            ],
            temperature:
              config.thinkingLevel === "low"
                ? 0.3
                : config.thinkingLevel === "medium"
                  ? 0.6
                  : 0.8,
            max_tokens: config.maxOutputTokens,
          }),
          signal: controller.signal,
        });
        if (!aiResponse.ok) {
          const responseBody = summarizeProviderError(await aiResponse.text())
            .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email]")
            .replace(/\bBearer\s+\S+/gi, "Bearer [redacted]")
            .slice(0, 800);
          const error = new Error(
            `OpenRouter API error: status=${aiResponse.status} model=${model} body=${responseBody || "<empty>"}`
          );
          (error as any).status = aiResponse.status;
          throw error;
        }
        return (await aiResponse.json()) as OpenrouterResponse;
      } catch (error) {
        if (abortedByTimeout) {
          const timeoutError = new Error(
            `OpenRouter model request timed out after ${config.requestTimeoutMs}ms (model=${model}).`
          );
          (timeoutError as any).code = "MODEL_TIMEOUT";
          throw timeoutError;
        }
        throw error;
      } finally {
        clearTimeout(requestTimeout);
      }
    };

    let parsedData: GeneratedWorkoutPlan | undefined;
    let validationErrors: string[] = [];
    let latestUsage: OpenrouterResponse["usage"];
    let rejectedResponse = "";
    for (let attempt = 0; attempt <= OPENROUTER_MAX_ATTEMPTS; attempt++) {
      let attemptHadValidationFailure = false;
      const userPrompt =
        attempt === 0
          ? basePrompt
          : `
${basePrompt}

REPAIR REQUIRED (attempt ${attempt}/${OPENROUTER_MAX_ATTEMPTS})

PREVIOUS GENERATED WORKOUT:
${rejectedResponse || "No previous response available."}

BACKEND VALIDATION ERRORS:
${validationErrors.join("; ")}

MANDATORY MUSCLE COVERAGE REQUIREMENTS:
${repairCoverageInstructions}

REPAIR RULES:

1. Correct EVERY backend validation error.

2. Every required muscle component must have at least ONE actual exercise in the exercises array.

3. For grouped priorities, treat every component as a separate mandatory requirement.
   For example, "legs (hamstrings, glutes)" requires:
   - At least one hamstring exercise.
   - At least one glute exercise.

4. The approved exercise options above are taken from the database candidate allowlist.
   Use their exact exercise IDs and names.

5. Do not satisfy missing muscle coverage by simply changing the description or targetMuscles array.
   You must add an actual exercise object.

6. Preserve valid existing exercises where possible.
   However, replace redundant exercises when necessary to include missing mandatory muscle groups.

7. Do not invent exercise IDs, names, or muscle groups.

8. Keep the workout appropriate for the athlete's goal, experience and requested duration.

9. Return the COMPLETE corrected workout, not just the missing exercise.

10. Return only the original schema-compliant JSON object.
`;
      for (const model of modelsToTry) {
        try {
          const parsedResponse = await requestModel(model, userPrompt);
          latestUsage = parsedResponse.usage;

          const choice = parsedResponse.choices?.[0];
          const raw = choice?.message?.content;

          const content = typeof raw === "string" ? raw.trim() : "";

          console.warn("[OpenRouter Workout] Response diagnostics:", {
            model,
            finishReason: choice?.finish_reason ?? "unknown",
            contentType: typeof raw,
            contentChars: content.length,
            usage: parsedResponse.usage ?? null,
            contentPreview: content.slice(0, 700),
          });

          const match = content.match(/\{[\s\S]*\}/);

          if (!match) {
            throw new Error(
              `OpenRouter returned no workout JSON. model=${model}, finishReason=${choice?.finish_reason ?? "unknown"}, contentChars=${content.length}`
            );
          }

          rejectedResponse = match[0].slice(0, 6000);
          const candidateWorkout = JSON.parse(match[0]) as GeneratedWorkoutPlan;
          console.info(
            "[OpenRouter Workout] Model-selected exercises:",
            candidateWorkout.exercises?.map((exercise) => {
              const approvedCandidate = candidates.find(
                (candidate) => candidate.id === exercise.exerciseId
              );

              return {
                name: exercise.exerciseName,
                requestedMuscle: exercise.muscle,
                verifiedMuscle: approvedCandidate?.muscle ?? "NOT APPROVED",
              };
            })
          );

          if (
            !candidateWorkout ||
            typeof candidateWorkout !== "object" ||
            Object.keys(candidateWorkout).length === 0
          ) {
            console.warn(
              `[OpenRouter Workout] empty workout object model=${model} finishReason=${parsedResponse.choices?.[0]?.finish_reason ?? "unknown"} contentChars=${raw?.length ?? 0}`
            );
          }
          if (request.scheduledDate)
            candidateWorkout.scheduledDate = request.scheduledDate;
          const validation = validateWorkoutAgainstRequirements(
            candidateWorkout,
            candidates,
            request.mode === "insight_driven" ? targetMuscles : [],
            request.targetDurationMinutes ?? request.durationMinutes ?? 45
          );
          if (!validation.workout) {
            validationErrors = validation.errors;
            attemptHadValidationFailure = true;
            console.warn(
              `[OpenRouter Workout] validation failed attempt=${attempt + 1}: ${validationErrors.join("; ")}`
            );
            continue;
          }
          parsedData = validation.workout;
          break;
        } catch (error) {
          lastError = error;

          if ((error as any)?.code === "MODEL_TIMEOUT") {
            console.warn(
              `[OpenRouter Workout] ${model} timed out; trying the next configured model.`
            );
            continue;
          }

          console.warn(
            `[OpenRouter Workout] ${model} failed, trying fallback...`,
            error
          );
        }
      }
      if (parsedData) break;
      if (!attemptHadValidationFailure && lastError) throw lastError;
      if (attempt === OPENROUTER_MAX_ATTEMPTS)
        throw new Error(
          `Workout did not pass validation after ${OPENROUTER_MAX_ATTEMPTS} repair attempts: ${validationErrors.join("; ")}`
        );
    }
    if (!parsedData)
      throw lastError ?? new Error("Workout generation failed validation.");

    // Save as draft
    const [draftRow] = await db
      .insert(aiGeneratedWorkouts)
      .values({
        userId,
        targetMuscles,
        status: "draft",
        workoutData: parsedData as any,
      })
      .returning({
        id: aiGeneratedWorkouts.id,
        createdAt: aiGeneratedWorkouts.createdAt,
      });

    // Token usage
    const usage = latestUsage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;

    console.log(
      `[OpenRouter Workout] completed in ${Date.now() - startedAt}ms exercises=${parsedData.exercises.length} validated=true`
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
      source: "openrouter",
      data: {
        draftId: draftRow.id,
        status: "draft",
        workout: parsedData,
        createdAt: draftRow.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error(
      "[OpenRouter Workout Error]:",
      error.message || "generation failed"
    );
    timedOut = error?.code === "MODEL_TIMEOUT";

    await abortAiExecution({
      reservationId: reservation.reservationId,
      userId,
      feature: "workout_generation",
      errorMessage: error.message || "Failed to generate workout.",
    });

    return {
      success: false,
      error: timedOut
        ? "The AI took too long to respond. Your trial allowance has been preserved. Please try again."
        : error.message?.includes("is not a valid model ID")
          ? "The configured OpenRouter model ID is invalid. Update OPENROUTER_MODEL or OPENROUTER_FALLBACK_MODEL to a current model ID and restart the backend."
          : error.message?.includes("validation")
            ? "Forge could not produce a workout that meets the coaching priorities and exercise requirements. Your generation allowance has been preserved; please try again or adjust the session settings."
            : "Unable to generate workout right now. Your trial allowance has been preserved. Please try again.",
      retryAfterSeconds: timedOut ? 30 : undefined,
    };
  }
};
