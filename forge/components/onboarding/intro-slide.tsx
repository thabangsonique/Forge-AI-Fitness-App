import type { IntroSlice as IntroSlideData } from "@/constants/intro-slides";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

type IntroSlideProps = {
  slide: IntroSlideData;
  width: number;
};

export default function IntroSlide({ slide, width }: IntroSlideProps) {
  return (
    <View style={{ width }} className="mt-10 flex-1 px-6 pb-4">
      <View className="flex-1">
        <Text className="text-center text-3xl font-bold leading-9 text-white">
          {slide.title}
        </Text>
        <Text className="text-center text-base leading-6 text-muted/60">
          {slide.description}
        </Text>

        {slide.image ? (
          <View className="mt-8 h-[340px] w-full rounded-3xl bg-background">
            <View className="h-full w-full overflow-hidden rounded-3xl">
              <Image
                contentFit="cover"
                source={slide.image}
                style={{
                  width: "100%",
                  height: "100%",
                  shadowColor: "#fff",
                  shadowOffset: { width: 0, height: 14 },
                  shadowOpacity: 0.5,
                  shadowRadius: 24,
                }}
                transition={200}
              />
              <LinearGradient
                colors={[
                  "rgba(11, 12, 10, 0)",
                  "rgba(11, 12, 10, 0.75)",
                  "#0B0C0A",
                ]}
                end={{ x: 0, y: 1 }}
                locations={[0, 0.6, 1]}
                pointerEvents="none"
                start={{ x: 0, y: 0 }}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "20%",
                }}
              />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
