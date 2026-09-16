import { authClient } from "@/lib/auth-client";
import {
  signInFormValues,
  signInSchema,
} from "@/lib/validations/auth-validation";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
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
export default function SignIn() {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<signInFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onTouched",
    resolver: zodResolver(signInSchema),
    shouldFocusError: false,
  });

  //handle the sign in.
  const onSignIn = handleSubmit(async ({ email, password }) => {
    try {
      setIsLoading(true);

      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        Alert.alert("Failed to sign in.Please try again.", error.message);
      }

      //redirect user to the homepage.
      router.replace("/(app)/(tabs)");
    } catch (error: any) {
      console.error("Failed to sign in. server error", error);
      Alert.alert("Server error signing in", error.message);
    } finally {
      setIsLoading(false);
    }
  });

  // GOOGLE SIGN IN
  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);

    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/(app)/(tabs)",
      });

      if (error) {
        Alert.alert(`Failed to sign in with google, ${error}`);
      }
    } catch (error: any) {
      Alert.alert("Network error", error.message);
    } finally {
      setGoogleLoading(false);
    }
  };
  return (
    <SafeAreaView className="pt- flex-1 bg-background px-6 pt-4">
      <KeyboardAvoidingView
        className="mt-5 flex-1"
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <Text className="text-2xl font-bold tracking-widest text-primary">
          Welcome back
        </Text>
        <Text className="text-muted/80">Sign in to continue</Text>

        {/* form section */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onBlur, value, onChange } }) => (
            <View className="mt-8 gap-3">
              <Text className="text-white">Email</Text>

              <TextInput
                autoComplete="email"
                textContentType="emailAddress"
                autoCapitalize="none"
                returnKeyType="next"
                onBlur={() => {
                  (setIsFocused(false), onBlur());
                }}
                onFocus={() => setIsFocused(true)}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                value={value}
                onChangeText={onChange}
                placeholder="you@example.com"
                placeholderTextColor="#858585ff"
                selectionColor="#DFFF00"
                className={`h-14 rounded-xl border bg-muted/20 px-4 text-white ${errors.password ? "border-red-500" : isFocused ? "border-primary" : "border-transparent"}`}
              />
              {errors.email && (
                <Text className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
        />

        {/* password */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onBlur, value, onChange } }) => (
            <View className="mt-8 gap-3">
              <Text className="text-white">Password</Text>
              <View
                className={`h-14 flex-row items-center rounded-xl border bg-muted/20 px-4 text-white ${errors.email ? "border-red-500" : isFocused ? "border-primary" : "border-transparent"}`}
              >
                <TextInput
                  ref={passwordInputRef}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onBlur={() => {
                    (setIsFocused(false), onBlur());
                  }}
                  onFocus={() => setIsFocused(true)}
                  // onSubmitEditing={() => }
                  value={value}
                  onChangeText={onChange}
                  placeholder="Enter your password."
                  placeholderTextColor="#858585ff"
                  selectionColor="#DFFF00"
                  className="h-full flex-1 text-white"
                />

                {/* eye icon */}
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

        <Text className="mt-4 text-primary">Forgot password</Text>
        {/* login button */}
        <Pressable
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}

          disabled={isLoading}
          onPress={onSignIn}
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
          disabled={isLoading || googleLoading}
          onPress={handleGoogleSignUp}
          className="mt-8 w-full flex-row items-center justify-center rounded-full bg-white  px-5 py-3 "
        >
          {googleLoading ? (
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

        <Link href={"/(public)/sign-up"} className="mt-5 gap-2 text-center">
          <Text className=" text-white">
            Don't have an account? <Text className="text-primary">Sign Up</Text>
          </Text>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
