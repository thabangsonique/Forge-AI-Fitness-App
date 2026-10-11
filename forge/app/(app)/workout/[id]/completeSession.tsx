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
  FlatList,
  Image,
  ImageBackground,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const bgImg = require("../../../../assets/images/app-images/complete-session-2.png");

export default function CompleteSession() {
  //STATES
  const [selected, setSelected] = useState("");

  const { id } = useLocalSearchParams<{ id: string }>();

  const router = useRouter();

  //fetch workouts
  const { data: allWorkouts, isLoading: loadingWorkouts } =
    useGetAllWorkoutsQuery();

  const workout = allWorkouts?.find((w) => w.id === id);

  console.log("HERE IS THE CURRENT WORKOUT", workout);
  const {
    data: sessionHistory,
    isLoading,
    isError,
  } = useGetWorkoutSessionHistoryQuery();

  //current completed workout.
  const completedSession = sessionHistory?.find((ws) => ws.workoutId === id);

  //fetch the all the exercises that the user performed.
  const completedExercise =
    workout?.exercises
      .map((exercise) => {
        const performedSets =
          completedSession?.sets.filter(
            (set) => set.exerciseId === exercise.id
          ) ?? [];

        return {
          ...exercise, //exercise names exist here.
          completedSets: performedSets,
        };
      })
      .filter((exercise) => exercise.completedSets.length > 0) ?? [];

  console.log("Actual completed exercise", completedExercise);
  // console.log(
  //   "HERE IS THE CURRENT COMPLETED SESSION SEt",
  //   completedSession?.sets
  // );

  const totalVolume = completedSession?.sets.reduce((total, set) => {
    return total + set.weight * set.reps;
  }, 0);

  // console.log("COMPLETE PAGE SESSION HISTORY", sessionHistory);
  console.log("current completed exercises", completedSession);

  return (
    <ImageBackground source={bgImg} className="flex-1" resizeMode="cover">
      {/* Dark overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#0B0C0A",
          opacity: 0.8,
          zIndex: 10,
        }}
      />

      <SafeAreaView className="flex-1 px-5" style={{ zIndex: 20 }}>
        {/* Header */}
        <View className="mt-10 items-center justify-center">
          <Text className="mb-4 text-2xl font-bold text-white">
            Workout Complete
          </Text>

          {/* image */}
          <View className="h-[250px] w-full overflow-hidden rounded-3xl border border-primary/10">
            <Image
              source={{ uri: workout?.image }}
              resizeMode="cover"
              className="h-full w-full"
            />
          </View>

          <View className="absolute bottom-[30px] z-20 h-[200px] w-[200px] items-center justify-center gap-3 rounded-3xl bg-background/90">
            <View className="rounded-full bg-primary p-5">
              <FontAwesome5 name="trophy" size={20} />
            </View>

            <Text className="text-2xl font-bold text-white">Push Day</Text>
            <Text className="text-muted-2">
              {completedSession?.completedAt
                ? formatDate(completedSession?.completedAt)
                : "-"}{" "}
              - {formatDuration(completedSession?.durationSeconds ?? 0)}
            </Text>
            <Text className="text-muted-2">3 Exercises</Text>
          </View>
        </View>

        {/* duration section */}
        <BlurView
          intensity={50}
          tint="dark"
          className="mt-5 flex-row items-center justify-between rounded-3xl border border-primary/10 px-4 py-4 backdrop-blur"
        >
          {/* DURATION */}
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">
              {formatDuration(completedSession?.durationSeconds ?? 0)}
            </Text>
            <Text className="text-muted-2/50">Duration</Text>
          </View>
          {/* sets */}
          <View className="flex-1">
            <Text className="text-xl font-bold text-primary">
              {completedSession?.sets.length}
              <Text className="text-white"> / {workout?.totalSets}</Text>
            </Text>
            <Text className="text-muted-2/50">Sets</Text>
          </View>
          {/* volume */}
          <View>
            <Text className="text-xl font-bold text-primary">
              {totalVolume} kg
            </Text>
            <Text className="text-muted-2/50">Volume</Text>
          </View>
        </BlurView>

        {/* exercise breakdown */}
        <View className="flex-row items-center justify-between">
          <Text className="mt-3 text-white">Exercise Breakdown</Text>
          <Text className="mt-3 text-white">
            {completedExercise.length} Exercise(s)
          </Text>
        </View>

        <View className="mt-4">
          {/* exercise flatlist */}
          <FlatList
            data={completedExercise}
            keyExtractor={(item) => item.id}
            ItemSeparatorComponent={() => <View className="h-3" />}
            renderItem={({ item }) => (
              <View className="overflow-hidden rounded-3xl">
                <BlurView intensity={100} tint="dark" className="px-4 py-3">
                  <Text className="text-white ">{item.name}</Text>
                  <Text className="text-muted-2/40">
                    {item.completedSets.length} sets
                  </Text>
                  <View className="flex-row gap-3">
                    {item.completedSets.map((set, idx) => (
                      <Text className=" text-sm text-muted-2/40">
                        {set.weight}kg x {set.reps}
                      </Text>
                    ))}
                  </View>
                </BlurView>
              </View>
            )}
          />
        </View>

        {/* return user to the home screen + view progress */}
        <Pressable
          onPress={() => router.replace("/(app)/(tabs)")}
          onPressIn={() => setSelected("done")}
          onPressOut={() => setSelected("")}
          disabled={selected === "done"}
          className={`${selected === "done" ? "opacity-50" : "opacity-100"} mt-[60px] h-[40px] w-full items-center justify-center rounded-full bg-primary`}
        >
          <Text>Done</Text>
        </Pressable>
        <Pressable
          onPressIn={() => setSelected("progress")}
          onPressOut={() => setSelected("")}
          disabled={selected === "progress"}
          className={`${selected === "progress" ? "opacity-50" : "opacity-100"} mt-4 h-[40px] w-full items-center justify-center rounded-full bg-primary`}
        >
          <Text>View Progress</Text>
        </Pressable>
      </SafeAreaView>
    </ImageBackground>
  );
}
