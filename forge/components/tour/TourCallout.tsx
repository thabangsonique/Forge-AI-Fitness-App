import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type TourCalloutProps = {
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  // Shows a spinner on the primary button. Used while an existing mutation runs.
  loading?: boolean;
  // Optional "Step 2 of 5" style label.
  stepLabel?: string;
};

// A single teaching card. It deliberately does not know about tour stages or
// Redux - it only renders content and reports taps. That keeps it reusable and
// makes the journey readable from the screens themselves.
export default function TourCallout({
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  loading = false,
  stepLabel,
}: TourCalloutProps) {
  // Android hardware back should behave like "dismiss", never leave the user
  // trapped behind an overlay with no visible exit.
  const handleDismiss = () => {
    if (loading) return;
    if (onSecondary) onSecondary();
  };

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <SafeAreaView className="flex-1 justify-end bg-black/70 px-5">
        <View
          accessibilityViewIsModal
          accessibilityLiveRegion="polite"
          className="mb-4 rounded-3xl border border-primary/20 bg-background p-5"
        >
          {stepLabel ? (
            <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              {stepLabel}
            </Text>
          ) : null}

          <Text className="text-xl font-bold text-white">{title}</Text>

          <Text className="mt-2 text-sm leading-6 text-muted-2">
            {description}
          </Text>

          <Pressable
            onPress={onPrimary}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={primaryLabel}
            className={`mt-5 h-12 items-center justify-center rounded-full bg-primary ${
              loading ? "opacity-60" : ""
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="font-bold text-black">{primaryLabel}</Text>
            )}
          </Pressable>

          {secondaryLabel && onSecondary ? (
            <Pressable
              onPress={onSecondary}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={secondaryLabel}
              hitSlop={8}
              className="mt-2 h-11 items-center justify-center"
            >
              <Text className="text-sm font-semibold text-muted-2">
                {secondaryLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}