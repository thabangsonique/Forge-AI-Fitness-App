import { cn } from "@/lib/validations/utils";
import { Feather } from "@expo/vector-icons";
import React, { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

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
      <Pressable
        onPress={onPress}
        className={cn(
          "flex-row items-center justify-between overflow-hidden rounded-2xl bg-card-background px-4 py-4",
          selected ? "border border-primary" : "border border-muted/40"
        )}
        style={
          selected
            ? {
                shadowColor: "#DAE86A",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.45,
                shadowRadius: 30,
                elevation: 8,
              }
            : undefined
        }
      >
        {/* Top-to-bottom gradient */}
        {/* <LinearGradient
          colors={[
            "rgba(218, 232, 106, 0.08)",
            "rgba(2, 2, 0, 0.08)",
            "rgba(218, 232, 106, 0.01)",
          ]}
          locations={[0, 0.45, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        /> */}

        {/* Icon */}
        <View
          className={`rounded-xl p-3 ${selected ? "bg-primary" : "bg-muted/20"}`}
        >
          {icon}
        </View>

        {/* Text and description */}
        <View className="ml-3 flex-1">
          <Text className="text-lg text-white">{label}</Text>
          <Text className="mt-1 max-w-52 text-[11px] font-semibold tracking-wide text-muted/40">
            {description}
          </Text>
        </View>

        {/* Selection indicator */}
        {selected ? (
          <View className="rounded-full bg-primary p-1">
            <Feather name="check" color="#000" />
          </View>
        ) : (
          <View className="h-6 w-6 rounded-full border-2 border-muted/20" />
        )}
      </Pressable>
    </Animated.View>
  );
}
