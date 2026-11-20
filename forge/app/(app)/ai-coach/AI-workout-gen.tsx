import {
  useGenerateAiWorkoutMutation,
  useGetCoachInsightsQuery,
} from "@/features/api";
import { FontAwesome } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import GeneratedWorkout from "./cards/generatedWorkout";

const newProjectImage = require("../../../assets/images/app-images/new-project.png");

// Enable LayoutAnimation on Android.
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Props required by each accordion card.
interface InsightAccordionProps {
  title: string;
  children: ReactNode;
}

// Reusable accordion component.
function InsightAccordion({ title, children }: InsightAccordionProps) {
  const [expanded, setExpanded] = useState(false);

  // Controls the chevron rotation.
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  const toggleAccordion = () => {
    const nextExpanded = !expanded;

    // Animate the card's height/layout change.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setExpanded(nextExpanded);

    // Animate the chevron independently.
    Animated.timing(rotateAnimation, {
      toValue: nextExpanded ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Convert animation value into a rotation angle.
  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  //FETCH WORKOUT GENERATION.

  return (
    <View className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-muted/10">
      {/* Clickable card header */}
      <Pressable
        onPress={toggleAccordion}
        className="flex-row items-center justify-between p-4"
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text className="flex-1 text-lg font-bold text-white">{title}</Text>

        <Animated.Text
          style={{ transform: [{ rotate }] }}
          className="ml-3 text-2xl text-primary"
        >
          ⌄
        </Animated.Text>
      </Pressable>

      {/* Only render the content when expanded */}
      {expanded && <View className="px-4 pb-4">{children}</View>}
    </View>
  );
}

//SHIMMER TEXT ANIMATION.

const ShimmerText = () => {
  const shimmer = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);

  // Start the loop only once we know how wide the text is.
  useEffect(() => {
    if (!textWidth) return;

    shimmer.setValue(0);

    const animation = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [shimmer, textWidth]);

  // Width of the moving highlight band.
  const bandWidth = textWidth * 0.5;

  // Band starts fully off the left edge and ends fully off the right.
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-bandWidth, textWidth],
  });

  return (
    <View className="self-start">
      {/* 1. Dim base text: always visible, also sets the size */}
      <Text
        numberOfLines={1}
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        className="text-lg font-bold text-white/30"
      >
        Generating your workout...
      </Text>

      {/* 2. Highlight, visible only where the mask has letters */}
      {textWidth > 0 && (
        <MaskedView
          pointerEvents="none"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          maskElement={
            <View style={{ backgroundColor: "transparent" }}>
              <Text
                numberOfLines={1}
                className="text-lg font-bold"
                style={{ color: "black" }}
              >
                Generating your workout...
              </Text>
            </View>
          }
        >
          <Animated.View
            style={{
              width: bandWidth,
              height: "100%",
              transform: [{ translateX }],
            }}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.95)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </MaskedView>
      )}
    </View>
  );
};
export default function AIWorkoutGeneration() {
  // Fetch cached AI insight.
  const { data: insight, isLoading, isError } = useGetCoachInsightsQuery();

  //generate workout.
  const [
    generateAiWorkout,
    {
      data: generatedWorkout,
      isLoading: isGenerating,
      isError: isGeneratingError,
      error: errorMessage,
    },
  ] = useGenerateAiWorkoutMutation();

  const hasTriggeredGeneration = useRef(false);

  useEffect(() => {
    if (hasTriggeredGeneration.current) return;

    hasTriggeredGeneration.current = true;
    const generateWorkout = async () => {
      try {
        await generateAiWorkout({ mode: "insight_driven" }).unwrap();
      } catch (error) {
        console.error("AI workout generation failed:", error);
      }
    };

    generateWorkout();
  }, [generateAiWorkout]);

  console.log("generated workout", generatedWorkout);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#D8FF00" />

        <Text className="mt-4 text-white">
          Building your personalized workout...
        </Text>
      </SafeAreaView>
    );
  }

  if (isError || !insight) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-red-400">
          Could not load your workout generation.
        </Text>

        <Text className="mt-2 text-muted-2">
          Please check your connection and try again.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-4 pt-5">
      {/* Background image */}
      <Image
        source={newProjectImage}
        className="absolute inset-0 -translate-x-5"
        resizeMode="cover"
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Content overlay */}
        <View className="relative z-10 flex-1">
          <Text className="mb-4 text-2xl font-bold text-primary">
            Your AI Workout
          </Text>

          <Text className="mb-3 font-bold text-white">
            Your Insight Review.
          </Text>

          {/* Volume Insight */}
          {insight.volume && (
            <InsightAccordion title={insight.volume.title}>
              {insight.volume.explanation ? (
                <Text className="text-sm leading-6 text-muted-2">
                  {insight.volume.explanation}
                </Text>
              ) : null}
            </InsightAccordion>
          )}

          {/* Muscle Focus Insight */}
          {insight.muscleFocus && (
            <InsightAccordion title={insight.muscleFocus.title}>
              {insight.muscleFocus.explanation ? (
                <Text className="text-sm leading-6 text-muted-2">
                  {insight.muscleFocus.explanation}
                </Text>
              ) : null}

              {insight.muscleFocus.neglectedMuscles?.length > 0 && (
                <View className="mt-3">
                  <Text className="mb-2 font-bold text-white">
                    Muscles needing attention
                  </Text>

                  {insight.muscleFocus.neglectedMuscles.map((muscle, index) => (
                    <Text
                      key={`${muscle}-${index}`}
                      className="mb-1 text-sm text-muted-2"
                    >
                      • {muscle}
                    </Text>
                  ))}
                </View>
              )}
            </InsightAccordion>
          )}

          {/* Strength Insight */}
          {insight.strength && (
            <InsightAccordion title={insight.strength.title}>
              {insight.strength.progressionAnalysis ? (
                <Text className="text-sm leading-6 text-muted-2">
                  {insight.strength.progressionAnalysis}
                </Text>
              ) : null}
            </InsightAccordion>
          )}

          {/* workout generation section */}

          <View className="rounded-3xl border border-primary/10 px-4 py-5">
            {isGenerating && <ShimmerText />}

            {/* failure */}
            {isGeneratingError && (
              <View className="items-center justify-center gap-3">
                <Text className=" text-red-500">
                  {(errorMessage as any)?.data?.error ??
                    "something went wrong."}
                </Text>
                {/* //icon */}
                <FontAwesome name="diamond" size={32} color="#D8FF00" />
              </View>
            )}

            {/* successfull generation */}
            {generatedWorkout && (
              <GeneratedWorkout generatedWorkout={generatedWorkout} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
