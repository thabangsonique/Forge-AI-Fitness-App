import { onboardingTrainingLocation } from "@/lib/validations/onboarding-validation";
import { FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import OnboardingOptionCard from "./onboarding-card";

type LocationStepProps = {
  onSelect: (value: onboardingTrainingLocation) => void;
  value?: onboardingTrainingLocation;
};

const goalOptions = [
  {
    icon: "arrow-trend-up",
    label: "Full Gym",
    description: "Barbells, racks, cables, and  machines",
    value: "gym",
  },
  {
    icon: "shield",
    label: "Home",
    description: "Dumbbells and whatever you have at home",
    value: "home",
  },
  {
    icon: "fire",
    label: "Bodywieght Only",
    description: "No equipment. Just you",
    value: "bodyweight",
  },
] as const;

export default function GoalStep({ value, onSelect }: LocationStepProps) {
  return (
    <View className="mt-5 flex-1">
      <Animated.View entering={FadeInRight.duration(250)}>
        <Text className="text-center text-xl font-bold text-white">
          Where do you train?
        </Text>
        <Text className="text-center text-muted/40">
          Your coach only pics exercises you can do.
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
