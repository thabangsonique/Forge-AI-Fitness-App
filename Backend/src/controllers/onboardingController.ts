import { fromNodeHeaders } from "better-auth/node";
import { Request, Response } from "express";
import { auth } from "../lib/auth";
import { completeOnboarding } from "../services/onboarding/onboardingService";
import { completeOnboardingSchema } from "../validations/onboardingValidation";

export const completeOnboardingProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const parsed = completeOnboardingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message ?? "Invalid onboarding data.",
      });
    }

    const result = await completeOnboarding(session.user.id, parsed.data);

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Error completing onboarding", error);
    return res.status(500).json({ error: "Could not complete onboarding." });
  }
};
