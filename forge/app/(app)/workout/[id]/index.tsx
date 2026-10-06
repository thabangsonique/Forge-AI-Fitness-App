import { useGetAllWorkoutsQuery } from "@/features/api";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Workout() {
  const [isSelected, setIsSelected] = useState("");
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: allWorkouts, isLoading } = useGetAllWorkoutsQuery();

  const workout = allWorkouts?.find((w) => w.id === id);
  console.log("RESULTS", workout);
  if (isLoading) {
    <SafeAreaView className="flex-1 items-center justify-center">
      <ActivityIndicator />
    </SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-background pb-4">
      {/* image container */}
      <View className="relative overflow-hidden ">
        <Image
          source={{ uri: workout?.image }}
          className="h-[300px] w-full"
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(11,12,10,1)"]}
          className="absolute inset-0"
        />
        <LinearGradient
          colors={["rgba(11,12,10,0.9)", "transparent"]}
          className="absolute top-0 h-[80px] w-full"
        />
        <LinearGradient
          colors={["black", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          className="absolute bottom-0 left-0 right-[100px] h-full"
        />

        <View className=" absolute left-0 right-[100px]" />
        {/* header */}
        <View className="absolute top-[50px] w-full flex-row items-center justify-between px-5">
          {/* back button */}
          <Pressable
            onPress={() => {
              (setIsSelected("back"), router.back());
            }}
            className={`${isSelected === "back" ? "opacity-0.5" : "opacity-1"} h-[30px] w-[30px] items-center justify-center rounded-full bg-primary`}
          >
            <Feather name="arrow-left" size={20} color="#000" />
          </Pressable>
          <Pressable className="h-[30px] w-[30px] items-center justify-center rounded-full bg-primary ">
            <Feather name="more-horizontal" color="#000" size={20} />
          </Pressable>
        </View>

        {/* content */}
        <View className="absolute bottom-[30px] z-10 w-full px-5">
          {/* category */}
          <View className="w-[80px] items-center justify-center rounded-xl bg-primary/30">
            <Text className="text-xs text-white">
              {workout?.workoutCategory}
            </Text>
          </View>
          <Text className="text-lg text-white">{workout?.name}</Text>
          <Text className="text-lg text-muted-2/40">
            {workout?.description}
          </Text>
        </View>
      </View>

      {/* EXERCISES */}
      <View className="mb-3 mt-8 flex-row items-center justify-between px-5">
        <Text className="text-white">Exercises</Text>
        <Text className="text-muted-2/50">
          {workout?.exercises.length} Exercises
        </Text>
      </View>

      <FlatList
        data={workout?.exercises}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, padding: 15 }}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between rounded-3xl border-b-[0.5px] border-muted-2/5 pb-3">
            {/* image */}
            <View className="h-[80px] w-[80px] overflow-hidden rounded-2xl bg-muted-2/50">
              <Text className="text-white">Image Here</Text>
            </View>

            {/* exercise text */}
            <View className="ml-4 w-[50px] flex-1">
              <Text className="text-white">{item.name}</Text>
              <Text className="text-sm text-muted-2">
                {item.sets} sets - {item.reps} reps
              </Text>
            </View>

            {/* check icon- to add exercise */}
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Feather name="check" size={15} color="#000" />
            </View>

            {/* bottom border line */}
          </View>
        )}
      />
      <View className="h-[45px] w-full px-[15px] ">
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/workout/[id]/live",
              params: {
                id: id,
              },
            })
          }
          onPressIn={() => setIsSelected("start")}
          onPressOut={() => setIsSelected("")}
          className={` ${isSelected === "start" ? "opacity-60" : "opacity-100"} h-full w-full flex-row items-center justify-between rounded-3xl bg-primary pl-[100px] pr-[30px]`}
        >
          <Text>Start Workout</Text>
          <FontAwesome5 name="play" size={15} color="#000" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
