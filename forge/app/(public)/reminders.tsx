import { authClient } from "@/lib/auth-client";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const toReminderTime = (date: Date) =>
  `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(
    2,
    "0"
  )}`;

export default function Reminders() {
  const router = useRouter();
  const [time, setTime] = useState(() => {
    const date = new Date();
    date.setHours(18, 0, 0, 0);
    return date;
  });
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");
  const [isLoading, setIsLoading] = useState(false);

  const continueToTrial = () => router.replace("/trial");

  const saveReminder = async (enabled: boolean) => {
    setIsLoading(true);

    try {
      const session = await authClient.getSession();
      const token = session.data?.session?.token;

      if (token) {
        await fetch(`${API_URL}/api/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reminderEnabled: enabled,
            reminderTime: enabled ? toReminderTime(time) : null,
          }),
        });
      }
    } finally {
      setIsLoading(false);
      continueToTrial();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 pt-8">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Feather color="#DAE86A" name="bell" size={28} />
        </View>

        <Text className="mt-6 text-3xl font-bold leading-9 text-white">
          Never miss a session.
        </Text>
        <Text className="mt-3 text-base leading-6 text-muted/50">
          Pick a time and we&apos;ll remind you when it&apos;s time to train.
        </Text>

        <Pressable
          className="mt-10 items-center rounded-3xl border border-primary/25 bg-card-background py-8"
          onPress={() => setShowPicker(true)}
        >
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted/40">
            Reminder time
          </Text>
          <Text className="mt-2 text-5xl font-bold text-white">
            {formatTime(time)}
          </Text>
          <Text className="mt-2 text-xs text-primary">Tap to change</Text>
        </Pressable>

        {showPicker ? (
          <DateTimePicker
            display={Platform.OS === "ios" ? "spinner" : "default"}
            mode="time"
            onChange={(event, nextDate) => {
              if (Platform.OS === "android") {
                setShowPicker(false);
              }

              if (event.type === "set" && nextDate) {
                setTime(nextDate);
              }
            }}
            themeVariant="dark"
            value={time}
          />
        ) : null}

        <View className="mt-auto pb-8">
          <Pressable
            className="w-full items-center rounded-full bg-primary py-3"
            disabled={isLoading}
            onPress={() => saveReminder(true)}
          >
            <Text className="text-lg font-bold text-black">
              Enable reminders
            </Text>
          </Pressable>

          <Pressable
            className="mt-4 items-center py-2"
            onPress={() => saveReminder(false)}
          >
            <Text className="text-sm text-muted/40">Not now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
