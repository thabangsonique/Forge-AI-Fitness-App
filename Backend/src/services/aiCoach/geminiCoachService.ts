//actual gemini execution.

import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { count, eq } from "drizzle-orm";
import { db } from "../../db";
import { workoutSession } from "../../db/schema";
import { loadAiConfig } from "../aiUsage/aiUsageConfig";
import {
  abortAiExecution,
  completeAiExecution,
  prepareAiExecution,
  savedCachedInsight,
} from "../aiUsage/usageManagerservice";
import { getFitnessContext } from "../fitnessAnalytics/fitnessAnalyticsService";
import {
  buildCaochPrompt,
  COACH_RESPONSE_JSON_SCHEMA,
  COACH_SYSTEM_INSTRUCTION,
  generateFingerPrint,
} from "./promptBuilder";
import {
  AiCoachInsightResponse,
  CoachInsightFailureCode,
  GenerateCoachInsightResult,
} from "./types";

const GEMINI_MAX_ATTEMPTS = 3;

// Allows us to wait between retry attempts, but also cancel
// the waiting period if the overall timeout expires.
const sleep = (ms: number, signal: AbortSignal): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Gemini request timed out."));
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("Gemini request timed out."));
    };

    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    signal.addEventListener("abort", onAbort, { once: true });
  });
};

// Safely extract the HTTP status from an unknown error.
function getHttpStatus(error: unknown): number | undefined {
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
}

// Extract a readable error message.
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown Gemini API error";
}

// Translate a raw Gemini/network error into a stable failure code plus a
// message that is safe and useful to show to the user.
export function classifyGeminiError(error: unknown): {
  failureCode: CoachInsightFailureCode;
  message: string;
  retryAfterSeconds?: number;
} {
  const status = getHttpStatus(error);
  const rawMessage = getErrorMessage(error).toLowerCase();
  const errorName =
    typeof error === "object" && error !== null
      ? (error as { name?: unknown }).name
      : undefined;

  const isTimeout =
    status === 408 ||
    rawMessage.includes("timed out") ||
    rawMessage.includes("timeout") ||
    errorName === "AbortError" ||
    errorName === "TimeoutError";

  if (isTimeout) {
    return {
      failureCode: "ai_timeout",
      message: "The AI took too long to respond. Please try again.",
      retryAfterSeconds: 30,
    };
  }

  if (status === 429) {
    return {
      failureCode: "quota_exceeded",
      message:
        "The AI has reached its usage limit. Please try again later or upgrade your plan.",
      retryAfterSeconds: 60,
    };
  }

  if (status !== undefined && [500, 502, 503, 504].includes(status)) {
    return {
      failureCode: "ai_busy",
      message:
        "The AI service is busy right now. Please try again in a moment.",
      retryAfterSeconds: 30,
    };
  }

  return {
    failureCode: "generation_failed",
    message:
      "Unable to generate AI coaching insights right now. Please try again shortly.",
  };
}

// Retry temporary Gemini failures, but never exceed
// the overall timeout controlled by AbortController.
async function withRetry<T>(
  task: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  maxAttempts = GEMINI_MAX_ATTEMPTS
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal.aborted) {
      throw new Error("Gemini request timed out.");
    }

    try {
      return await task(signal);
    } catch (error: unknown) {
      // Do not retry if our overall timeout has expired.
      if (signal.aborted) {
        throw new Error("Gemini request timed out.");
      }

      const status = getHttpStatus(error);

      const isTemporary = [408, 429, 500, 502, 503, 504].includes(status ?? -1);

      const isLastAttempt = attempt === maxAttempts;

      if (!isTemporary || isLastAttempt) {
        throw error;
      }

      console.log(
        `Gemini attempt ${attempt}/${maxAttempts} failed with status ${
          status ?? "unknown"
        }. Retrying...`
      );

      await sleep(1000 * attempt, signal);
    }
  }

  throw new Error("Gemini retry process failed.");
}

