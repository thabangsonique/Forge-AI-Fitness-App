import { getSplitForDays } from "@/constants/onboarding-flow";
import { cn } from "@/lib/validations/utils";
import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

type WeeklyTargetStepProps = {
  onSelect: (value: number) => void;
  value?: number;
};

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function WeeklyTargetStep({
  onSelect,
  value,
}: WeeklyTargetStepProps) {
  const split = value ? getSplitForDays(value) : null;

  return (
    <View className="mt-5 flex-1">
      <Animated.View entering={FadeInRight.duration(250)}>
        <Text className="text-center text-xl font-bold text-white">
          How many days a week can you train?
        </Text>
        <Text className="text-center text-muted/40">
          We&apos;ll build your split around it.
        </Text>
      </Animated.View>

      <View className="mt-8 flex-row justify-between gap-2">
        {DAY_OPTIONS.map((day) => {
          const selected = value === day;

          return (
            <Pressable
              className={cn(
                "flex-1 items-center rounded-2xl border py-4",
                selected
                  ? "border-primary bg-primary"
                  : "border-muted/40 bg-card-background"
              )}
              key={day}
              onPress={() => onSelect(day)}
            >
              <Text
                className={cn(
                  "text-lg font-bold",
                  selected ? "text-black" : "text-white"
                )}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6 min-h-[96px] rounded-3xl border border-primary/20 bg-primary/5 p-4">
        {split ? (
          <>
            <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
              Your split
            </Text>
            <Text className="mt-1 text-lg font-bold text-white">
              {split.name}
            </Text>
            <Text className="mt-1 text-xs leading-5 text-muted/50">
              {split.hint}
            </Text>
          </>
        ) : (
          <Text className="text-center text-sm leading-6 text-muted/40">
            Pick your training days to see your weekly split.
          </Text>
        )}
      </View>
    </View>
  );
}
