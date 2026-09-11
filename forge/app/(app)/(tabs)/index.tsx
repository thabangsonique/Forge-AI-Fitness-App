import {
  getOnboardingAnswers,
  resetOnboardingAnswers,
} from "@/constants/onboarding";
import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function index() {
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
    <SafeAreaView>
      <View>
        <Text>Home page</Text>
        <Pressable onPress={handleLogOut} className="bg-primary p-5">
          <Text>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