export const generateUserCoachInsight = async (
  userId: string
): Promise<GenerateCoachInsightResult> => {
  const config = loadAiConfig();

  //fetch user training data
  const fitnessContext = await getFitnessContext(userId);

  //total users completed sessions.
  const [totalSessions] = await db
    .select({ count: count() })
    .from(workoutSession)
    .where(eq(workoutSession.userId, userId));

  if (totalSessions.count < 2) {
    return {
      success: false,
      error:
        "Log at least 2 completed workouts before generating an AI insight.",
      failureCode: "insufficient_data",
    };
  }

  //create  request fingerprint
  const fingerprint = generateFingerPrint(userId, fitnessContext);

  //Function gives us the go-ahead as to whether proceed with new generation or not.
  const gate = await prepareAiExecution<AiCoachInsightResponse>({
    userId,
    feature: "coach_insight",
    fingerprint,
  });

  if (!gate.shouldExecute) {
    //Reason one, in case where the AI insight already exists.
    if (gate.cachedResult) {
      return {
        success: true,
        source: "cache",
        data: gate.cachedResult,
      };
    }

    //Any other reason apart from existing insight.

    return {
      success: false,
      error: gate.blockedReason || "AI generation is not available right now.",
      // A blocked reason that carries a retry delay is the user cooldown or a
      // global rate limit.
      failureCode: gate.retryAfterSeconds ? "rate_limited" : undefined,
      retryAfterSeconds: gate.retryAfterSeconds,
    };
  }

  //Suppose we have clearance from prepare AI execution.
  const reservation = gate.reservation;

  if (!reservation) {
    return {
      success: false,
      error: "AI execution approved without a reservation.",
    };
  }
  const timeoutController = new AbortController();

  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, config.requestTimeoutMs);

  //sending info to google gemini
  try {
    const ai = new GoogleGenAI({
      apiKey: config.apiKey,
    });

    const promptText = buildCaochPrompt(fitnessContext);

    // Try the primary model first, then the fallback model if the primary is
    // temporarily overloaded (503/429/5xx).
    const modelsToTry = Array.from(
      new Set([config.model, config.fallbackModel].filter(Boolean))
    );

    let response: GenerateContentResponse | undefined;
    let lastError: unknown;

    for (const model of modelsToTry) {
      try {
        response = await withRetry(
          (signal) =>
            ai.models.generateContent({
              model,
              contents: promptText,
              config: {
                systemInstruction: COACH_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseJsonSchema: COACH_RESPONSE_JSON_SCHEMA as any,
                temperature: 0.7,

                abortSignal: signal,

                httpOptions: {
                  timeout: config.requestTimeoutMs,
                },
              },
            }),

          timeoutController.signal,

          GEMINI_MAX_ATTEMPTS
        );
        break;
      } catch (error) {
        lastError = error;

        // If the overall timeout fired, do not try another model.
        if (timeoutController.signal.aborted) {
          throw error;
        }

        const status = getHttpStatus(error);
        const isTemporary = [408, 429, 500, 502, 503, 504].includes(
          status ?? -1
        );

        if (!isTemporary) {
          throw error;
        }

        console.warn(
          `[Gemini Coach] ${model} is overloaded right now; trying the fallback model.`
        );
      }
    }

    if (!response) {
      throw lastError ?? new Error("Gemini did not return a response.");
    }

    const rawText = response.text || "{}";
    const parsedText = JSON.parse(rawText); //convert response to json format

    //data that we'll use and send to the front end.
    const coachingResponse: AiCoachInsightResponse = {
      muscleFocus: parsedText.muscleFocus,
      volume: parsedText.volume,
      strength: parsedText.strength,
      overall: parsedText.overall,
      generatedAt: new Date().toISOString(),
    };

    //Metadata info about Gemini's generation token usage.
    const usage = response.usageMetadata;
    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;
    const totalTokens = usage?.totalTokenCount || inputTokens + outputTokens;

    //Finalize the AI request.
    await completeAiExecution({
      reservationId: reservation?.reservationId,
      userId,
      feature: "coach_insight",
      tokens: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
    });

    //save the newly generated insight.
    await savedCachedInsight(
      userId,
      fingerprint,
      null, // lastWorkoutSessionId can be linked here
      coachingResponse
    );

    return {
      success: true,
      source: "gemini",
      data: coachingResponse,
    };
  } catch (error: unknown) {
    const failure = classifyGeminiError(error);
    const rawMessage = getErrorMessage(error);

    console.error(
      `❌ [Gemini Coach Error] ${failure.failureCode}:`,
      rawMessage
    );

    //Release user token if the request failed to generate. Store both the code
    //and the raw reason so future debugging is easier.
    await abortAiExecution({
      reservationId: reservation.reservationId,
      userId,
      feature: "coach_insight",
      errorMessage: `${failure.failureCode}: ${rawMessage}`,
    });

    //Return the specific reason so the controller can pick a proper status.
    return {
      success: false,
      failureCode: failure.failureCode,
      error: failure.message,
      retryAfterSeconds: failure.retryAfterSeconds,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};
