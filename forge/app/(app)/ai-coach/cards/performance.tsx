import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

const PRIMARY_COLOR = "#dae86aff";
export default function Performance() {
  return (
    <View
      className="flex-row items-center rounded-3xl border border-lime-400/70 bg-[#0f130e] p-4"

      style={{
        shadowColor: "#dae86aff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* Trend icon box */}
      <View className="h-12 w-12 items-center justify-center rounded-xl border border-primary/10 bg-lime-400/10">
        <Feather name="trending-up" size={24} color={PRIMARY_COLOR} />
      </View>

      {/* Text */}
      <View className="mx-3 flex-1">
        <Text className="text-base font-bold text-white">
          Performance Overview
        </Text>
        \ {/* increased/ decreased dynamic value */}
        <Text className="mt-0.5 text-sm leading-5 text-neutral-400">
          Your overall strength has increased by
          {/* percentage dynamic value */}
          <Text className="font-bold">+6.8%</Text>
          compared to the previous month.
        </Text>
      </View>
    </View>
  );
}
