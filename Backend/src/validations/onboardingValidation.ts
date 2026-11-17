import { z } from "zod";
import {
  birthYearSchema,
  experienceSchema,
  genderSchema,
  goalSchema,
  heightCmSchema,
  trainingLocationSchema,
  weightKgSchema,
  weightUnitSchema,
  workoutsPerWeekSchema,
} from "./profileValidation";

export const onboardingPainPointSchema = z.enum([
  "not_sure_improving",
  "repeat_workouts",
  "never_know_weight",
  "lose_motivation",
  "no_real_plan",
]);

export const completeOnboardingSchema = z
  .object({
    gender: genderSchema,
    goal: goalSchema,
    experience: experienceSchema,
    painPoints: z.array(onboardingPainPointSchema).min(1),
    workoutsPerWeek: workoutsPerWeekSchema,
    trainingLocation: trainingLocationSchema.optional().nullable(),
    weightUnit: weightUnitSchema.optional(),
    weightKg: weightKgSchema,
    heightCm: heightCmSchema,
    birthYear: birthYearSchema,
  })
  .strict();

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
