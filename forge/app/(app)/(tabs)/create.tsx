import {
  CreateWorkoutRequest,
  Exercise,
  useCreateWorkoutMutation,
  useGetAllWorkoutsQuery,
  useGetExercisesQuery,
  useUpdateWorkoutMutation,
} from "@/features/api";
import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { BlurView } from "expo-blur";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import {
  FlatList,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { runOnJS } from "react-native-worklets";

type SelectedExercise = {
  exerciseId: string;
  name: string;
  muscle: string | null;
  reps: number;
  sets: number;
  restSeconds: number;
};

const WORKOUT_TYPES = [
  "Push",
  "Pull",
  "Arms",
  "Legs",
  "Shoulders",
  "Quads",
  "Push-Pull",
  "Full Body",
] as const;

export default function Create() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const router = useRouter();
  const isEditing = Boolean(editId);

  // STATES
  const [form, setForm] = useState<CreateWorkoutRequest>({
    name: "",
    description: "",
    category: "",

    exercises: [],
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [isPressed, setIsPressed] = useState("");
  const [scheduledDate, setSheduledDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isMissing, setIsMissing] = useState(false);

  //DATE REFORMAT
  const atLocalMidnight = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    return d;
  };

  //ANIAMTED GESTURE HANDLAR
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      if (translateY.value > 350) {
        runOnJS(setModalOpen)(false);
        translateY.value = 0;
      } else {
        translateY.value = withSpring(0);
      }
    });

  //animated style.
  const animatedSheet = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
      ],
    };
  });

  // QUERIES
  const {
    data: AllExercises,
    isLoading: loadingExercises,
    isError: errorExercises,
  } = useGetExercisesQuery();

  const [
    createWorkout,
    { isLoading: creatingWorkout, isError: errorCreating },
  ] = useCreateWorkoutMutation();

  const [updateWorkout, { isLoading: updatingWorkout }] =
    useUpdateWorkoutMutation();

  const { data: allWorkouts } = useGetAllWorkoutsQuery();

  const isSaving = creatingWorkout || updatingWorkout;

  const workoutNameRef = useRef<TextInput>(null);

  //PREFILL THE FORM WHEN EDITING AN EXISTING WORKOUT.
  useEffect(() => {
    if (!editId || !allWorkouts) return;

    const workout = allWorkouts.find((w) => w.id === editId);

    if (!workout) return;

    setForm({
      name: workout.name,
      description: workout.description ?? "",
      category: workout.workoutCategory ?? "",
      exercises: workout.exercises.map((ex) => ({
        exerciseId: ex.id,
        name: ex.name,
        muscle: ex.muscle,
        reps: ex.reps,
        sets: ex.sets,
        restSeconds: ex.restSeconds,
      })),
    });

    setSheduledDate(null);
  }, [editId, allWorkouts]);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      category: "",
      exercises: [],
    });

    setSheduledDate(null);
    setShowDatePicker(false);
  };

  const cancelEditing = () => {
    resetForm();
    router.setParams({ editId: undefined });
  };

  const DEFAULTS = { sets: 3, reps: 10, restSeconds: 60 };

  const PRESS_RIPPLE = { color: "rgba(0, 0, 0, 0.28)" };
  const pressStyle = ({ pressed }: { pressed: boolean }) => ({
    opacity: pressed ? 0.6 : 1,
  });

  //function to add exercise
  const addExercise = (exercise: Exercise) => {
    // console.log("SELECTED EXERCISE", exercise);
    // console.log("SELECTED EXERCISE MUSCLE", exercise.muscle);
    if (form.exercises.some((ex) => ex.exerciseId === exercise.id)) {
      ToastAndroid.show(
        "Exercise already added to the workout.",
        ToastAndroid.SHORT
      );
      return;
    }

    //if exercise doesnt already exist.
    setForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          exerciseId: exercise.id,
          name: exercise.name,
          muscle: exercise.muscle,
          ...DEFAULTS,
        },
      ],
    }));

    setModalOpen(false);
  };

  //function to bump up set values.
  const bump = (
    exerciseId: string,
    delta: number,
    field: "sets" | "reps" | "restSeconds"
  ) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.exerciseId === exerciseId
          ? { ...ex, [field]: Math.max(1, ex[field] + delta) }
          : ex
      ),
    }));
  };
  //remove exercise.
  const removeExercise = (exerciseId: string) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.exerciseId !== exerciseId),
    }));
  };

  const handleDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "set" && selected) {
      setSheduledDate(atLocalMidnight(selected));
    }
  };

  //function to save workout -backend.
  const saveWorkout = async () => {
    try {
      const payload: CreateWorkoutRequest = {
        ...form,
        scheduledDate: scheduledDate
          ? atLocalMidnight(scheduledDate).toISOString()
          : undefined,
      };

      if (!form.name.trim()) {
        setIsMissing(true);
        workoutNameRef.current?.focus();
        return;
      }

      if (form.exercises.length === 0) {
        Alert.alert("Missing exercises", "At least one exercise is required.");
        return;
      }

      if (isEditing && editId) {
        await updateWorkout({ id: editId, ...payload }).unwrap();

        Alert.alert("Success", "Workout updated successfully");

        resetForm();
        setIsMissing(false);
        router.setParams({ editId: undefined });
        router.back();

        return;
      }

      await createWorkout(payload).unwrap();

      // console.log("HERE IS THE WORKOUT CREATION", form);
      Alert.alert("Success", "Workout created successfully");
      setIsMissing(false);
      resetForm();
    } catch (error: any) {
      // console.log("Error creating workout", error);
      Alert.alert(
        "Error",
        isEditing ? "Failed to update workout" : "Failed to create workout"
      );
    }
  };

  //exercise reordering.
  const movedExercise = (
    exercises: SelectedExercise[],
    fromIndex: number,
    toIndex: number
  ): SelectedExercise[] => {
    if (
      fromIndex < 0 ||
      fromIndex >= exercises.length ||
      toIndex < 0 ||
      toIndex >= exercises.length ||
      fromIndex === toIndex
    ) {
      return exercises;
    }

    const nextExercises = [...exercises];
    const [movedExercise] = nextExercises.splice(fromIndex, 1);

    if (!movedExercise) {
      return exercises;
    }

    nextExercises.splice(toIndex, 0, movedExercise);

    return nextExercises;
  };

  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    setForm((prev) => ({
      ...prev,
      exercises: movedExercise(prev.exercises, fromIndex, toIndex),
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-background  px-5 pb-20 pt-5">
      {/* header section. */}
      <View className="flex-row items-center justify-between pb-4">
        <Text className="text-center text-lg text-white">
          {isEditing ? "Edit Workout" : "Create Workout"}
        </Text>
        <Pressable
          disabled={isSaving}
          onPress={() => saveWorkout()}
          className="rounded-3xl bg-primary px-4 py-2"
        >
          {isSaving ? (
            <>
              <ActivityIndicator />
            </>
          ) : (
            <Text>{isEditing ? "Update Workout" : "Save Workout"}</Text>
          )}
        </Pressable>
      </View>

      {isEditing && (
        <Pressable
          onPress={cancelEditing}
          className="mb-2 self-start rounded-full bg-muted-2/10 px-4 py-2"
        >
          <Text className="text-muted-2">Cancel editing</Text>
        </Pressable>
      )}

      {/* create workout contents  section*/}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-[50px]">
          <Text className="text-white">Workout Name</Text>
          <TextInput
            ref={workoutNameRef}
            placeholder="e.g Push Day"
            className={`${isMissing ? "border-red-500" : "border-transparent"} mt-3 rounded-3xl border bg-muted-2/10 px-4 text-muted-2 text-white placeholder:text-muted-2/50 `}
            selectionColor="#dae86aff"
            onChangeText={(text) =>
              setForm((prev) => ({
                ...prev,
                name: text,
              }))
            }
            value={form.name}
          />
          {isMissing && (
            <Text className="mt-2 text-red-500">Workout name is required.</Text>
          )}

          {/* description */}
          <Text className="mt-8 text-white ">Description</Text>
          <TextInput
            placeholder="e.g Push Day"
            onChangeText={(text) =>
              setForm((prev) => ({
                ...prev,
                description: text,
              }))
            }
            value={form.description}
            className="mt-3 rounded-3xl bg-muted-2/10 px-4 text-muted-2 text-white placeholder:text-muted-2/50 "
          />
        </View>
        {/* WORKOUT TYPE / CATEGORY */}
        <Text className="mt-8 text-white">Workout Type</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 16 }}
          className="mt-3 flex-grow-0"
        >
          {WORKOUT_TYPES.map((workoutType) => {
            const isSelected = form.category === workoutType;

            return (
              <Pressable
                key={workoutType}
                onPress={() =>
                  setForm((prev) => ({
                    ...prev,
                    category: prev.category === workoutType ? "" : workoutType,
                  }))
                }
                className={`h-10 items-center justify-center rounded-3xl px-5 ${
                  isSelected ? "bg-primary" : "bg-muted-2/10"
                }`}
              >
                <Text
                  className={`text-sm ${
                    isSelected ? "text-black" : "text-muted-2/50"
                  }`}
                >
                  {workoutType}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* schedule for */}
        {/* SCHEDULE DATE (OPTIONAL) */}

        {!isEditing && (
          <>
            <Text className="mt-8 text-white">Schedule date (optional)</Text>

            <View className="mt-3 flex-row items-center justify-between rounded-3xl bg-muted-2/10 px-4 py-3">
              {/* DATE SELECTION BUTTON */}

              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="flex-1 flex-row items-center gap-3"
              >
                <Feather name="calendar" size={18} color="#D8FF00" />

                <Text className="text-white">
                  {scheduledDate
                    ? scheduledDate.toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "No date selected"}
                </Text>
              </Pressable>

              {/* CLEAR SELECTED DATE */}

              {scheduledDate && (
                <Pressable
                  onPress={() => setSheduledDate(null)}
                  hitSlop={10}
                  className="rounded-full bg-muted-2/20 p-1"
                >
                  <Feather name="x" size={16} color="#a0a0a0" />
                </Pressable>
              )}
            </View>

            {/* DATE PICKER */}

            {showDatePicker && (
              <View className="mt-3 rounded-3xl bg-muted-2/10 py-2">
                <DateTimePicker
                  value={scheduledDate ?? new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={atLocalMidnight(new Date())}
                  onChange={handleDateChange}
                  themeVariant="dark"
                />

                {/* IOS DONE BUTTON */}

                {Platform.OS === "ios" && (
                  <Pressable
                    onPress={() => setShowDatePicker(false)}
                    className="items-center self-end rounded-full bg-primary px-4 py-1"
                  >
                    <Text className="text-black">Done</Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}

        <Pressable
          onPress={() => setModalOpen(true)}
          onPressIn={() => setIsPressed("add-exercise")}
          onPressOut={() => setIsPressed("")}
          className={`${isPressed === "add-exercise" ? "opacity-0.5" : "opacity-1"} mt-5 flex-row items-center justify-center gap-3 overflow-hidden rounded-3xl bg-primary py-3`}
        >
          <Feather name="plus" color="#000" size={20} />
          <Text>Add Exercise</Text>
        </Pressable>

        {/* EXERCISES SECTION */}
        <Text className="mt-8 text-lg font-bold text-white">Exercises</Text>
        <Text className="text-muted-2/50">
          {form.exercises.length} Exercises
        </Text>
        <View className="gap-5 rounded-3xl py-4">
          {/* each exercise--HARDCODED */}

          {form.exercises.map((ex, index) => {
            // console.log("added exercise muscle", ex.muscle);
            return (
              <View
                key={ex.exerciseId}
                className="w-full rounded-3xl bg-muted-2/10 px-3 py-3"
              >
                {/* exercise header section */}
                <View className="flex-row items-center justify-between">
                  {/* Reordering buttons */}
                  <View className="mr-4 items-center gap-1 ">
                    {/* Move exercise up */}
                    <Pressable
                      disabled={index === 0}
                      onPress={() => handleMoveExercise(index, index - 1)}

                      className="mb-3 h-8 w-8 items-center justify-center rounded-full bg-background"
                    >
                      <Feather name="arrow-up" size={25} color="#D8FF00" />
                    </Pressable>

                    {/* Move exercise down */}
                    <Pressable
                      disabled={index === form.exercises.length - 1}
                      onPress={() => handleMoveExercise(index, index + 1)}

                      className="h-8 w-8 items-center justify-center rounded-full bg-background"
                    >
                      <Feather name="arrow-down" size={25} color="#D8FF00" />
                    </Pressable>
                  </View>

                  {/* image here */}
                  <View className="h-[60px] w-[60px]  items-center justify-center rounded-3xl bg-background">
                    <Text className="text-center text-white">Image here</Text>
                  </View>
                  {/* exercise name */}
                  <View className="ml-4 flex-1">
                    <Text className="text-white">{ex.name}</Text>
                    <Text className="text-muted-2/50">{ex.muscle}</Text>
                  </View>

                  {/* arrow positions */}
                  {/* arrow buttons + remove button */}
                  <View className="flex-row items-center gap-2">
                    {/* Remove exercise */}
                    <Pressable
                      onPress={() => removeExercise(ex.exerciseId)}
                      onPressIn={() => setIsPressed("remove")}
                      onPressOut={() => setIsPressed("")}
                      className={`${
                        isPressed === "remove" ? "opacity-0.5" : "opacity-1"
                      } h-10 w-[80px] items-center justify-center rounded-full bg-primary`}
                    >
                      <Text>Remove</Text>
                    </Pressable>
                  </View>
                  {/* remove exercise */}
                </View>

                {/* set selector section */}
                <View className="mt-5 gap-5">
                  {(["sets", "reps", "restSeconds"] as const).map((field) => (
                    <View key={field} className="flex-row justify-between">
                      <Text className="capitalize text-white">{field}</Text>
                      {/* //selectors */}
                      <View className="flex-row items-center gap-6">
                        <Pressable
                          onPress={() => bump(ex.exerciseId, -1, field)}
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                          })}
                          className="h-[30px] w-[50px] items-center justify-center rounded-3xl border border-primary"
                        >
                          <Text className="text-lg text-white">-</Text>
                        </Pressable>
                        <Text className="w-[20px] text-center text-white">
                          {ex[field]}
                        </Text>
                        <Pressable
                          onPress={() => bump(ex.exerciseId, +1, field)}
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.5 : 1,
                          })}
                          className="h-[30px] w-[50px] items-center justify-center rounded-3xl border border-primary"
                        >
                          <Text className="text-lg text-white">+</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* //EXERCISE MODAL OPEN */}
      <Modal
        visible={modalOpen}
        transparent
        onRequestClose={() => setModalOpen(false)}
        animationType="slide"
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* modal container styling */}
          <View className="flex-1 justify-end">
            <BlurView intensity={80} tint="dark" className="absolute inset-0" />
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={animatedSheet}
                className="h-[80%] rounded-t-3xl border border-primary/20 bg-background px-4 py-5"
              >
                {/* drag handle */}
                <View className="mb-4 w-full items-center justify-center">
                  <View className="h-[5px] w-[100px] rounded-full bg-muted-2/25" />
                </View>

                {/* header section */}
                <View className="flex-row justify-between">
                  <Text className="font-bold text-white">Select Exercise</Text>
                  <Pressable
                    onPress={() => setModalOpen(false)}
                    className="items-center justify-center rounded-full bg-primary"
                  >
                    <Feather name="x" size={25} color="#000" />
                  </Pressable>
                </View>

                {/* //search bar */}
                <TextInput
                  placeholder="Search exercise by name,force .. "
                  className="mb-4 mt-4 rounded-3xl bg-muted-2/20 px-4 text-muted-2/40 text-white placeholder:text-muted-2/40"
                  selectionColor="#dae86aff"
                />
                {/* //exercises. */}
                {/* NOTE STILL TO ADD FLATLIST */}
                <FlatList
                  data={AllExercises}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => addExercise(item)}
                      onPressIn={() => setIsPressed(item.name)}
                      onPressOut={() => setIsPressed("")}
                      className={` ${isPressed === item.name ? "opacity-0.5 border-primary" : "opacity-1 border-primary/30"} mt-4 flex-row items-center justify-between rounded-3xl border  px-2  py-4`}
                    >
                      {/* image */}
                      <View className="h-[80px] w-[80px]  items-center justify-center rounded-3xl bg-muted-2/50">
                        <Text className="text-center text-white">
                          Image here
                        </Text>
                      </View>

                      {/* exercise name */}
                      <View className="ml-4 flex-1">
                        <Text className="mb-3 w-[150px] font-bold text-white">
                          {item.name}
                        </Text>
                        <View className="flex-row">
                          {/* target muscle */}
                          <View className="w-1/2">
                            <Text className="text-muted-2/60">
                              - {item.muscle}
                            </Text>

                            {/* difficulty */}
                            <Text className="text-muted-2/60">
                              - {item.difficulty}
                            </Text>

                            {/* equipment */}
                            <Text className="text-muted-2/60">
                              - {item.equipment}
                            </Text>
                          </View>

                          {/* right side */}
                          <View className="w-1/2">
                            {/* mechanicss */}
                            <Text className="text-muted-2/60">
                              - {item.mechanics}
                            </Text>

                            {/* force type */}
                            <Text className="text-muted-2/60">
                              - {item.forceType}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  )}
                />

                <ScrollView showsVerticalScrollIndicator={false}></ScrollView>
              </Animated.View>
            </GestureDetector>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </SafeAreaView>
  );
}
