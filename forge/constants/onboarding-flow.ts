import type {
  onboardingPainPoint,
  onboardingWeightUnit,
} from "@/lib/validations/onboarding-validation";

export const PAIN_POINT_OPTIONS: {
  value: onboardingPainPoint;
  label: string;
  icon: string;
}[] = [
  {
    value: "not_sure_improving",
    label: "I don't know if I'm actually improving",
    icon: "trending-up",
  },
  {
    value: "repeat_workouts",
    label: "I repeat the same workouts",
    icon: "repeat",
  },
  {
    value: "never_know_weight",
    label: "I never know what weight or reps to do next",
    icon: "sliders",
  },
  {
    value: "lose_motivation",
    label: "I lose motivation when I don't see results",
    icon: "battery-charging",
  },
  {
    value: "no_real_plan",
    label: "I don't have a real plan",
    icon: "map",
  },
];

export const PAIN_POINT_LINES: Record<onboardingPainPoint, string> = {
  not_sure_improving:
    "You said you're not sure if you're improving. Forge tracks every lift, PR by PR.",
  repeat_workouts:
    "You said you repeat the same workouts. Your plan changes every week.",
  never_know_weight:
    "You said you never know what weight to do next. Every lift has a target.",
  lose_motivation:
    "You said you lose motivation without results. Your PRs are tracked automatically.",
  no_real_plan:
    "You said you don't have a real plan. Yours is built around your goal and schedule.",
};

export type SplitPlan = {
  name: string;
  labels: string[];
  days: number[];
  hint: string;
};

const SPLIT_BY_DAYS: Record<number, SplitPlan> = {
  1: {
    name: "Full Body",
    labels: ["Full"],
    days: [1],
    hint: "Full body / 1 focused session",
  },
  2: {
    name: "Full Body",
    labels: ["Full"],
    days: [1, 4],
    hint: "Full body / 2 sessions",
  },
  3: {
    name: "Full Body",
    labels: ["Full"],
    days: [1, 3, 5],
    hint: "Full body / 3 sessions",
  },
  4: {
    name: "Upper / Lower",
    labels: ["Up", "Low"],
    days: [1, 2, 4, 5],
    hint: "Upper / Lower / Upper / Lower",
  },
  5: {
    name: "Upper / Lower + Push / Pull",
    labels: ["Up", "Low", "Push", "Pull", "Up"],
    days: [1, 2, 3, 5, 6],
    hint: "Upper / Lower / Push / Pull / Upper",
  },
  6: {
    name: "Push / Pull / Legs",
    labels: ["Push", "Pull", "Legs"],
    days: [1, 2, 3, 4, 5, 6],
    hint: "Push / Pull / Legs repeated twice",
  },
  7: {
    name: "Push / Pull / Legs + Active Rest",
    labels: ["Push", "Pull", "Legs"],
    days: [1, 2, 3, 4, 5, 6],
    hint: "Push / Pull / Legs plus an active rest day",
  },
};

export const getSplitForDays = (days: number): SplitPlan =>
  SPLIT_BY_DAYS[Math.min(7, Math.max(1, Math.round(days)))] ?? SPLIT_BY_DAYS[3];

export const getPreferredDays = (days: number): number[] =>
  getSplitForDays(days).days;

export const WEEK_DAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export type WeekDayPlan = {
  dayIndex: number;
  label: string;
  shortLabel: string;
  workoutLabel: string | null;
  isActiveRest: boolean;
};

export const getWeekPlan = (days: number): WeekDayPlan[] => {
  const split = getSplitForDays(days);
  const preferred = new Set(split.days);
  let trainingIndex = 0;

  return WEEK_DAY_LABELS.map((shortLabel, dayIndex) => {
    if (preferred.has(dayIndex)) {
      const workoutLabel =
        split.labels[trainingIndex % split.labels.length] ?? "Train";
      trainingIndex += 1;

      return {
        dayIndex,
        label: shortLabel,
        shortLabel,
        workoutLabel,
        isActiveRest: false,
      };
    }

    const isActiveRest = days === 7 && dayIndex === 0;

    return {
      dayIndex,
      label: shortLabel,
      shortLabel,
      workoutLabel: isActiveRest ? "Active" : null,
      isActiveRest,
    };
  });
};

export const getPainPointLine = (
  painPoints: onboardingPainPoint[] | undefined
): string | null => {
  const first = painPoints?.[0];
  return first ? PAIN_POINT_LINES[first] : null;
};

export const getWeightUnitLabel = (unit: onboardingWeightUnit) =>
  unit === "kg" ? "Metric (kg / cm)" : "Imperial (lb / ft)";
