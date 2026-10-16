import { useGetUserStatsQuery } from "@/features/api";
import React from "react";
import { Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface MuscleHypertrophyProps {
  isActive: string;
}
export default function MuscleHypertrophy({
  isActive,
}: MuscleHypertrophyProps) {
  //WEEKLY SETS QUERY.
  const { data: userStats, isLoading, isError } = useGetUserStatsQuery();

  // console.log("Loading:", isLoading);
  // console.log("Error:", isError);
  // console.log("User stats:", userStats);
  // console.log("Weekly muscle sets", userStats?.weeklyMuscleSets);
  // console.log("Active muscle:", isActive);
  const selectedMuscle =
    userStats?.weeklyMuscleSets.filter((item) => item.muscle === isActive) ??
    [];
  // console.log("muscleHyper screen:", userStats?.weeklyMuscleSets);
  console.log("selected muscle:", selectedMuscle);

  //get the start of the current week.(monday of current week)
  const getStartWeek = (date: Date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);

    const currentDay = result.getDay();

    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

    result.setDate(result.getDate() - daysFromMonday);

    return result; //monday of the current week
  };

  //format current date.
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  //monday of currrent week
  const currentWeek = getStartWeek(new Date());

  //last 7 weeks from this week.
  const lastSevenWeeks = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentWeek);

    date.setDate(currentWeek.getDate() - (6 - index) * 7);

    return {
      weekStart: formatDate(date),
      label: `W${index + 1}`,
    };
  });

  // console.log("chart data", chartData);
  const chartData = lastSevenWeeks.map((week) => {
    const matchingWeek = selectedMuscle.find(
      (item) => item.weekStart === week.weekStart
    );

    return {
      value: matchingWeek ? Number(matchingWeek.sets) : 0,
      label: week.label,
    };
  });

  return (
    <View className="rounded-3xl border border-muted/20 bg-black  px-4 py-4">
      <Text className="text-lg font-bold text-white">Chest hypertrophy</Text>
      <Text className="text-sm text-muted/50">Weekly training volume</Text>
      <View className="mt-4 flex-row items-center gap-3">
        <View className="h-4 w-4 rounded-full bg-primary" />
        <Text className="text-sm text-muted/50">Your weekly sets</Text>
      </View>
      <View className="mt-2 flex-row items-center gap-3">
        <View className="h-4 w-4 rounded-full bg-muted/50" />
        <Text className="text-sm text-muted/50">Recommended target</Text>
      </View>

      <Text className="mt-6 text-muted/50">Sets / week</Text>

      <View className="mt-5 overflow-hidden">
        <LineChart
          data={chartData}

          // Line styling
          color="#D4F017"
          thickness={1}

          // Data point styling
          dataPointsColor="#D4F017"
          dataPointsRadius={6}

          // Chart dimensions
          height={220}
          spacing={38}
          initialSpacing={20}

          // Y-axis config
          yAxisColor="transparent"
          yAxisTextStyle={{ color: "#ffffff" }}
          yAxisLabelWidth={20}
          maxValue={25}
          noOfSections={5}
          stepValue={5}

          // X-axis config
          xAxisColor="#333"
          xAxisLabelTextStyle={{ color: "#ffffff" }}

          // Grid lines
          rulesColor="#333"
          rulesType="solid"

          // Background
          backgroundColor="#000000"

          // Reference / target line (the dashed line at 20)
          showReferenceLine1
          referenceLine1Position={20}
          referenceLine1Config={{
            color: "gray",
            dashWidth: 6,
            dashGap: 4,
            thickness: 2,
          }}

          // Smooth curve (optional, looks closer to image)
          curved

          // Hide the default area fill
          areaChart={false}
        />
      </View>
    </View>
  );
}
