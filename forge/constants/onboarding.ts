import {
  OnboardingValues,
  onboardingValuesSchema,
} from "@/lib/validations/onboarding-validation";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEYS = "myworkout_onboarding_answers"; //label of the container of the answers.
export const answers: Partial<OnboardingValues> = {};

export const steps = [
  { field: "gender", key: "gender" },
  { field: "goal", key: "goal" },
  { field: "experience", key: "experience" },
] as const;

//check to make sure async storage is operating on mobile instead of web.
const isMobile = Platform.OS !== "web";

if (isMobile) {
  //grab data from ONBOARDING_KEYS
  AsyncStorage.getItem(ONBOARDING_KEYS)
    .then((data) => data && Object.assign(answers, JSON.parse(data)))
    .catch(() => {});
}

//function to save user answers inside the async storage.
export const saveOnboardingAnswers = (
  field: keyof OnboardingValues,
  value: any,
) => {
  answers[field] = value;
  if (isMobile) {
    AsyncStorage.setItem(ONBOARDING_KEYS, JSON.stringify(answers)).catch(
      () => {},
    );
  }
};

//check the onboarding answers against the schema,
export const getOnboardingAnswers = () => {
  return onboardingValuesSchema.safeParse(answers);
};

//clear async storage after completion of onboarding.
export const resetOnboardingAnswers = () => {
  steps.forEach((s) => delete answers[s.field]);
  if (isMobile) AsyncStorage.removeItem(ONBOARDING_KEYS).catch(() => {});
};

export const stepIndex = (key: string) => steps.findIndex((s) => s.key === key);
