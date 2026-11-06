import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Text, View } from "react-native";

const PRIMARY_COLOR = "#dae86aff";
export default function TrainingVolume() {
  return (
    <View className="flex-row items-center rounded-3xl bg-muted/10 p-4">
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)"]}
        className="absolute inset-0"
      />
      {/* Icon box */}
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Feather name="bar-chart-2" size={24} color={PRIMARY_COLOR} />
      </View>

      {/* Content */}
      <View className="ml-3 flex-1">
        {/* Title row with badge */}
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-white">
            Training Volume
          </Text>

          <View className="rounded-3xl bg-red-500/10 px-3 py-1">
            <Text className="text-xs font-bold text-red-500">
              {/* dynamic text */}
              Attention
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text className="mt-1 text-sm leading-5 text-neutral-400">
          {/* dynamic muscle */}
          Your chest
          <Text className="font-semibold">training</Text>
          {/* dynamic text */}
          volume is below your 5-week average (12 vs 16 sets).
        </Text>
      </View>

      {/* chevron */}
      <Feather name="chevron-right" size={20} color="#fff" />
    </View>
  );
}
