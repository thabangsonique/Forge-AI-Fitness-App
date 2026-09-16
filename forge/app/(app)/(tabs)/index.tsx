import {
  getOnboardingAnswers,
  resetOnboardingAnswers,
} from "@/constants/onboarding";
import { authClient } from "@/lib/auth-client";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const userImage = require("../../../assets/images/app-images/user-profile.png");
const push = require("../../../assets/images/app-images/push.jpeg");

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
export default function index() {
  const [isPressed, setIsPressed] = React.useState(false);

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
      <View>
        {/* user profile section*/}
        <View className="flex-row items-center justify-between">
          {/* profile image + name */}
          <Image
            source={userImage}
            className="h-12 w-12 rounded-full"
            resizeMode="contain"
          />

          {/* text */}
          <View className="ml-2 flex-1">
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

        <Text className="mt-8 text-lg text-white">Next workout</Text>

        {/* workout card */}
        <View className="relative mt-2 h-[200px] w-full overflow-hidden rounded-2xl bg-primary">
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
      </View>

      {/* workout summary calendar */}
      <Text className="mt-4 text-white">Your training summary</Text>
      <View className="mt-4 h-[100px] w-full overflow-hidden rounded-2xl bg-muted/10 px-7 py-4">
        <Text className="font-bold text-white">Workouts</Text>

        {/* weekdays */}
        <View className="mt-5 w-full flex-row justify-between">
          {weekDays.map((day, idx) => (
            <View
              key={idx}
              className="flex rounded-full border border-muted/20 p-3"
            >
              <Text className="text-white">{day}</Text>
              {}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}
