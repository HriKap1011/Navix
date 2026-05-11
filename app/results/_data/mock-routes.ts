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
};

export type RouteLeg = {
  from: string;
  to: string;
  mode: string;
  duration: string;
};

const routeTemplates = [
  {
    via: "Pune Junction",
    duration: 920,
    price: 2850,
    legModes: ["Train", "Intercity Bus"],
    legRatio: 0.72,
    recommendationTag: "Best Balance",
    tagTone: "cyan" as const,
  },
  {
    via: "Goa Madgaon",
    duration: 1025,
    price: 2220,
    legModes: ["Sleeper Bus", "Express Train"],
    legRatio: 0.58,
    recommendationTag: "Cheapest",
    tagTone: "emerald" as const,
  },
  {
    via: "Hyderabad Deccan",
    duration: 460,
    price: 5940,
    legModes: ["Flight", "Express Bus"],
    legRatio: 0.62,
    recommendationTag: "Fastest",
    tagTone: "violet" as const,
  },
  {
    via: "Hubballi",
    duration: 850,
    price: 3180,
    legModes: ["Train", "Train"],
    legRatio: 0.64,
    recommendationTag: "Fewer Transfers",
    tagTone: "amber" as const,
  },
];

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatRupees(price: number) {
  return `INR ${price.toLocaleString("en-IN")}`;
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

export function buildRouteOptions(
  origin: string,
  destination: string,
  dateInput?: string,
): RouteOption[] {
  const seed = getHash(`${origin}-${destination}-${dateInput ?? "flexible"}`);
  const durationOffset = seed % 55;
  const priceOffset = seed % 420;
  const recommendedIndex = seed % routeTemplates.length;

  return routeTemplates.map((template, index) => {
    const directionalBoost = index % 2 === 0 ? 1 : -1;
    const adjustedDuration =
      template.duration + directionalBoost * Math.floor(durationOffset / 2) + index * 6;
    const adjustedPrice =
      template.price + directionalBoost * Math.floor(priceOffset / 2) + index * 95;

    const totalMinutes = Math.max(120, adjustedDuration);
    const firstLegMinutes = Math.max(60, Math.round(totalMinutes * template.legRatio));
    const secondLegMinutes = Math.max(45, totalMinutes - firstLegMinutes);
    const legs: RouteLeg[] = [
      {
        from: origin,
        to: template.via,
        mode: template.legModes[0],
        duration: formatDuration(firstLegMinutes),
      },
      {
        from: template.via,
        to: destination,
        mode: template.legModes[1],
        duration: formatDuration(secondLegMinutes),
      },
    ];

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
    };
  });
}
