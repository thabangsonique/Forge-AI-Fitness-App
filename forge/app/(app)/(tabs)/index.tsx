import {
  getOnboardingAnswers,
  resetOnboardingAnswers,
} from "@/constants/onboarding";
import {
  useGetCompletedSessionsQuery,
  useGetScheduledWorkoutsQuery,
  useGetWorkoutSessionHistoryQuery,
} from "@/features/api";
import { authClient } from "@/lib/auth-client";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const userImage = require("../../../assets/images/app-images/user-profile.png");
const push = require("../../../assets/images/app-images/push.jpeg");
const pull = require("../../../assets/images/app-images/pull.png");
const legs = require("../../../assets/images/app-images/Legs.png");

//QUICK ACTIONS.
const quickActions = [
  {
    icon: "dumbbell",
    title: "Wokouts",
    href: "/(app)/(tabs)/workouts",
  },
  {
    icon: "calendar-alt",
    title: "My Plan",
    href: "/(app)/(tabs)/workouts",
  },
  {
    icon: "walking",
    title: "Exercises",
    href: "/(app)/(tabs)/workouts",
  },
  {
    icon: "apple-alt",
    title: "Diet",
    href: "/(app)/(tabs)/workouts",
  },
  {
    icon: "brain",
    title: "AI Coach",
    href: "/(app)/(tabs)/workouts",
  },
  {
    icon: "stopwatch",
    title: "Track",
    href: "/(app)/(tabs)/workouts",
  },
];

type ScheduledWorkouts = {
  workoutId: string;
  scheduledDate: string;
};

type CompletedSessions = {
  workoutId: string;
  completedAt: string;
};

type DayData = {
  key: string;
  label: string;
  date: Date;
  hasWorkout: boolean;
  isFuture: boolean;
  isToday: boolean;
  wasCompleted: boolean;
};

//check for existing workout session's data within current weekdays.
const getDayWeek = (
  scheduledWorkouts: ScheduledWorkouts[],
  completedSessions: CompletedSessions[]
): DayData[] => {
  //find the actual date of the day's labels.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  //find sunday.
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  //find rest of day dates of the week.
  const labels = ["S", "M", "T", "W", "T", "F", "S"];

  const keys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  //loop through each day/label.
  return labels.map((label, index) => {
    //get actual date for this current loop day/label.
    const dayDate = new Date(startOfWeek);
    dayDate.setHours(0, 0, 0, 0);
    dayDate.setDate(startOfWeek.getDate() + index);

    //check for existing scheduled workouts on this current loop day.
    const scheduledWorkout = scheduledWorkouts.find((workout) => {
      const scheduledDate = new Date(workout.scheduledDate);

      return scheduledDate.getTime() === dayDate.getTime();
    });

    //convert to boolean value.
    const hasWorkout = !!scheduledWorkout;

    //check if found scheduled workout was completed or not.
    let wasCompleted = false;

    if (hasWorkout) {
      wasCompleted = completedSessions.some((session) => {
        const sessionDate = new Date(session.completedAt);

        return (
          session.workoutId === scheduledWorkout.workoutId &&
          sessionDate.getTime() === dayDate.getTime()
        );
      });
    }

    const isToday = dayDate.getTime() === today.getTime();
    const isFuture = dayDate > today;

    return {
      key: keys[index],
      label,
      date: dayDate,
      hasWorkout,
      isFuture,
      isToday,
      wasCompleted,
    };
  });
};

//get icon for each day.
const getDayIcon = (day: DayData) => {
  if (!day.hasWorkout) {
    return <Feather name="circle" size={20} color="#4B5563" />;
  }

  if (day.wasCompleted) {
    return <Feather name="check-circle" size={20} color="#10B981" />;
  }

  if (day.isToday || day.isFuture) {
    return <FontAwesome5 name="fire" size={20} color="#F59E0B" />;
  }

  return <Feather name="x-circle" size={20} color="#EF4444" />;
};

