import { PAIN_POINT_OPTIONS } from "@/constants/onboarding-flow";
import type { onboardingPainPoint } from "@/lib/validations/onboarding-validation";
import { Feather } from "@expo/vector-icons";
import React, { ComponentProps } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import OnboardingOptionCard from "./onboarding-card";

type IconName = ComponentProps<typeof Feather>["name"];

const ICONS: Record<onboardingPainPoint, IconName> = {
  not_sure_improving: "trending-up",
  repeat_workouts: "repeat",
  never_know_weight: "sliders",
  lose_motivation: "battery-charging",
  no_real_plan: "map",
};

type PainPointsStepProps = {
  onToggle: (value: onboardingPainPoint) => void;
  value?: onboardingPainPoint[];
};

export default function PainPointsStep({
  onToggle,
  value = [],
}: PainPointsStepProps) {
  return (
    <View className="mt-5 flex-1">
      <Animated.View entering={FadeInRight.duration(250)}>
        <Text className="text-center text-xl font-bold text-white">
          What&apos;s holding your progress back?
        </Text>
        <Text className="text-center text-muted/40">Pick all that apply.</Text>
      </Animated.View>

      <View className="mt-8 gap-4">
        {PAIN_POINT_OPTIONS.map((option, index) => {
          const selected = value.includes(option.value);

          return (
            <OnboardingOptionCard
              key={option.value}
              delay={(index + 1) * 60}
              description=""
              icon={
                <Feather
                  color={selected ? "#000" : "#a0a0a0"}
                  name={ICONS[option.value]}
                  size={20}
                />
              }
              label={option.label}
              onPress={() => onToggle(option.value)}
              selected={selected}
            />
          );
        })}
      </View>
    </View>
  );
}
