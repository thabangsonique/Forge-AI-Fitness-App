import { useGetExercisesQuery } from "@/features/api";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ExerciseDescription() {
  //STATES
  const [selected, setSelected] = useState("");
  const [muscleModal, setMuscleModalOpen] = useState(false);
  //QUERIES
  const { id } = useLocalSearchParams();
  const { data: allExercises, isLoading, isError } = useGetExercisesQuery();
  const exercise = allExercises?.find((exercise) => exercise.id === id);
  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-5">
      <ScrollView>
        {/* header */}
        <View className="flex-row items-center py-3">
          <Pressable
            hitSlop={10}
            onPress={() => router.back()}
            className="z-10"
          >
            <Feather name="arrow-left" size={24} color="white" />
          </Pressable>

          <Text className="absolute left-0 right-0 text-center text-lg font-semibold text-white">
            {exercise?.name}
          </Text>
        </View>

        {/* exercise image */}
        <View className="mt-2 overflow-hidden rounded-3xl">
          <Image
            source={
              exercise?.image?.trim()
                ? {
                    uri: exercise?.image.trim(),
                  }
                : require("../../../../assets/images/app-images/logo.png")
            }
            className=" h-[300px]"
            resizeMode="cover"
          />
        </View>

        <Pressable
          onPress={() => setMuscleModalOpen(true)}
          onPressIn={() => setSelected("muscle-modal")}
          onPressOut={() => setSelected("")}
          className={`${selected === "muscle-modal" ? "opacity-50" : "opacity-100"} mt-4 h-[40px] w-full items-center justify-center rounded-full bg-primary`}
        >
          <Text>View Muscles Worked</Text>
        </Pressable>

        {/* description details */}
        <Text className="mt-5 text-lg font-bold text-white">Instructions</Text>
        <View className="gap-4">
          {exercise?.instruction.map((item, index) => (
            <Text className="tracking-wider text-muted/80">
              {index + 1}. {item}
            </Text>
          ))}
        </View>

        {/* muscles worked */}
        <Text className="mt-5 text-lg font-bold text-white">
          Muscles Worked
        </Text>
      </ScrollView>

      {/* muscle modal */}

      <Modal
        visible={muscleModal}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setMuscleModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          {/* actual modal */}
          <View className="h-[200px]  rounded-t-2xl bg-card-background">
            {/* header */}
            <Text className="text-center text-white">Muscled Worked</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
