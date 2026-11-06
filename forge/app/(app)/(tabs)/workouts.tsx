import {
  useGetAllWorkoutsQuery,
  useGetScheduledWorkoutsQuery,
  useGetWorkoutsBySearchQuery,
  Workout,
} from "@/features/api";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";

import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const userImage = require("../../../assets/images/app-images/user-profile.png");
const push = require("../../../assets/images/app-images/push.jpeg");
const pull = require("../../../assets/images/app-images/pull.png");
const legs = require("../../../assets/images/app-images/Legs.png");
const arm = require("../../../assets/images/app-images/arm.png");
const shoulder = require("../../../assets/images/app-images/shoulder.png");
const anatomy = require("../../../assets/images/app-images/anatomy.png");
const logo = require("../../../assets/images/app-images/logo.png");
const gBackground = require("../../../assets/images/app-images/gradient.png");

const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  push: push,
  pull: pull,
  arms: arm,
  legs: legs,
  shoulders: shoulder,
  quads: legs,
  "push-pull": push,
  "full body": anatomy,
};

const workoutFilters = [
  "All",
  "Push",
  "Pull",
  "Legs",
  "Arm",
  "Shoulder",
  "core",
];

type ScheduledWorkout = {
  workoutId: string;
  scheduledDate: string;
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

export default function Plan() {
  const [isPressed, setIsPressed] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [workoutSelected, setWorkoutSelected] = useState("");
  const router = useRouter();

  // --------------------------------------------------
  // SEARCH DEBOUNCE
  // --------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --------------------------------------------------
  // API QUERIES
  // --------------------------------------------------

  const {
    data: scheduledWorkouts,
    refetch: refetchScheduled,
    isFetching: isFetchingScheduled,
  } = useGetScheduledWorkoutsQuery();

  const {
    data: allWorkouts,
    refetch: refetchAllWorkouts,
    isFetching: isFetchingWorkouts,
  } = useGetAllWorkoutsQuery();

  const {
    data: searchedWorkouts,
    refetch: refetchSearch,
    isFetching: isFetchingSearch,
  } = useGetWorkoutsBySearchQuery(debouncedSearchTerm, {
    skip: debouncedSearchTerm.length === 0,
  });

  //REFETCH HANDLERS.
  const isRefreshing =
    isFetchingScheduled || isFetchingWorkouts || isFetchingSearch;

  // user manual refresh
  const onRefresh = useCallback(async () => {
    await Promise.all([
      refetchAllWorkouts(),
      refetchScheduled(),
      ...(debouncedSearchTerm.length > 0 ? [refetchSearch()] : []),
    ]);
  }, [
    refetchAllWorkouts,
    refetchScheduled,
    refetchSearch,
    debouncedSearchTerm,
  ]);

  // tab auto refetch
  useFocusEffect(
    useCallback(() => {
      refetchAllWorkouts();
      refetchScheduled();
    }, [refetchAllWorkouts, refetchScheduled])
  );

  // --------------------------------------------------
  // DETERMINE WHICH WORKOUTS TO DISPLAY
  // --------------------------------------------------

  const workoutsToDisplay = useMemo(() => {
    // If the user is searching,
    // display search results.
    if (debouncedSearchTerm.length > 0) {
      return searchedWorkouts ?? [];
    }

    // Otherwise display all workouts.
    return allWorkouts ?? [];
  }, [debouncedSearchTerm, allWorkouts, searchedWorkouts]);

  // --------------------------------------------------
  // FILTER WORKOUTS
  // --------------------------------------------------

  const filteredWorkouts = useMemo(() => {
    // Start with whatever workouts we decided
    // should be displayed.
    let workouts = workoutsToDisplay;

    // "All" means don't apply another filter.
    if (activeFilter === "All") {
      return workouts;
    }

    // Filter based on the workout name.
    workouts = workouts.filter((workout) =>
      workout.name.toLowerCase().includes(activeFilter.toLowerCase())
    );

    return workouts;
  }, [workoutsToDisplay, activeFilter]);

  // --------------------------------------------------
  // FIND NEXT SCHEDULED WORKOUT
  // --------------------------------------------------

  //NEXT WORKOUT IMAGE.
  const resolveWorkoutImage = (
    category?: string | null,
    image?: string | null
  ): ImageSourcePropType => {
    const categoryImage = CATEGORY_IMAGES[category?.trim().toLowerCase() ?? ""];

    if (categoryImage) {
      return categoryImage;
    }

    //for system workouts
    const systemWorkout = image?.trim();
    return systemWorkout ? { uri: systemWorkout } : logo;
  };

  const getNextWorkout = (
    scheduledWorkouts: ScheduledWorkout[]
  ): Workout | undefined => {
    // Get today's date.
    const today = new Date();

    // Set today's time to midnight.
    today.setHours(0, 0, 0, 0);

    // Keep only workouts scheduled for today or later.
    const upcoming = scheduledWorkouts.filter(
      (scheduledWorkout) => new Date(scheduledWorkout.scheduledDate) >= today
    );

    // Sort from earliest scheduled date to latest.
    upcoming.sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime()
    );

    // The first item is the next workout.
    const nextSession = upcoming[0];

    // Find the complete workout from all workouts.
    const workoutDetails = allWorkouts?.find(
      (workout) => workout.id === nextSession?.workoutId
    );

    return workoutDetails;
  };

  const nextWorkout = getNextWorkout(scheduledWorkouts ?? []);

  // --------------------------------------------------
  // FEATURED WORKOUTS
  // --------------------------------------------------

  const defaultWorkouts = allWorkouts?.filter((w) => {
    return w.workoutType === "system";
  });

  // console.log(
  //   "HERE ARE ALL THE DEFAULT WORKOUTS",

  //   defaultWorkouts
  // );
  // --------------------------------------------------
  // HEADER
  // --------------------------------------------------

  const renderHeader = () => {
    return (
      <View>
        {/* -------------------------------------------- */}
        {/* PAGE HEADER */}
        {/* -------------------------------------------- */}

        <View className="relative flex-row items-center justify-between">
          <Pressable
            onPressIn={() => setIsPressed("home")}
            onPressOut={() => setIsPressed("")}
            onPress={() => {
              router.replace("/(app)/(tabs)");
            }}
            hitSlop={20}
            pressRetentionOffset={30}
            className={`${isPressed === "home" ? "opacity-50" : "opacity-100"} z-20 h-12 w-12 items-center justify-center rounded-full bg-primary/10`}
          >
            <Feather name="chevron-left" size={25} color="#fff" />
          </Pressable>

          <Text
            pointerEvents="none"
            className="absolute left-0 right-0 text-center text-white"
          >
            Workouts
          </Text>
        </View>

        {/* -------------------------------------------- */}
        {/* UPCOMING WORKOUT */}
        {/* -------------------------------------------- */}

        <Text className="mt-5 uppercase text-muted-2">Upcoming workout</Text>

        {nextWorkout ? (
          <View className="relative mt-2 h-[200px] w-full overflow-hidden rounded-3xl bg-primary">
            {/* Workout image */}
            <Image
              source={resolveWorkoutImage(
                nextWorkout.workoutCategory,
                nextWorkout.image
              )}
              className="h-full w-full"
              resizeMode="cover"
            />

            {/* Dark gradient over image */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.9)"]}
              className="absolute inset-0"
            />

            {/* Workout information */}
            <View className="absolute bottom-[90px] left-5 right-5 flex w-[300px]">
              <Text className="font-bold uppercase text-white">
                {nextWorkout.name}
              </Text>

              <Text className="mt-2 text-muted-2">
                {nextWorkout.description}
              </Text>

              <View className="flex-row items-center gap-2">
                <FontAwesome5 name="fire" size={16} color="#F59E0B" />
                <Text className="text-lg font-bold text-white">
                  {nextWorkout?.workoutCategory} Workout
                </Text>
              </View>
            </View>

            {/* Start workout button */}
            <Pressable
              className={`absolute bottom-5 left-5 h-[50px] w-[200px] items-center justify-center rounded-full bg-primary ${
                isPressed === "start" ? "opacity-60" : "opacity-100"
              }`}
              onPress={() => router.push(`/workout/${nextWorkout.id}`)}
              // onPressIn={() => {
              //   setIsPressed("start");
              // }}
              // onPressOut={() => {
              //   setIsPressed("");
              // }}
            >
              <View className="flex-row items-center gap-12">
                <Text className="font-bold">Start Workout</Text>

                <Feather name="chevron-right" color="black" size={23} />
              </View>
            </Pressable>
          </View>
        ) : (
          <View className="mt-2 h-[200px] w-full items-center justify-center rounded-3xl bg-muted-2/10">
            <Feather name="calendar" size={30} color="#888" />

            <Text className="mt-3 text-white">No upcoming workouts</Text>

            <Text className="mt-1 text-muted-2/50">
              Schedule a workout to see it here.
            </Text>
          </View>
        )}

        {/* -------------------------------------------- */}
        {/* SEARCH */}
        {/* -------------------------------------------- */}

        <View className="mt-6 flex-row items-center rounded-2xl bg-muted-2/10 px-4">
          <Feather name="search" size={20} color="#888" />

          <TextInput
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search workouts..."
            placeholderTextColor="#888"
            className="ml-3 h-12 flex-1 text-white"
          />

          {searchTerm.length > 0 && (
            <Pressable onPress={() => setSearchTerm("")}>
              <Feather name="x" size={20} color="#888" />
            </Pressable>
          )}
        </View>

        {/* -------------------------------------------- */}
        {/* FILTERS */}
        {/* -------------------------------------------- */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 12,
          }}
          className="mt-6"
        >
          {workoutFilters.map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`rounded-full px-5 py-3 ${
                activeFilter === filter ? "bg-primary" : "bg-muted-2/10"
              }`}
            >
              <Text
                className={`font-medium ${
                  activeFilter === filter ? "text-black" : "text-white"
                }`}
              >
                {filter}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* -------------------------------------------- */}
        {/* FEATURED WORKOUTS */}
        {/* -------------------------------------------- */}

        <View className="mt-8">
          <Text className="text-lg font-bold text-white">
            Featured Workouts
          </Text>

          <Text className="mt-1 text-muted-2/50">Ready-to-follow workouts</Text>

          <FlatList
            data={defaultWorkouts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 12,
              paddingTop: 16,
            }}
            renderItem={({ item }) => (
              <Pressable
                className={`${isPressed === item.id ? "opacity-60" : "opacity-100"} relative h-[160px] w-[220px] overflow-hidden rounded-3xl bg-muted-2/10`}
                onPress={() => {
                  // console.log("WORKOUT PRESSED:", item.id);

                  router.push({
                    pathname: "/workout/[id]",
                    params: {
                      id: item.id,
                    },
                  });
                }}
                onPressIn={() => setIsPressed(item.id)}
                onPressOut={() => setIsPressed("")}
              >
                <Image
                  source={
                    item.image?.trim()
                      ? { uri: item.image.trim() }
                      : require("../../../assets/images/app-images/logo.png")
                  }
                  className="h-full w-full"
                  resizeMode="cover"
                />

                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.9)"]}
                  className="absolute inset-0"
                />

                <View className="absolute bottom-4 left-4 right-4">
                  <Text className="text-lg font-bold uppercase text-white">
                    {item.name}
                  </Text>

                  <Text className="mt-1 text-xs text-muted-2">
                    {item.description}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* -------------------------------------------- */}
        {/*YOUR WORKOUTS HEADER */}
        {/* -------------------------------------------- */}

        <View className="mt-8">
          <Text className="text-lg font-bold text-white">Your Workouts</Text>

          <Text className="mt-2 text-muted-2/50">
            Click on a workout to start.
          </Text>
        </View>
      </View>
    );
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <SafeAreaView className="flex-1 bg-background px-5 pb-8 pt-5">
      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        renderItem={({ item }) => (
          <Pressable
            onPressIn={() => setWorkoutSelected(item.id)}
            onPressOut={() => setWorkoutSelected("")}
            onPress={() => {
              router.push(`/workout/${item.id}/`);
            }}
            className={`mb-5 mt-5 h-[120px] w-full gap-2 overflow-hidden rounded-3xl border px-4 pt-8 ${
              workoutSelected === item.id
                ? "border-primary/40 opacity-60"
                : "border-primary/10 opacity-100"
            } bg-muted-2/10`}
          >
            {/* Workout name */}
            <Text className="text-lg text-white">{item.name}</Text>

            {/* Description */}
            <Text className="text-xs text-muted-2/50">{item.description}</Text>

            {/* Workout statistics */}
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
        ListEmptyComponent={
          <View className="items-center py-10">
            <Feather name="activity" size={30} color="#666" />

            <Text className="mt-3 text-white">
              {debouncedSearchTerm.length > 0
                ? "No workouts found"
                : "No workouts yet"}
            </Text>

            <Text className="mt-1 text-center text-muted-2/50">
              {debouncedSearchTerm.length > 0
                ? "Try searching for another workout."
                : "Create your first workout to see it here."}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
