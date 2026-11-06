import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import GenerateWorkout from "./cards/GenerateWorkout";
import Performance from "./cards/performance";
import PerformanceTrends from "./cards/performanceTrends";
import QuickActions from "./cards/QuickAction";
import TrainingVolume from "./cards/trainingVolume";

const PRIMARY_COLOR = "#dae86aff";
export default function AiInsight() {
  const [isPressed, setIsPressed] = useState("");
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-background px-3 pt-3">
      {/* header here */}
      <View className="h-14 flex-row  items-center px-4">
        {/* Back button */}
        <Pressable
          onPressIn={() => setIsPressed("home")}
          onPressOut={() => setIsPressed("")}
          onPress={() => {
            console.log("CHEVRON PRESSED");

            router.replace("/(app)/(tabs)");
          }}
          hitSlop={20}
          pressRetentionOffset={30}
          className={`${isPressed === "home" ? "opacity-50" : "opacity-100"} z-20 h-12 w-12 items-center justify-center rounded-full bg-primary/10`}
        >
          <Feather name="chevron-left" size={25} color="#fff" />
        </Pressable>

        {/* Centered title */}
        <View
          pointerEvents="none"
          className="absolute inset-x-0 items-center justify-center"
        >
          <Text className="text-lg text-white">AI Coach</Text>
        </View>
      </View>

      {/* ai INSIGHT SECTION */}
      <View className="flex-row items-center rounded-2xl p-4">
        {/* Brain icon box */}
        <View className="h-12 w-12 items-center justify-center ">
          <FontAwesome5 name="brain" size={26} color={PRIMARY_COLOR} />
        </View>

        {/* Title + subtitle */}
        <View className="mx-3 flex-1">
          <Text className="text-lg font-bold text-white">Forge Coach</Text>
          <Text className="text-sm leading-5 text-muted/50">
            Your personal training insights powered by your progress.
          </Text>
        </View>

        {/* Time period badge */}
        <View className="flex-row items-center rounded-3xl bg-muted/10 px-2.5 py-2">
          <Feather name="calendar" size={16} color={PRIMARY_COLOR} />
          <View className="ml-2">
            <Text className="text-xs leading-4 text-neutral-300">Based on</Text>
            <Text className="text-xs font-semibold leading-4 text-white">
              last 4 weeks
            </Text>
          </View>
        </View>
      </View>

      {/* performance overview */}
      <Performance />

      {/* KEY INSIGHTS */}
      <Text className="mb-3 mt-5 font-bold text-white">Key Insights</Text>
      <View className="gap-4">
        <TrainingVolume />
        <PerformanceTrends />
        <GenerateWorkout />
      </View>

      {/* QUICK ACTIONS */}
      <View className="flex-row flex-wrap justify-between gap-y-3">
        <View className="w-[48%]">
          <QuickActions />
        </View>

        <View className="w-[48%]">
          <QuickActions />
        </View>

        <View className="w-[48%]">
          <QuickActions />
        </View>

        <View className="w-[48%]">
          <QuickActions />
        </View>
      </View>
    </SafeAreaView>
  );
}
