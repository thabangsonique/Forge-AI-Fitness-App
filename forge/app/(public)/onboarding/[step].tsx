import BodyStatsStep from "@/components/onboarding/body-stats";
import BuildingStep from "@/components/onboarding/building-step";
import ExperienceStep from "@/components/onboarding/experience";
import GenderStep from "@/components/onboarding/gender";
import GoalStep from "@/components/onboarding/goal";
import InfoStep from "@/components/onboarding/info-step";
import {
  CoachVisual,
  PlateauVisual,
  TrackingChartVisual,
} from "@/components/onboarding/onboarding-visuals";
import PainPointsStep from "@/components/onboarding/pain-points";
import PlanRevealStep from "@/components/onboarding/plan-reveal";
import LocationStep from "@/components/onboarding/trainLocation";
import WeeklyTargetStep from "@/components/onboarding/weekly-target";
import SafeAreaScreen from "@/components/ui/safe-area-screen";
import {
  clearOnboardingAnswer,
  firstIncompleteRequiredStep,
  flushOnboardingWrites,
  hydrateOnboardingAnswers,
  loadOnboardingAnswers,
  saveOnboardingAnswers,
  setOnboardingProgress,
  stepIndex,
  steps,
} from "@/constants/onboarding";
import type {
  OnboardingValues,
  onboardingPainPoint,
  onboardingWeightUnit,
} from "@/lib/validations/onboarding-validation";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function OnboardingStep() {
  const { step: key = "" } = useLocalSearchParams<{ step: string }>();
  const router = useRouter();

  const [values, setValues] = useState<Partial<OnboardingValues>>(() =>
    loadOnboardingAnswers()
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateOnboardingAnswers().then(() => {
      setValues(loadOnboardingAnswers());
      setHydrated(true);
    });
  }, []);

  const index = stepIndex(key);
  const step = steps[index];
  const next = steps[index + 1];

  useEffect(() => {
    if (step) {
      setOnboardingProgress(step.key);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (index <= 0) {
      router.replace("/welcome");
    } else {
      router.back();
    }
  }, [index, router]);

  const saveField = useCallback(
    (
      field: keyof OnboardingValues,
      value: OnboardingValues[keyof OnboardingValues]
    ) => {
      saveOnboardingAnswers(field, value);
      setValues((current) => ({ ...current, [field]: value }));
    },
    []
  );

  const clearField = useCallback((field: keyof OnboardingValues) => {
    clearOnboardingAnswer(field);
    setValues((current) => {
      const nextValues = { ...current };
      delete nextValues[field];
      return nextValues;
    });
  }, []);

  const goNext = useCallback(async () => {
    // Make sure the last answer is on disk before leaving the step.
    await flushOnboardingWrites();

    if (next) {
      router.push({
        pathname: "/onboarding/[step]",
        params: { step: next.key },
      });
    } else {
      router.push("/sign-up");
    }
  }, [next, router]);

  const togglePainPoint = useCallback(
    (point: onboardingPainPoint) => {
      const current = values.painPoints ?? [];
      const nextPoints = current.includes(point)
        ? current.filter((item) => item !== point)
        : [...current, point];

      saveField("painPoints", nextPoints);
    },
    [saveField, values.painPoints]
  );

  const setWeightUnit = useCallback(
    (value: onboardingWeightUnit) => saveField("weightUnit", value),
    [saveField]
  );
  const setWeight = useCallback(
    (value: number | null) => saveField("weightKg", value),
    [saveField]
  );
  const setHeight = useCallback(
    (value: number | null) => saveField("heightCm", value),
    [saveField]
  );
  const setBirthYear = useCallback(
    (value: number | null) => saveField("birthYear", value),
    [saveField]
  );

  const skip = useCallback(() => {
    if (step?.key === "bodyStats") {
      clearField("weightKg");
      clearField("heightCm");
      clearField("birthYear");
    }

    if (step?.key === "location") {
      clearField("trainingLocation");
    }

    goNext();
  }, [clearField, goNext, step?.key]);

  const finishBuilding = useCallback(() => {
    setOnboardingProgress("planReveal");
    router.replace({
      pathname: "/onboarding/[step]",
      params: { step: "planReveal" },
    });
  }, [router]);

  const firstIncomplete = useMemo(
    () => firstIncompleteRequiredStep(values),
    [values]
  );

  const canContinue = useMemo(() => {
    // planReveal must not be saveable without the answers it claims to
    // summarise, otherwise it renders "valid" with empty values.
    if (step?.kind === "reveal") {
      return firstIncomplete === null;
    }

    if (!step?.required || !step.field) {
      return true;
    }

    const fieldValue = values[step.field];

    if (Array.isArray(fieldValue)) {
      return fieldValue.length > 0;
    }

    return fieldValue != null;
  }, [firstIncomplete, step, values]);

  // Never render a step that sits past the first unanswered required one.
  useEffect(() => {
    if (!hydrated || !step || !firstIncomplete) {
      return;
    }

    const incompleteIndex = stepIndex(firstIncomplete.key);

    if (incompleteIndex >= 0 && index > incompleteIndex) {
      router.replace({
        pathname: "/onboarding/[step]",
        params: { step: firstIncomplete.key },
      });
    }
  }, [firstIncomplete, hydrated, index, router, step]);

  if (!step) {
    return null;
  }

  if (!hydrated) {
    return (
      <SafeAreaScreen>
        <View className="flex-1 bg-background" />
      </SafeAreaScreen>
    );
  }

  const isBuilding = step.kind === "loading";
  const isReveal = step.kind === "reveal";
  const showFooter = !isBuilding;

  return (
    <SafeAreaScreen>
      <View className="flex-1 bg-background pt-4">
        <View className="px-6">
          <View className="flex-row items-center justify-between">
            <Pressable
              className="h-[40px] w-[40px] items-center justify-center rounded-full border border-muted/10 bg-muted/10 active:bg-primary/50"
              onPress={goBack}
            >
              <Feather color={"#a0a0a0"} name="chevron-left" size={23} />
            </Pressable>

            <Text className="text-xs font-semibold uppercase tracking-wider text-muted/40">
              Step {index + 1} of {steps.length}
            </Text>

            <View className="w-[40px]" />
          </View>

          <View className="mt-3 h-[6px] overflow-hidden rounded-full bg-muted/10">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step.key === "goal" && (
            <GoalStep
              onSelect={(value) => saveField("goal", value)}
              value={values.goal}
            />
          )}
          {step.key === "experience" && (
            <ExperienceStep
              onSelect={(value) => saveField("experience", value)}
              value={values.experience}
            />
          )}
          {step.key === "painPoints" && (
            <PainPointsStep
              onToggle={togglePainPoint}
              value={values.painPoints}
            />
          )}
          {step.key === "trainingBlind" && (
            <InfoStep
              body="Most people train hard for months and never know if they're moving forward. You'll see every rep, every weight, and every PR in one place."
              title="Training blind is why progress stalls."
            >
              <TrackingChartVisual />
            </InfoStep>
          )}
          {step.key === "weeklyTarget" && (
            <WeeklyTargetStep
              onSelect={(value) => saveField("workoutsPerWeek", value)}
              value={values.workoutsPerWeek}
            />
          )}
          {step.key === "location" && (
            <LocationStep
              onSelect={(value) => saveField("trainingLocation", value)}
              value={values.trainingLocation}
            />
          )}
          {step.key === "gender" && (
            <GenderStep
              onSelect={(value) => saveField("gender", value)}
              value={values.gender}
            />
          )}
          {step.key === "plateau" && (
            <InfoStep
              body="Your plan adapts every week based on what you lifted and how hard it felt. You keep progressing instead of repeating the same session."
              title="Progress isn't more workouts. It's better ones."
            >
              <PlateauVisual />
            </InfoStep>
          )}
          {step.key === "bodyStats" && (
            <BodyStatsStep
              onChange={{
                weightUnit: setWeightUnit,
                weightKg: setWeight,
                heightCm: setHeight,
                birthYear: setBirthYear,
              }}
              value={values}
            />
          )}
          {step.key === "coachBridge" && (
            <InfoStep
              body="Every week, Forge looks at your recent sessions and sets a target for every lift. You'll always know what to do next."
              title="A coach worth waking up for."
            >
              <CoachVisual />
            </InfoStep>
          )}
          {step.key === "building" && (
            <BuildingStep onDone={finishBuilding} />
          )}
          {step.key === "planReveal" && <PlanRevealStep value={values} />}
        </ScrollView>

        {showFooter ? (
          <View className="px-6 pb-8 pt-2">
            <Pressable
              className={`w-full items-center justify-center rounded-full py-3 ${
                canContinue ? "bg-primary" : "bg-primary/30"
              }`}
              disabled={!canContinue}
              onPress={goNext}
            >
              <Text
                className={`text-lg font-bold ${
                  canContinue ? "text-black" : "text-black/40"
                }`}
              >
                {isReveal ? "Save my plan" : "Continue"}
              </Text>
            </Pressable>

            {step.skippable ? (
              <Pressable className="mt-4 items-center py-2" onPress={skip}>
                <Text className="text-sm text-muted/40">Skip for now</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaScreen>
  );
}
