import { useGetUserStatsQuery } from "@/features/api";
import React from "react";
import { Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface MuscleStrengthProps {
  isActive: string;
}

export default function MuscleStrength({ isActive }: MuscleStrengthProps) {
  //QUERIES:
  const { data: userStats, isLoading, isError } = useGetUserStatsQuery();

  const chartData = userStats?.muscleStrength
    .filter((strength) => strength.muscle === isActive)
    .map((strength) => ({
      value: strength.best1RM,
      label: strength.weekLabel,
    }));

  //highest 1RM so far.
  const muscle1RMS = userStats?.muscleStrength
    .filter((item) => item.muscle === isActive)
    .map((muscle) => muscle.best1RM);

  const maxMuscleStrength = Math.floor(
    muscle1RMS && muscle1RMS.length > 0 ? Math.max(...muscle1RMS) : 0
  );

  console.log("1 rep max's", muscle1RMS);

  return (
    <View className="overflow-hidden rounded-3xl border border-muted/20 bg-black  px-4 py-4">
      <Text className="text-lg font-bold text-white">Muscles strength</Text>
      <Text className="text-sm text-muted/50">
        Weekly muscle strength progression
      </Text>

      {/* highest 1RM */}
      <View className="mt-3 rounded-3xl border border-muted/20 px-3 py-4">
        <Text className="text-white">Your Highest 1RMax</Text>
        <Text className="mt-2 text-lg font-bold text-primary">
          {maxMuscleStrength} kg
        </Text>
      </View>
      {/* GRAPH */}
      <View className="mt-5 overflow-hidden">
        <LineChart
          data={chartData ?? []}

          // Line styling
          color="#688fecff"
          thickness={1.5}

          // Data point styling
          dataPointsColor="#3d74d2ff"
          dataPointsRadius={4}

          // Chart dimensions
          width={320}
          height={220}
          spacing={38}
          initialSpacing={20}

          // Y-axis config
          yAxisColor="transparent"

          yAxisLabelSuffix=" kg"
          yAxisTextStyle={{ color: "#ffffff" }}
          yAxisLabelWidth={45}
          maxValue={400}
          noOfSections={5}
          stepValue={80}

          // X-axis config
          xAxisColor="#333"
          xAxisLabelTextStyle={{ color: "#ffffff" }}

          // Grid lines
          rulesColor="#333"
          rulesType="solid"

          // Background
          backgroundColor="#000000"

          // Hide the default area fill
          areaChart={false}
        />
      </View>
    </View>
  );
}
