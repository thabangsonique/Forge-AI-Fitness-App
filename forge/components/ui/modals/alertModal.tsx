import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type modalProps = {
  visible: boolean;
  setIncompleteAlert: React.Dispatch<React.SetStateAction<boolean>>;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  selected: string;
  completedSetsCount: number | undefined;
  totalSetsRequired: number | undefined;
  handleFinishWorkout: () => void;
};

export default function AlertModal({
  visible,

  setIncompleteAlert,
  setSelected,
  selected,
  completedSetsCount,
  totalSetsRequired,
  handleFinishWorkout,
}: modalProps) {
  const router = useRouter();
  const [selectedModalButton, setSelectedModalButton] = useState("");
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => setIncompleteAlert}
    >
      <View className="flex-1 items-center justify-center bg-black/80">
        {/* modal card */}
        <View className="w-4/5 rounded-3xl border border-white/10 bg-neutral-900 p-6">
          <Text className="text-xl font-bold text-white">
            Incomplete workout
          </Text>

          {selected === "leave" ? (
            <Text className="mt-2 text-muted/70">
              Your workout hasn't been completed. If you leave now, your unsaved
              progress will be lost.
            </Text>
          ) : (
            <Text className="mt-2 text-muted/70">
              You've completed {completedSetsCount} of {totalSetsRequired} sets.
              Are you sure you want to finish this workout now?
            </Text>
          )}

          {/* buttons */}
          <View className="flex-row justify-between">
            <Pressable
              onPress={() => setIncompleteAlert(false)}
              onPressIn={() => setSelectedModalButton("continue")}
              onPressOut={() => setSelectedModalButton("")}
              className={`${selectedModalButton === "continue" ? " opacity-50" : "opacity-100"} mt-5  items-center rounded-xl bg-[#fff] px-3 py-3`}
            >
              {selected === "leave" ? (
                <Text>Continue Workout</Text>
              ) : (
                <Text className="font-bold text-red-800">Discard</Text>
              )}
            </Pressable>
            <Pressable
              onPress={() => {
                handleFinishWorkout;
                setIncompleteAlert(false);

                router.push("/(app)/(tabs)/progress");
              }}
              onPressIn={() => setSelectedModalButton("finish")}
              onPressOut={() => setSelectedModalButton("")}
              className={`${selectedModalButton === "finish" ? " opacity-50" : "opacity-100"} mt-5  items-center rounded-xl bg-[#D8FF00] px-6 py-3`}
            >
              {selected === "leave" ? (
                <Text>Leave</Text>
              ) : (
                <Text>Finish Workout</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
