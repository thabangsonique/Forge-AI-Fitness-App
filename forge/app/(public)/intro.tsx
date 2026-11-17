import IntroSlide from "@/components/onboarding/intro-slide";
import SafeAreaScreen from "@/components/ui/safe-area-screen";
import { INTRO_SLIDES } from "@/constants/intro-slides";
import {
  clearOnboardingProgress,
  firstIncompleteRequiredStep,
  getOnboardingProgress,
  hydrateOnboardingAnswers,
  loadOnboardingAnswers,
  stepIndex,
} from "@/constants/onboarding";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function Intro() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(nextIndex, INTRO_SLIDES.length - 1)));
  };

  const handleStart = async () => {
    await hydrateOnboardingAnswers();

    // A saved progress key can outlive the answers it belonged to (for example
    // when the user abandoned the flow). Never resume past an unanswered
    // required step, otherwise planReveal looks valid with empty answers and
    // sign-up bounces the user back here forever.
    const firstIncomplete = firstIncompleteRequiredStep(loadOnboardingAnswers());

    if (firstIncomplete) {
      await clearOnboardingProgress();

      router.replace({
        pathname: "/onboarding/[step]",
        params: { step: firstIncomplete.key },
      });
      return;
    }

    const savedStep = await getOnboardingProgress();
    const savedIndex = savedStep ? stepIndex(savedStep) : -1;
    const resumeStep = savedStep && savedIndex >= 0 ? savedStep : "goal";

    router.replace({
      pathname: "/onboarding/[step]",
      params: { step: resumeStep },
    });
  };

  return (
    <SafeAreaScreen>
      <StatusBar style="light" />

      <View className="flex-1">
        <FlatList
          data={INTRO_SLIDES}
          extraData={width}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          horizontal
          bounces={false}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={handleMomentumEnd}
          pagingEnabled
          renderItem={({ item }) => <IntroSlide slide={item} width={width} />}
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
        />

        <View className="px-6 pb-2">
          <View className="mb-7 flex-row items-center justify-center gap-2">
            {INTRO_SLIDES.map((slide, index) => (
              <View
                key={slide.id}
                className={
                  index === activeIndex
                    ? "h-2 w-7 rounded-full bg-primary"
                    : "h-2 w-2 rounded-full bg-muted/20"
                }
              />
            ))}
          </View>

          <Pressable
            accessibilityLabel="Start"
            accessibilityRole="button"
            onPress={handleStart}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
            className="w-full items-center justify-center rounded-full bg-primary py-4"
          >
            <Text className="text-lg font-semibold text-black">Start</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaScreen>
  );
}
