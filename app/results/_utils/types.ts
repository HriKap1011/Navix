export type TravelDifficulty = "Easy" | "Moderate" | "Challenging";

export type TravelInsights = {
  demandLevel: "Low" | "Moderate" | "High" | "Very High";
  bookingUrgency: string;
  seasonalTip: string;
  crowdLevel: number; // 0-100
  priceTrend: "Rising" | "Stable" | "Dropping";
  trendDescription: string;
};

export type CorridorInsights = {
  overallDemand: "Low" | "Moderate" | "High" | "Very High";
  corridorTrend: string;
  bestBookingWindow: string;
  seasonalContext: string;
  avgCrowdLevel: number;
  routesAnalyzed: number;
  corridorPopularity: number; // 0-100
};

export type RouteLeg = {
  from: string;
  to: string;
  mode: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
};

export type RouteOption = {
  id: string;
  routeCombination: string;
  duration: string;
  estimatedPrice: string;
  travelModes: string[];
  legs: RouteLeg[];
  recommendationTag: string;
  tagTone: "cyan" | "emerald" | "violet" | "amber";
  isRecommended?: boolean;
  departureTime: string;
  arrivalTime: string;
  layoverDuration: string;
  estimatedAvailability: number;
  confidenceScore: number;
  difficulty: TravelDifficulty;
  travelInsights: TravelInsights;
  navixScore: number;
  comfortScore: number;
  seatLikelihood: number;
  recommendationReasoning?: string[];
  waitlistCode?: string;
  confirmationLikelihood?: "High" | "Medium" | "Low" | "Very Low";
  confirmationProbability?: number;
  peakDemandFactor?: string;
  rescueRecommendation?: string;
};

export interface City {
  name: string;
  lat: number;
  lon: number;
  has_airport: boolean;
  has_train_station: boolean;
  code: string;
  station: string;
}

export interface FetchRoutesResult {
  routes: RouteOption[];
  error?: string | null;
  demandProfile?: {
    isWeekendRush: boolean;
    isSummerRush: boolean;
    activeFestival: string | null;
    seatModifier: number;
    comfortModifier: number;
    priceMultiplier: number;
    crowdModifier: number;
    contextualMessage: string | null;
  } | null;
}

export interface FetchCitiesResult {
  cities: City[];
  error?: string | null;
}
