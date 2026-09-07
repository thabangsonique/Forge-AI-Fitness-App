import { z } from "zod";

//define schema.
export const onboardingValuesSchema = z.object({
  gender: z.enum(["male", "female"]),
  goal: z.enum(["build muscle", "lose fat", "gain strength"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
});

export type OnboardingValues = z.infer<typeof onboardingValuesSchema>;
export type onboardingGender = OnboardingValues["gender"];
export type onboardingGoal = OnboardingValues["goal"];
export type onboardingExperience = OnboardingValues["experience"];
