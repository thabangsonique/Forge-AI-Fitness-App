import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const bgImg = require("../../assets/images/app-images/welcome-img.png");
const mockup = require("../../assets/images/app-images/mockup.png");
const logo = require("../../assets/images/app-images/logo-full(2).png");

export default function welcome() {
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      const entry = StatusBar.pushStackEntry({
        backgroundColor: "#DFFF00",
        barStyle: "light-content",
        translucent: false,
      });

      return () => StatusBar.popStackEntry(entry);
    }, [])
  );

  //sign in.

  return (
    <ImageBackground source={bgImg} className="flex-1" resizeMode="cover">
      {/* overlay layer */}
      <View className="absolute inset-0 bg-black/50" />
      <SafeAreaView className="flex-1 justify-between px-6">
        {/* logo section */}
        <View className="mt-56 items-center">
          <Image source={logo} className="size-60" resizeMode="contain" />

          {/* slogan text */}
          {/* <View className="flex mt-4">
            <Text className="text-white mb-2 ">Be stronger.</Text>
            <Text className="text-white mb-2">Be healthier.</Text>
            <Text className="text-primary mb-2">Be your best.</Text>
          </View> */}

          {/* description */}
          <Text
            className="mt-14 text-center text-muted-2"
            style={{ lineHeight: 20 }}
          >
            Your personalized fitness journey starts here. Precision training
            designed for elite performance.
          </Text>

          {/* buttons */}
          {/* <Link
            href={{
              pathname: "/onboarding/[step]",
              params: { step: "gender" },
            }}
            asChild
          > */}
          <Pressable
            onPress={() => {
              console.log("BUTTON PRESSED");

              router.push({
                pathname: "/onboarding/[step]",
                params: { step: "gender" },
              });
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
            className="mt-10 w-full flex-row items-center justify-center rounded-full bg-primary py-3 "
          >
            <Text className="text-lg">Get Started</Text>
            <Ionicons name="arrow-forward" />
          </Pressable>
          {/* </Link> */}

          <Pressable
            onPress={() => router.push("/sign-in")}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
            className="mt-5 w-full flex-row items-center justify-center rounded-full border border-primary py-3 "
          >
            <Text className="text-lg text-white">Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
