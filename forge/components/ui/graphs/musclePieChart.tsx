import { ExerciseBreakedown } from "@/features/api";
import React from "react";
import { View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

interface MusclePie {
  muscleDistribution: ExerciseBreakedown["muscleDistribution"];
}

export default function MusclePieChart({ muscleDistribution }: MusclePie) {
  const pieData = muscleDistribution
    .map((item) => ({
      percentage: Number(item.percentage),
    }))
    .filter((item) => item.percentage > 0)
    .map((item) => ({
      value: item.percentage,
      color:
        item.percentage > 75
          ? "#DAE86A"
          : item.percentage >= 50
            ? "#DAE86A80"
            : item.percentage >= 25
              ? "#DAE86A4D"
              : "#DAE86A1A",
    }));

  console.log("Muscle distribution:", muscleDistribution);
  console.log("Pie data:", pieData);
  return (
    <View className="items-center justify-center">
      <PieChart
        data={pieData}
        donut
        radius={55}
        innerRadius={38}
        innerCircleColor="#171717"
        focusOnPress={false}
        showText={false}
        centerLabelComponent={() => <View />}
      />
    </View>
  );
}
