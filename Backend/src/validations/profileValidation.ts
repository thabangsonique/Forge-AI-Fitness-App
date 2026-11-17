import { z } from "zod";

export const genderSchema = z.enum(["male", "female"]);
export const goalSchema = z.enum(["build muscle", "lose fat", "gain strength"]);
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
export const trainingLocationSchema = z.enum(["gym", "home", "bodyweight"]);

export const heightCmSchema = z.coerce
  .number()
  .positive()
  .max(300)
  .optional()
  .nullable();

export const weightKgSchema = z.coerce
  .number()
  .positive()
  .max(500)
  .optional()
  .nullable();

export const birthYearSchema = z.coerce
  .number()
  .int()
  .min(1900)
  .max(new Date().getFullYear())
  .optional()
  .nullable();

export const preferredDaysSchema = z
  .array(z.number().int().min(0).max(6))
  .max(7)
  .optional()
  .nullable();

export const reminderTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .optional()
  .nullable();

export const painPointsSchema = z
  .array(z.string().min(1))
  .optional()
  .nullable();

export const createProfileSchema = z
  .object({
    gender: genderSchema,
    goal: goalSchema,
    experience: experienceSchema,
    workoutsPerWeek: workoutsPerWeekSchema.optional(),
    weightUnit: weightUnitSchema.optional(),
    trainingLocation: trainingLocationSchema.optional().nullable(),
    heightCm: heightCmSchema,
    weightKg: weightKgSchema,
    birthYear: birthYearSchema,
    preferredDays: preferredDaysSchema,
    reminderEnabled: z.boolean().optional(),
    reminderTime: reminderTimeSchema,
    painPoints: painPointsSchema,
  })
  .strict();

export const updateProfileSchema = z
  .object({
    gender: genderSchema.optional(),
    goal: goalSchema.optional(),
    experience: experienceSchema.optional(),
    workoutsPerWeek: workoutsPerWeekSchema.optional(),
    weightUnit: weightUnitSchema.optional(),
    trainingLocation: trainingLocationSchema.optional().nullable(),
    heightCm: heightCmSchema,
    weightKg: weightKgSchema,
    birthYear: birthYearSchema,
    preferredDays: preferredDaysSchema,
    reminderEnabled: z.boolean().optional(),
    reminderTime: reminderTimeSchema,
    painPoints: painPointsSchema,
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
  trainingLocation: trainingLocationSchema.nullable(),
  heightCm: z.number().nullable(),
  weightKg: z.number().nullable(),
  birthYear: z.number().nullable(),
  preferredDays: z.array(z.number()).nullable(),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().nullable(),
  painPoints: z.array(z.string()).nullable(),
  onboardingCompletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type Profile = z.infer<typeof profileSchema>;
