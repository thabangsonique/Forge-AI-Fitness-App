import { fromNodeHeaders } from "better-auth/node";
import { Request, Response } from "express";
import { auth } from "../lib/auth";
import { generateUserCoachInsight } from "../services/aiCoach/geminiCoachService";
import { generateFingerPrint } from "../services/aiCoach/promptBuilder";
import { getFitnessContext } from "../services/fitnessAnalytics/fitnessAnalyticsService";
import { checkUserEntitlement } from "../services/aiUsage/subscriptionService";
import { getCachedInsight } from "../services/aiUsage/usageManagerservice";

export const generateCoachInsight = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const userId = session.user.id;

    //call actual ai generation function.
    const result = await generateUserCoachInsight(userId);

    //if generation failed
    if (!result.success) {
      let statusCode = 400;

      if (
        result.failureCode === "quota_exceeded" ||
        result.failureCode === "rate_limited" ||
        (!result.failureCode && result.retryAfterSeconds)
      ) {
        statusCode = 429;
      } else if (
        result.failureCode === "ai_busy" ||
        result.failureCode === "ai_timeout"
      ) {
        statusCode = 503;
      }

      return res.status(statusCode).json({
        success: false,
        error: result.error,
        failureCode: result.failureCode,
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }

    return res.status(200).json({
      success: true,
      source: result.source,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Error in getCoachInsights controller:", error);

    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while generating insights.",
    });
  }
};

//fetch cached insights.
// GET /coach/insights — returns the last cached insight WITHOUT using a trial credit.
// If no cache exists, returns a "no_cache" indicator so the frontend can show the
// "Generate your first insight" button.
export const getCachedCoachInsight = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const userId = session.user.id;

    // Recompute the fingerprint from the user's latest training data. We only
    // return a cached insight if it still matches the current data, otherwise
    // the app would display an outdated analysis as if it were current.
    const fitnessContext = await getFitnessContext(userId);
    const fingerprint = generateFingerPrint(userId, fitnessContext);

    // Look up the cached result for this exact data snapshot — this does NOT
    // touch trial credits.
    const cached = await getCachedInsight(userId, fingerprint);

    if (!cached.hit || cached.data === undefined) {
      // No insight exists for the current training data
      return res.status(200).json({
        success: true,
        source: "no_cache",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      source: "cache",
      data: cached.data,
      generatedAt: cached.generatedAt,
    });
  } catch (error: any) {
    console.error("Error in getCachedCoachInsight controller:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve cached insight.",
    });
  }
};

//Give frontend user status, and as far as generation and subscription account is concerned.
export const getCoachStatus = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const userId = session.user.id;
    const entitlement = await checkUserEntitlement(userId, "coach_insight");

    //Gives us the user whether, the user is allowed to make the next generation, where they stand with generation requests.
    return res.status(200).json({
      success: true,
      tier: entitlement.tier,
      allowed: entitlement.allowed,
      reason: entitlement.reason,
      trialSummary: entitlement.trialSummary,
    });
  } catch (error: any) {
    console.error("Error in getCoachStatus controller:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve coaching status.",
    });
  }
};
