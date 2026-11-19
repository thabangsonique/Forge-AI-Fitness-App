// OpenRouter-based workout generation service

import { db } from "../../db";
import { aiGeneratedWorkouts } from "../../db/schema";
import { loadAiConfig } from "../aiUsage/aiUsageConfig";
import {
  abortAiExecution,
  completeAiExecution,
  prepareAiExecution,
} from "../aiUsage/usageManagerservice";
import {
  fetchExercisesCandidates,
  resolveTargetMuscles,
} from "../aiWorkout/exerciseCandidate";
import {
  GeneratedWorkoutPlan,
  GenerateWorkoutRequest,
  GenerateWorkoutResult,
} from "../aiWorkout/types";
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

const OPENROUTER_MAX_ATTEMPTS = 3;

// OpenRouter API endpoint
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

  //fetch target muscles and exercises
  const targetMuscles = await resolveTargetMuscles(userId, request);
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
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, config.requestTimeoutMs);

  let lastError: unknown;
  let response: OpenrouterResponse | undefined;

  const startedAt = Date.now();

  try {
    const userProfile = await getUserFitnessProfile(userId);

    // Build the prompt
    const systemPrompt = `You are Forge AI Coach, a personal fitness trainer.
Generate a complete workout plan based on the user's profile and goals.
Format the response as JSON matching the provided schema exactly.`;

    const userPrompt = `
User Profile:
- Goal: ${userProfile.goal}
- Experience: ${userProfile.experience}
- Preferred Days: ${(userProfile as any).preferredDays?.join(", ") || "flexible"}
- Training Location: ${(userProfile as any).trainingLocation || "gym"}

Target Muscles: ${targetMuscles.join(", ")}
Duration: ${request.durationMinutes || 45} minutes
Equipment: ${request.preferredEquipment?.join(", ") || "any"}

Available Exercises:
${JSON.stringify(candidates.slice(0, 50), null, 2)}

Generate a workout plan with name, description, category, and exercises array.
Each exercise needs: exerciseId, exerciseName, muscle, sets, reps, restSeconds, coachingTip.
`;

    const modelsToTry = Array.from(
      new Set([config.model, config.fallbackModel].filter(Boolean))
    );

    for (const model of modelsToTry) {
      try {
        const aiResponse = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            // OpenRouter-specific headers
            "HTTP-Referer": "https://your-domain.com", // Replace with your actual domain
            "X-Title": "Forge AI Fitness App",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
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
          signal: timeoutController.signal,
        });

        if (!aiResponse.ok) {
          const error = new Error(`OpenRouter API error: ${aiResponse.status}`);
          (error as any).status = aiResponse.status;
          throw error;
        }

        response = await aiResponse.json();
        break;
      } catch (error) {
        lastError = error;

        if (timeoutController.signal.aborted) {
          throw error;
        }

        console.warn(
          `[OpenRouter Workout] ${model} failed, trying fallback...`,
          error
        );
      }
    }

    if (!response || !response.choices?.[0]?.message?.content) {
      throw (
        lastError ?? new Error("OpenRouter did not return a valid response.")
      );
    }

    // Parse the JSON response
    const rawJsonText = response.choices[0].message.content;

    // Diagnostic log: see exactly what the AI is sending
    console.log("[OpenRouter Workout] Raw Response:", rawJsonText);

    // Try to extract JSON if the AI returned conversational text
    let jsonText = rawJsonText;
    const jsonMatch = rawJsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const parsedData = JSON.parse(jsonText) as GeneratedWorkoutPlan;

    if (request.scheduledDate) {
      parsedData.scheduledDate = request.scheduledDate;
    }

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
    const usage = response.usage;
    const inputTokens = usage?.prompt_tokens || 0;
    const outputTokens = usage?.completion_tokens || 0;

    console.log(
      `[OpenRouter Workout] completed in ${Date.now() - startedAt}ms`
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
    console.error("❌ [OpenRouter Workout Error]:", error);

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
