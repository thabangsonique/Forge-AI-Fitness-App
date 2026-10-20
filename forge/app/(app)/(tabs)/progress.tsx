import VolumeScreen from "@/components/ui/volumeScreen";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MuscleScreen from "@/components/ui/muscleScreen";
import PrScreen from "@/components/ui/prScreen";
import { useGetUserStatsQuery } from "@/features/api";

const perfomanceOptions = [
  { title: "Volume" },
  { title: "Muscle" },
  { title: "PRs" },
];
export default function statistics() {
  //STATES
  const [isActive, setIsActive] = useState("Volume");

  //QUERIES
  const {
    data: UserStats,
    isLoading,
    isError,
    isSuccess,
    isUninitialized,
    status,
  } = useGetUserStatsQuery();

  console.log("user stats:", UserStats?.exerciseBreakedown);
  return (
    <SafeAreaView className="flex-1 bg-background px-5 pb-[50px] pt-5">
      {/* header */}
      <View>
        <Text className="text-center text-white">Progress</Text>

        {/* toggle section */}
        <View className="mt-5 flex-row items-center justify-center gap-5">
          {perfomanceOptions.map((option, idx) => (
            <Pressable
              key={idx}
              onPress={() => setIsActive(option.title)}
              className={`${isActive === option.title ? "bg-primary" : "bg-muted/10"} rounded-full px-3 py-2`}
            >
              <Text
                className={`${isActive === option.title ? "text-black" : "text-muted-2"}`}
              >
                {option.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* stats section */}

      {/* volume page */}
      <View className="mt-5 flex-1">
        {isActive === "Volume" && (
          <VolumeScreen
            weeklyVolume={UserStats?.totalWeeklyVolume}
            isLoading={isLoading}
            isError={isError}
          />
        )}

        {/* muscle screen */}
        {isActive === "Muscle" && (
          <MuscleScreen
            muscleStats={UserStats?.exerciseBreakedown}
            isLoading={isLoading}
            isError={isError}
          />
        )}

        {/* PRs screen */}
        {isActive === "PRs" && <PrScreen />}
      </View>
    </SafeAreaView>
  );
}
