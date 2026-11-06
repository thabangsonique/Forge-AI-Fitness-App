import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Text, View } from "react-native";

const PRIMARY_COLOR = "#dae86aff";
export default function GenerateWorkout() {
  return (
    <View className="rounded-3xl bg-muted/10 p-4">
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.5)"]}
        className="absolute inset-0"
      />
      {/* Top section */}
      <Pressable className="flex-row items-center">
        {/* Icon box */}
        <View className="h-12 w-12 items-center justify-center rounded-xl  bg-primary/10">
          <FontAwesome5 name="lightbulb" size={24} color={PRIMARY_COLOR} />
        </View>

        {/* Text */}
        <View className="mx-3 flex-1">
          <Text className="text-base font-bold text-white">
            Recommended Next Step
          </Text>
          <Text className="mt-0.5 text-sm leading-5 text-neutral-400">
            Consider prioritising {/* dynamic text */}
            <Text className="font-semibold">Chest</Text> in your next workout to
            maintain balanced development.
          </Text>
        </View>

        {/* Chevron */}
        <Feather name="chevron-right" size={22} color="#a3a3a3" />
      </Pressable>

      {/* CTA button */}
      <Pressable className="mt-4 flex-row items-center justify-center rounded-3xl  bg-primary py-3.5">
        <Ionicons name="barbell-outline" size={20} color="#000" />
        <Text className="ml-2 text-base font-bold text-black">
          Generate a Workout
        </Text>
      </Pressable>
    </View>
  );
}
