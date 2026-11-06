// Backend/src/controllers/personalRecordsController.ts
import { fromNodeHeaders } from "better-auth/node";
import { Request, Response } from "express";
import { auth } from "../lib/auth";
import {
  buildHeroStats,
  calculatePersonalRecords,
} from "../services/fitnessAnalytics/personalRecordsService";

// Re-export for any existing callers
export const calculatePersonalRecord = calculatePersonalRecords;

/**
 * Controller handling HTTP requests for user personal records.
 */
export const getPersonalRecords = async (req: Request, res: Response) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      return res.status(401).json({ message: "Unauthorized- no token found." });
    }

    const userId = session.user.id;
    const records = await calculatePersonalRecords(userId);
    const hero = buildHeroStats(records);

    return res.status(200).json({
      success: true,
      hero,
      records,
    });
  } catch (error) {
    console.error("Error fetching personal records:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to calculate personal records.",
    });
  }
};
