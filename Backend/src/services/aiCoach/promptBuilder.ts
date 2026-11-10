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
