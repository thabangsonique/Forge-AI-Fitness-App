import AlertModal from "@/components/ui/modals/alertModal";
import {
  useCreateWorkoutSessionMutation,
  useGetAllWorkoutsQuery,
} from "@/features/api";
import { formatElapsedTime } from "@/utils/formatDuration";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

type WorkoutSet = {
  exerciseId: string;
  setNumber: number;
  weight: string;
  reps: string;
};

type WorkoutSession = {
  workoutId: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  sets: WorkoutSet[];
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
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: allWorkouts, isLoading: loadingWorkouts } =
    useGetAllWorkoutsQuery();

  const workout = allWorkouts?.find((w) => w.id === id);

  console.log("exercise images", workout?.exercises);

  //STATES
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<WorkoutSets>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [activeRest, setActiveRest] = useState<{
    exerciseId: string;
    setIndex: number;
  } | null>(null);
  const [isRestPaused, setIsRestPaused] = useState(false);
  const repsRefs = useRef<{ [key: string]: TextInput | null }>({});
  const exerciseCarouselRef = useRef<ScrollView>(null);
  const [restDuration, setRestDuration] = useState(0);
  const [selected, setSelected] = useState("");
  const [startedAt] = useState(new Date().toISOString());
  const [completedAt] = useState(new Date().toISOString());
  const [incompleteAlert, setIncompleteAlert] = useState(false);

  //TIMER SCROLLVIEW
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  //EXERCISE IMAGE SCROLLVIEW
  useEffect(() => {
    const thumbnailWidth = 72;
    const gap = 12;

    exerciseCarouselRef.current?.scrollTo({
      x: Math.max(0, currentExerciseIndex * (thumbnailWidth + gap)),
      animated: true,
    });
  }, [currentExerciseIndex]);

  //CALCULATE WORKOUT TIMER
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const started = new Date(startedAt).getTime();
      const diffInSecconds = Math.floor((now - started) / 1000);

      setElapsedSeconds(diffInSecconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  //rest set timer
  useEffect(() => {
    if (!activeRest || restSecondsRemaining <= 0) {
      return; // dont start timer
    }

    //starting the timer
    const interval = setInterval(() => {
      setRestSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRest, restSecondsRemaining]);

  //QUERIES.
  const [createWorkoutSession, { isLoading: creatingSession }] =
    useCreateWorkoutSessionMutation();

  const totalExercises = workout?.exercises.length;

  const exerciseProgress =
    totalExercises && totalExercises > 0
      ? ((currentExerciseIndex + 1) / totalExercises) * 100
      : 0;

  const currentExercise = workout?.exercises[currentExerciseIndex];

  //function to toggle status.
  const handleCompletedSet = (exerciseId: string, setIndex: number) => {
    //check if set already comopleted.

    //fetch current set we are resting from.
    const currentSet = sets[exerciseId]?.[setIndex];

    if (currentSet?.completed) {
      setSets((current) => ({
        ...current,
        [exerciseId]: {
          ...current[exerciseId],
          [setIndex]: {
            ...current[exerciseId]?.[setIndex],
            completed: false,
          },
        },
      }));

      // reset rest timer
      if (
        activeRest?.exerciseId === exerciseId &&
        activeRest?.setIndex === setIndex
      ) {
        setActiveRest(null);
        setRestSecondsRemaining(0);
        setRestDuration(0);
      }
      return;
    }

    //fetch exercise for restSeconds info
    const exercise = workout?.exercises.find((ex) => ex.id === exerciseId);

    if (!exercise) {
      return;
    }

    //fetch weight and reps values.
    const weight = currentSet?.weight?.trim() ?? "";
    const reps = currentSet?.reps?.trim() ?? "";

    if (restSecondsRemaining > 0) {
      ToastAndroid.show(
        "Still resting! Wait it out or hit 'Skip rest' to keep going.",
        ToastAndroid.LONG
      );
    }

    if (!weight || !reps) {
      ToastAndroid.show(
        "Enter weight and reps before completing the set.",
        ToastAndroid.SHORT
      );
      return;
    }

    //set the new set(update the new set)

    setSets((current) => ({
      ...current,
      [exerciseId]: {
        ...current[exerciseId],
        [setIndex]: {
          weight,
          reps,
          completed: true,
        },
      },
    }));

    (setActiveRest({ exerciseId, setIndex }),
      setRestSecondsRemaining(exercise.restSeconds));
    setRestDuration(exercise.restSeconds);
  };

  //REST PROGRESS.
  const restProgress =
    restDuration > 0
      ? ((restDuration - restSecondsRemaining) / restDuration) * 100
      : 0;

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

  //CHECK TOTAL SETS COMPLETED.
  //Total sets for all exercises.
  const totalSetsRequired = workout?.exercises.reduce((total, exercise) => {
    return total + exercise.sets;
  }, 0);

  const completedSetsCount = Object.values(sets).reduce(
    (total, exerciseSets) => {
      const completedInExercise = Object.values(exerciseSets).filter(
        (setData) => setData.completed
      ).length;
      return total + completedInExercise;
    },
    0
  );
  const handleFinishWorkout = async () => {
    //alert for incompleted sets
    if (totalSetsRequired !== completedSetsCount) {
      setIncompleteAlert(true);
      return;
    }

    const completedAt = new Date().toISOString();

    //calculate duration.
    const durationSeconds = Math.floor(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000
    );

    //convert object into array.
    const flatSets = Object.entries(sets).flatMap(([exerciseId, setMap]) =>
      //go a level deeper for the set data
      Object.entries(setMap).map(([setIndex, setData]) => ({
        exerciseId,
        setNumber: Number(setIndex),
        weight: setData.weight,
        reps: setData.reps,
      }))
    );

    //set payload structure for backend.
    const workoutSets = {
      workoutId: id,
      completedAt,
      startedAt,
      durationSeconds,
      sets: flatSets,
    };

    try {
      await createWorkoutSession(workoutSets).unwrap();

      ToastAndroid.show(
        "Workout completed successfully!",
        ToastAndroid.SHORT //how long the toast stays on the screen.
      );
    } catch (error) {
      console.log("Failed to create workout session", error);

      ToastAndroid.show(
        "Failed to create workout session.Please try again.",
        ToastAndroid.SHORT
      );
    }

    //redirect to workout session created page.
    router.replace(`/(app)/workout/${id}/completeSession`);
  };

  console.log("ALL SETS", workout?.exercises);
  ape: console.log(JSON.stringify(workout?.exercises?.[0], null, 2));
  console.log("exersice image,:", currentExercise?.image);
  return (
    <SafeAreaView className="flex-1 bg-background pb-5 pt-5">
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={100}
        className="flex-1"
      >
        {/* top header counter + timer*/}
        <View className="flex-row items-center justify-between px-5">
          <Text className=" text-white">{workout?.name}</Text>

          <Pressable
            onPress={() => {
              setSelected("leave");
              handleFinishWorkout();
            }}
            className="rounded-3xl bg-primary/10 px-5 py-3"
          >
            <Text className="font-bold text-primary">Leave</Text>
          </Pressable>
        </View>

        <View className="ml-5 mt-4 flex-row items-center gap-2">
          <Feather name="clock" size={20} color="#ffffff" />
          <Text className="text-lg text-white">
            {formatElapsedTime(elapsedSeconds)}
          </Text>
        </View>

        {/* image of the exercise */}
        <View className="mt-2 overflow-hidden rounded-3xl">
          <Image
            source={{
              uri: currentExercise?.image ?? workout?.image ?? undefined,
            }}
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

        {/* exercise curosel */}
        <ScrollView
          ref={exerciseCarouselRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 8,
            gap: 12,
            alignItems: "center",
          }}
        >
          {workout?.exercises.map((exercise, index) => {
            const isCurrentExercise = index === currentExerciseIndex;
            const imageUri = exercise.image?.trim();

            return (
              <View
                key={exercise.workoutExerciseId ?? exercise.id}
                className={`${isCurrentExercise ? "border-primary" : "border-transparent"} h-20  w-20 overflow-hidden rounded-3xl border`}
              >
                <Image
                  source={
                    imageUri
                      ? { uri: imageUri }
                      : require("../../../../assets/images/app-images/logo.png")
                  }
                  className="h-full w-full"
                  resizeMode="cover"
                  onLoad={() => {
                    console.log("IMAGE LOADED:", exercise.name);
                  }}
                  onError={(event) => {
                    console.log("IMAGE FAILED:", exercise.name);
                    console.log("IMAGE URL:", JSON.stringify(imageUri));
                    console.log("IMAGE ERROR:", event.nativeEvent.error);
                  }}
                />
              </View>
            );
          })}
        </ScrollView>

        <View className="mt-5 rounded-3xl  px-5">
          {/* exercise header */}
          <View>
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
                    {/* weight */}
                    <TextInput
                      placeholder="20kg"
                      value={currentSet?.weight ?? ""}
                      editable={
                        !currentSet?.completed && restSecondsRemaining === 0
                      }
                      onChangeText={(value) => {
                        if (exerciseId !== undefined)
                          updateSets(exerciseId, idx, "weight", value);
                      }}

                      keyboardType="numeric"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        if (exerciseId !== undefined) {
                          const key = `${exerciseId}-${idx}`;
                          repsRefs.current[key]?.focus();
                        }
                      }}
                      className={`mr-[20px] w-[60px] rounded-2xl text-center text-white ${
                        currentSet?.completed || restSecondsRemaining > 0
                          ? "bg-muted-2/10 opacity-40"
                          : "bg-muted-2/20"
                      }`}
                      selectionColor="#dae86aff"
                    />
                    {/* reps */}
                    <TextInput
                      ref={(el) => {
                        if (exerciseId !== undefined) {
                          repsRefs.current[`${exerciseId}-${idx}`] = el;
                        }
                      }}
                      placeholder="20kg"
                      value={currentSet?.reps ?? ""}
                      editable={
                        !currentSet?.completed && restSecondsRemaining === 0
                      }
                      onChangeText={(value) => {
                        if (exerciseId !== undefined)
                          updateSets(exerciseId, idx, "reps", value);
                      }}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        if (exerciseId !== undefined)
                          handleCompletedSet(exerciseId, idx);
                      }}
                      className={`mr-[20px] w-[60px] rounded-2xl text-center text-white ${
                        currentSet?.completed || restSecondsRemaining > 0
                          ? "bg-muted-2/10 opacity-40"
                          : "bg-muted-2/20"
                      }`}
                      selectionColor="#dae86aff"
                    />
                    {/* status */}
                    <Pressable
                      onPress={() => {
                        if (!exerciseId) return;
                        handleCompletedSet(exerciseId, idx);
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

        {/* //REST TIMER */}

        {restSecondsRemaining > 0 && (
          <View
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;

              scrollViewRef.current?.scrollToPosition(
                0,
                Math.max(0, y - 30),
                true
              );
            }}
            className="mx-5 mt-5 rounded-3xl border border-primary/10 px-4 py-4"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-muted/70">REST TIMER</Text>

                <Text className="mt-1 text-white">
                  {restSecondsRemaining > 0
                    ? "Recover for your next set"
                    : "Rest complete"}
                </Text>
              </View>

              {/* Icon */}
              <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Feather name="clock" size={20} color="#dae86aff" />
              </View>
            </View>

            {/* Countdown */}
            <View className="mt-5 items-center justify-center">
              <Text className="text-4xl font-bold text-white">
                {formatElapsedTime(restSecondsRemaining)}
              </Text>

              <Text className="mt-1 text-muted/70">Remaining</Text>
            </View>

            {/* Progress bar */}
            <View className="mt-5 h-2 overflow-hidden rounded-full bg-muted-2/20">
              <View
                style={{ width: `${restProgress}%` }}
                className="h-full rounded-full bg-primary"
              />
            </View>

            {/* Timer controls */}
            <View className="mt-5 flex-row gap-3">
              <Pressable
                onPress={() => {
                  setActiveRest(null);
                  setRestSecondsRemaining(0);
                  setRestDuration(0);
                }}
                className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-primary/30"
              >
                <Feather
                  name={restSecondsRemaining > 0 ? "skip-forward" : "check"}
                  size={16}
                  color="#dae86aff"
                />

                <Text className="font-semibold text-white">
                  {restSecondsRemaining > 0 ? "Skip rest" : "Done"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

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
          <Pressable
            onPress={handleFinishWorkout}
            disabled={creatingSession}

            className="mt-4 h-[40px] w-full items-center justify-center rounded-full bg-primary"
          >
            {creatingSession ? (
              <ActivityIndicator size={20} />
            ) : (
              <Text>Finish Workout</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAwareScrollView>

      {/* MODAL DISPLAY */}
      {incompleteAlert && (
        <AlertModal
          visible={incompleteAlert}
          setIncompleteAlert={setIncompleteAlert}
          totalSetsRequired={totalSetsRequired}
          completedSetsCount={completedSetsCount}
          handleFinishWorkout={handleFinishWorkout}
          selected={selected}
          setSelected={setSelected}
        />
      )}
    </SafeAreaView>
  );
}
