import LottieView from "lottie-react-native";
import React from "react";

export default function ChasingDotsLoader() {
  return (
    <LottieView
      source={require("@/assets/animations/chasing-dots.json")}
      autoPlay
      loop
      style={{
        width: 120,
        height: 120,
      }}
    />
  );
}
