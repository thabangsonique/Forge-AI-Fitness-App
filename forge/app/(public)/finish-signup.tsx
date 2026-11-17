import { authClient } from "@/lib/auth-client";
import { completeOnboardingAfterAuth } from "@/lib/onboarding-completion";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FinishSignUp() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const finish = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const completion = await completeOnboardingAfterAuth();

    if (completion.success) {
      router.replace("/reminders");
      return;
    }

    if (completion.missingAnswers) {
      const session = await authClient.getSession();
      router.replace(session.data?.session ? "/(app)/(tabs)" : "/sign-up");
      return;
    }

    setError(completion.error ?? "Could not save your plan.");
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    finish();
  }, [finish]);

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 items-center justify-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Feather color="#DAE86A" name="zap" size={34} />
        </View>

        <Text className="mt-6 text-center text-2xl font-bold text-white">
          Saving your plan
        </Text>
        <Text className="mt-2 max-w-xs text-center text-sm leading-6 text-muted/50">
          We&apos;re setting up your profile, starter workout, and training
          days.
        </Text>

        {isLoading ? (
          <ActivityIndicator className="mt-8" color="#DAE86A" size="large" />
        ) : (
          <View className="mt-8 w-full">
            <Text className="text-center text-sm text-red-400">{error}</Text>

            <Pressable
              className="mt-6 w-full items-center rounded-full bg-primary py-3"
              onPress={finish}
            >
              <Text className="text-lg font-bold text-black">Try again</Text>
            </Pressable>

            <Pressable
              className="mt-4 items-center py-2"
              onPress={() => router.replace("/sign-in")}
            >
              <Text className="text-sm text-muted/40">
                Back to sign in
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
