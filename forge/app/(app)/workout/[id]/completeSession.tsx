import {
  useGetAllWorkoutsQuery,
  useGetWorkoutSessionHistoryQuery,
} from "@/features/api";
import { formatDate, formatDuration } from "@/utils/formatDuration";
import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const bgImg = require("../../../../assets/images/app-images/complete-session-2.png");

export default function CompleteSession() {
  // STATE
  const [selected, setSelected] = useState("");

  // GET WORKOUT ID FROM ROUTE
  const { id } = useLocalSearchParams<{ id: string }>();

  const router = useRouter();

  // FETCH ALL WORKOUTS
  const { data: allWorkouts, isLoading: loadingWorkouts } =
    useGetAllWorkoutsQuery();

  const workout = allWorkouts?.find((w) => w.id === id);

  // FETCH WORKOUT SESSION HISTORY
  const {
    data: sessionHistory,
    isLoading,
    isError,
  } = useGetWorkoutSessionHistoryQuery();

  // FIND THE COMPLETED SESSION
  const completedSession = sessionHistory?.find((ws) => ws.workoutId === id);

  // GUARD AGAINST undefined sets — a session with no logged sets has sets: undefined
  const completedSets = completedSession?.sets ?? [];

  // GET EXERCISES AND THEIR COMPLETED SETS
  const completedExercise =
    workout?.exercises
      .map((exercise) => {
        const performedSets = completedSets.filter(
          (set) => set.exerciseId === exercise.id
        );

        return {
          ...exercise,
          completedSets: performedSets,
        };
      })
      .filter((exercise) => exercise.completedSets.length > 0) ?? [];

  // CALCULATE TOTAL VOLUME
  const totalVolume = completedSets.reduce((total, set) => {
    return total + set.weight * set.reps;
  }, 0);

  return (
    <ImageBackground source={bgImg} className="flex-1" resizeMode="cover">
      {/* DARK OVERLAY */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#0B0C0A",
          opacity: 0.8,
        }}
      />

      <SafeAreaView className="flex-1 px-5">
        {/* HEADER */}
        <View className="mt-4 items-center justify-center">
          <Text className="mb-4 text-2xl font-bold text-white">
            Workout Complete
          </Text>
        </View>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* WORKOUT IMAGE AND TROPHY CARD */}
          <View className="relative">
            <View className="h-[250px] w-full overflow-hidden rounded-3xl border border-primary/10">
              {workout?.image ? (
                <Image
                  source={{ uri: workout.image }}
                  resizeMode="cover"
                  className="h-full w-full"
                />
              ) : (
                <View className="h-full w-full items-center justify-center bg-background">
                  <FontAwesome5 name="dumbbell" size={35} color="#DAE86A" />
                </View>
              )}
            </View>

            {/* TROPHY CARD */}
            <View className="absolute bottom-[25px] left-1/2 z-10 h-[200px] w-[200px] -translate-x-1/2 items-center justify-center gap-3 rounded-3xl border border-primary/10 bg-background/90">
              <View className="rounded-full bg-primary p-5">
                <FontAwesome5 name="trophy" size={20} color="#0B0C0A" />
              </View>

              <Text className="text-center text-2xl font-bold text-white">
                {workout?.name ?? "Workout"}
              </Text>

              <Text className="text-center text-xs text-muted-2">
                {completedSession?.completedAt
                  ? formatDate(completedSession.completedAt)
                  : "-"}{" "}
                - {formatDuration(completedSession?.durationSeconds ?? 0)}
              </Text>

              <Text className="text-sm text-muted-2">
                {completedExercise.length} Exercises
              </Text>
            </View>
          </View>

          {/* SPACING BELOW TROPHY CARD */}
          <View className="h-[40px]" />

          {/* WORKOUT STATISTICS */}
          <BlurView
            intensity={50}
            tint="dark"
            className="mt-5 flex-row items-center justify-between rounded-3xl border border-primary/10 px-4 py-4"
          >
            {/* DURATION */}
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">
                {formatDuration(completedSession?.durationSeconds ?? 0)}
              </Text>
              <Text className="text-muted-2/50">Duration</Text>
            </View>

            {/* SETS */}
            <View className="flex-1">
              <Text className="text-xl font-bold text-primary">
                {completedSets.length ?? 0}
                <Text className="text-white"> / {workout?.totalSets ?? 0}</Text>
              </Text>
              <Text className="text-muted-2/50">Sets</Text>
            </View>

            {/* VOLUME */}
            <View className="flex-1">
              <Text className="text-xl font-bold text-primary">
                {totalVolume} kg
              </Text>
              <Text className="text-muted-2/50">Volume</Text>
            </View>
          </BlurView>

          {/* EXERCISE BREAKDOWN HEADER */}
          <View className="mt-6 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-white">
              Exercise Breakdown
            </Text>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(app)/(tabs)/progress",
                })
              }
              hitSlop={8}
            >
              <Text className="font-bold text-primary">View All Exercises</Text>
            </Pressable>
          </View>

          {/* COMPLETED EXERCISES if found*/}
          <View className="mt-4">
            {completedExercise.slice(0, 2).map((item) => (
              <View
                key={item.id}
                className="mb-3 overflow-hidden rounded-3xl border border-primary/10"
              >
                <BlurView intensity={100} tint="dark" className="px-4 py-4">
                  <Text className="font-semibold text-white">{item.name}</Text>

                  <Text className="mt-1 text-muted-2/50">
                    {item.completedSets.length} sets completed
                  </Text>

                  <View className="mt-3 flex-row flex-wrap gap-3">
                    {item.completedSets.map((set, idx) => (
                      <Text
                        key={`${item.id}-${idx}`}
                        className="text-sm text-muted-2/70"
                      >
                        {set.weight}kg x {set.reps}
                      </Text>
                    ))}
                  </View>
                </BlurView>
              </View>
            ))}

            {/* EMPTY STATE */}
            {!isLoading &&
              !loadingWorkouts &&
              completedExercise.length === 0 && (
                <View className="items-center rounded-3xl border border-primary/10 bg-background/50 px-4 py-8">
                  <FontAwesome5
                    name="clipboard-list"
                    size={28}
                    color="#DAE86A"
                  />
                  <Text className="mt-3 text-center text-white">
                    No completed exercises found.
                  </Text>
                </View>
              )}
          </View>
        </ScrollView>

        {/* FIXED BOTTOM BUTTONS */}
        <View className="pb-3 pt-2">
          {/* DONE BUTTON */}
          <Pressable
            onPress={() => router.replace("/(app)/(tabs)")}
            onPressIn={() => setSelected("done")}
            onPressOut={() => setSelected("")}
            disabled={selected !== "" && selected !== "done"}
            className={`h-[45px] w-full items-center justify-center rounded-full bg-primary ${
              selected === "done" ? "opacity-50" : "opacity-100"
            }`}
          >
            <Text>Done</Text>
          </Pressable>

          {/* VIEW PROGRESS BUTTON */}
          <Pressable
            onPress={() => router.replace("/(app)/(tabs)/progress")}
            onPressIn={() => setSelected("progress")}
            onPressOut={() => setSelected("")}
            disabled={selected !== "" && selected !== "progress"}
            className={`mt-3 h-[45px] w-full items-center justify-center rounded-full bg-primary ${
              selected === "progress" ? "opacity-50" : "opacity-100"
            }`}
          >
            <Text>View Progress</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
