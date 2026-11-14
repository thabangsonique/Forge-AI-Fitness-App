import { z } from "zod";

export const genderSchema = z.enum(["male", "female"]);
export const goalSchema = z.enum([
  "build muscle",
  "lose fat",
  "gain strength",
]);
export const experienceSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);
export const weightUnitSchema = z.enum(["kg", "lb"]);
export const workoutsPerWeekSchema = z
  .number()
  .int("workoutsPerWeek must be a whole number between 1 and 7.")
  .min(1, "workoutsPerWeek must be between 1 and 7.")
  .max(7, "workoutsPerWeek must be between 1 and 7.");

export const createProfileSchema = z
  .object({
    gender: genderSchema,
    goal: goalSchema,
    experience: experienceSchema,
    workoutsPerWeek: workoutsPerWeekSchema.optional(),
    weightUnit: weightUnitSchema.optional(),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    gender: genderSchema.optional(),
    goal: goalSchema.optional(),
    experience: experienceSchema.optional(),
    workoutsPerWeek: workoutsPerWeekSchema.optional(),
    weightUnit: weightUnitSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one profile field is required.",
  });

export const profileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  gender: genderSchema,
  goal: goalSchema,
  experience: experienceSchema,
  workoutsPerWeek: workoutsPerWeekSchema,
  weightUnit: weightUnitSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type Profile = z.infer<typeof profileSchema>;
