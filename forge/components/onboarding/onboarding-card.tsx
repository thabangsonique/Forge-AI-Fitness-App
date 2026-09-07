import { View, Text, Pressable } from "react-native";
import React, { ReactNode } from "react";
import Animated, { FadeInRight } from "react-native-reanimated";
import { cn } from "@/lib/validations/utils";
import { Feather } from "@expo/vector-icons";

type OnboardingOptions = {
  label: string;
  description: string;
  onPress: () => void;
  selected: boolean;
  icon: ReactNode;
  delay?: number;
};

export default function OnboardingOptionCard({
  label,
  delay = 0,
  description,
  onPress,
  selected,
  icon,
}: OnboardingOptions) {
  return (
    <Animated.View entering={FadeInRight.delay(delay).duration(250)}>
      {/* //actual option button */}
      <Pressable
        onPress={onPress}
        className={cn(
          "bg-card-background rounded-2xl py-4 px-4 flex-row items-center justify-between ",
          selected ? "border-2  border-primary" : "border border-muted/40",
        )}
      >
        {/* icon */}{" "}
        <View
          className={`rounded-xl p-3 ${selected ? "bg-primary" : "bg-muted/20"}`}
        >
          {icon}
        </View>
        {/* text + descriptoin */}
        <View className="flex-1 ml-3">
          <Text className="text-white text-lg">{label}</Text>
          <Text className="text-muted/40 font-semibold tracking-wide text-[11px] max-w-52 mt-1">
            {description}
          </Text>
        </View>
        {selected ? (
          <View className="rounded-full bg-primary p-1">
            <Feather name="check" color={"#000"} />
          </View>
        ) : (
          <View className="rounded-full border-2 border-muted/20 h-6 w-6" />
        )}
      </Pressable>
    </Animated.View>
  );
}
