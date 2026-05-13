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
};

export type RouteLeg = {
  from: string;
  to: string;
  mode: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
};

// ------------------------------------------------------------------
// Template definitions
// ------------------------------------------------------------------

const routeTemplates = [
  {
    via: "Pune Junction",
    duration: 920,
    price: 2850,
    legModes: ["Train", "Intercity Bus"],
    legRatio: 0.72,
    recommendationTag: "Best Balance",
    tagTone: "cyan" as const,
    baseDepHour: 6,
    baseDepMin: 45,
    layoverMinutes: 55,
    baseAvailability: 72,
    baseConfidence: 84,
    difficulty: "Easy" as TravelDifficulty,
    baseDemand: "Moderate" as const,
    baseUrgency: "Book when ready — good availability",
    baseSeasonalTip: "Year-round popular corridor",
    baseCrowdLevel: 58,
    basePriceTrend: "Stable" as const,
    baseTrendDesc: "Prices holding steady on this route",
    baseNavixScore: 87,
  },
  {
    via: "Goa Madgaon",
    duration: 1025,
    price: 2220,
    legModes: ["Sleeper Bus", "Express Train"],
    legRatio: 0.58,
    recommendationTag: "Cheapest",
    tagTone: "emerald" as const,
    baseDepHour: 21,
    baseDepMin: 30,
    layoverMinutes: 70,
    baseAvailability: 61,
    baseConfidence: 71,
    difficulty: "Moderate" as TravelDifficulty,
    baseDemand: "High" as const,
    baseUrgency: "Book 2–3 days ahead for best rates",
    baseSeasonalTip: "Budget route — demand spikes on weekends",
    baseCrowdLevel: 72,
    basePriceTrend: "Rising" as const,
    baseTrendDesc: "Fares trending up over next 48 hours",
    baseNavixScore: 79,
  },
  {
    via: "Hyderabad Deccan",
    duration: 460,
    price: 5940,
    legModes: ["Flight", "Express Bus"],
    legRatio: 0.62,
    recommendationTag: "Fastest",
    tagTone: "violet" as const,
    baseDepHour: 9,
    baseDepMin: 10,
    layoverMinutes: 40,
    baseAvailability: 38,
    baseConfidence: 91,
    difficulty: "Easy" as TravelDifficulty,
    baseDemand: "Very High" as const,
    baseUrgency: "Book ASAP — premium seats fill fast",
    baseSeasonalTip: "Business corridor with consistent demand",
    baseCrowdLevel: 81,
    basePriceTrend: "Rising" as const,
    baseTrendDesc: "High demand pushing fares upward",
    baseNavixScore: 83,
  },
  {
    via: "Hubballi",
    duration: 850,
    price: 3180,
    legModes: ["Train", "Train"],
    legRatio: 0.64,
    recommendationTag: "Fewer Transfers",
    tagTone: "amber" as const,
    baseDepHour: 7,
    baseDepMin: 20,
    layoverMinutes: 90,
    baseAvailability: 55,
    baseConfidence: 77,
    difficulty: "Moderate" as TravelDifficulty,
    baseDemand: "Low" as const,
    baseUrgency: "Flexible — last-minute booking usually fine",
    baseSeasonalTip: "Off-peak route with reliable availability",
    baseCrowdLevel: 35,
    basePriceTrend: "Dropping" as const,
    baseTrendDesc: "Lower demand keeping prices competitive",
    baseNavixScore: 72,
  },
];

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatRupees(price: number) {
  return `INR ${price.toLocaleString("en-IN")}`;
}

