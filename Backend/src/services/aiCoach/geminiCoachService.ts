//actual gemini execution.

import { GoogleGenAI } from "@google/genai";
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
import { AiCoachInsightResponse, GenerateCoachInsightResult } from "./types";

export const generateUserCoachInsight = async (
  userId: string
): Promise<GenerateCoachInsightResult> => {
  const config = loadAiConfig();

  //fetch user training data
  const fitnessContext = await getFitnessContext(userId);

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

  //sending info to google gemini
  try {
    const ai = new GoogleGenAI({
      apiKey: config.apiKey,
    });

    const promptText = buildCaochPrompt(fitnessContext);

    const response = await ai.models.generateContent({
      model: config.model,
      contents: promptText,
      config: {
        systemInstruction: COACH_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: COACH_RESPONSE_JSON_SCHEMA as any,
        temperature: 0.7,
      },
    });

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
  } catch (error: any) {
    console.error("❌ [Gemini Coach Error]:", error);

    //Release user token if the request failed to generate.
    await abortAiExecution({
      reservationId: reservation.reservationId,
      userId,
      feature: "coach_insight",
      errorMessage: error.message || "Unknown Gemini API error",
    });

    //ultimate failure generation error.
    return {
      success: false,
      error:
        "Unable to generate AI coaching insights right now. Please try again shortly.",
    };
  }
};
