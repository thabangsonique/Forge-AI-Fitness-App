import { fromNodeHeaders } from "better-auth/node";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db";
import { profiles } from "../db/schema";
import { auth } from "../lib/auth";
import {
  createProfileSchema,
  updateProfileSchema,
} from "../validations/profileValidation";

const getAuthenticatedUserId = async (req: Request) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  return session?.user?.id ?? null;
};

const getValidationMessage = (issues: { message: string }[]) =>
  issues[0]?.message ?? "Invalid profile data.";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = await getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    return res.status(200).json({
      success: true,
      profile: profile ?? null,
    });
  } catch (error) {
    console.error("Error fetching profile", error);
    return res.status(500).json({ error: "Could not fetch profile." });
  }
};

export const createProfile = async (req: Request, res: Response) => {
  try {
    const userId = await getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const parsed = createProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: getValidationMessage(parsed.error.issues),
      });
    }

    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (existingProfile) {
      return res.status(200).json({ success: true, existingProfile });
    }

    const [newProfile] = await db
      .insert(profiles)
      .values({
        ...parsed.data,
        userId,
      })
      .returning();

    return res.status(200).json({ success: true, profile: newProfile });
  } catch (error) {
    console.error("Error creating profile", error);
    return res.status(500).json({ error: "Could not create profile." });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = await getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized - no token found." });
    }

    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: getValidationMessage(parsed.error.issues),
      });
    }

    const existingProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (existingProfile) {
      const [updatedProfile] = await db
        .update(profiles)
        .set(parsed.data)
        .where(eq(profiles.userId, userId))
        .returning();

      return res.status(200).json({
        success: true,
        profile: updatedProfile,
      });
    }

    const createParsed = createProfileSchema.safeParse(req.body);

    if (!createParsed.success) {
      return res.status(400).json({
        error:
          "Complete profile requires a valid gender, goal, and experience.",
      });
    }

    const [newProfile] = await db
      .insert(profiles)
      .values({
        ...createParsed.data,
        userId,
      })
      .returning();

    return res.status(200).json({ success: true, profile: newProfile });
  } catch (error) {
    console.error("Error updating profile", error);
    return res.status(500).json({ error: "Could not update profile." });
  }
};
