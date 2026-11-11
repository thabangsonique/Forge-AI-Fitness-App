import { FitnessContext } from "../fitnessAnalytics/types";

//actual ai prompt
export const COACH_SYSTEM_INSTRUCTION = `
You are Forge AI, an elite, science-backed strength and conditioning coach embedded in the Forge fitness application.
Your coaching style is encouraging, objective, concise, and focused on progressive overload and balanced hypertrophy.
Guidelines:
1. Always speak directly to the athlete using second person ("you", "your").
2. Keep explanations clear, practical, and actionable. Avoid unnecessary fitness jargon.
3. If an athlete has neglected muscle groups, suggest exercises to restore balance.
4. If an athlete increased their 1RM or hit a PR, celebrate their progress specifically.
5. If strength stalled or declined, suggest constructive cues (e.g. recovery, rep quality, or volume adjustment).
6. Never give medical diagnoses. Focus strictly on training and athletic performance.

VOLUME INTERPRETATION RULES:
7. Never assume that increasing training volume automatically means better progress.
8. Evaluate volume changes alongside strength progression, training consistency, and recovery context.
9. If volume increases but strength progression is stagnant or declining, consider whether fatigue or excessive workload could be contributing factors. Do not assume this is the cause.
`;

//define response restrictions.
export const COACH_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    muscleFocus: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Catchy title for the muscle balance card",
        },
        explanation: {
          type: "string",
          description:
            "2-3 sentences explaining their muscle distribution and any imbalances",
        },
        neglectedMuscles: {
          type: "array",
          items: { type: "string" },
          description: "Names of muscle groups that need more attention",
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
          description: "1-2 actionable tips for upcoming sessions",
        },
      },
      required: ["title", "explanation", "neglectedMuscles", "recommendations"],
    },
    volume: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title for the weekly volume card",
        },
        explanation: {
          type: "string",
          description:
            "2-3 sentences analyzing their weekly tonnage, consistency, and workload changes",
        },
        trendStatus: {
          type: "string",
          enum: ["increasing", "decreasing", "consistent", "insufficient_data"],
          description: "Overall volume trend direction",
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
          description: "1-2 tips on adjusting training volume",
        },
      },
      required: ["title", "explanation", "trendStatus", "recommendations"],
    },
    strength: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Title for the muscle strength card",
        },
        praise: {
          type: "string",
          description:
            "Celebration of specific exercise 1RM gains or recent PRs",
        },
        progressionAnalysis: {
          type: "string",
          description:
            "Analysis of exercise-specific strength gains or plateaus",
        },
        exercisesToFocus: {
          type: "array",
          items: { type: "string" },
          description: "Exercises that have room for progression",
        },
      },
      required: ["title", "praise", "progressionAnalysis", "exercisesToFocus"],
    },
    overall: {
      type: "object",
      properties: {
        headline: {
          type: "string",
          description: "A short, motivating punchline summarizing the week",
        },
        detailedFeedback: {
          type: "string",
          description:
            "Comprehensive review connecting workouts and PRs to their primary goal",
        },
        nextMilestone: {
          type: "string",
          description: "The next clear training milestone to target",
        },
        goalAlignment: {
          type: "string",
          description:
            "How their current training aligns with their goal (e.g. hypertrophy)",
        },
      },
      required: [
        "headline",
        "detailedFeedback",
        "nextMilestone",
        "goalAlignment",
      ],
    },
  },
  required: ["muscleFocus", "volume", "strength", "overall"],
};

export const buildCaochPrompt = (context: FitnessContext): string => {
  const {
    profile,
    volume,
    muscleDistribution,
    topStrengthTrends,
    personalRecords,
    trainingGaps,
  } = context;

  //User's profile for prompt understanding.
  const profileSection = `ATHLETE PROFILE:
  -Primary Goal: ${profile.goal || "Build Muscle"}
  -Experience Level: ${profile.experience || "Beginner"}
  - Target Workouts Per Week: ${profile.workoutsPerWeekTarget || 4}
  `;

  const muscleRows = muscleDistribution
    .map(
      (m) =>
        `-${m.muscle}: ${m.currentWeekSets} sets this week (4-week avg: ${m.previousAverageSets} sets, change: ${m.percentageChange > 0 ? "+" : ""}${m.percentageChange}%)`
    )
    .join("\n");

  const gapRows =
    trainingGaps.length > 0
      ? trainingGaps
          .map((g) => `- ${g.muscle} | Severity: ${g.severity} | ${g.reason}`)
          .join("\n")
      : "No training gaps detected. Muscle distribution appears balanced.";

  const muscleSection = `
MUSCLE DISTRIBUTION (WEEKLY SETS):
${muscleRows || "No muscle set data available yet."}
TRAINING GAPS / NEGLECTED MUSCLES:
${gapRows}
`;

  const volumeSection = ` WEEKLY TRAINING VOLUME (TONNAGE):
- Current week volume: ${volume.currentWeeklyVolumeKg} kg
- Previous week volume: ${volume.previousWeeklyVolumeKg} kg
-Volume Trens: ${volume.percentageChange > 0 ? "+" : ""}${volume.percentageChange}%
`;

  //User's strength progression.(specific to exercise)
  const strengthRows = topStrengthTrends
    .slice(0, 8) // Limit to top 8 active exercises to preserve tokens
    .map((s) => {
      const change =
        s.percentageChange !== null
          ? `${s.percentageChange > 0 ? "+" : ""}${s.percentageChange}%`
          : "N/A";

      return `- ${s.exerciseName} (${s.muscle}): Current estimated 1RM: ${s.currentEstimated1RM} kg (Prev: ${s.previousEstimated1RM} kg, change: ${change}, trend: ${s.trend})`;
    })
    .join("\n");

  const strengthSection = `
EXERCISE-SPECIFIC STRENGTH PROGRESSION (1RM):
${strengthRows || "No 1RM strength progression data recorded yet."}
`;

  // 5. Personal Records (PRs)
  const prRows = personalRecords
    .slice(0, 5)
    .map((pr) => `- ${pr.exerciseName}: ${pr.currentPR} ${pr.metricType}`)
    .join("\n");
  const prSection = `
RECENT NOTABLE PERSONAL RECORDS:
${prRows || "No personal records established yet."}
`;

  return `
Please analyze the following anonymous training data and provide structured coaching insights:
${profileSection}
${muscleSection}
${volumeSection}
${strengthSection}
${prSection}
`;
};

export const generateFingerPrint = (
  userId: string,
  context: FitnessContext
) => {
  const currentVolume = context.volume.currentWeeklyVolumeKg;
  const prCount = context.personalRecords.length;
  const progressionCount = context.topStrengthTrends.length;
  const topPrSum = context.personalRecords
    .slice(0, 3)
    .reduce((sum, r) => sum + r.currentPR, 0);

  //return fingerprint:
  return `coach_${userId}_vol${currentVolume}_pr${prCount}_sum${topPrSum}_prog${progressionCount}`;
};
