import { fromNodeHeaders } from "better-auth/node";
import { Request, Response } from "express";
import { auth } from "../lib/auth";
import { generateUserCoachInsight } from "../services/aiCoach/geminiCoachService";
import { checkUserEntitlement } from "../services/aiUsage/subscriptionService";

export const getCoachInsight = async (req: Request, res: Response) => {
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
      const statusCode = result.retryAfterSeconds ? 429 : 400;

      return res.status(statusCode).json({
        success: false,
        error: result.error,
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
