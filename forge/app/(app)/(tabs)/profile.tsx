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
import ProfileRow from "@/components/ui/profile/profile-row";
import ProfileSection from "@/components/ui/profile/profile-section";
import {
  useGetCompletedSessionsQuery,
  useGetPersonalRecordsQuery,
  useGetUserStatsQuery,
} from "@/features/api";
import { authClient, useSession } from "@/lib/auth-client";
import { formatTrainedTime } from "@/utils/formatDuration";

type ProfileDetails = {
  gender: string;
  goal: string;
  experience: string;
  workoutsPerWeek: number;
  weightUnit: string;
};

// TODO: replace with API hook - profile fields are read from the stats payload until a standalone profile query exists.
const PROFILE_PLACEHOLDER: ProfileDetails = {
  gender: "Not set",
  goal: "Not set",
  experience: "Not set",
  workoutsPerWeek: 0,
  weightUnit: "kg",
};

// TODO: replace with API hook - AI plan usage is not exposed through RTK Query yet.
const AI_PLAN_PLACEHOLDER = {
  tier: "Free",
  trialDaysLeft: 0,
  insightsLeft: 0,
  workoutGenerationsLeft: 0,
};

const formatProfileValue = (value: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Not set";
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const formatDays = (days: number) => `${days} ${days === 1 ? "day" : "days"}`;

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
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    refetch: refetchStats,
  } = useGetUserStatsQuery(undefined, { skip: !userId });

  const {
    data: completedSessions,
    isLoading: isSessionsLoading,
    isError: isSessionsError,
    refetch: refetchSessions,
  } = useGetCompletedSessionsQuery(undefined, { skip: !userId });

  const {
    data: personalRecords,
    isLoading: isRecordsLoading,
    isError: isRecordsError,
    refetch: refetchRecords,
  } = useGetPersonalRecordsQuery(undefined, { skip: !userId });

  const isLoading =
    isSessionLoading ||
    (Boolean(userId) &&
      (isStatsLoading || isSessionsLoading || isRecordsLoading));
  const hasError =
    Boolean(sessionError) || isStatsError || isSessionsError || isRecordsError;

  const displayName = session?.user?.name?.trim() || "Athlete";
  const displayEmail = session?.user?.email?.trim() || "No email";

  const profile: ProfileDetails =
    stats?.overview?.userProfile ?? PROFILE_PLACEHOLDER;
  const weeklyTarget = profile.workoutsPerWeek || 0;
  const weeklyTargetLabel = `${weeklyTarget} ${
    weeklyTarget === 1 ? "workout" : "workouts"
  } / week`;

  const totalWorkouts = stats?.overview?.totalWorkout ?? 0;
  const totalSessions =
    stats?.overview?.completedSession?.totalSessions ?? 0;
  const totalTrainedSeconds =
    stats?.overview?.completedSession?.totalDurationSeconds ?? 0;
  const totalPersonalRecords = personalRecords?.hero?.totalPRs ?? 0;

  const sessionsThisWeek = React.useMemo(() => {
    if (!completedSessions?.length) {
      return 0;
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return completedSessions.filter((item) => {
      const completedAt = new Date(item.completedAt);

      return (
        !Number.isNaN(completedAt.getTime()) &&
        completedAt >= startOfWeek &&
        completedAt < endOfWeek
      );
    }).length;
  }, [completedSessions]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleRetry = () => {
    refetchSession();

    if (userId) {
      refetchStats();
      refetchSessions();
      refetchRecords();
    }
  };

  const handleSignIn = () => {
    router.replace("/sign-in");
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      router.replace("/welcome");
    }
  };

  // TODO: wire each row to the edit modal once field updates are implemented.
  const handleEditField = (fieldName: string) => {
    void fieldName;
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
          <>
            <ProfileSection title="Personal">
              <ProfileRow
                label="Name"
                value={displayName}
                valueTone="strong"
              />
              <ProfileRow label="Email" value={displayEmail} />
              <ProfileRow
                label="Gender"
                value={formatProfileValue(profile.gender)}
                valueTone="strong"
                onPress={() => handleEditField("gender")}
              />
            </ProfileSection>

            <ProfileSection title="Training">
              <ProfileRow
                label="Goal"
                value={formatProfileValue(profile.goal)}
                valueTone="strong"
                onPress={() => handleEditField("goal")}
              />
              <ProfileRow
                label="Experience"
                value={formatProfileValue(profile.experience)}
                valueTone="strong"
                onPress={() => handleEditField("experience")}
              />
              <ProfileRow
                label="Weekly target"
                value={weeklyTargetLabel}
                valueTone="strong"
                onPress={() => handleEditField("workoutsPerWeek")}
              />
              <ProfileRow
                label="Weight unit"
                value={profile.weightUnit}
                valueTone="strong"
                onPress={() => handleEditField("weightUnit")}
              />
            </ProfileSection>

            <ProfileSection title="Progress">
              <ProfileRow
                icon={<Feather name="activity" size={20} color="white" />}
                label="Total workouts"
                value={String(totalWorkouts)}
                valueTone="strong"
              />
              <ProfileRow
                icon={<Feather name="check-circle" size={20} color="white" />}
                label="Sessions completed"
                value={String(totalSessions)}
                valueTone="strong"
              />
              <ProfileRow
                icon={<Feather name="clock" size={20} color="white" />}
                label="Total trained time"
                value={formatTrainedTime(totalTrainedSeconds)}
                valueTone="strong"
              />
              <ProfileRow
                icon={<Feather name="award" size={20} color="white" />}
                label="Personal records"
                value={String(totalPersonalRecords)}
                valueTone="strong"
              />
              <ProfileRow
                icon={<Feather name="calendar" size={20} color="white" />}
                label="This week"
                value={`${sessionsThisWeek} of ${weeklyTarget} sessions`}
                valueTone="strong"
              />

              {totalSessions === 0 ? (
                <View className="px-4 pb-4 pt-1">
                  <Text className="text-sm text-muted-3">
                    No sessions yet. Complete a workout to start tracking your
                    progress.
                  </Text>
                </View>
              ) : null}
            </ProfileSection>

            <ProfileSection title="AI Plan">
              <ProfileRow
                icon={
                  <Feather name="zap" size={20} color="greenyellow" />
                }
                label="Plan"
                value={AI_PLAN_PLACEHOLDER.tier}
                valueTone="strong"
              />
              <ProfileRow
                icon={
                  <Feather name="clock" size={20} color="greenyellow" />
                }
                label="Trial days left"
                value={formatDays(AI_PLAN_PLACEHOLDER.trialDaysLeft)}
              />
              <ProfileRow
                icon={
                  <Feather
                    name="message-circle"
                    size={20}
                    color="greenyellow"
                  />
                }
                label="Insights left"
                value={String(AI_PLAN_PLACEHOLDER.insightsLeft)}
              />
              <ProfileRow
                icon={
                  <Feather name="activity" size={20} color="greenyellow" />
                }
                label="Workout generations left"
                value={String(AI_PLAN_PLACEHOLDER.workoutGenerationsLeft)}
              />
            </ProfileSection>

            <ProfileSection title="Account">
              <ProfileRow
                destructive
                icon={<Feather name="log-out" size={20} color="red" />}
                label="Sign out"
                onPress={handleSignOut}
                showChevron={false}
              />
            </ProfileSection>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
