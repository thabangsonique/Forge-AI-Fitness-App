import {
  getOnboardingAnswers,
  hydrateOnboardingAnswers,
  resetOnboardingAnswers,
} from "@/constants/onboarding";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export type OnboardingCompletionResult = {
  success: boolean;
  missingAnswers?: boolean;
  starterWorkoutName?: string;
  error?: string;
};

const getToken = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const session = await authClient.getSession();
    const token = session.data?.session?.token;

    if (token) {
      return token;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return null;
};

export const completeOnboardingAfterAuth =
  async (): Promise<OnboardingCompletionResult> => {
    await hydrateOnboardingAnswers();

    const answers = getOnboardingAnswers();

    if (!answers.success) {
      return {
        success: false,
        missingAnswers: true,
        error: "Your onboarding answers are missing.",
      };
    }

    const token = await getToken();

    if (!token) {
      return {
        success: false,
        error: "We could not verify your session. Please try again.",
      };
    }

    try {
      const response = await fetch(`${API_URL}/api/onboarding/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(answers.data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: errorText || "Could not save your plan.",
        };
      }

      const data = (await response.json()) as {
        starterWorkout?: { name: string } | null;
      };

      resetOnboardingAnswers();

      return {
        success: true,
        starterWorkoutName: data.starterWorkout?.name,
      };
    } catch {
      return {
        success: false,
        error: "Network error. Your answers are still saved.",
      };
    }
  };
