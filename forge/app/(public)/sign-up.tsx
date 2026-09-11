import {
  getOnboardingAnswers,
  resetOnboardingAnswers,
} from "@/constants/onboarding";
import { authClient } from "@/lib/auth-client";
import {
  signUpFormValues,
  signUpSchema,
} from "@/lib/validations/auth-validation";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const googleLogo = require("../../../forge/assets/images/app-images/google.png");
export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);

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

    console.log(result);

    if (!result.success) {
      router.replace("/welcome");
      return;
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

      //grab the user session token from expo-secure store.
      const sessionResults = await authClient.getSession();

      const token = sessionResults.data?.session?.token;

      if (!token) {
        throw new Error("Sign up was succesful but token was not created.");
      }

      //backend to add profile for this user.
      //save onboarding data into the profiles table via backend.
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/profile`,

        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(result.data),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Could not save your profile. Server said: ${errorText}`
        );
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
      return;
    }

    setIsGoogleLoading(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/(app)/(tabs)",
      });
    } catch (error: any) {
      Alert.alert("Network error", error.message);
    } finally {
      setIsGoogleLoading(false);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="mt-5 flex-1"
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View className="flex-grow px-5 py-5">
          {/* heading text */}
          <Text className="text-2xl font-bold tracking-widest text-primary">
            Create account
          </Text>
          <Text className="text-muted/80">Sign up to get started</Text>

          {/* sign up form */}
          <View className="mt-9">
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onBlur, onChange, value } }) => (
                //  Full name
                <View className="gap-2">
                  <Text className="text-white">Full Name</Text>
                  {/* input box */}
                  <TextInput
                    autoComplete="name"
                    autoCapitalize="words"
                    placeholder="John Doe"
                    placeholderTextColor="#858585ff"
                    returnKeyType="next"
                    className={`h-14 rounded-xl border bg-muted/20 px-4 text-white ${errors.fullName ? "border-red-500" : isFocused ? "border-primary" : "border-transparent"}`}
                    onBlur={() => {
                      setIsFocused(false);
                      onBlur();
                    }}
                    onFocus={() => setIsFocused(true)}
                    onChangeText={onChange}
                    selectionColor="#DFFF00"
                    onSubmitEditing={() => emailInputRef.current?.focus}
                    value={value}
                  />
                  {errors.fullName && (
                    <Text className="mt-1 text-sm text-red-500">
                      {errors.fullName.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* email */}
          <View className="mt-4">
            <Controller
              name="email"
              control={control}
              render={({ field: { onBlur, value, onChange } }) => (
                <View className="gap-2">
                  <Text className="text-white">Email</Text>
                  <TextInput
                    ref={emailInputRef}
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    inputMode="email"
                    placeholder="you@example.com"
                    placeholderTextColor="#858585ff"
                    returnKeyType="next"
                    className={`h-14 rounded-xl border bg-muted/20 px-4 text-white ${errors.email ? "border-red-500" : isFocused ? "border-primary" : "border-transparent"}`}

                    onBlur={() => {
                      setIsFocused(false);
                      onBlur();
                    }}
                    onFocus={() => setIsFocused(true)}
                    onChangeText={onChange}
                    selectionColor="#DFFF00"
                    onSubmitEditing={() => passwordInputRef.current?.focus}
                    value={value}
                  />

                  {errors.email && (
                    <Text className="mt-1 text-sm text-red-500">
                      {errors.email.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* password */}
          <View className="mt-4">
            <Controller
              name="password"
              control={control}
              render={({ field: { onBlur, value, onChange } }) => (
                <View className="gap-2">
                  <Text className="text-white">Password</Text>
                  <View
                    className={`h-14 flex-row items-center rounded-xl border bg-muted/20 px-4 text-white ${errors.email ? "border-red-500" : isFocused ? "border-primary" : "border-transparent"}`}
                  >
                    {/* input box */}
                    <TextInput
                      ref={passwordInputRef}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      autoCapitalize="none"
                      placeholder="Create a password"
                      placeholderTextColor="#858585ff"

                      className="h-full flex-1 text-white"

                      onBlur={() => {
                        setIsFocused(false);
                        onBlur();
                      }}
                      returnKeyType="done"
                      onFocus={() => setIsFocused(true)}
                      onChangeText={onChange}
                      selectionColor="#DFFF00"
                      onSubmitEditing={() => onsubmit}
                      value={value}
                    />

                    {/* eye icon */}
                    <Pressable
                      accessibilityLabel={
                        showPassword ? "Hide password" : "Show password"
                      }
                      accessibilityRole="button"
                      hitSlop={4}
                      onPress={() => setShowPassword((current) => !current)}
                    >
                      <Feather
                        name={showPassword ? "eye-off" : "eye"}
                        color="#a0a0a0"
                        size={22}
                      />
                    </Pressable>
                  </View>
                  {errors.password && (
                    <Text className="mt-1 text-sm text-red-500">
                      {errors.password.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* sign up button */}
          <Pressable
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}

            disabled={isLoading || isGoogleLoading}
            onPress={onSubmit}
            className="mt-8 w-full flex-row items-center justify-center rounded-full border border-primary bg-primary py-3 "
          >
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <>
                <Text className="text-lg text-black"> Sign Up</Text>
              </>
            )}
          </Pressable>

          {/* or sign with google */}
          <View className="mt-6 flex-row items-center gap-3">
            <View className="h-px flex-1 bg-muted-3" />
            <Text className="text-muted-2">or continue with</Text>
            <View className="h-px flex-1 bg-muted-3" />
          </View>

          {/* google login button */}
          <Pressable
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
            disabled={isLoading || isGoogleLoading}
            onPress={handleGoogleSignUp}
            className="mt-8 w-full flex-row items-center rounded-full bg-white  px-5 py-3 "
          >
            {isGoogleLoading ? (
              <ActivityIndicator />
            ) : (
              <>
                <Image
                  source={googleLogo}
                  resizeMode="contain"
                  className="h-5 w-5"
                />
                <Text className="flex-1 text-center">Continue with Google</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
