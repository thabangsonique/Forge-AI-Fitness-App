import { useGetPersonalRecordsQuery } from "@/features/api";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_COLOR = "#D8FF00";
const MUTED_COLOR = "#A3A3A3";

export default function PrScreen() {
  const router = useRouter();
  //states
  const [selected, setSelected] = useState("");
  // Query
  const {
    data: recordsData,
    isLoading,
    isError,
    isFetching,
    error,
  } = useGetPersonalRecordsQuery();

  console.log("PR data:", recordsData);
  console.log("Loading:", isLoading);
  console.log("Fetching:", isFetching);
  console.log("Error:", error);

  const heroStats = recordsData?.hero;
  const records = recordsData?.records;

  // Loading state
  if (isLoading) {
    return (
      <View className="items-center justify-center p-5">
        <ActivityIndicator color={PRIMARY_COLOR} />
        <Text className="mt-3 text-muted-2">Loading personal records...</Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-center text-white">
          Failed to load personal records.
        </Text>
      </View>
    );
  }

  // Empty state
  if (!recordsData) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-center text-white">
          No personal record data available yet.
        </Text>
      </View>
    );
  }

  // List header
  const renderHeader = () => (
    <View>
      <Text className="text-xl font-bold text-white">Personal Records</Text>

      <Text className="text-sm text-muted-2/70">
        Your strongest performances
      </Text>

      {/* Summary cards */}
      <View className="mb-4 mt-4 flex-row items-center justify-center gap-2">
        {/* Total PRs */}
        <View className="h-[100px] w-[100px] items-center justify-center gap-2 rounded-3xl bg-muted/10 px-2">
          <Text className="text-muted">Total PRs</Text>

          <Text className="text-xl font-bold text-primary">
            {heroStats?.totalPRs ?? 0}
          </Text>

          <Text className="text-center text-sm text-muted-2/70">
            Total records
          </Text>
        </View>

        {/* Recent PRs */}
        <View className="h-[100px] w-[100px] items-center justify-center gap-2 rounded-3xl bg-muted/10 px-2">
          <Text className="text-muted">This month</Text>

          <Text className="text-xl font-bold text-primary">
            {heroStats?.last30Days ?? 0}
          </Text>

          <Text className="text-center text-sm text-muted-2/70">
            New records
          </Text>
        </View>

        {/* Strongest PR */}
        <View className="h-[100px] w-[100px] items-center justify-center gap-2 rounded-3xl bg-muted/10 px-2">
          <Text className="text-muted">Strongest</Text>

          <Text className="text-xl font-bold text-primary">
            {heroStats?.strongest?.currentPR ?? 0} kg
          </Text>

          <Text
            className="text-center text-sm text-muted-2/70"
            numberOfLines={2}
          >
            {heroStats?.strongest?.exerciseName ?? "No records yet"}
          </Text>
        </View>
      </View>

      {/* Recent records heading */}
      <View className="mb-5 mt-4 flex-row items-center justify-between">
        <Text className=" text-lg font-bold text-white">Recent PRs</Text>

        <Pressable>
          <Text className="text-primary">View All</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1">
      <FlatList
        data={records?.slice(0, 3) ?? []}
        keyExtractor={(item) => item.exerciseId}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => {
          // Format the PR date safely
          const prDate = item.prDate
            ? new Date(item.prDate).toLocaleDateString("en-ZA", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "No date";

          return (
            <Pressable
              onPress={() => router.push(`/exercisePR/${item.exerciseId}`)}
              onPressIn={() => setSelected(item.exerciseName)}
              onPressOut={() => setSelected("")}
              className={`${selected === item.exerciseName ? "opacity-50" : "opacity-100"} mb-4 flex-row items-center rounded-3xl bg-muted/10 px-2 py-2`}
            >
              {/* Exercise icon */}
              <FontAwesome5 name="dumbbell" size={20} color={MUTED_COLOR} />

              {/* Exercise details */}
              <View className="ml-4 flex-1">
                <Text className="mb-1 text-muted-2/70">
                  {item.exerciseName}
                </Text>

                <View className="flex-row items-center justify-between">
                  <Text className="mb-1 text-white">{item.currentPR} kg</Text>

                  {/* PR improvement */}
                  <View className="flex-row items-center gap-2">
                    {item.delta != null && item.delta > 0 && (
                      <FontAwesome5 name="arrow-up" size={12} color="#DAE86A" />
                    )}

                    <Text className="text-primary">
                      {item.delta != null
                        ? `${item.delta > 0 ? "+" : ""}${item.delta}`
                        : "—"}
                    </Text>
                  </View>
                </View>

                {/* Record date */}
                <Text className="text-xs text-muted">{prDate}</Text>
              </View>

              {/* Right chevron */}
              <FontAwesome5
                name="chevron-right"
                size={14}
                color="#DAE86A"
                style={{ marginLeft: 20 }}
              />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text className="py-6 text-center text-muted-2">
            No personal records yet. Complete a workout to get started.
          </Text>
        }
      />
    </SafeAreaView>
  );
}
