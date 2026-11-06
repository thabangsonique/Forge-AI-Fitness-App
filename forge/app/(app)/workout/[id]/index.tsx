import {
  useDeleteWorkoutMutation,
  useGetAllWorkoutsQuery,
} from "@/features/api";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const userImage = require("../../../../assets/images/app-images/user-profile.png");
const push = require("../../../../assets/images/app-images/push.jpeg");
const pull = require("../../../../assets/images/app-images/pull.png");
const legs = require("../../../../assets/images/app-images/Legs.png");
const arm = require("../../../../assets/images/app-images/arm.png");
const shoulder = require("../../../../assets/images/app-images/shoulder.png");
const anatomy = require("../../../../assets/images/app-images/anatomy.png");
const logo = require("../../../../assets/images/app-images/logo.png");
const gBackground = require("../../../../assets/images/app-images/gradient.png");

const CATEGORY_IMAGES: Record<string, ImageSourcePropType> = {
  push: push,
  pull: pull,
  arms: arm,
  legs: legs,
  shoulders: shoulder,
  quads: legs,
  "push-pull": push,
  "full body": anatomy,
};

export default function Workout() {
  const [isSelected, setIsSelected] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: allWorkouts, isLoading } = useGetAllWorkoutsQuery();
  const [deleteWorkout, { isLoading: isDeleting }] = useDeleteWorkoutMutation();

  const workout = allWorkouts?.find((w) => w.id === id);
  const isOwned = workout?.workoutType === "user";
  // console.log("RESULTS", JSON.stringify(workout, null, 2));

  if (isLoading) {
    <SafeAreaView className="flex-1 items-center justify-center">
      <ActivityIndicator />
    </SafeAreaView>;
  }

  //NEXT WORKOUT IMAGE.
  const resolveWorkoutImage = (
    category?: string | null,
    image?: string | null
  ): ImageSourcePropType => {
    const categoryImage = CATEGORY_IMAGES[category?.trim().toLowerCase() ?? ""];

    if (categoryImage) {
      return categoryImage;
    }

    //for system workouts
    const systemWorkout = image?.trim();
    return systemWorkout ? { uri: systemWorkout } : logo;
  };

  const handleEdit = () => {
    if (!workout) return;

    setMenuOpen(false);

    router.push({
      pathname: "/(app)/(tabs)/create",
      params: {
        editId: workout.id,
      },
    });
  };

  const handleDelete = async () => {
    if (!workout) return;

    try {
      await deleteWorkout(workout.id).unwrap();

      setDeleteModalOpen(false);
      setMenuOpen(false);

      router.back();
    } catch (error: any) {
      setDeleteModalOpen(false);

      Alert.alert(
        "Unable to delete workout",
        error?.data?.error ?? "Something went wrong. Please try again."
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background pb-4">
      {/* image container */}
      <View className="relative overflow-hidden ">
        <Image
          source={resolveWorkoutImage(workout?.workoutCategory, workout?.image)}
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
          <Pressable
            onPress={() => setMenuOpen(true)}
            className="h-[30px] w-[30px] items-center justify-center rounded-full bg-primary "
          >
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
              <Image
                source={
                  item.image?.trim()
                    ? { uri: item.image.trim() }
                    : require("../../../../assets/images/app-images/logo.png")
                }
                className="h-full w-full"
                resizeMode="cover"
              />
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

      {/* OPTIONS MENU */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          onPress={() => setMenuOpen(false)}
          className="flex-1 justify-end bg-black/70"
        >
          <Pressable
            onPress={() => {}}
            className="rounded-t-3xl border-t border-primary/20 bg-background px-5 pb-10 pt-5"
          >
            <View className="mb-5 w-full items-center justify-center">
              <View className="h-[5px] w-[100px] rounded-full bg-muted-2/25" />
            </View>

            <Text className="mb-4 font-bold text-white">{workout?.name}</Text>

            {isOwned ? (
              <>
                <Pressable
                  onPress={handleEdit}
                  className="flex-row items-center gap-3 rounded-2xl bg-muted-2/10 px-4 py-4"
                >
                  <Feather name="edit-2" size={18} color="#D8FF00" />
                  <Text className="text-white">Edit workout</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setMenuOpen(false);
                    setDeleteModalOpen(true);
                  }}
                  className="mt-3 flex-row items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-4"
                >
                  <Feather name="trash-2" size={18} color="#F87171" />
                  <Text className="text-red-400">Delete workout</Text>
                </Pressable>
              </>
            ) : (
              <View className="flex-row items-center gap-3 rounded-2xl bg-muted-2/10 px-4 py-4">
                <Feather name="lock" size={18} color="#888" />
                <Text className="max-w-[200px] text-muted-2">
                  This is a system workout and cannot be edited.
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => setMenuOpen(false)}
              className="mt-5 items-center rounded-2xl bg-primary py-3"
            >
              <Text>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal
        visible={deleteModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalOpen(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/80 px-5">
          <View className="w-full rounded-3xl border border-white/10 bg-neutral-900 p-6">
            <Text className="text-xl font-bold text-white">
              Delete workout?
            </Text>

            <Text className="mt-2 text-muted-2/70">
              {workout?.name} will be permanently deleted. This cannot be
              undone.
            </Text>

            <View className="mt-6 flex-row justify-between gap-3">
              <Pressable
                onPress={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 items-center rounded-xl bg-white py-3"
              >
                <Text>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleDelete}
                disabled={isDeleting}
                className="flex-1 items-center rounded-xl bg-red-500 py-3"
              >
                {isDeleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-bold text-white">Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
