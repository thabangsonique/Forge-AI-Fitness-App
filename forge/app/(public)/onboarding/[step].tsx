import { View, Text, Pressable } from "react-native";
import React, { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { OnboardingValues } from "@/lib/validations/onboarding-validation";
import {
  saveOnboardingAnswers,
  stepIndex,
  steps,
} from "@/constants/onboarding";
import { Feather } from "@expo/vector-icons";
import SafeAreaScreen from "@/components/ui/safe-area-screen";
import GenderStep from "@/components/onboarding/gender";
import GoalStep from "@/components/onboarding/goal";
import ExperienceStep from "@/components/onboarding/experience";

export default function OnboardingStep() {
  //grab the current step we are at.
  const { step: key = "" } = useLocalSearchParams<{ step: string }>();
  const router = useRouter();

  //settibg the state to store the answers of the user.
  const [values, setValues] = useState<Partial<OnboardingValues>>({});

  //grab the index number of the current step.
  const index = stepIndex(key);
  //grab full info of step using the INdex value
  const step = steps[index];

  const next = steps[index + 1];

  const goBack = () => {
    if (index == 0) {
      router.replace("/welcome");
    } else {
      router.back();
    }
  };

  //when user selects an answer
  const onselect = (value: OnboardingValues[typeof step.field]) => {
    const nextValues = { ...values, [step.field]: value };
    saveOnboardingAnswers(step.field, value);
    setValues(nextValues);
  };

  //function to go to the next page.
  const goNext = () => {
    if (next) {
      router.push({
        pathname: "/onboarding/[step]",
        params: { step: next.key },
      });
    } else {
      router.push("/sign-up");
    }
  };

  return (
    <SafeAreaScreen>
      <View className="flex-1 px-6 pb-10 pt-4 bg-background">
        {/* back + progress bar */}
        <View className="flex-row items-center gap-2">
          {/* back button */}
          <Pressable
            onPress={goBack}
            className="active:bg-primary/50 rounded-full items-center justify-center"
          >
            <Feather color={"#DFFF00"} name="arrow-left" size={23} />
          </Pressable>

          {/* progress bar */}
          <View className="h-2 flex-1 overflow-hidden rounded-full border border-muted-2/40">
            {/* inner bar */}
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${((index + 1) / steps.length) * 100}%` }}
            ></View>
          </View>
        </View>
        {/* render step pages accordingly */}
        {step.key === "gender" && (
          <>
            <GenderStep onSelect={onselect} value={values.gender} />
          </>
        )}
        {step.key === "goal" && (
          <>
            <GoalStep onSelect={onselect} value={values.goal} />
          </>
        )}
        {step.key === "experience" && (
          <>
            <ExperienceStep onSelect={onselect} value={values.experience} />
          </>
        )}
        {/* cta button -next/ continue to sign up*/}
        <View className="flex-1 justify-end">
          <Pressable
            onPress={goNext}
            className="bg-primary py-3 w-full items-center justify-center rounded-full"
          >
            <Text className="text-black text-lg font-bold">
              {next ? "Next" : "Continue to Sign Up"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaScreen>
  );
}
