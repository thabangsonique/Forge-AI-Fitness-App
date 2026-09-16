import { Feather, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#DFFF00",
        tabBarStyle: {
          position: "absolute",
          bottom: insets.bottom + 8,
          height: 65,
          paddingBottom: 30,
          backgroundColor: "#151515ff",
          marginHorizontal: 16,
          borderRadius: 32,
          elevation: 8,
          shadowOffset: { width: 0, height: 20 },
          shadowRadius: 30,
          shadowOpacity: 1,
          shadowColor: "#000",
          borderTopColor: "transparent",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarButton: ({ onPress }) => (
            <Pressable
              className="flex-1 items-center justify-center"
              onPress={onPress}
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
                <Feather name="plus" size={24} />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="diet"
        options={{
          title: "Diet",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="nutrition" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
