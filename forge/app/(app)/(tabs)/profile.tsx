import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfileHeader from "@/components/ui/profile/profile-header";
import { useGetUserStatsQuery } from "@/features/api";
import { useSession } from "@/lib/auth-client";

export default function Profile() {
  const router = useRouter();
  const {
    data: session,
    isPending: isSessionLoading,
    error: sessionError,
    refetch: refetchSession,
  } = useSession();

  const userId = session?.user?.id;

  const {
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useGetUserStatsQuery(undefined, { skip: !userId });

  const isLoading = isSessionLoading || (Boolean(userId) && isStatsLoading);
  const hasError = Boolean(sessionError) || isStatsError;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleRetry = () => {
    refetchSession();

    if (userId) {
      refetchStats();
    }
  };

  const handleSignIn = () => {
    router.replace("/sign-in");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 150,
        }}
      >
        <ProfileHeader
          canGoBack={router.canGoBack()}
          createdAt={session?.user?.createdAt}
          email={session?.user?.email}
          image={session?.user?.image}
          name={session?.user?.name}
          onBack={handleBack}
        />

        {isLoading ? (
          <View className="mt-8 h-40 items-center justify-center">
            <ActivityIndicator className="text-primary" />
            <Text className="mt-3 text-sm text-muted-2">
              Loading your profile...
            </Text>
          </View>
        ) : !session ? (
          <View className="mt-8 items-center rounded-3xl bg-muted/10 px-5 py-8">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Feather name="lock" size={22} color="white" />
            </View>

            <Text className="mt-4 text-center text-base font-semibold text-white">
              You are signed out
            </Text>
            <Text className="mt-2 text-center text-sm text-muted-2">
              Sign in to view your profile and training details.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={handleSignIn}
              className="mt-5 flex-row items-center rounded-full bg-primary px-5 py-3 active:opacity-60"
            >
              <Text className="text-sm font-semibold text-black">Sign in</Text>
              <Feather name="arrow-right" size={16} color="black" />
            </Pressable>
          </View>
        ) : hasError ? (
          <View className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3">
            <Text className="text-sm text-red-400">
              We could not load your profile. Please try again.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={handleRetry}
              className="mt-3 self-start rounded-full bg-red-500/15 px-4 py-2 active:opacity-60"
            >
              <Text className="text-sm font-semibold text-red-400">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View className="mt-8 rounded-3xl bg-muted/10 px-5 py-6">
            <Text className="text-center text-sm text-muted-2">
              Your personal and fitness details will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
