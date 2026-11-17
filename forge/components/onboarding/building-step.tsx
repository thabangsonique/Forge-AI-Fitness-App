import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeInRight } from "react-native-reanimated";

const TASKS = [
  "Choosing your weekly split",
  "Matching your experience level",
  "Removing exercises you can't do",
  "Setting your progression targets",
];

type BuildingStepProps = {
  onDone: () => void;
};

export default function BuildingStep({ onDone }: BuildingStepProps) {
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (completed >= TASKS.length) {
      const timer = setTimeout(onDone, 450);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setCompleted((count) => count + 1), 650);
    return () => clearTimeout(timer);
  }, [completed, onDone]);

  return (
    <View className="mt-6 flex-1 items-center">
      <Text className="text-center text-2xl font-bold text-white">
        Building your Forge plan...
      </Text>
      <Text className="mt-2 text-center text-sm text-muted/50">
        No AI. Just a plan built from your answers.
      </Text>

      <Animated.View
        className="mt-8 w-full rounded-3xl border border-primary/20 bg-card-background p-5"
        entering={FadeIn.duration(250)}
      >
        {TASKS.map((task, index) => {
          const done = index < completed;
          const active = index === completed;

          return (
            <Animated.View
              className="mb-4 flex-row items-center last:mb-0"
              entering={FadeInRight.duration(200)}
              key={task}
            >
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${
                  done ? "bg-primary" : active ? "bg-primary/15" : "bg-muted/10"
                }`}
              >
                {done ? (
                  <Feather color="#000" name="check" size={16} />
                ) : active ? (
                  <Animated.View
                    className="h-3 w-3 rounded-full bg-primary"
                    entering={FadeIn.duration(300)}
                  />
                ) : (
                  <View className="h-2 w-2 rounded-full bg-muted/30" />
                )}
              </View>
              <Text
                className={`ml-3 flex-1 text-sm ${
                  done ? "text-primary" : "text-muted/60"
                }`}
              >
                {task}
              </Text>
            </Animated.View>
          );
        })}
      </Animated.View>
    </View>
  );
}
