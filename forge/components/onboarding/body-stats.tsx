import { cn } from "@/lib/validations/utils";
import type { onboardingWeightUnit } from "@/lib/validations/onboarding-validation";
import React, { useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";

type BodyStatsStepProps = {
  value: {
    weightUnit?: onboardingWeightUnit;
    weightKg?: number | null;
    heightCm?: number | null;
    birthYear?: number | null;
  };
  onChange: {
    weightUnit: (value: onboardingWeightUnit) => void;
    weightKg: (value: number | null) => void;
    heightCm: (value: number | null) => void;
    birthYear: (value: number | null) => void;
  };
};

const KG_PER_LB = 2.20462;
const CM_PER_IN = 2.54;

const formatNumber = (value: number) =>
  Number.isInteger(value) ? `${value}` : value.toFixed(1);

export default function BodyStatsStep({
  value,
  onChange,
}: BodyStatsStepProps) {
  const unit = value.weightUnit ?? "kg";
  const currentYear = new Date().getFullYear();

  const [weightEnabled, setWeightEnabled] = useState(value.weightKg != null);
  const [heightEnabled, setHeightEnabled] = useState(value.heightCm != null);
  const [ageEnabled, setAgeEnabled] = useState(value.birthYear != null);

  const [weightText, setWeightText] = useState(
    value.weightKg != null
      ? formatNumber(
          unit === "kg" ? value.weightKg : value.weightKg * KG_PER_LB
        )
      : ""
  );
  const [heightText, setHeightText] = useState(
    value.heightCm != null
      ? formatNumber(unit === "kg" ? value.heightCm : value.heightCm / CM_PER_IN)
      : ""
  );
  const [ageText, setAgeText] = useState(
    value.birthYear != null ? `${currentYear - value.birthYear}` : ""
  );

  const changeUnit = (nextUnit: onboardingWeightUnit) => {
    if (nextUnit === unit) {
      return;
    }

    const weight = Number.parseFloat(weightText);
    const height = Number.parseFloat(heightText);

    if (Number.isFinite(weight)) {
      setWeightText(
        formatNumber(
          nextUnit === "kg" ? weight / KG_PER_LB : weight * KG_PER_LB
        )
      );
    }

    if (Number.isFinite(height)) {
      setHeightText(
        formatNumber(nextUnit === "kg" ? height * CM_PER_IN : height / CM_PER_IN)
      );
    }

    onChange.weightUnit(nextUnit);
  };

  const changeWeight = (text: string) => {
    setWeightText(text);
    const amount = Number.parseFloat(text);
    onChange.weightKg(
      Number.isFinite(amount)
        ? unit === "kg"
          ? amount
          : amount / KG_PER_LB
        : null
    );
  };

  const changeHeight = (text: string) => {
    setHeightText(text);
    const amount = Number.parseFloat(text);
    onChange.heightCm(
      Number.isFinite(amount)
        ? unit === "kg"
          ? amount
          : amount * CM_PER_IN
        : null
    );
  };

  const changeAge = (text: string) => {
    setAgeText(text);
    const amount = Number.parseInt(text, 10);
    onChange.birthYear(
      Number.isFinite(amount) && amount > 0 ? currentYear - amount : null
    );
  };

  return (
    <View className="mt-5 flex-1">
      <Animated.View entering={FadeInRight.duration(250)}>
        <Text className="text-center text-xl font-bold text-white">
          Units and body stats
        </Text>
        <Text className="text-center text-muted/40">
          Optional. This helps us personalize your plan.
        </Text>
      </Animated.View>

      <View className="mt-6 flex-row rounded-full bg-card-background p-1">
        {(["kg", "lb"] as const).map((option) => {
          const selected = unit === option;

          return (
            <Pressable
              className={cn(
                "flex-1 items-center rounded-full py-2.5",
                selected ? "bg-primary" : "bg-transparent"
              )}
              key={option}
              onPress={() => changeUnit(option)}
            >
              <Text
                className={cn(
                  "text-sm font-bold",
                  selected ? "text-black" : "text-muted/50"
                )}
              >
                {option === "kg" ? "Metric (kg / cm)" : "Imperial (lb / in)"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-6 gap-3">
        <StatRow
          enabled={weightEnabled}
          label={`Weight (${unit})`}
          onToggle={(enabled) => {
            setWeightEnabled(enabled);
            if (!enabled) {
              setWeightText("");
              onChange.weightKg(null);
            }
          }}
          onValueChange={changeWeight}
          placeholder={unit === "kg" ? "75" : "165"}
          value={weightText}
        />

        <StatRow
          enabled={heightEnabled}
          label={`Height (${unit === "kg" ? "cm" : "in"})`}
          onToggle={(enabled) => {
            setHeightEnabled(enabled);
            if (!enabled) {
              setHeightText("");
              onChange.heightCm(null);
            }
          }}
          onValueChange={changeHeight}
          placeholder={unit === "kg" ? "175" : "69"}
          value={heightText}
        />

        <StatRow
          enabled={ageEnabled}
          label="Age"
          onToggle={(enabled) => {
            setAgeEnabled(enabled);
            if (!enabled) {
              setAgeText("");
              onChange.birthYear(null);
            }
          }}
          onValueChange={changeAge}
          placeholder="28"
          value={ageText}
        />
      </View>
    </View>
  );
}

type StatRowProps = {
  enabled: boolean;
  label: string;
  onToggle: (enabled: boolean) => void;
  onValueChange: (value: string) => void;
  placeholder: string;
  value: string;
};

function StatRow({
  enabled,
  label,
  onToggle,
  onValueChange,
  placeholder,
  value,
}: StatRowProps) {
  return (
    <View className="flex-row items-center rounded-2xl border border-muted/20 bg-card-background px-4 py-3">
      <Text className="flex-1 text-base text-white">{label}</Text>

      {enabled ? (
        <TextInput
          className="mr-3 w-24 rounded-xl bg-muted/10 px-3 py-2 text-right text-base text-white"
          keyboardType="decimal-pad"
          onChangeText={onValueChange}
          placeholder={placeholder}
          placeholderTextColor="#4B5563"
          value={value}
        />
      ) : null}

      <Switch
        ios_backgroundColor="#27272A"
        onValueChange={onToggle}
        thumbColor={enabled ? "#DAE86A" : "#71717A"}
        trackColor={{ false: "#27272A", true: "rgba(218, 232, 106, 0.35)" }}
        value={enabled}
      />
    </View>
  );
}
