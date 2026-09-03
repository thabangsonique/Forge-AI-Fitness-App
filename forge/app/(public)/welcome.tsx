import {
  View,
  Text,
  ImageBackground,
  Image,
  Pressable,
  StatusBar,
} from "react-native";
import React, { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect } from "expo-router";

const bgImg = require("../../assets/images/app-images/welcome-img.png");
const mockup = require("../../assets/images/app-images/mockup.png");
const logo = require("../../assets/images/app-images/logo-full(2).png");

useFocusEffect(
  useCallback(() => {
    const entry = StatusBar.pushStackEntry({
      backgroundColor: "#DFFF00",
      barStyle: "light-content",
      translucent: false,
    });

    return () => StatusBar.popStackEntry(entry);
  }, []),
);
export default function welcome() {
  return (
    <ImageBackground source={bgImg} className="flex-1" resizeMode="cover">
      {/* overlay layer */}
      <View className="absolute inset-0 bg-black/50" />
      <SafeAreaView className="flex-1 justify-between px-6">
        {/* logo section */}
        <View className="items-center mt-56">
          <Image source={logo} className="size-60" resizeMode="contain" />

          {/* slogan text */}
          {/* <View className="flex mt-4">
            <Text className="text-white mb-2 ">Be stronger.</Text>
            <Text className="text-white mb-2">Be healthier.</Text>
            <Text className="text-primary mb-2">Be your best.</Text>
          </View> */}

          {/* description */}
          <Text
            className="text-muted-2 text-center mt-14"
            style={{ lineHeight: 20 }}
          >
            Your personalized fitness journey starts here. Precision training
            designed for elite performance.
          </Text>

          {/* buttons */}
          <Link
            href={{
              pathname: "/onboarding/[step]",
              params: { step: "gender" },
            }}
          >
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
              className="bg-primary mt-10 flex-row justify-center items-center rounded-full py-3 w-full "
            >
              <Text className="text-lg">Get Started</Text>
              <Ionicons name="arrow-forward" />
            </Pressable>
          </Link>
          <Pressable
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
            className="border border-primary mt-5 flex-row justify-center items-center rounded-full py-3 w-full "
          >
            <Text className="text-lg text-white">Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
