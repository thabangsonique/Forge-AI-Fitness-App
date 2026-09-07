import { View, Text } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import React from "react";
import { onboardingExperience } from "@/lib/validations/onboarding-validation";
import OnboardingOptionCard from "./onboarding-card";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";

type ExperienceStepProps = {
  onSelect: (value: onboardingExperience) => void;
  value?: onboardingExperience;
};

const experienceOptions = [
  {
    icon: "bolt",
    label: "Beginner",
    description: "New to Training",
    value: "beginner",
  },
  {
    icon: "bullseye",
    label: "Intermediate",
    description: "Trained for a while",
    value: "intermediate",
  },
  {
    icon: "award",
    label: "Advanced",
    description: "Very experienced",
    value: "advanced",
  },
] as const;

export default function ExperienceStep({
  value,
  onSelect,
}: ExperienceStepProps) {
  return (
    <View className="mt-5 flex-1">
      <Animated.View entering={FadeInRight.duration(250)}>
        <Text className="font-bold text-white text-xl text-center">
          What's your gender?
        </Text>
        <Text className="text-muted/40 text-center">
          This helps us personalize your experience
        </Text>
      </Animated.View>

      {/* options cards dispaly */}
      <View className="mt-8 gap-5">
        {experienceOptions.map((option, index) => {
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
