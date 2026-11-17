import {
  OnboardingValues,
  onboardingValuesSchema,
} from "@/lib/validations/onboarding-validation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const ONBOARDING_KEYS = "myworkout_onboarding_answers";
const ONBOARDING_PROGRESS_KEY = "myworkout_onboarding_progress";

export type OnboardingStepKind = "question" | "info" | "loading" | "reveal";

export type OnboardingStep = {
  key: string;
  kind: OnboardingStepKind;
  field?: keyof OnboardingValues;
  required?: boolean;
  skippable?: boolean;
};

export const steps: OnboardingStep[] = [
  { key: "goal", kind: "question", field: "goal", required: true },
  {
    key: "experience",
    kind: "question",
    field: "experience",
    required: true,
  },
  {
    key: "painPoints",
    kind: "question",
    field: "painPoints",
    required: true,
  },
  { key: "trainingBlind", kind: "info" },
  {
    key: "weeklyTarget",
    kind: "question",
    field: "workoutsPerWeek",
    required: true,
  },
  {
    key: "location",
    kind: "question",
    field: "trainingLocation",
    skippable: true,
  },
  { key: "gender", kind: "question", field: "gender", required: true },
  { key: "plateau", kind: "info" },
  { key: "bodyStats", kind: "question", skippable: true },
  { key: "coachBridge", kind: "info" },
  { key: "building", kind: "loading" },
  { key: "planReveal", kind: "reveal" },
];

export const answers: Partial<OnboardingValues> = {};

const isMobile = Platform.OS !== "web";

export const hydrateOnboardingAnswers = async () => {
  if (!isMobile) {
    return;
  }

  try {
    const data = await AsyncStorage.getItem(ONBOARDING_KEYS);
    if (data) {
      Object.assign(answers, JSON.parse(data));
    }
  } catch {
    // Ignore storage errors and let the user continue from the first step.
  }
};

if (isMobile) {
  hydrateOnboardingAnswers();
}

export const loadOnboardingAnswers = (): Partial<OnboardingValues> => ({
  ...answers,
});

export const saveOnboardingAnswers = (
  field: keyof OnboardingValues,
  value: OnboardingValues[keyof OnboardingValues]
) => {
  (answers as Record<string, unknown>)[field] = value;

  if (isMobile) {
    AsyncStorage.setItem(ONBOARDING_KEYS, JSON.stringify(answers)).catch(
      () => {}
    );
  }
};

export const clearOnboardingAnswer = (field: keyof OnboardingValues) => {
  delete answers[field];

  if (isMobile) {
    AsyncStorage.setItem(ONBOARDING_KEYS, JSON.stringify(answers)).catch(
      () => {}
    );
  }
};

export const getOnboardingAnswers = () => {
  return onboardingValuesSchema.safeParse(answers);
};

export const setOnboardingProgress = (stepKey: string) => {
  if (isMobile) {
    AsyncStorage.setItem(ONBOARDING_PROGRESS_KEY, stepKey).catch(() => {});
  }
};

export const getOnboardingProgress = async (): Promise<string | null> => {
  if (!isMobile) {
    return null;
  }

  try {
    return await AsyncStorage.getItem(ONBOARDING_PROGRESS_KEY);
  } catch {
    return null;
  }
};

export const resetOnboardingAnswers = () => {
  Object.keys(answers).forEach((key) => {
    delete answers[key as keyof OnboardingValues];
  });

  if (isMobile) {
    AsyncStorage.removeItem(ONBOARDING_KEYS).catch(() => {});
    AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY).catch(() => {});
  }
};

export const stepIndex = (key: string) => steps.findIndex((s) => s.key === key);
