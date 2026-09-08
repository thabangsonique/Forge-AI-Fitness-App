import {
  getOnboardingAnswers,
  resetOnboardingAnswers,
} from "@/constants/onboarding";
import { authClient } from "@/lib/auth-client";
import {
  signUpFormValues,
  signUpSchema,
} from "@/lib/validations/auth-validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Text, View } from "react-native";

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);

  //google auth loading state.
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<signUpFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
    mode: "onTouched",
    resolver: zodResolver(signUpSchema),
    shouldFocusError: false,
  });

  //function to handle login.
  const onSubmit = handleSubmit(async ({ email, password, fullName }) => {
    const result = getOnboardingAnswers();

    if (!result.success) {
      router.replace("/welcome");
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name: fullName,
      });

      if (error) {
        Alert.alert("Could not create account", error.message);
        return;
      }

      resetOnboardingAnswers();
      //take the user to the hime page.
      router.replace("/(app)/(tabs)");
    } catch (err: any) {
      Alert.alert("Network error", err.message);
    } finally {
      setIsLoading(false);
    }
  });

  //google login.
  const handleGoogleSignUp = async () => {
    const result = getOnboardingAnswers();

    if (!result.success) {
      router.replace("/welcome");
    }

    setIsGoogleLoading(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/(app)/(tabs)",
      });

      resetOnboardingAnswers();
    } catch (error: any) {
      Alert.alert("Network error", error.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };
  return (
    <View>
      <Text>sign-up</Text>
    </View>
  );
}
