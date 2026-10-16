import {
  defaultZoom,
  MuscleId,
  muscleZoomConfig,
} from "@/constants/data/muscleConfig";
import { ExerciseBreakedown } from "@/features/api";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import MuscleHypertrophy from "./graphs/muscleHypertrophy";
import MusclePieChart from "./graphs/musclePieChart";

const muscleGroups = [
  { id: "all", name: "All" },
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "lats", name: "Lats" },
  { id: "shoulders", name: "Shoulders" },
  { id: "biceps", name: "Biceps" },
  { id: "triceps", name: "Triceps" },

  { id: "abs", name: "Abs" },

  { id: "quadriceps", name: "Quadriceps" },
  { id: "hamstrings", name: "Hamstrings" },
  { id: "glutes", name: "Glutes" },
  { id: "calves", name: "Calves" },

  { id: "traps", name: "Traps" },
  { id: "lower-back", name: "Lower Back" },
  { id: "mid-back", name: "Mid Back" },
] as const;

interface MuscleScreenProps {
  muscleStats?: ExerciseBreakedown;
  isLoading: boolean;
  isError: boolean;
}

// highlight muscle
const muscleImages: Record<MuscleId, number> = {
  all: require("../../assets/images/app-images/anatomy.png"),
  chest: require("../../assets/images/app-images/chest-highlight.png"),
  back: require("../../assets/images/app-images/back-highlight.png"),
  lats: require("../../assets/images/app-images/lats-highlight.png"),
  shoulders: require("../../assets/images/app-images/shoulder-highlight.png"),
  biceps: require("../../assets/images/app-images/bicep-highlight.png"),
  triceps: require("../../assets/images/app-images/tricep-highlight.png"),
  abs: require("../../assets/images/app-images/abs-highlight.png"),
  quadriceps: require("../../assets/images/app-images/quads-highlight.png"),
  hamstrings: require("../../assets/images/app-images/hamstring-highlight.png"),
  glutes: require("../../assets/images/app-images/glutes-highlight.png"),
  calves: require("../../assets/images/app-images/calves-highlight.png"),

  traps: require("../../assets/images/app-images/traps-highlight.png"),
  "lower-back": require("../../assets/images/app-images/lower-back-highlight.png"),
  "mid-back": require("../../assets/images/app-images/back-highlight.png"),
};

const anatomy = require("../../assets/images/app-images/anatomy.png");
const chestHighlight = require("../../assets/images/app-images/chest-highlight.png");
const PRIMARY_COLOR = "#D8FF00";
const MUTED_COLOR = "#A3A3A3";
export default function MuscleScreen({
  muscleStats,
  isLoading,
  isError,
}: MuscleScreenProps) {
  const [isActive, setIsActive] = useState<MuscleId>("chest");

  const activeMuscle = muscleImages[isActive];

  console.log("muscle stats", muscleStats?.muscleDistribution);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    scale.stopAnimation();
    translateX.stopAnimation();
    translateY.stopAnimation();

    const zoom = muscleZoomConfig[isActive] ?? defaultZoom;

    // Stop any previous animation before starting another
    scale.stopAnimation();
    translateX.stopAnimation();
    translateY.stopAnimation();

    Animated.parallel([
      Animated.timing(scale, {
        toValue: zoom.scale,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: zoom.translateX,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: zoom.translateY,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, scale, translateX, translateY]);

  if (isLoading) {
    return (
      <View className="items-center justify-center p-5">
        <ActivityIndicator color={PRIMARY_COLOR} />
        <Text className="mt-3 text-muted-2">Loading completed sessions...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <Text className="text-center text-white">
        Failed to load muscle stats.
      </Text>
    );
  }

  if (!muscleStats) {
    return (
      <Text className="text-center text-white">
        No muscle focus data available yet.
      </Text>
    );
  }

  //percentage display.

  return (
    <View className="relative flex-1 pb-10">
      {/* muscle filter */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
        className="z-10 mb-[30px]"
      >
        <View className=" flex-row items-center justify-center gap-5">
          {muscleGroups.map((option, idx) => (
            <Pressable
              key={idx}
              onPress={() => setIsActive(option.id)}
              className={`${isActive === option.id ? "bg-primary" : "bg-muted/10"} rounded-full px-3 py-2`}
            >
              <Text
                className={`${isActive === option.id ? "text-black" : "text-muted-2"}`}
              >
                {option.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ScrollView>
        {/* MUSCLE ANATOMY DISPLAY */}
        {/* muscle focus card */}
        <View className="h-[300px] w-full overflow-hidden rounded-3xl ">
          <View className=" absolute inset-0 h-full w-full bg-muted/20" />

          <Animated.Image
            source={anatomy}
            className="h-full w-full"
            resizeMode="cover"
            style={{
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
          <Animated.Image
            source={activeMuscle}
            className="absolute inset-0 h-full w-full"
            resizeMode="cover"
            style={{
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        </View>
        <Text className="mt-8 text-lg font-bold text-white">Muscle Focus</Text>

        {/* MUSCLE BALANCE CARD ALL MUSCLES*/}
        <View className="-x-4 mt-2 rounded-3xl border border-muted/20 bg-muted/10 px-4 py-3">
          {/* right side */}
          <MusclePieChart muscleDistribution={muscleStats.muscleDistribution} />

          {/* left side */}
          <View className="gap-3">
            {muscleStats?.muscleDistribution.map((item, idx) => {
              const percentage =
                item.percentage > 75
                  ? "bg-primary"
                  : item.percentage >= 50 && item.percentage < 75
                    ? "bg-primary/50"
                    : item.percentage >= 25 && item.percentage < 50
                      ? "bg-primary/30"
                      : item.percentage >= 0 && item.percentage < 25
                        ? "bg-primary/10"
                        : "bg-muted/10";
              return (
                <View key={idx} className="flex-row justify-between">
                  {/* dot */}
                  <View className="flex-row items-center gap-2">
                    <View className={` ${percentage} h-3 w-3 rounded-full`} />
                    <Text className="text-white">{item.muscle}</Text>
                  </View>

                  <Text className="text-muted-2">{item.percentage}%</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* DISPLAY CHANGE BASED ON THE SELECTED MUSCLE */}
        <BlurView
          intensity={10}
          tint="light"
          className="mt-5 overflow-hidden rounded-3xl border border-muted/20 px-4 py-4"
        >
          <Text className="text-white">Chest(Pectorials)</Text>
          <View className=" mt-5 flex-row gap-5">
            <View className="h-[100px] w-[100px] items-center justify-center gap-2 rounded-3xl border border-primary/10 bg-background">
              <Text className="text-muted">Weekly sets</Text>
              <Text className="font-bold text-white">32</Text>
            </View>
            <View className="h-[100px] w-[100px] items-center justify-center gap-2 rounded-3xl border border-primary/10 bg-background">
              <Text className="text-muted ">Volume</Text>
              <Text className="font-bold text-primary">32564kg</Text>
            </View>
          </View>
        </BlurView>

        {/* SELECTED MUSCLE HYPERTROPHY CHART AGAINST SCIENTIFIC HYPERTROPHY 10 SETS*/}

        <View className="mt-5">
          <MuscleHypertrophy isActive={isActive} />
        </View>

        {/* MUSCLE STRENGTH PROGRESSION */}

        {/* AI INSIGHT */}
      </ScrollView>
    </View>
  );
}
