export const muscleZoomConfig = {
  all: {
    scale: 1,
    translateX: 0,
    translateY: 0,
  },
  chest: {
    scale: 4,
    translateX: 300,
    translateY: 350,
  },
  back: {
    scale: 3,
    translateX: -230,
    translateY: 250,
  },
  lats: {
    scale: 3,
    translateX: -230,
    translateY: 250,
  },
  shoulders: {
    scale: 4,
    translateX: 380,
    translateY: 350,
  },
  biceps: {
    scale: 4,
    translateX: 400,
    translateY: 350,
  },
  triceps: {
    scale: 4,
    translateX: -230,
    translateY: 350,
  },
  abs: {
    scale: 4,
    translateX: 300,
    translateY: 250,
  },

  quadriceps: {
    scale: 4,
    translateX: 350,
    translateY: -85,
  },
  hamstrings: {
    scale: 4,
    translateX: -230,
    translateY: -85,
  },
  glutes: {
    scale: 4,
    translateX: -300,
    translateY: 10,
  },
  calves: {
    scale: 4,
    translateX: -230,
    translateY: -300,
  },
  traps: {
    scale: 3,
    translateX: -230,
    translateY: 250,
  },
  "lower-back": {
    scale: 3,
    translateX: -230,
    translateY: 200,
  },
  "mid-back": {
    scale: 3,
    translateX: -230,
    translateY: 250,
  },
} as const;

export type MuscleId = keyof typeof muscleZoomConfig;

export const defaultZoom = {
  scale: 1,
  translateX: 0,
  translateY: 0,
} as const;
