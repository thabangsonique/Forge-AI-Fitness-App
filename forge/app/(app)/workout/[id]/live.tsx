import { useGetAllWorkoutsQuery } from "@/features/api";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

type WorkoutSession = {
  workoutId: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  sets: WorkoutSets;
};

type SetData = {
  weight: string;
  reps: string;
  completed: boolean;
};

type WorkoutSets = {
  [exerciseId: string]: {
    [setIndex: number]: SetData;
  };
};

export default function live() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: allWorkouts, isLoading: loadingWorkouts } =
    useGetAllWorkoutsQuery();

  const workout = allWorkouts?.find((w) => w.id === id);

  //STATES
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<WorkoutSets>({});

  const [selected, setSelected] = useState("");
  const [startedAt] = useState(new Date().toISOString());
  const [completedAt] = useState(new Date().toISOString());

  const totalExercises = workout?.exercises.length;

  const exerciseProgress =
    totalExercises && totalExercises > 0
      ? ((currentExerciseIndex + 1) / totalExercises) * 100
      : 0;

  const currentExercise = workout?.exercises[currentExerciseIndex];

  //function to toggle status.
  const toggleCompleSet = (exerciseId: string, setIndex: number) => {
    setSets((current) => ({
      //protect what already exists.
      ...current,
      //protect everything about this current exercise
      [exerciseId]: {
        ...current[exerciseId],

        [setIndex]: {
          weight: current[exerciseId]?.[setIndex].weight ?? "",
          reps: current[exerciseId]?.[setIndex].reps ?? "",
          completed: !(current[exerciseId]?.[setIndex].completed ?? false),
        },
      },
    }));

    console.log("NEW ADDED SET", sets);
  };

  const updateSets = (
    exerciseId: string,
    setIndex: number,
    field: string,
    value: string
  ) => {
    setSets((current) => ({
      ...current,

      [exerciseId]: {
        ...current[exerciseId],

        [setIndex]: {
          ...current[exerciseId]?.[setIndex],
          [field]: value,
          completed: current[exerciseId]?.[setIndex]?.completed ?? false,
        },
      },
    }));
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < (totalExercises ?? 0) - 1) {
      setCurrentExerciseIndex((current) => current + 1);
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((current) => current - 1);
    }
  };

  const handleFinishWorkout = () => {
    const completedAt = new Date().toISOString();

    //calculate duration.
    const durationSeconds = Math.floor(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
    );

    //set payload structure for backend.
    const workoutSets = {
      workoutId: id,
      completedAt,
      startedAt,
      durationSeconds,
      sets,
    };
  };

  console.log("ALL SETS", workout?.exercises);
  return (
    <SafeAreaView className="flex-1 bg-background pt-5">
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={100}
        className="flex-1"
      >
        {/* top header counter + timer*/}
        <View className="flex-row items-center justify-between px-5">
          <Text className=" text-white">{workout?.name}</Text>

          <Text className="text-primary">Leave</Text>
        </View>
        <Text className="ml-5 mt-4 text-lg text-primary">00:02:46</Text>

        {/* image of the exercise */}
        <View className="mt-2 overflow-hidden rounded-3xl">
          <Image
            source={{ uri: workout?.image }}
            className=" h-[150px]"
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(11,12,10,0.9)"]}
            className="absolute inset-0"
          />
        </View>

        {/* header section */}
        <View className="mt-5 px-5 ">
          <Text className="text-muted-2">
            Exercise {currentExerciseIndex + 1} of {totalExercises}
          </Text>
        </View>

        <View className="mt-5 rounded-3xl  px-5">
          {/* exercise header */}
          <Text className="text-lg font-semibold text-white">
            {currentExercise?.name}
          </Text>
          <View className="mt-2 flex-row">
            <Text className="text-muted-2/50">
              {currentExercise?.sets} sets -
            </Text>
            <Text className="text-muted-2/50">
              {currentExercise?.reps} reps -{" "}
            </Text>
            <Text className="text-muted-2/50">
              {currentExercise?.restSeconds}s rest
            </Text>
          </View>

          {/* exercise table */}
          <View className="mt-5 flex-row justify-center">
            <Text className="w-[25%] text-center text-muted-2/50">SET</Text>
            <Text className="w-[25%] text-center text-muted-2/50">WEIGHT</Text>
            <Text className="w-[25%] text-center text-muted-2/50">REPS</Text>
            <Text className="w-[25%] text-center text-muted-2/50">STATUS</Text>
          </View>

          {/* map through set entries */}
          <View>
            {Array.from({ length: currentExercise?.sets ?? 0 }).map(
              (set, idx) => {
                const exerciseId = currentExercise?.id;
                const currentSet =
                  exerciseId !== undefined
                    ? sets[exerciseId]?.[idx]
                    : undefined;
                return (
                  <View key={idx} className=" mt-5 flex-row px-8">
                    <Text className="w-[25%] text-white">{idx + 1}</Text>
                    <TextInput
                      placeholder="20kg"
                      value={currentSet?.weight ?? ""}
                      onChangeText={(value) => {
                        if (exerciseId !== undefined)
                          updateSets(exerciseId, idx, "weight", value);
                      }}

                      keyboardType="numeric"
                      className="mr-[20px] w-[60px] rounded-2xl bg-muted-2/20 text-center text-white placeholder:text-muted-2/50"
                      selectionColor="#dae86aff"
                    />
                    <TextInput
                      placeholder="20kg"
                      value={currentSet?.reps ?? ""}
                      onChangeText={(value) => {
                        if (exerciseId !== undefined)
                          updateSets(exerciseId, idx, "reps", value);
                      }}
                      keyboardType="numeric"
                      className="mr-[30px] w-[60px] rounded-2xl  bg-muted-2/20 text-center text-white placeholder:text-muted-2/50"
                      selectionColor="#dae86aff"
                    />
                    {/* status */}
                    <Pressable
                      onPress={() => {
                        if (!exerciseId) return;
                        toggleCompleSet(exerciseId, idx);
                      }}
                      className={` ${currentSet?.completed ? "border-transparent bg-primary " : "border border-muted-2"} h-8 w-8 items-center justify-center rounded-full `}
                    >
                      {currentSet?.completed && (
                        <Feather name="check" size={18} color="#000" />
                      )}
                    </Pressable>
                  </View>
                );
              }
            )}
          </View>
        </View>

        {/* Next + Prev section */}
        <View className="mt-4 flex-row items-center justify-between px-5">
          <Pressable
            onPress={handlePrevExercise}
            onPressIn={() => setSelected("back")}
            onPressOut={() => setSelected("")}
            className={`${selected === "back" ? "opacity-50" : "opacity-100"} h-[50px] w-[50px] items-center justify-center rounded-full border border-primary/50 bg-primary/5`}
          >
            <Feather name="chevron-left" size={20} color="#fff" />
          </Pressable>

          {/* corusel */}
          <View className="flex-1 flex-row items-center justify-center ">
            {/* bar line */}
            <View className="mt-3 h-2 w-[100px] rounded-full border border-primary/10">
              <View
                style={{ width: `${exerciseProgress}%` }}

                className="h-2 rounded-full bg-primary"
              />
            </View>
          </View>

          <Pressable
            onPress={handleNextExercise}
            onPressIn={() => setSelected("next")}
            onPressOut={() => setSelected("")}
            className={`${selected === "next" ? "opacity-50" : "opacity-100"} h-[50px] w-[50px] items-center justify-center rounded-full border border-primary/50 bg-primary/5`}
          >
            <Feather name="chevron-right" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* button */}
        <View className="w-full px-5">
          <Pressable className="mt-4 h-[40px] w-full items-center justify-center rounded-full bg-primary">
            <Text>Finish Workout</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
