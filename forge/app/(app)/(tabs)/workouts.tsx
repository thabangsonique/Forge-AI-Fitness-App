import {
  useGetAllWorkoutsQuery,
  useGetScheduledWorkoutsQuery,
  useGetWorkoutsBySearchQuery,
  useGetWorkoutSessionHistoryQuery,
} from "@/features/api";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

//WORKOUT FILTER OPTIONS
const workoutFilters = [
  "All",
  "Push",
  "Pull",
  "Legs",
  "Arm",
  "Shoulder",
  "core",
];

type ScheduledWorkouts = {
  workoutId: string;
  scheduledDate: string;
};

type CompletedSessions = {
  workoutId: string;
  completedAt: string;
};

type SessionHistory = {
  id: string;

  userId: string;
  workoutId: string;
  workoutName: string;
  startedtAt: Date;
  completedAt: Date;
  durationSeconds: number;
  createdAt: Date;
  sets: sessionSet[];
};

type sessionSet = {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
};

type Exercise = {
  id: string;
  workoutExerciseId: string;
  name: string;
  description: string | null;
  muscle: string | null;
  equipment: string | null;
  difficulty: string | null;
  forceType: string | null;
  mechanics: string | null;
  category: string | null;

  position: number;
  sets: number;
  reps: number;
  restSeconds: number;
};

type Workout = {
  id: string;
  name: string;
  description: string | null;

  exercises: Exercise[];

  exerciseCount: number;
  totalSets: number;
};

