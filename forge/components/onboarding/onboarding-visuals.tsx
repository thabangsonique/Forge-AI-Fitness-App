import type { WeekDayPlan } from "@/constants/onboarding-flow";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

export function TrackingChartVisual() {
  return (
    <View className="overflow-hidden rounded-3xl bg-card-background p-4">
      <Svg height={180} viewBox="0 0 320 180" width="100%">
        <Line
          stroke="#4B5563"
          strokeDasharray="4 6"
          strokeWidth={2}
          x1={24}
          x2={296}
          y1={128}
          y2={128}
        />
        <Circle cx={24} cy={128} fill="#4B5563" r={3} />
        <Circle cx={296} cy={128} fill="#4B5563" r={3} />

        <Polyline
          fill="none"
          points="24,136 78,126 132,112 186,90 240,62 296,32"
          stroke="#DAE86A"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
        />
        <Circle cx={296} cy={32} fill="#DAE86A" r={4} />

        <SvgText
          fill="#9CA3AF"
          fontSize={11}
          fontWeight="600"
          x={24}
          y={158}
        >
          Without tracking
        </SvgText>
        <SvgText
          fill="#DAE86A"
          fontSize={11}
          fontWeight="700"
          x={218}
          y={20}
        >
          With Forge
        </SvgText>
      </Svg>
      <Text className="text-center text-xs text-muted/30">Illustrative.</Text>
    </View>
  );
}

const WITHOUT = [
  "Same routine every week",
  "Guessing your weights",
  "No idea if you hit a PR",
];

const WITH = [
  "Workouts built from your recent sessions",
  "A target for every lift",
  "PRs tracked automatically",
];

export function PlateauVisual() {
  return (
    <View className="flex-row gap-3">
      <View className="flex-1 rounded-3xl border border-white/5 bg-card-background p-4">
        <View className="mb-4 h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
          <Feather color="#F87171" name="x" size={16} />
        </View>
        <Text className="mb-3 text-sm font-semibold text-white">
          Without Forge
        </Text>
        {WITHOUT.map((item) => (
          <View className="mb-3 flex-row" key={item}>
            <Feather color="#6B7280" name="minus" size={14} />
            <Text className="ml-2 flex-1 text-xs leading-5 text-muted/50">
              {item}
            </Text>
          </View>
        ))}
      </View>

      <View className="flex-1 rounded-3xl border border-primary/30 bg-primary/5 p-4">
        <View className="mb-4 h-8 w-8 items-center justify-center rounded-full bg-primary/20">
          <Feather color="#DAE86A" name="check" size={16} />
        </View>
        <Text className="mb-3 text-sm font-semibold text-white">
          With Forge
        </Text>
        {WITH.map((item) => (
          <View className="mb-3 flex-row" key={item}>
            <Feather color="#DAE86A" name="check" size={14} />
            <Text className="ml-2 flex-1 text-xs leading-5 text-muted/60">
              {item}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const PROGRESSION = [
  { lift: "Bench Press", start: "60 kg x 8", next: "70 kg x 8" },
  { lift: "Squat", start: "80 kg x 6", next: "90 kg x 6" },
  { lift: "Deadlift", start: "100 kg x 5", next: "110 kg x 5" },
];

export function ProgressionVisual() {
  return (
    <View className="rounded-3xl bg-card-background p-4">
      <View className="mb-3 flex-row justify-between px-1">
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted/40">
          Week 1
        </Text>
        <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
          Week 4
        </Text>
      </View>

      {PROGRESSION.map((row) => (
        <View
          className="mb-2 flex-row items-center justify-between rounded-2xl bg-muted/5 px-3 py-3"
          key={row.lift}
        >
          <Text className="flex-1 text-sm text-white">{row.lift}</Text>
          <Text className="w-24 text-right text-xs text-muted/50">
            {row.start}
          </Text>
          <Feather
            color="#DAE86A"
            name="arrow-right"
            size={14}
            style={{ marginHorizontal: 8 }}
          />
          <Text className="w-24 text-right text-xs font-semibold text-primary">
            {row.next}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function CoachVisual() {
  return (
    <View className="items-center justify-center rounded-3xl bg-card-background py-12">
      <View className="h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <Feather color="#DAE86A" name="trending-up" size={32} />
        </View>
      </View>
    </View>
  );
}

type WeekPlanStripProps = {
  week: WeekDayPlan[];
};

export function WeekPlanStrip({ week }: WeekPlanStripProps) {
  return (
    <View className="flex-row justify-between">
      {week.map((day) => (
        <View
          className={`items-center rounded-2xl border px-1.5 py-2 ${
            day.workoutLabel
              ? day.isActiveRest
                ? "border-primary/20 bg-primary/5"
                : "border-primary/30 bg-primary/10"
              : "border-muted/10 bg-muted/5"
          }`}
          key={day.dayIndex}
          style={{ width: 44 }}
        >
          <Text className="text-[10px] text-muted/40">{day.shortLabel}</Text>
          <Text
            className={`mt-1 text-[10px] font-semibold ${
              day.workoutLabel ? "text-primary" : "text-muted/25"
            }`}
            numberOfLines={1}
          >
            {day.workoutLabel ?? "-"}
          </Text>
        </View>
      ))}
    </View>
  );
}
