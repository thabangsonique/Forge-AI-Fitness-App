import { z } from "zod";

//define schema.
export const onboardingValuesSchema = z.object({
  gender: z.enum(["male", " female"]),
  goal: z.enum(["build muscle", "lose fat", "maintain"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
});

export type OnboardingValues = z.infer<typeof onboardingValuesSchema>;
