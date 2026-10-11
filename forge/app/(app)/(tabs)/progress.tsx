import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const perfomanceOptions = [
  { title: "Volume" },
  { title: "Muscle" },
  { title: "PRs" },
  { title: "Body" },
];
export default function statistics() {
  const [isActive, setIsActive] = useState("Volume");
  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-5">
      {/* header */}
      <View>
        <Text className="text-center text-white">Progress</Text>

        {/* toggle section */}
        <View className="mt-5 flex-row items-center justify-center gap-5">
          {perfomanceOptions.map((option, idx) => (
            <Pressable
              key={idx}
              onPress={() => setIsActive(option.title)}
              className={`${isActive === option.title ? "bg-primary" : "bg-muted/10"} rounded-full px-3 py-2`}
            >
              <Text
                className={`${isActive === option.title ? "text-black" : "text-muted-2"}`}
              >
                {option.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* stats section */}
      <View className="mt-4 flex-row items-center justify-center gap-2">
        {/* workouts */}
        <View className="h-[110px] w-[110px] items-center justify-center gap-2 rounded-3xl rounded-3xl bg-muted/10">
          <Text className=" text-muted-2">Workouts</Text>
          <Text className="text-lg font-bold text-white">3</Text>
          <Text className="text-sm text-muted-2">Total workouts</Text>
        </View>
        {/* time */}
        <View className="h-[110px] w-[110px] items-center  justify-center  gap-2 rounded-3xl bg-muted/10 px-4 py-3">
          <Text className=" text-muted-2">Time</Text>
          <Text className="text-lg font-bold text-white">2h 24m</Text>
          <Text className="text-sm text-muted-2">Activity Log</Text>
        </View>
        {/* volume lifted */}
        <View className="rounded- h-[110px] w-[110px]  items-center  justify-center gap-2 rounded-3xl bg-muted/10 px-4 py-3">
          <Text className=" text-muted-2">Volume</Text>
          <Text className="text-lg font-bold text-white">3</Text>
          <Text className="text-sm text-muted-2">Total Lifted</Text>
        </View>
      </View>

      {/* weight distribution graph */}
      {/* header */}
    </SafeAreaView>
  );
}
