import {
  getPainPointLine,
  getSplitForDays,
  getWeekPlan,
} from "@/constants/onboarding-flow";
import type { OnboardingValues } from "@/lib/validations/onboarding-validation";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { WeekPlanStrip } from "./onboarding-visuals";

type PlanRevealStepProps = {
  value: Partial<OnboardingValues>;
};

const titleCase = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "Your";

export default function PlanRevealStep({ value }: PlanRevealStepProps) {
  const days = value.workoutsPerWeek ?? 3;
  const split = getSplitForDays(days);
  const week = getWeekPlan(days);
  const painLine = getPainPointLine(value.painPoints);

  return (
    <View className="mt-5 flex-1">
      <Animated.View entering={FadeInRight.duration(250)}>
        <Text className="text-center text-2xl font-bold text-white">
          Your plan is ready
        </Text>
        <Text className="mt-1 text-center text-sm text-muted/50">
          Built around your goal, schedule, and starting point.
        </Text>
      </Animated.View>

      <Animated.View
        className="mt-6 rounded-3xl border border-primary/25 bg-card-background p-5"
        entering={FadeInDown.delay(80).duration(300)}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted/40">
              Your program
            </Text>
            <Text className="mt-1 text-2xl font-bold text-white">
              {split.name}
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/15">
            <Feather color="#DAE86A" name="zap" size={22} />
          </View>
        </View>

        <View className="mt-5 flex-row gap-2">
          <SummaryPill label="Goal" value={titleCase(value.goal)} />
          <SummaryPill label="Level" value={titleCase(value.experience)} />
          <SummaryPill label="Days" value={`${days} / week`} />
        </View>
      </Animated.View>

      <Animated.View
        className="mt-4 rounded-3xl bg-card-background p-4"
        entering={FadeInDown.delay(140).duration(300)}
      >
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted/40">
          Your week
        </Text>
        <WeekPlanStrip week={week} />
      </Animated.View>

      {painLine ? (
        <Animated.View
          className="mt-4 flex-row rounded-2xl border border-primary/20 bg-primary/5 p-4"
          entering={FadeInDown.delay(200).duration(300)}
        >
          <Feather color="#DAE86A" name="target" size={18} />
          <Text className="ml-3 flex-1 text-xs leading-5 text-muted/60">
            {painLine}
          </Text>
        </Animated.View>
      ) : null}

      <Text className="mt-4 text-center text-xs text-muted/30">
        Your coach adapts the plan every week as you get stronger.
      </Text>
    </View>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-muted/5 px-2 py-2">
      <Text className="text-[10px] uppercase tracking-wide text-muted/35">
        {label}
      </Text>
      <Text className="mt-0.5 text-xs font-semibold text-white" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
