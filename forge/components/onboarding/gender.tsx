import { View, Text } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import React from "react";
import { onboardingGender } from "@/lib/validations/onboarding-validation";
import OnboardingOptionCard from "./onboarding-card";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";

type GenderStepProps = {
  onSelect: (value: onboardingGender) => void;
  value?: onboardingGender;
};

const genderOptions = [
  {
    icon: "mars",
    label: "Male",
    value: "male",
  },
  {
    icon: "venus",
    label: "Female",
    value: "female",
  },
] as const;

export default function GenderStep({ value, onSelect }: GenderStepProps) {
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
        {genderOptions.map((option, index) => {
          const selected = value === option.value;
          return (
            <OnboardingOptionCard
              key={option.value}
              delay={(index + 1) * 80}
              description=""
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