//ACTUAL PAGE COMPONENT.
export default function index() {
  //STATES
  const [isPressed, setIsPressed] = React.useState(false);
  const [calenderDays, setCalenderDays] = useState<DayData[]>([]);
  const [isSelected, setIsSelected] = useState("");
  const router = useRouter();

  //QUERIES.
  const {
    data: ScheduledWorkouts,
    isLoading: scheduledLoading,
    error: scheduledError,
  } = useGetScheduledWorkoutsQuery();
  const {
    data: completedSessions,
    isLoading: LoadingCompleted,
    error: errorCompleted,
  } = useGetCompletedSessionsQuery();
  const {
    data: workoutHistory,
    isLoading: isHistoryLoading,
    error: isHistoryError,
  } = useGetWorkoutSessionHistoryQuery();

  //DAY CALENDAR USE EFFECT.
  useEffect(() => {
    console.log("HERE ARE ALL THE SCHEDULED WORKOUTS", ScheduledWorkouts);
    console.log("HERE ARE ALL THE COMPLETED SESSIONS", completedSessions);
    console.log("HERE IS THE WORKOUT SESSION HISTORY DATA:", workoutHistory);

    if (!scheduledLoading && !LoadingCompleted) {
      //check for errors.
      if (scheduledError || errorCompleted) {
        console.error("error fetching calendar data", {
          scheduled: scheduledError,
          sessions: errorCompleted,
        });

        setCalenderDays(getDayWeek([], [])); //avoids crashing if no scheduled workout/ completed workouts exis.
        return;
      }

      const days = getDayWeek(ScheduledWorkouts || [], completedSessions || []);

      setCalenderDays(days);
    }
  }, [
    ScheduledWorkouts,
    completedSessions,
    scheduledError,
    scheduledLoading,
    errorCompleted,
    LoadingCompleted,
  ]);

  //PROFILE SYNCING USEEFFECT.
  useEffect(() => {
    const syncProfileIfNeeded = async () => {
      //check if user filled in the answers.
      const result = getOnboardingAnswers();

      if (!result.success) return;

      //get the token for backend requests.
      const sessionResults = await authClient.getSession();

      const token = sessionResults.data?.session?.token;
      if (!token) return;

      //call backend to save profile.
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(result.data),
        }
      );

      if (response.ok) {
        resetOnboardingAnswers();
      }
    };

    syncProfileIfNeeded();
  }, []);

  // logout functiomn.
  const handleLogOut = async () => {
    try {
      await authClient.signOut();

      router.replace("/sign-in");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-5">
      {/* SECTION- user profile*/}
      <View className="flex-row items-center justify-between pb-4">
        {/* profile image + name */}
        <Image
          source={userImage}
          className="h-12 w-12 rounded-full"
          resizeMode="contain"
        />

        {/* text */}
        <View className="ml-3 flex-1">
          <Text className="text-lg text-white">
            Hi, <Text className="font-semibold">Thabang</Text>
          </Text>
          <Text className="text-sm text-muted-2">
            Ready to crush your goals?
          </Text>
        </View>

        {/* notification icon */}
        <Feather name="bell" size={23} color="white" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="mt-8 text-lg text-muted-2">Next workout</Text>

        {/* workout card */}
        <View className="relative mt-2 h-[200px] w-full overflow-hidden rounded-3xl bg-primary">
          <Image source={push} className="h-full w-full" resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.9)"]}
            className="absolute inset-0"
          />

          <View className="absolute bottom-5 left-5 right-5 w-[300px] flex-row items-center">
            <View>
              <Text className="text-lg font-semibold text-white">Push Day</Text>
              <Text className="text-muted-2">Chest - Shoulders - Triceps</Text>

              <View className="mt-2 flex-row items-center">
                <Feather name="clock" color="#C7C8BF" size={15} />
                <Text className="ml-2 text-muted-2"> 45 min</Text>
                <FontAwesome5
                  name="dumbbell"
                  color="#C7C8BF"
                  size={15}
                  className="ml-4"
                />
                <Text className="ml-2 text-muted-2"> 320 kcal</Text>
              </View>
            </View>
          </View>

          {/* start workout button */}
          <Pressable
            className={`absolute bottom-5 right-[30px] h-[50px] w-[50px] items-center justify-center rounded-full bg-primary ${
              isPressed ? "opacity-60" : "opacity-100"
            }`}
            onPressIn={() => {
              setIsPressed(true);
              console.log("BUTTON IS PRESSING");
            }}
            onPressOut={() => setIsPressed(false)}
          >
            <Feather name="chevron-right" color="black" size={23} />
          </Pressable>
        </View>
        {/* <Pressable onPress={handleLogOut} className="bg-primary p-5">
          <Text>Log out</Text>
        </Pressable> */}

        {/* workout summary calendar */}
        <Text className="text-md  mt-5 text-muted-2">
          Your training summary
        </Text>
        <View className="mt-4 h-[130px] w-full overflow-hidden rounded-3xl bg-muted/10 px-7 py-4">
          <Text className=" text-white">Scheduled Workouts</Text>

          {/* weekdays */}
          <View className="mt-5 w-full flex-row justify-between">
            {/* map through week days */}
            {calenderDays.map((day) => (
              <View
                key={day.key}
                className="items-center rounded-full border border-muted/20 px-2 py-2"
              >
                {/* label */}
                <View>
                  <Text className="text-muted/50">{day.label}</Text>
                </View>

                {/* icon */}
                <View className="mt-2">{getDayIcon(day)}</View>
              </View>
            ))}
          </View>
        </View>

        {/* SECTION-quick actions */}
        <Text className="text-md mb-3 mt-9 text-muted-2">Quick Actions</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {/* //CARDS */}
          {quickActions.map((action, index) => (
            <Pressable
              key={index}

              onPress={() => {
                (setIsSelected(action.title), router.push(action.href));
              }}
              className={`h-[90px] w-[80px] items-center justify-between rounded-3xl px-2 py-5 ${isSelected === action.title ? "bg-primary/20" : "bg-muted/10 "}`}
            >
              <FontAwesome5
                name={action.icon}
                size={20}
                color={isSelected === action.title ? "#dae86aff" : "#a0a0a0"}
              />
              <Text className="text-muted-2">{action.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* /RECENT WORKOUTS- SECTION */}
        <View className="mt-9 pb-[150px]">
          {/* header */}
          <View className="flex-row items-center justify-between">
            <Text className="text-md text-muted-2">Recent Workouts</Text>

            {/* --to wrap in Link --*/}
            <Text className="text-primary">View All</Text>
          </View>

          {/*map  workout contents */}

          {workoutHistory?.map((wh, idx) => (
            <View
              key={idx}
              className="mt-4 h-[70px] flex-row items-center overflow-hidden rounded-3xl bg-muted/10 pr-4"
            >
              {/* image */}
              <Image
                source={push}
                alt="Workout image"
                resizeMode="cover"
                className="h-full w-20 rounded-3xl"
              />

              {/* text */}
              <View className="ml-4 flex-1">
                <Text className="mb-2 text-white">{wh.workoutName}</Text>
                <Text className="text-muted">
                  {Math.floor(wh.durationSeconds / 60)} min -{" "}
                  {wh.sets[idx].weight} kg
                </Text>
              </View>

              {/* icon */}
              <Feather name="check-circle" color="#dae86aff" size={20} />
            </View>
          ))}
        </View>

        {/*paste here */}
      </ScrollView>
    </SafeAreaView>
  );
}
