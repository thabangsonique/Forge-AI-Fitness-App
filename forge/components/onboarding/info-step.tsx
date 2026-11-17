import React, { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

type InfoStepProps = {
  title: string;
  body: string;
  children?: ReactNode;
  caption?: string;
};

export default function InfoStep({
  title,
  body,
  children,
  caption,
}: InfoStepProps) {
  return (
    <View className="mt-5 flex-1">
      <Animated.View entering={FadeInRight.duration(250)}>
        <Text className="text-center text-2xl font-bold leading-8 text-white">
          {title}
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-muted/50">
          {body}
        </Text>
      </Animated.View>

      {children ? <View className="mt-8">{children}</View> : null}

      {caption ? (
        <Text className="mt-4 text-center text-xs text-muted/30">{caption}</Text>
      ) : null}
    </View>
  );
}
