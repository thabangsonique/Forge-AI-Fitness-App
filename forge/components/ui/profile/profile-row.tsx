import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

type ProfileRowProps = {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  valueTone?: "strong" | "muted";
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
};

export default function ProfileRow({
  icon,
  label,
  value,
  valueTone = "muted",
  onPress,
  rightElement,
  destructive = false,
  showChevron,
}: ProfileRowProps) {
  const displayChevron = onPress ? (showChevron ?? true) : false;
  const labelClassName = destructive
    ? "flex-1 text-base text-red-400"
    : "flex-1 text-base text-white";
  const valueClassName =
    valueTone === "strong"
      ? "ml-3 text-sm font-semibold text-white"
      : "ml-3 text-sm text-muted-2";

  const content = (
    <>
      {icon ? (
        <View className="mr-3.5 items-center justify-center">{icon}</View>
      ) : null}

      <Text className={labelClassName} numberOfLines={1}>
        {label}
      </Text>

      {value ? (
        <Text className={valueClassName} numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {rightElement ? <View className="ml-2">{rightElement}</View> : null}

      {displayChevron ? (
        <View className="ml-2">
          <Feather
            name="chevron-right"
            size={18}
            color={destructive ? "red" : "gray"}
          />
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className="min-h-14 flex-row items-center px-4 py-3 active:bg-white/5"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className="min-h-14 flex-row items-center px-4 py-3">{content}</View>
  );
}
