export interface MuscleFocusInsight {
  title: string;
  explanation: string;
  neglectedMuscles: string[];
  recommendations: string[];
}

export interface VolumeInsight {
  title: string;
  explanation: string;
  trendStatus: "increasing" | "decreasing" | "consistent" | "insufficient_data";
  recommendations: string[];
}

export interface StrengthInsight {
  title: string;
  praise: string;
  progressionAnalysis: string;
  exercisesToFocus: string[];
}

export interface OverallCoachSummary {
  headline: string;
  detailedFeedback: string;
  nextMilestone: string;
  goalAlignment: string;
}

export interface AiCoachInsightResponse {
  muscleFocus: MuscleFocusInsight;
  volume: VolumeInsight;
  strength: StrengthInsight;
  overall: OverallCoachSummary;
  generatedAt: string;
}
