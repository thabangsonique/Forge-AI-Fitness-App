import {
  defaultZoom,
  MuscleId,
  muscleZoomConfig,
} from "@/constants/data/muscleConfig";
import {
  ExerciseBreakedown,
  useGenerateCoachInsightMutation,
  useGetCoachInsightsQuery,
} from "@/features/api";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
import MuscleStrength from "./graphs/muscleStrength";

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

//ai generation button type.
type InsightSection = "muscle" | "volume" | "strength" | "overall";

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
const BLACK_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 10,
  elevation: 8,
};
export default function MuscleScreen({
  muscleStats,
  isLoading,
  isError,
}: MuscleScreenProps) {
  const [isActive, setIsActive] = useState<MuscleId>("chest");
  const [activeInsightSection, setActiveInsightSection] =
    useState<InsightSection | null>(null);

  const [generationError, setGenerationError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTimedOut, setGenerationTimedOut] = useState(false);
  const generationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [generateInsight, { isError: insightError }] =
    useGenerateCoachInsightMutation();

  // The GET endpoint only returns an insight that matches the user's current
  // training data, so whatever it returns is safe to render on the cards.
  const { data: cachedInsight } = useGetCoachInsightsQuery();

  const insight = cachedInsight;

  const activeMuscle = muscleImages[isActive];

  // console.log("muscle stats", muscleStats?.muscleDistribution);

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

  // Clear any pending safety timeout if the screen unmounts.
  useEffect(() => {
    return () => {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

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

  //error helper function.
  const getErrorMessage = (error: unknown): string => {
    const e = error as { status?: number | string; data?: { error?: string } };

    if (e?.data?.error) return e.data.error; // message from backend
    if (e?.status === "FETCH_ERROR")
      return "No connection. Check your internet and try again.";
    return "Something went wrong. Please try again.";
  };

  // handle insight generation
  const handleInsightGeneration = async (section: InsightSection) => {
    if (isGenerating) return;

    setActiveInsightSection(section);
    setGenerationError("");
    setGenerationTimedOut(false);
    setIsGenerating(true);

    // Safety net: if the request hangs and the backend timeout never fires,
    // stop the spinner instead of spinning forever.
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
    }

    generationTimeoutRef.current = setTimeout(() => {
      setIsGenerating(false);
      setGenerationTimedOut(true);
      setGenerationError(
        "This is taking longer than expected. Please try again."
      );
    }, 45_000);

    try {
      await generateInsight().unwrap();
    } catch (error: any) {
      setGenerationError(getErrorMessage(error));
      console.log("Insight generation failed", error);
    } finally {
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
        generationTimeoutRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  //CHECKER

  // //volume insight.
  // const volumeInsight = generateInsight?.success
  //   ? generateInsight.data.volume
  //   : undefined;
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
        <View className="-x-4 mt-2 overflow-hidden rounded-3xl border border-muted/20 bg-muted/10 px-4 py-3">
          <LinearGradient
            colors={["rgba(216,255,0,0.05)", "rgba(216,255,0,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
            pointerEvents="none"
          />

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

        {/* GENERATE MUSCLE INSIGHT CARD */}
        {activeInsightSection === "muscle" && insight?.muscleFocus ? (
          <View className="mt-4 gap-2 rounded-2xl border border-primary/10 bg-background/60 p-3">
            {/* Title + trend badge */}
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-sm font-bold text-white">
                {insight.muscleFocus.title}
              </Text>
              <View className="rounded-full bg-primary/10 px-2.5 py-1">
                <Text className="text-xs font-bold text-primary">
                  {insight.muscleFocus.neglectedMuscles}
                </Text>
              </View>
            </View>

            {/* Explanation */}
            <Text className="text-sm leading-5 text-muted-2">
              {insight.muscleFocus.explanation}
            </Text>

            {/* Recommendations */}
            {insight.muscleFocus.recommendations.map((tip, index) => (
              <View key={index} className="flex-row items-start gap-2">
                <View className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <Text className="flex-1 text-sm leading-5 text-muted-2">
                  {tip}
                </Text>
              </View>
            ))}

            {/* generate workout button */}
            <Pressable
              onPress={() => handleInsightGeneration("volume")}
              disabled={isGenerating}
              className={`mt-4 flex-row items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 ${
                isGenerating ? "opacity-60" : ""
              }`}
              style={BLACK_SHADOW}
            >
              {isGenerating && activeInsightSection === "muscle" ? (
                <ActivityIndicator color="#000" size={25} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={17} color="#000" />
                  <Text className="font-bold text-black">
                    Build My Fix Workout
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View className="mt-6 rounded-3xl border border-muted/20 bg-muted/10 px-4 py-4">
            <LinearGradient
              colors={["rgba(216,255,0,0.03)", "rgba(216,255,0,0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                borderRadius: 24,
              }}
              pointerEvents="none"
            />

            <View className=" flex-row items-center gap-2">
              <Ionicons name="sparkles" size={18} color={PRIMARY_COLOR} />
              <Text className="text-base font-bold text-white">
                Turn your split into a plan
              </Text>
            </View>

            <Text className="mt-1 text-sm text-muted-2">
              Generate an AI insight based on your muscle distribution to see
              which muscles are lagging and what to focus on next.
            </Text>

            {(insightError || generationTimedOut) &&
            activeInsightSection === "muscle" ? (
              <Text className="mt-3 text-sm text-red-400">
                {generationError}
              </Text>
            ) : null}

            <Pressable
              onPress={() => handleInsightGeneration("muscle")}
              disabled={isGenerating}
              className={`mt-4 flex-row items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 ${isGenerating ? "opacity-60" : ""}`}
              style={BLACK_SHADOW}
            >
              {isGenerating && activeInsightSection === "muscle" ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="font-bold text-black">Generate Insight</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* DISPLAY CHANGE BASED ON THE SELECTED MUSCLE */}
        <BlurView
          intensity={10}
          tint="light"
          className="mt-6 overflow-hidden rounded-3xl border border-muted/20 px-4 py-4"
        >
          <LinearGradient
            colors={["rgba(216,255,0,0.03)", "rgba(216,255,0,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            }}
            pointerEvents="none"
          />
          <Text className="text-white">Chest(Pectorials)</Text>
          <View className=" mt-5 flex-row gap-5">
            <View
              className="h-[100px] w-[100px] items-center justify-center gap-2 rounded-3xl border border-primary/10 bg-background"
              style={BLACK_SHADOW}
            >
              <Text className="text-muted">Weekly sets</Text>
              <Text className="font-bold text-white">32</Text>
            </View>
            <View
              className="h-[100px] w-[100px] items-center justify-center gap-2 rounded-3xl border border-primary/10 bg-background"
              style={BLACK_SHADOW}
            >
              <Text className="text-muted ">Volume</Text>
              <Text className="font-bold text-primary">32564kg</Text>
            </View>
          </View>
        </BlurView>

        {/* SELECTED MUSCLE HYPERTROPHY CHART AGAINST SCIENTIFIC HYPERTROPHY 10 SETS*/}

        <View className="mt-5">
          <MuscleHypertrophy isActive={isActive} />
        </View>

        {/* GENERATED VOLUME  HERE */}
        {activeInsightSection === "volume" && insight?.volume ? (
          <View className="mt-4 gap-2 rounded-2xl border border-primary/10 bg-background/60 p-3">
            {/* Title + trend badge */}
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-sm font-bold text-white">
                {insight.volume.title}
              </Text>
              <View className="rounded-full bg-primary/10 px-2.5 py-1">
                <Text className="text-xs font-bold text-primary">
                  {insight.volume.trendStatus.replace("_", " ")}
                </Text>
              </View>
            </View>

            {/* Explanation */}
            <Text className="text-sm leading-5 text-muted-2">
              {insight.volume.explanation}
            </Text>

            {/* Recommendations */}
            {insight.volume.recommendations.map((tip, index) => (
              <View key={index} className="flex-row items-start gap-2">
                <View className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <Text className="flex-1 text-sm leading-5 text-muted-2">
                  {tip}
                </Text>
              </View>
            ))}

            {/* generate workout button */}
            <Pressable
              onPress={() => handleInsightGeneration("volume")}
              disabled={isGenerating}
              className={`mt-4 flex-row items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 ${
                isGenerating ? "opacity-60" : ""
              }`}
              style={BLACK_SHADOW}
            >
              {isGenerating && activeInsightSection === "volume" ? (
                <ActivityIndicator color="#000" size={25} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={17} color="#000" />
                  <Text className="font-bold text-black">
                    Build My Fix Workout
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View className="mt-6 rounded-2xl border border-white/10 bg-[#171717] p-4">
            <LinearGradient
              colors={["rgba(216,255,0,0.03)", "rgba(216,255,0,0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
              pointerEvents="none"
            />
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="analytics-outline"
                size={19}
                color={PRIMARY_COLOR}
              />
              <Text className="text-base font-bold text-white">
                Understand your training volume
              </Text>
            </View>

            <Text className="mt-1 text-sm leading-5 text-muted-2">
              Not sure whether your weekly volume is supporting muscle growth?
              Generate an AI analysis of your training workload, volume trends,
              and consistency to understand how your training is progressing and
              what you should adjust next.
            </Text>

            {/* handling error generation cases. */}
            {(insightError || generationTimedOut) &&
            activeInsightSection === "volume" ? (
              <Text className="mt-3 text-sm text-red-400">
                {generationError}
              </Text>
            ) : null}

            <Pressable
              onPress={() => handleInsightGeneration("volume")}
              disabled={isGenerating}
              className={`mt-4 flex-row items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 ${
                isGenerating ? "opacity-60" : ""
              }`}
              style={BLACK_SHADOW}
            >
              {isGenerating && activeInsightSection === "volume" ? (
                <ActivityIndicator color="#000" size={25} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={17} color="#000" />
                  <Text className="font-bold text-black">
                    Generate Volume Insights
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* MUSCLE STRENGTH PROGRESSION */}
        <View className="mt-5">
          <MuscleStrength isActive={isActive} />
        </View>

        {/* MUSCLE STRENGTH INSIGHT */}

        {activeInsightSection === "strength" && insight?.strength ? (
          <View className="mt-4 gap-2 rounded-2xl border border-primary/10 bg-background/60 p-3">
            {/* Title + trend badge */}
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-sm font-bold text-white">
                {insight.strength.title}
              </Text>
              <View className="rounded-full bg-primary/10 px-2.5 py-1">
                <Text className="text-xs font-bold text-primary">
                  {insight.strength.praise.replace("_", " ")}
                </Text>
              </View>
            </View>

            {/* Explanation */}
            <Text className="text-sm leading-5 text-muted-2">
              {insight.strength.progressionAnalysis}
            </Text>

            {/* Recommendations */}
            {insight.strength.exercisesToFocus.map((tip, index) => (
              <View key={index} className="flex-row items-start gap-2">
                <View className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <Text className="flex-1 text-sm leading-5 text-muted-2">
                  {tip}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="mt-6 rounded-2xl border border-white/10 bg-[#171717] p-4">
            <LinearGradient
              colors={["rgba(216,255,0,0.03)", "rgba(216,255,0,0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.5 }}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
              pointerEvents="none"
            />
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="barbell-outline"
                size={19}
                color={PRIMARY_COLOR}
              />
              <Text className="text-base font-bold text-white">
                Understand your strength progression
              </Text>
            </View>

            <Text className="mt-1 text-sm leading-5 text-muted-2">
              Want to know whether your strength is actually improving? Generate
              an AI analysis of your highest estimated one-rep max lifts and
              weekly strength progression to identify your strongest exercises,
              performance improvements, and potential plateaus.
            </Text>
            {/* 

            {/* handling error generation cases. */}
            {(insightError || generationTimedOut) &&
            activeInsightSection === "strength" ? (
              <Text className="mt-3 text-sm text-red-400">
                {generationError}
              </Text>
            ) : null}

            <Pressable
              onPress={() => handleInsightGeneration("strength")}
              disabled={isGenerating}
              className={`mt-4 flex-row items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 ${
                isGenerating ? "opacity-60" : ""
              }`}
              style={BLACK_SHADOW}
            >
              {isGenerating && activeInsightSection === "strength" ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={17} color="#000" />
                  <Text className="font-bold text-black">
                    Generate Strength Insights
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* AI INSIGHT */}
        <Text className="mt-5 font-bold text-white">AI Insight</Text>
        <View className="mt-2 rounded-3xl border border-muted/20 px-4 py-3">
          <Text className="text-white">AI Insight</Text>
        </View>
      </ScrollView>
    </View>
  );
}
