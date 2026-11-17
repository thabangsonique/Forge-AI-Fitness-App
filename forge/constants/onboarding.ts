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

// Serializes AsyncStorage writes so a queued answer can never land after a
// pending clear, and so callers can await a known point in the queue.
let writeQueue: Promise<void> = Promise.resolve();

const enqueueWrite = (write: () => Promise<void>) => {
  writeQueue = writeQueue.then(write).catch(() => {});
  return writeQueue;
};

const replaceAnswers = (next: Partial<OnboardingValues>) => {
  Object.keys(answers).forEach((key) => {
    delete answers[key as keyof OnboardingValues];
  });

  Object.assign(answers, next);
};

export const hydrateOnboardingAnswers = async () => {
  if (!isMobile) {
    return;
  }

  // Flush anything already queued so we never replace newer in-memory answers
  // with a stale stored copy.
  await writeQueue;

  try {
    const data = await AsyncStorage.getItem(ONBOARDING_KEYS);

    // Replace (never merge) so removed keys cannot be resurrected. With no
    // stored payload the in-memory answers are already the source of truth -
    // resetOnboardingAnswers() is what clears them.
    if (data) {
      replaceAnswers(JSON.parse(data));
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
    return enqueueWrite(() =>
      AsyncStorage.setItem(ONBOARDING_KEYS, JSON.stringify(answers))
    );
  }

  return writeQueue;
};

export const clearOnboardingAnswer = (field: keyof OnboardingValues) => {
  delete answers[field];

  if (isMobile) {
    return enqueueWrite(() =>
      AsyncStorage.setItem(ONBOARDING_KEYS, JSON.stringify(answers))
    );
  }

  return writeQueue;
};

export const getOnboardingAnswers = () => {
  return onboardingValuesSchema.safeParse(answers);
};

export const setOnboardingProgress = (stepKey: string) => {
  if (isMobile) {
    return enqueueWrite(() =>
      AsyncStorage.setItem(ONBOARDING_PROGRESS_KEY, stepKey)
    );
  }

  return writeQueue;
};

export const getOnboardingProgress = async (): Promise<string | null> => {
  if (!isMobile) {
    return null;
  }

  try {
    await writeQueue;
    return await AsyncStorage.getItem(ONBOARDING_PROGRESS_KEY);
  } catch {
    return null;
  }
};

export const clearOnboardingProgress = () => {
  if (isMobile) {
    return enqueueWrite(() => AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY));
  }

  return writeQueue;
};

export const resetOnboardingAnswers = () => {
  replaceAnswers({});

  if (isMobile) {
    return enqueueWrite(async () => {
      await AsyncStorage.removeItem(ONBOARDING_KEYS);
      await AsyncStorage.removeItem(ONBOARDING_PROGRESS_KEY);
    });
  }

  return writeQueue;
};

export const stepIndex = (key: string) => steps.findIndex((s) => s.key === key);

// Resolves once every queued answer/progress write has reached AsyncStorage.
export const flushOnboardingWrites = () => writeQueue;

// First required step (in step order) whose answer is missing or fails its own
// schema, or null when every required answer is valid. Used to resume at the
// right place instead of trusting a stale progress key.
export const firstIncompleteRequiredStep = (
  values: Partial<OnboardingValues>
): OnboardingStep | null =>
  steps.find((step) => {
    if (!step.required || !step.field) {
      return false;
    }

    const value = values[step.field];

    if (value == null) {
      return true;
    }

    return !onboardingValuesSchema.shape[step.field].safeParse(value).success;
  }) ?? null;
