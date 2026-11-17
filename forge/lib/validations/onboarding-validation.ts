import { z } from "zod";

export const PAIN_POINTS = [
  "not_sure_improving",
  "repeat_workouts",
  "never_know_weight",
  "lose_motivation",
  "no_real_plan",
] as const;

export const painPointSchema = z.enum(PAIN_POINTS);
export const trainingLocationSchema = z.enum(["gym", "home", "bodyweight"]);
export const weightUnitSchema = z.enum(["kg", "lb"]);

export const onboardingValuesSchema = z.object({
  gender: z.enum(["male", "female"]),
  goal: z.enum(["build muscle", "lose fat", "gain strength"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  painPoints: z.array(painPointSchema).min(1),
  workoutsPerWeek: z.number().int().min(1).max(7),
  trainingLocation: trainingLocationSchema.optional(),
  weightUnit: weightUnitSchema.default("kg"),
  weightKg: z.number().positive().max(500).nullable().optional(),
  heightCm: z.number().positive().max(300).nullable().optional(),
  birthYear: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .nullable()
    .optional(),
});

export type OnboardingValues = z.infer<typeof onboardingValuesSchema>;
export type onboardingGender = OnboardingValues["gender"];
export type onboardingGoal = OnboardingValues["goal"];
export type onboardingExperience = OnboardingValues["experience"];
export type onboardingTrainingLocation = NonNullable<
  OnboardingValues["trainingLocation"]
>;
export type onboardingPainPoint = OnboardingValues["painPoints"][number];
export type onboardingWeightUnit = OnboardingValues["weightUnit"];
