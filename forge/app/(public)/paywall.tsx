import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PLANS = [
  {
    id: "annual",
    label: "Annual",
    price: "$59.99",
    cadence: "/ year",
    note: "$5.00 / month, billed yearly",
    badge: "Best value",
  },
  {
    id: "monthly",
    label: "Monthly",
    price: "$9.99",
    cadence: "/ month",
    note: "Cancel anytime",
    badge: null,
  },
] as const;

export default function Paywall() {
  const router = useRouter();
  const [selected, setSelected] = useState<"annual" | "monthly">("annual");

  const goHome = () => router.replace("/(app)/(tabs)");

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 pt-4">
        <View className="flex-row justify-end">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-muted/10"
            onPress={goHome}
          >
            <Feather color="#a0a0a0" name="x" size={20} />
          </Pressable>
        </View>

        <Text className="mt-4 text-3xl font-bold leading-9 text-white">
          Keep the momentum. Start completely{" "}
          <Text className="text-primary">free.</Text>
        </Text>
        <Text className="mt-2 text-base leading-6 text-muted/50">
          Unlock unlimited coach insights and generated workouts.
        </Text>

        <View className="mt-8 gap-3">
          {PLANS.map((plan) => {
            const isSelected = selected === plan.id;

            return (
              <Pressable
                className={`rounded-3xl border p-5 ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-muted/15 bg-card-background"
                }`}
                key={plan.id}
                onPress={() => setSelected(plan.id)}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted/30"
                      }`}
                    >
                      {isSelected ? (
                        <Feather color="#000" name="check" size={12} />
                      ) : null}
                    </View>
                    <Text className="ml-3 text-base font-semibold text-white">
                      {plan.label}
                    </Text>
                    {plan.badge ? (
                      <View className="ml-2 rounded-full bg-primary/20 px-2 py-0.5">
                        <Text className="text-[10px] font-bold uppercase text-primary">
                          {plan.badge}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="items-end">
                    <Text className="text-lg font-bold text-white">
                      {plan.price}
                    </Text>
                    <Text className="text-xs text-muted/40">
                      {plan.cadence}
                    </Text>
                  </View>
                </View>
                <Text className="mt-2 text-xs text-muted/40">{plan.note}</Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6 flex-row items-center">
          <Feather color="#DAE86A" name="shield" size={16} />
          <Text className="ml-2 flex-1 text-xs leading-5 text-muted/40">
            Your trial is active for 7 days. You will not be charged today.
          </Text>
        </View>

        <View className="mt-auto pb-8">
          <Pressable
            className="w-full items-center rounded-full bg-primary py-3"
            onPress={goHome}
          >
            <Text className="text-lg font-bold text-black">
              Start free trial
            </Text>
          </Pressable>

          <Pressable className="mt-4 items-center py-2" onPress={goHome}>
            <Text className="text-sm text-muted/40">Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
