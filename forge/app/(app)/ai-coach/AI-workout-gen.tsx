import { useGetCoachInsightsQuery } from "@/features/api";
import { ActivityIndicator, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const newProjectImage = require("../../../assets/images/app-images/new-project.png");

export default function AIWorkoutGeneration() {
  // Fetch cached insight
  const { data: insight, isLoading, isError } = useGetCoachInsightsQuery();

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

  // Workout generation screen - display the generated workout
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      {/* Background Image */}
      <Image
        source={newProjectImage}
        className="absolute inset-0 -translate-x-5"
        resizeMode="cover"
      />

      {/* Content overlay */}
      <View className="relative z-10 flex-1">
        <Text className="mb-4 text-2xl font-bold text-primary">
          Your AI Workout
        </Text>

        <Text className="mb-3 font-bold text-white">Your Insight Review.</Text>
        {/* Display workout details based on the generated insight */}
        {insight?.volume && (
          <View className="mb-4 rounded-2xl bg-muted/10 p-4">
            <Text className="text-lg font-bold text-white">
              {insight.volume.title}
            </Text>
            {insight.volume.explanation ? (
              <Text className="mt-2 text-sm text-muted-2">
                {insight.volume.explanation}
              </Text>
            ) : null}
          </View>
        )}

        {insight?.muscleFocus && (
          <View className="mb-4 rounded-2xl bg-muted/10 p-4">
            <Text className="text-lg font-bold text-white">
              {insight.muscleFocus.title}
            </Text>
            {insight.muscleFocus.explanation ? (
              <Text className="mt-2 text-sm text-muted-2">
                {insight.muscleFocus.explanation}
              </Text>
            ) : null}
          </View>
        )}

        {insight?.strength && (
          <View className="mb-4 rounded-2xl bg-muted/10 p-4">
            <Text className="text-lg font-bold text-white">
              {insight.strength.title}
            </Text>
            {insight.strength.progressionAnalysis ? (
              <Text className="mt-2 text-sm text-muted-2">
                {insight.strength.progressionAnalysis}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
