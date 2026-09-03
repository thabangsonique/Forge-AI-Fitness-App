import { View, Text } from "react-native";
import React, { ComponentProps } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { cn } from "@/lib/validations/utils";

type SafeAreaScreen = ComponentProps<typeof SafeAreaView>;

export default function SafeAreaScreen({
  className,
  ...props
}: SafeAreaScreen) {
  return (
    <SafeAreaView
      className={cn("flex-1 bg-background", className)}
      {...props}
    />
  );
}
