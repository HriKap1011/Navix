export type TravelDifficulty = "Easy" | "Moderate" | "Challenging";

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
  // New realism fields
  departureTime: string;       // e.g. "06:45"
  arrivalTime: string;         // e.g. "14:20"
  layoverDuration: string;     // e.g. "1h 15m" (total wait between legs)
  estimatedAvailability: number; // seats / % availability 0–100
  confidenceScore: number;     // 0–100
  difficulty: TravelDifficulty;
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
  // Small per-search time jitter so results feel search-specific
  const timeJitterMin = (seed % 30) - 15; // –15 … +14 minutes

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

    // Departure / arrival maths
    const depJitter = (timeJitterMin + index * 7) % 30;
    const depRaw = addMinutesToTime(
      template.baseDepHour,
      template.baseDepMin,
      depJitter,
    );
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

    // Availability: jitter ±12 from base, clamp 5–99
    const availability = Math.min(
      99,
      Math.max(5, template.baseAvailability + ((seed >> index) % 25) - 12),
    );

    // Confidence: jitter ±8, clamp 40–99
    const confidence = index === 0 ? 87 : Math.min(
      99,
      Math.max(40, template.baseConfidence + ((seed >> (index + 2)) % 17) - 8),
    );

    return {
      id: `route-${index + 1}`,
      routeCombination: `${origin} → ${template.via} → ${destination}`,
      duration: formatDuration(totalMinutes),
      estimatedPrice: formatRupees(Math.max(850, adjustedPrice)),
      travelModes: [...new Set(legs.map((leg) => leg.mode))],
      legs,
      recommendationTag: template.recommendationTag,
      tagTone: template.tagTone,
      isRecommended: index === recommendedIndex,
      departureTime: formatTime(depRaw.hour, depRaw.min),
      arrivalTime: formatTime(finalArr.hour, finalArr.min),
      layoverDuration: formatDuration(Math.max(10, layoverMin)),
      estimatedAvailability: availability,
      confidenceScore: confidence,
      difficulty: template.difficulty,
    };
  });
}
