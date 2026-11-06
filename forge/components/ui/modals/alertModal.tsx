import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

export type ModalAction = "leave" | "finish" | null;

type ModalProps = {
  visible: boolean;
  setIncompleteAlert: React.Dispatch<React.SetStateAction<boolean>>;
  modalAction: ModalAction;
  setModalAction: React.Dispatch<React.SetStateAction<ModalAction>>;
  completedSetsCount: number | undefined;
  totalSetsRequired: number | undefined;
  handleFinishWorkout: (confirmed?: boolean) => Promise<void>;
  creatingSession: boolean;
};

export default function AlertModal({
  visible,
  setIncompleteAlert,
  modalAction,
  setModalAction,
  completedSetsCount,
  totalSetsRequired,
  handleFinishWorkout,
  creatingSession,
}: ModalProps) {
  const router = useRouter();
  const [selectedModalButton, setSelectedModalButton] = useState("");

  const isLeaving = modalAction === "leave";

  const closeModal = () => {
    setIncompleteAlert(false);
    setModalAction(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeModal}
    >
      <View className="flex-1 items-center justify-center bg-black/80">
        <View className="w-[315px] rounded-3xl border border-white/10 bg-neutral-900 p-6">
          <Text className="text-xl text-white">
            {isLeaving ? "Leave workout?" : "Finish workout early?"}
          </Text>

          {isLeaving ? (
            <Text className="mt-2 text-muted/70">
              Your workout hasn't been completed. If you leave now, your unsaved
              progress will be lost.
            </Text>
          ) : (
            <Text className="mt-2 text-muted/70">
              You've completed {completedSetsCount} of {totalSetsRequired} sets.
              Are you sure you want to finish and save this workout now?
            </Text>
          )}

          <View className="flex-row justify-between">
            {/* Cancel / Continue button */}
            <Pressable
              onPress={closeModal}
              onPressIn={() => setSelectedModalButton("continue")}
              onPressOut={() => setSelectedModalButton("")}
              className={`${
                selectedModalButton === "continue"
                  ? "opacity-50"
                  : "opacity-100"
              } mt-5 items-center rounded-xl bg-white px-3 py-3`}
            >
              <Text className="text-black">Continue Workout</Text>
            </Pressable>

            {/* Confirmation button */}
            <Pressable
              disabled={creatingSession || modalAction === null}
              onPress={async () => {
                if (modalAction === "leave") {
                  closeModal();
                  router.back();
                  return;
                }

                if (modalAction === "finish") {
                  await handleFinishWorkout(true);
                }
              }}
              onPressIn={() => setSelectedModalButton("confirm")}
              onPressOut={() => setSelectedModalButton("")}
              className={`${
                selectedModalButton === "confirm" ? "opacity-50" : "opacity-100"
              } mt-5 items-center rounded-xl bg-[#D8FF00] px-5 py-3`}
            >
              {creatingSession ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text className=" text-black">
                  {isLeaving ? "Leave Workout" : "Finish Anyway"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
