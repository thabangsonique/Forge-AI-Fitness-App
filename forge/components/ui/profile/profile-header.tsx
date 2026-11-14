import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";

const fallbackProfileImage = require("../../../assets/images/app-images/user-profile.png");

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type ProfileHeaderProps = {
  image?: string | null;
  name?: string | null;
  email?: string | null;
  createdAt?: string | Date | null;
  canGoBack?: boolean;
  onBack?: () => void;
};

const getMemberSince = (createdAt?: string | Date | null) => {
  if (!createdAt) {
    return null;
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};

export default function ProfileHeader({
  image,
  name,
  email,
  createdAt,
  canGoBack = false,
  onBack,
}: ProfileHeaderProps) {
  const displayName = name?.trim() || "Athlete";
  const displayEmail = email?.trim() || "No email on file";
  const memberSince = getMemberSince(createdAt);
  const avatarSource: ImageSourcePropType = image
    ? { uri: image }
    : fallbackProfileImage;

  return (
    <View className="items-center">
      <View className="h-12 w-full flex-row items-center justify-center">
        {canGoBack && onBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onBack}
            className="absolute left-0 h-11 w-11 items-center justify-center rounded-full bg-muted/10 active:opacity-60"
          >
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>
        ) : null}

        <Text className="text-lg font-semibold text-white">Profile</Text>
      </View>

      <View className="mt-5 h-28 w-28 overflow-hidden rounded-full border-2 border-primary/40 bg-muted/10">
        <Image
          source={avatarSource}
          className="h-full w-full"
          resizeMode="cover"
        />
      </View>

      <Text className="mt-4 text-xl font-bold text-white">{displayName}</Text>
      <Text className="mt-1 text-sm text-muted-2">{displayEmail}</Text>

      {memberSince ? (
        <Text className="mt-1 text-xs text-muted-2/60">
          Member since {memberSince}
        </Text>
      ) : null}
    </View>
  );
}
