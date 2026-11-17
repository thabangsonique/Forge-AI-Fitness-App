import type { ImageSourcePropType } from "react-native";

export type IntroSlice = {
  id: string;
  title: string;
  description: string;
  image?: ImageSourcePropType;
};

export const INTRO_SLIDES: IntroSlice[] = [
  {
    id: "personalized-coach",
    title: "Your AI coach, built around you",
    description:
      "Tell Forge your goal, experience, schedule, and equipment. Your plan is built around your life—not a generic template.",
    image: require("../assets/images/app-images/bg-pr.png"),
  },
  {
    id: "adaptive-workouts",
    title: "Workouts that adapt after every session",
    description:
      "Every session feeds your next one. Forge adjusts volume, exercise selection, and progression as you train.",
    image: require("../assets/images/app-images/generate-fix.png"),
  },
  {
    id: "pr-progress",
    title: "See your PR progress, PR by PR",
    description:
      "Track personal records, strength trends, and weekly progress in one place.",
    image: require("../assets/images/app-images/progress.png"),
  },
];