function formatTime(hours: number, minutes: number): string {
  const h = ((hours % 24) + 24) % 24;
  return `${String(h).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function addMinutesToTime(
  baseHour: number,
  baseMin: number,
  addMinutes: number,
): { hour: number; min: number } {
  const totalMin = baseHour * 60 + baseMin + addMinutes;
  return { hour: Math.floor(totalMin / 60) % 24, min: totalMin % 60 };
}

function getHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function formatTravelDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ------------------------------------------------------------------
// Corridor Insights
// ------------------------------------------------------------------

export function getCorridorInsights(
  origin: string,
  destination: string,
  dateInput?: string,
): CorridorInsights {
  const seed = getHash(`${origin}-${destination}-corridor`);
  const month = dateInput ? new Date(dateInput).getMonth() : new Date().getMonth();

  let seasonalContext: string;
  let demandBoost = 0;
  if (month >= 9 || month <= 1) {
    seasonalContext = "Peak travel season — festival and holiday demand is elevated across this corridor";
    demandBoost = 15;
  } else if (month >= 2 && month <= 4) {
    seasonalContext = "Summer travel window — moderate demand with occasional spikes around long weekends";
    demandBoost = 5;
  } else {
    seasonalContext = "Monsoon season — lighter traffic and better seat availability expected";
    demandBoost = -10;
  }

  const basePop = 55 + (seed % 35);
  const popularity = Math.min(98, Math.max(20, basePop + demandBoost));

  const demands: Array<"Low" | "Moderate" | "High" | "Very High"> = ["Low", "Moderate", "High", "Very High"];
  const demandIdx = popularity > 80 ? 3 : popularity > 60 ? 2 : popularity > 40 ? 1 : 0;

  const avgCrowd = Math.min(95, Math.max(15, 40 + (seed % 40) + Math.floor(demandBoost / 2)));

  const trends = [
    "Prices on this corridor are trending upward — booking soon is recommended.",
    "This route shows stable pricing with minor fluctuations expected over the next week.",
    "Competition between operators is keeping prices competitive on this corridor.",
    "High demand corridor with limited budget options — consider off-peak departures.",
  ];

  const windows = [
    "2–4 days before travel",
    "1–2 weeks ahead for best rates",
    "Same-week booking usually fine",
    "Book 3+ days early for guaranteed seats",
  ];

  return {
    overallDemand: demands[demandIdx],
    corridorTrend: trends[seed % trends.length],
    bestBookingWindow: windows[seed % windows.length],
    seasonalContext,
    avgCrowdLevel: avgCrowd,
    routesAnalyzed: routeTemplates.length,
    corridorPopularity: popularity,
  };
}

// ------------------------------------------------------------------
// Builder
// ------------------------------------------------------------------

export function buildRouteOptions(
  origin: string,
  destination: string,
  dateInput?: string,
): RouteOption[] {
  if (origin.toLowerCase() === destination.toLowerCase()) {
    return [];
  }

  const seed = getHash(`${origin}-${destination}-${dateInput ?? "flexible"}`);
  const durationOffset = seed % 55;
  const priceOffset = seed % 420;
  const recommendedIndex = seed % routeTemplates.length;
  const timeJitterMin = (seed % 30) - 15;

  return routeTemplates.map((template, index) => {
    const directionalBoost = index % 2 === 0 ? 1 : -1;
    const adjustedDuration =
      template.duration +
      directionalBoost * Math.floor(durationOffset / 2) +
      index * 6;
    const adjustedPrice =
      template.price +
      directionalBoost * Math.floor(priceOffset / 2) +
      index * 95;

    const totalMinutes = Math.max(120, adjustedDuration);
    const firstLegMinutes = Math.max(60, Math.round(totalMinutes * template.legRatio));
    const secondLegMinutes = Math.max(45, totalMinutes - firstLegMinutes);

    const depJitter = (timeJitterMin + index * 7) % 30;
    const depRaw = addMinutesToTime(template.baseDepHour, template.baseDepMin, depJitter);
    const leg1Arr = addMinutesToTime(depRaw.hour, depRaw.min, firstLegMinutes);
    const layoverMin = template.layoverMinutes + (seed % 20) - 10;
    const leg2Dep = addMinutesToTime(leg1Arr.hour, leg1Arr.min, layoverMin);
    const finalArr = addMinutesToTime(leg2Dep.hour, leg2Dep.min, secondLegMinutes);

    const legs: RouteLeg[] = [
      {
        from: origin,
        to: template.via,
        mode: template.legModes[0],
        duration: formatDuration(firstLegMinutes),
        departureTime: formatTime(depRaw.hour, depRaw.min),
        arrivalTime: formatTime(leg1Arr.hour, leg1Arr.min),
      },
      {
        from: template.via,
        to: destination,
        mode: template.legModes[1],
        duration: formatDuration(secondLegMinutes),
        departureTime: formatTime(leg2Dep.hour, leg2Dep.min),
        arrivalTime: formatTime(finalArr.hour, finalArr.min),
      },
    ];

    const availability = Math.min(
      99,
      Math.max(5, template.baseAvailability + ((seed >> index) % 25) - 12),
    );

    const confidence = index === 0 ? 87 : Math.min(
      99,
      Math.max(40, template.baseConfidence + ((seed >> (index + 2)) % 17) - 8),
    );

    const isRec = index === recommendedIndex;

    // Navix Score with jitter
    const scoreJitter = ((seed >> (index + 3)) % 9) - 4;
    const navixScore = Math.min(96, Math.max(55, template.baseNavixScore + scoreJitter + (isRec ? 4 : 0)));

    // Travel insights with slight jitter
    const crowdJitter = ((seed >> (index + 1)) % 15) - 7;
    const crowdLevel = Math.min(95, Math.max(10, template.baseCrowdLevel + crowdJitter));

    const travelInsights: TravelInsights = {
      demandLevel: template.baseDemand,
      bookingUrgency: template.baseUrgency,
      seasonalTip: template.baseSeasonalTip,
      crowdLevel,
      priceTrend: template.basePriceTrend,
      trendDescription: template.baseTrendDesc,
    };

    return {
      id: `route-${index + 1}`,
      routeCombination: `${origin} → ${template.via} → ${destination}`,
      duration: formatDuration(totalMinutes),
      estimatedPrice: formatRupees(Math.max(850, adjustedPrice)),
      travelModes: [...new Set(legs.map((leg) => leg.mode))],
      legs,
      recommendationTag: template.recommendationTag,
      tagTone: template.tagTone,
      isRecommended: isRec,
      departureTime: formatTime(depRaw.hour, depRaw.min),
      arrivalTime: formatTime(finalArr.hour, finalArr.min),
      layoverDuration: formatDuration(Math.max(10, layoverMin)),
      estimatedAvailability: availability,
      confidenceScore: confidence,
      difficulty: template.difficulty,
      travelInsights,
      navixScore,
    };
  });
}
