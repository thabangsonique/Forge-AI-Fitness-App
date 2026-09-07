import { View, Text } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import React from "react";
import { onboardingGoal } from "@/lib/validations/onboarding-validation";
import OnboardingOptionCard from "./onboarding-card";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";

type GoalStepProps = {
  onSelect: (value: onboardingGoal) => void;
  value?: onboardingGoal;
};

const goalOptions = [
  {
    icon: "arrow-trend-up",
    label: "Build Muscle",
    description:
      "Increase muscle size and overall physique with hypertrophy progression.",
    value: "build muscle",
  },
  {
    icon: "shield",
    label: "Gain Strength",
    description:
      "Build raw compound strength and peak neurological power output.",
    value: "gain strength",
  },
  {
    icon: "fire",
    label: "Lose Fat",
    description:
      "Reduce body fat while maintaining and preserving lean muscle mass.",
    value: "lose fat",
  },
] as const;

export default function GoalStep({ value, onSelect }: GoalStepProps) {
  return (
    <View className="mt-5 flex-1">
      <Animated.View entering={FadeInRight.duration(250)}>
        <Text className="font-bold text-white text-xl text-center">
          What's your goal?
        </Text>
        <Text className="text-muted/40 text-center">
          Customize your workout volume,rep targets, and daily macros.
        </Text>
      </Animated.View>

      {/* options cards dispaly */}
      <View className="mt-8 gap-5">
        {goalOptions.map((option, index) => {
          const selected = value === option.value;
          return (
            <OnboardingOptionCard
              key={option.value}
              delay={(index + 1) * 80}
              description={option.description}
              icon={
                <FontAwesome6
                  color={selected ? "#0000" : "#a0a0a0"}
                  name={option.icon}
                  size={20}
                />
              }
              label={option.label}
              onPress={() => onSelect(option.value)}
              selected={selected}
            />
          );
        })}
      </View>
    </View>
  );
}
