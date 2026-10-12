import {
  useGetAllWorkoutsQuery,
  useGetWorkoutSessionHistoryQuery,
  type TotalWeeklyVolume,
} from "@/features/api";
import { formatMinutes } from "@/utils/formatDuration";
import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { BarChart } from "react-native-gifted-charts";

interface volumeScreenProps {
  weeklyVolume: TotalWeeklyVolume | undefined;
  isLoading: boolean;
  isError: boolean;
}

const PRIMARY_COLOR = "#D8FF00";
const MUTED_COLOR = "#A3A3A3";
export default function VolumeScreen({
  weeklyVolume,
  isLoading,
  isError,
}: volumeScreenProps) {
  const {
    data: sessionHistory,
    isLoading: sessionsLoading,
    isFetching: sessionsFetching,
    isError: sessionsError,
    isSuccess: sessionsSuccess,
    error: sessionsRequestError,
    status: sessionsStatus,
  } = useGetWorkoutSessionHistoryQuery();

  const {
    data: allWorkouts,
    isLoading: loadingWorkouts,
    isError: errorWorkouts,
  } = useGetAllWorkoutsQuery();

  const completedWorkouts = sessionHistory?.map((session) => {
    const workout = allWorkouts?.find((w) => w.id === session.workoutId);

    return {
      ...session,
      exerciseCount: workout?.exercises.length ?? 0,
    };
  });

  console.log("completed sessions:", completedWorkouts?.[0].sets);

  //for loading sessions
  const dataRendar = () => {
    if (sessionsLoading) {
      return (
        <View className="items-center justify-center p-5">
          <ActivityIndicator color={PRIMARY_COLOR} />
          <Text className="mt-3 text-muted-2">
            Loading completed sessions...
          </Text>
        </View>
      );
    }

    if (sessionsError) {
      return (
        <Text className="text-center text-white">
          Failed to load completed sessions.
        </Text>
      );
    }

    return (
      <Text className="text-center text-muted-2">
        No completed sessions yet.
      </Text>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-5">
        <ActivityIndicator color={PRIMARY_COLOR} size="large" />

        <Text className="mt-3 text-muted-2">Loading your progress...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-white">
          Failed to load volume data. Please try again.
        </Text>
      </View>
    );
  }

  if (!weeklyVolume) {
    return (
      <View className="items-center justify-center p-5">
        <Text className="text-white">
          Failed to load volume data. Please try again.
        </Text>
      </View>
    );
  }

  //max volume.
  const maxVolume = Math.max(
    0,
    ...weeklyVolume.dailyVolumes.map((day) => day.volume)
  );

  //reshape chart data.
  const chartData = weeklyVolume.dailyVolumes.map((day) => {
    const weekday = new Date(day.date).getUTCDay();

    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return {
      value: day.volume,
      label: labels[weekday],
      frontColor: PRIMARY_COLOR,
    };
  });

  console.log("here is the weekly volume data", weeklyVolume);
  // max chart height
  const maxChartHeight =
    maxVolume > 0 ? Math.ceil((maxVolume * 1.2) / 1000) * 1000 : 1000;

  const exerciseVolumes = completedWorkouts?.map((workout) => {
    const volume = (workout?.sets ?? []).reduce((setTotal, set) => {
      return setTotal + set.reps * set.weight;
    }, 0);

    return {
      ...workout,
      totalVolume: volume,
    };
  });

  return (
    <FlatList
      className="flex-1"
      data={completedWorkouts?.slice(0, 4) ?? []}
      keyExtractor={(item) => `${item.workoutId}-${item.completedAt}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: 24,
      }}
      ListHeaderComponent={
        <View>
          {/* stat cards */}
          <View className="mb-4 mt-4 flex-row items-center justify-center gap-2">
            {/* workouts */}
            <View className="h-[100px] w-[100px] items-center justify-center gap-2 rounded-3xl rounded-3xl bg-muted/10">
              <Text className=" text-muted-2">Workouts</Text>
              <Text className="text-lg font-bold text-white">3</Text>
              <Text className="text-sm text-muted-2">Total workouts</Text>
            </View>
            {/* time */}
            <View className="h-[100px] w-[100px] items-center  justify-center  gap-2 rounded-3xl bg-muted/10 px-4 py-3">
              <Text className=" text-muted-2">Time</Text>
              <Text className="text-lg font-bold text-white">2h 24m</Text>
              <Text className="text-sm text-muted-2">Activity Log</Text>
            </View>
            {/* volume lifted */}
            <View className="rounded- h-[100px] w-[100px]  items-center  justify-center gap-2 rounded-3xl bg-muted/10 px-4 py-3">
              <Text className=" text-muted-2">Volume</Text>
              <Text className="text-lg font-bold text-white">3</Text>
              <Text className="text-sm text-muted-2">Total Lifted</Text>
            </View>
          </View>

          {/* Weekly volume chart card */}
          <View className="rounded-3xl bg-muted/10 px-3 py-4">
            <Text className="text-primary">Weekly Load Distribution</Text>

            {/* Total weekly volume */}
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm text-muted-2">
                Total Lifted Weekly Volume
              </Text>

              <Text className="text-white">
                <Text className="font-bold text-primary">
                  {weeklyVolume.totalWeeklyVolume.toLocaleString("en-US")}
                </Text>{" "}
                kg
              </Text>
            </View>

            {/* Bar chart */}
            <View className="mt-4">
              <BarChart
                data={chartData}
                height={180}
                barWidth={18}
                spacing={18}
                barBorderRadius={5}
                frontColor={PRIMARY_COLOR}
                hideRules
                yAxisThickness={0}
                xAxisThickness={0}
                xAxisLabelTextStyle={{
                  color: MUTED_COLOR,
                  fontSize: 11,
                }}
                yAxisTextStyle={{
                  color: MUTED_COLOR,
                  fontSize: 11,
                }}
                noOfSections={4}
                maxValue={maxChartHeight}
              />
            </View>
          </View>

          {/* Recent sessions heading */}
          <View className="mb-4 mt-6 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-white">
                Recent Sessions
              </Text>

              <Text className="mt-1 text-sm text-muted-2">
                Your last four completed workouts
              </Text>
            </View>

            {/* right side */}
            <Pressable>
              <Text className="font-bold text-primary">View All</Text>
            </Pressable>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        console.log("here is the item", item);

        const totalVolume = (item?.sets).reduce((total, set) => {
          return total + set.reps * set.weight;
        }, 0);
        return (
          <View className="mb-3 flex-row items-center justify-between rounded-3xl bg-muted/10 p-5">
            {/* left side */}
            <View>
              <Text className="text-white">{item.workoutName}</Text>
              <Text className="mt-2 text-sm text-muted-2">
                {new Date(item.completedAt).toLocaleDateString("en-US", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {"  "}- {"  "}
                {formatMinutes(item.durationSeconds)}
              </Text>
            </View>

            {/* right side */}
            <View>
              <Text className="text-primary">{totalVolume} kg</Text>
              <Text className="text-white">{item.exerciseCount} Exercises</Text>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View className="rounded-3xl bg-muted/10 p-5">{dataRendar()}</View>
      }
    />
  );
}
