import {
  Exercise,
  useCreateWorkoutMutation,
  useGetExercisesQuery,
} from "@/features/api";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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

export interface CreateWorkoutRequest {
  name: string;
  description: string;
  category: string;
  exercises: SelectedExercise[];
}

export default function Create() {
  // STATES
  const [activeFilter, setActiveFilter] = useState("All");
  const [form, setForm] = useState<CreateWorkoutRequest>({
    name: "",
    description: "",
    category: "",
    exercises: [],
  });
  const [modalOpen, setModalOpen] = useState(false);

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

  const DEFAULTS = { sets: 3, reps: 10, restSeconds: 60 };

  //function to add exercise
  const addExercise = (exercise: Exercise) => {
    console.log("SELECTED EXERCISE", exercise);
    console.log("SELECTED EXERCISE MUSCLE", exercise.muscle);
    if (form.exercises.some((ex) => ex.exerciseId === exercise.id)) {
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

  //function to save workout -backend.
  const saveWorkout = async () => {
    try {
      await createWorkout(form).unwrap();

      console.log("HERE IS THE WORKOUT CREATION", form);
      Alert.alert("Success", "Workout created successfully");
    } catch (error: any) {
      console.log("Error creating workout", error);
      Alert.alert("Error", "Failed to create workout");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background  px-5 pb-20 pt-5">
      {/* header section. */}
      <View className="flex-row items-center justify-between pb-4">
        <Text className="text-center text-lg text-white">Create Workout</Text>
        <Pressable
          disabled={creatingWorkout}
          onPress={() => saveWorkout()}
          className="rounded-3xl bg-primary px-4 py-2"
        >
          {creatingWorkout ? (
            <>
              <ActivityIndicator />
            </>
          ) : (
            <Text>Save Workout</Text>
          )}
        </Pressable>
      </View>

      {/* create workout contents  section*/}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-[50px]">
          <Text className="text-white">Workout Name</Text>
          <TextInput
            placeholder="e.g Push Day"
            className="mt-3 rounded-3xl bg-muted-2/10 px-4 text-muted-2 text-white placeholder:text-muted-2/50 "
            onChangeText={(text) =>
              setForm((prev) => ({
                ...prev,
                name: text,
              }))
            }
            value={form.name}
          />

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
        {/* WORKOUT CATEGORY */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
          className="mt-8 flex-grow-0"
        >
          {(["strength Gain", "Muscle Gain"] as const).map(
            (workoutType, idx) => (
              <Pressable
                key={idx}
                onPress={() => setActiveFilter(workoutType)}
                className={`h-10 w-[100px] items-center justify-center rounded-3xl  ${activeFilter === workoutType ? " bg-primary" : "bg-muted-2/10"}`}
              >
                <Text
                  className={`text-sm  ${activeFilter === workoutType ? "text-black" : "text-muted-2/50"}`}
                >
                  {workoutType}
                </Text>
              </Pressable>
            )
          )}
        </ScrollView>

        <Pressable
          onPress={() => setModalOpen(true)}
          className="mt-5 flex-row items-center justify-center gap-3 rounded-3xl bg-primary py-3"
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

          {form.exercises.map((ex) => {
            console.log("added exercise muscle", ex.muscle);
            return (
              <View
                key={ex.exerciseId}
                className="w-full rounded-3xl bg-muted-2/10 px-3 py-3"
              >
                {/* exercise header section */}
                <View className="flex-row items-center justify-between">
                  {/* image here */}
                  <View className="h-[60px] w-[60px]  items-center justify-center rounded-3xl bg-background">
                    <Text className="text-center text-white">Image here</Text>
                  </View>
                  {/* exercise name */}
                  <View className="ml-4 flex-1">
                    <Text className="text-white">{ex.name}</Text>
                    <Text className="text-muted-2/50">{ex.muscle}</Text>
                  </View>

                  {/* remove exercise */}
                  <Pressable
                    onPress={() => removeExercise(ex.exerciseId)}
                    className="h-10 w-[80px] items-center justify-center rounded-full bg-primary"
                  >
                    <Text>Remove</Text>
                  </Pressable>
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
                          className="h-[30px] w-[50px] items-center justify-center rounded-3xl border border-primary"
                        >
                          <Text className="text-lg text-white">-</Text>
                        </Pressable>
                        <Text className="w-[20px] text-center text-white">
                          {ex[field]}
                        </Text>
                        <Pressable
                          onPress={() => bump(ex.exerciseId, +1, field)}
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
                className="max-h-[80%] rounded-t-3xl border border-primary/20 bg-background px-4 py-5"
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
                      className="mt-4 flex-row items-center justify-between rounded-3xl border border-primary/30 px-2  py-4"
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