const push = require("../../../assets/images/app-images/push.jpeg");
export default function plan() {
  const [isPressed, setIsPressed] = React.useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [debouncedSearchTerm, setDeboundedSearchTerm] = useState("");
  const [workoutSelected, setWorkoutSelected] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeboundedSearchTerm(searchTerm.trim());
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);

  const {
    data: ScheduledWorkouts,
    isLoading: scheduledLoading,
    error: scheduledError,
  } = useGetScheduledWorkoutsQuery();
  const {
    data: sessionHistory,
    isLoading: historyLoading,
    error: historyError,
  } = useGetWorkoutSessionHistoryQuery();
  const { data: allWorkouts } = useGetAllWorkoutsQuery();

  const {
    data: searchedWorkouts, //the workouts based on the search
    isLoading: searchLoading,
    isError: isSearchError,
  } = useGetWorkoutsBySearchQuery(debouncedSearchTerm, {
    skip: debouncedSearchTerm.length === 0,
  });

  //return workouts based on the search bar.
  const workoutsToDisplay = useMemo(() => {
    if (debouncedSearchTerm.length > 0) {
      return searchedWorkouts ?? [];
    }

    return allWorkouts ?? [];
  }, [debouncedSearchTerm, allWorkouts, searchedWorkouts]);

  //filtering the workouts- either all / searched.
  const filteredWorkouts = useMemo(() => {
    console.log(
      "INSIDE useMemo - workoutsToDisplay:",
      workoutsToDisplay?.length
    );
    console.log("INSIDE useMemo - activeFilter:", activeFilter);

    let workouts = workoutsToDisplay;
    console.log("INSIDE useMemo - starting workouts:", workouts?.length);

    if (activeFilter === "All") {
      console.log("INSIDE useMemo - returning all workouts");
      return workouts;
    }

    workouts = workouts.filter((workout) => {
      return workout.name.toLowerCase().includes(activeFilter.toLowerCase());
    });

    console.log("INSIDE useMemo - filtered workouts:", workouts?.length);
    return workouts;
  }, [workoutsToDisplay, activeFilter]);

  //find next workout.
  const getNextWorkout = (ScheduledWorkouts: ScheduledWorkouts[]) => {
    //fetch today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = ScheduledWorkouts.filter((sw) => {
      const workoutDate = new Date(sw.scheduledDate);

      return workoutDate >= today;
    });

    //sort dates.
    upcoming.sort((a, b) => {
      return (
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime()
      );
    });

    //grab first date as next workout.
    const nextSession = upcoming[0];
    console.log("NEXT SESSION:", nextSession);
    console.log("ALL WORKOUTS:", allWorkouts);

    const workoutDetails = allWorkouts?.find(
      (w) => w.id === nextSession?.workoutId
    );

    return workoutDetails;
  };

  const nextWorkout = getNextWorkout(ScheduledWorkouts ?? []);
  console.log("FILTERED WORKOUTS", filteredWorkouts);

  return (
    <SafeAreaView className="flex-1 bg-background  px-5 pt-5">
      {/* header section */}
      <View className="flex-row items-center justify-between">
        {/* back button*/}
        <Pressable className="rounded-full\ h-10 w-10 items-center justify-center">
          <Feather name="chevron-left" size={25} color="#fff" />
        </Pressable>

        {/* text */}
        <Text className=" text-white">Workouts</Text>

        {/* dot icons */}
        <Pressable>
          <Feather name="more-vertical" size={20} color="#fff" />
        </Pressable>
      </View>

      <Text className="mt-5 uppercase text-muted-2">Upcoming workout</Text>

      {nextWorkout ? (
        <View className="relative mt-2 h-[200px] w-full overflow-hidden rounded-3xl bg-primary">
          <Image source={push} className="h-full w-full" resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.9)"]}
            className="absolute inset-0"
          />

          {/* text container */}
          <View className="absolute bottom-[90px] left-5 right-5 flex w-[300px]">
            <Text className=" font-bold uppercase text-white">
              {nextWorkout.name}
            </Text>
            <Text className="mt-2 text-muted-2">{nextWorkout.description}</Text>
          </View>

          {/* start workout button */}
          <Pressable
            className={`absolute bottom-5 left-5  h-[50px] w-[200px] items-center justify-center rounded-full bg-primary ${
              isPressed ? "opacity-60" : "opacity-100"
            }`}
            onPressIn={() => {
              setIsPressed(true);
              console.log("BUTTON IS PRESSING");
            }}
            onPressOut={() => setIsPressed(false)}
          >
            <View className="flex-row items-center gap-12">
              <Text className="font-bold">Start Workout</Text>
              <Feather name="chevron-right" color="black" size={23} />
            </View>
          </Pressable>
        </View>
      ) : (
        <View className="mt-8 h-[130px] items-center justify-center rounded-3xl bg-muted-2/10">
          <Text className=" text-center text-lg text-white">
            No Upcoming Workouts
          </Text>
          <Text className="text-center text-muted-2">
            Scheduled your first workout
          </Text>
        </View>
      )}

      {/* category selector */}
      {/* saerch workouts. */}
      <TextInput
        value={searchTerm}
        onChangeText={(text) => setSearchTerm(text)}
        placeholder="Search by workout name..."
        className="mt-5 h-[45px] rounded-3xl bg-muted-2/10 px-5 text-white placeholder:text-muted/50"
        selectionColor="#dae86aff"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
        className="mt-6 h-[80px] flex-grow-0 pb-4"
      >
        {workoutFilters.map((wf, idx) => (
          <Pressable
            key={idx}
            onPress={() => setActiveFilter(wf)}
            className={`h-10 w-20 items-center justify-center rounded-3xl  ${activeFilter === wf ? " bg-primary" : "bg-muted-2/10"}`}
          >
            <Text
              className={`text-sm  ${activeFilter === wf ? "text-black" : "text-muted-2/50"}`}
            >
              {wf}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text className="mb-4 mt-3 text-muted-2/50">
        Click on workout to start.
      </Text>
      {/* //FILTERED WORKOUTS */}
      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}

        renderItem={({ item }) => (
          <Pressable
            onPress={() => setWorkoutSelected(item.name)}
            onPressOut={() => setWorkoutSelected("")}
            className={` ${workoutSelected === item.name ? "border-primary/40 opacity-60" : "border-primary/10  opacity-100"} mb-5 h-[120px] w-full gap-2 overflow-hidden rounded-3xl border bg-muted-2/10 px-4 pt-8`}
          >
            {/* header */}
            <Text className="text-lg text-white">{item.name}</Text>
            <Text className="text-xs text-muted-2/50">{item.description}</Text>
            <View className="flex-row">
              <Text className="mr-3 text-muted-2/50">
                Exercises: {item.exerciseCount}
              </Text>
              <Text className="text-muted-2/50">
                Total Sets: {item.totalSets}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
