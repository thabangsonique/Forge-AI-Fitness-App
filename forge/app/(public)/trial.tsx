import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INCLUDED = [
  {
    icon: "calendar" as const,
    title: "Your full plan",
    body: "Your split, starter workout, and training days are ready.",
  },
  {
    icon: "zap" as const,
    title: "3 AI coach insights",
    body: "Get a clear read on what's working and what to change.",
  },
  {
    icon: "cpu" as const,
    title: "2 generated workouts",
    body: "Build a workout around the muscles you want to train.",
  },
];

export default function TrialPromise() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 pt-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Feather color="#DAE86A" name="gift" size={28} />
        </View>

        <Text className="mt-6 text-3xl font-bold leading-9 text-white">
          Your 7-day trial starts now.
        </Text>
        <Text className="mt-3 text-base leading-6 text-muted/50">
          No card. No commitment. Just your first week with Forge.
        </Text>

        <View className="mt-9 gap-3">
          {INCLUDED.map((item) => (
            <View
              className="flex-row rounded-3xl border border-muted/10 bg-card-background p-4"
              key={item.title}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Feather color="#DAE86A" name={item.icon} size={18} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-white">
                  {item.title}
                </Text>
                <Text className="mt-1 text-xs leading-5 text-muted/50">
                  {item.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-auto pb-8">
          <Pressable
            className="w-full items-center rounded-full bg-primary py-3"
            onPress={() => router.replace("/paywall")}
          >
            <Text className="text-lg font-bold text-black">Continue</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
