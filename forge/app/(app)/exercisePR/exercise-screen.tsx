import type { Exercise } from "@/features/api";
import { useGetExercisesQuery } from "@/features/api";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { FlatList, TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

//type for exercises.

export default function ExerciseScreen() {
  const router = useRouter();
  //QUERIES
  const { data: allExercises, isLoading, isError } = useGetExercisesQuery();

  //STATES
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "muscles" | "equipments" | null
  >(null);

  //filtered exercises.
  const filteredExercises = allExercises?.filter((exercise) => {
    if (selectedFilter === "muscles") {
      return exercise.muscle?.toLowerCase().includes(search.toLowerCase());
    } else if (selectedFilter === "equipments") {
      return exercise.equipment?.toLowerCase().includes(search.toLowerCase());
    }

    return exercise.name.toLowerCase().includes(search.toLowerCase());
  });

  console.log("all exercises:", JSON.stringify(allExercises, null, 2));

  //each exercise item.
  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    return (
      <Pressable
        onPress={() =>
          router.push(`/exercisePR/${item.id}/exerciseDescription`)
        }
        onPressIn={() => setSelected(item.name)}
        onPressOut={() => setSelected("")}
        className={`${selected === item.name ? "bg-muted/10 opacity-50" : "opacity-100"} flex-row items-center rounded-3xl px-3 py-3`}
      >
        {/* exercise image */}
        <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full ">
          <Image
            source={
              item.image?.trim()
                ? { uri: item.image.trim() }
                : require("../../../assets/images/app-images/logo.png")
            }
            className="h-full w-full"
            resizeMode="cover"
          />
        </View>

        {/* text */}
        <View className="ml-3 flex-1">
          <Text className="text-white">{item.name}</Text>
          <Text className="text-sm text-muted-2">{item.muscle}</Text>
        </View>

        {/* info icon */}
        <Feather name="info" size={20} color="#6B7280" />
      </Pressable>
    );
  };
  return (
    <SafeAreaView className="flex-1 bg-background px-5">
      {/* header */}
      <View className="flex-row items-center py-3">
        <Pressable
          onPress={() => router.replace("/(app)/(tabs)")}
          hitSlop={10}
          className="z-10 h-12 w-12 items-center justify-center"
        >
          <Feather name="arrow-left" size={24} color="white" />
        </Pressable>

        <Text
          pointerEvents="none"
          className="absolute left-0 right-0 text-center text-lg font-semibold text-white"
        >
          Add exercise
        </Text>
      </View>

      {/* filters */}
      {/* search bar */}
      <View className="mt-3 flex-row items-center rounded-2xl bg-muted/10 px-4 py-2">
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search exercises"
          placeholderTextColor="#6B7280"
          className="ml-5  text-lg text-white"
          selectionColor="#dae86aff"
        />
      </View>

      {/* pills */}
      <View className="mt-3 flex-row gap-3">
        <Pressable
          onPress={() => setSelectedFilter("muscles")}
          className={`flex-1 items-center rounded-2xl py-3 ${
            selectedFilter === "muscles" ? "bg-primary/20" : "bg-muted/10"
          }`}
        >
          <Text
            className={
              selectedFilter === "muscles" ? "text-primary" : "text-white"
            }
          >
            Muscles
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setSelectedFilter("equipments")}
          className={`flex-1 items-center rounded-2xl py-3 ${
            selectedFilter === "equipments" ? "bg-primary/20" : "bg-muted/10"
          }`}
        >
          <Text
            className={
              selectedFilter === "equipments" ? "text-primary" : "text-white"
            }
          >
            Equipment
          </Text>
        </Pressable>
      </View>
      {/* flatlist */}
      <FlatList
        data={filteredExercises ?? allExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}
