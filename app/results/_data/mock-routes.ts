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
  comfortScore: number;
  seatLikelihood: number;
  recommendationReasoning?: string[];
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
// Generative Dataset & Utilities
// ------------------------------------------------------------------

const CITIES = [
  { name: "Delhi", lat: 28.7041, lon: 77.1025, hasAirport: true, hasTrainStation: true, station: "NDLS", alternatives: ["ANVT", "DLI", "NZM"] },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, hasAirport: true, hasTrainStation: true, station: "CSMT", alternatives: ["BCT", "BDTS", "LTT"] },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, hasAirport: true, hasTrainStation: true, station: "SBC", alternatives: ["YPR", "KJM", "SMVB"] },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867, hasAirport: true, hasTrainStation: true, station: "HYB", alternatives: ["SC", "KCG"] },
  { name: "Pune", lat: 18.5204, lon: 73.8567, hasAirport: true, hasTrainStation: true, station: "PUNE", alternatives: ["SSHV", "PA"] },
  { name: "Kolkata", lat: 22.5726, lon: 88.3639, hasAirport: true, hasTrainStation: true, station: "HWH", alternatives: ["SDAH", "KOAA", "SHM"] },
  { name: "Chennai", lat: 13.0827, lon: 80.2707, hasAirport: true, hasTrainStation: true, station: "MAS", alternatives: ["MS", "TBM"] },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873, hasAirport: true, hasTrainStation: true, station: "JP", alternatives: ["DPA", "GTNR"] },
  { name: "Patna", lat: 25.5941, lon: 85.1376, hasAirport: true, hasTrainStation: true, station: "PNBE", alternatives: ["PPTA", "RJPB"] },
  { name: "Varanasi", lat: 25.3176, lon: 82.9739, hasAirport: true, hasTrainStation: true, station: "BSB", alternatives: ["MUV", "DDU"] },
  { name: "Lucknow", lat: 26.8467, lon: 80.9462, hasAirport: true, hasTrainStation: true, station: "LKO", alternatives: ["LJN", "GTNR"] },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714, hasAirport: true, hasTrainStation: true, station: "ADI", alternatives: ["SBT", "GNC"] },
  { name: "Chandigarh", lat: 30.7333, lon: 76.7794, hasAirport: true, hasTrainStation: true, station: "CDG", alternatives: ["UMB"] },
  { name: "Bhubaneswar", lat: 20.2961, lon: 85.8245, hasAirport: true, hasTrainStation: true, station: "BBS", alternatives: ["KUR"] },
  { name: "Goa", lat: 15.2993, lon: 74.1240, hasAirport: true, hasTrainStation: true, station: "MAO", alternatives: ["KRMI", "THVM"] },
  { name: "Kochi", lat: 9.9312, lon: 76.2673, hasAirport: true, hasTrainStation: true, station: "ERS", alternatives: ["ERN", "AWY"] },
  { name: "Indore", lat: 22.7196, lon: 75.8577, hasAirport: true, hasTrainStation: true, station: "INDB", alternatives: ["DWX"] },
  { name: "Bhopal", lat: 23.2599, lon: 77.4126, hasAirport: true, hasTrainStation: true, station: "BPL", alternatives: ["RKMP"] },
  { name: "Nagpur", lat: 21.1458, lon: 79.0882, hasAirport: true, hasTrainStation: true, station: "NGP", alternatives: ["AJNI"] },
  { name: "Surat", lat: 21.1702, lon: 72.8311, hasAirport: true, hasTrainStation: true, station: "ST", alternatives: ["UDN"] },
  { name: "Kanpur", lat: 26.4499, lon: 80.3319, hasAirport: true, hasTrainStation: true, station: "CNB", alternatives: ["CPA"] },
  { name: "Visakhapatnam", lat: 17.6868, lon: 83.2185, hasAirport: true, hasTrainStation: true, station: "VSKP", alternatives: ["DVD"] },
];

function getHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getCityData(cityName: string) {
  const city = CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (city) return city;
  
  const hash = getHash(cityName);
  return {
     name: cityName,
     lat: 10 + (hash % 20),
     lon: 70 + ((hash >> 4) % 20),
     hasAirport: (hash % 10) > 4,
     hasTrainStation: true,
     station: cityName.substring(0, 3).toUpperCase(),
     alternatives: [cityName.substring(0, 3).toUpperCase() + "X"]
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

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
  return `${String(h).padStart(2, "0")}:${String(Math.floor(minutes % 60)).padStart(2, "0")}`;
}

function addMinutesToTime(
  baseHour: number,
  baseMin: number,
  addMinutes: number,
): { hour: number; min: number } {
  const totalMin = baseHour * 60 + baseMin + Math.round(addMinutes);
  return { hour: Math.floor(totalMin / 60) % 24, min: totalMin % 60 };
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

const MODES: Record<string, { speed: number; costPerKm: number; baseFare: number; }> = {
  "Flight": { speed: 600, costPerKm: 4.5, baseFare: 1500 },
  "Train": { speed: 80, costPerKm: 1.2, baseFare: 200 },
  "Sleeper Bus": { speed: 50, costPerKm: 1.8, baseFare: 100 },
  "Intercity Bus": { speed: 55, costPerKm: 1.4, baseFare: 50 },
  "Cab": { speed: 65, costPerKm: 12, baseFare: 300 },
};

function createLeg(fromData: any, toData: any, modeName: string, startTimeHr: number, startTimeMin: number, seedVal: number, priceMult = 1.0) {
  const mode = MODES[modeName] || MODES["Intercity Bus"];
  let dist = calculateDistance(fromData.lat, fromData.lon, toData.lat, toData.lon);
  if (dist < 50) dist = 50;
  
  const isFlight = modeName === "Flight";
  const boardingTimeMin = isFlight ? 90 : 30;
  
  const travelTimeMin = (dist / mode.speed) * 60;
  const timeMin = boardingTimeMin + travelTimeMin * (0.9 + 0.2 * ((seedVal % 100) / 100));
  
  const basePrice = dist * mode.costPerKm + mode.baseFare;
  const price = basePrice * (0.8 + 0.4 * (((seedVal >> 2) % 100) / 100)) * priceMult;

  const arr = addMinutesToTime(startTimeHr, startTimeMin, timeMin);

  return {
    leg: {
      from: fromData.name,
      to: toData.name,
      mode: modeName,
      duration: formatDuration(Math.round(timeMin)),
      departureTime: formatTime(startTimeHr, startTimeMin),
      arrivalTime: formatTime(arr.hour, arr.min)
    },
    durationMin: Math.round(timeMin),
    price: Math.round(price),
    arrTime: arr
  };
}

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
    seasonalContext = "Peak festive season — high demand across rail and air corridors";
    demandBoost = 15;
  } else if (month >= 2 && month <= 4) {
    seasonalContext = "Summer window — moderate demand; air travel recommended for long distances";
    demandBoost = 5;
  } else {
    seasonalContext = "Monsoon period — expect occasional weather-related delays in rail and air transit";
    demandBoost = -10;
  }

  const basePop = 55 + (seed % 35);
  const popularity = Math.min(98, Math.max(20, basePop + demandBoost));

  const demands: Array<"Low" | "Moderate" | "High" | "Very High"> = ["Low", "Moderate", "High", "Very High"];
  const demandIdx = popularity > 80 ? 3 : popularity > 60 ? 2 : popularity > 40 ? 1 : 0;

  const avgCrowd = Math.min(95, Math.max(15, 40 + (seed % 40) + Math.floor(demandBoost / 2)));

  const trends = [
    "Direct trains have long waitlists — consider multi-modal alternatives.",
    "Airfares are volatile on this route; check surrounding dates for savings.",
    "Strong rail connectivity makes rail-to-rail transfers highly viable here.",
    "Secondary terminals offer better availability for last-minute bookings.",
  ];

  const windows = [
    "Book 4+ days ahead for rail comfort",
    "Bus/Air seats usually available same-day at premium",
    "Tatkal window is critical for direct rail",
    "Book 1 week early for lower airfares",
  ];

  return {
    overallDemand: demands[demandIdx],
    corridorTrend: trends[seed % trends.length],
    bestBookingWindow: windows[seed % windows.length],
    seasonalContext,
    avgCrowdLevel: avgCrowd,
    routesAnalyzed: 6,
    corridorPopularity: popularity,
  };
}

export function buildRouteOptions(
  origin: string,
  destination: string,
  dateInput?: string,
): RouteOption[] {
  if (origin.toLowerCase() === destination.toLowerCase()) {
    return [];
  }

  const seed = getHash(`${origin}-${destination}-${dateInput ?? "flexible"}`);
  const originData = getCityData(origin);
  const destData = getCityData(destination);
  const directDist = calculateDistance(originData.lat, originData.lon, destData.lat, destData.lon);

  const intermediates = CITIES.filter(c => {
    if (c.name.toLowerCase() === originData.name.toLowerCase()) return false;
    if (c.name.toLowerCase() === destData.name.toLowerCase()) return false;
    const d1 = calculateDistance(originData.lat, originData.lon, c.lat, c.lon);
    const d2 = calculateDistance(c.lat, c.lon, destData.lat, destData.lon);
    return (d1 + d2) <= directDist * 1.5 + 400;
  });

  for (let i = 0; i < intermediates.length; i++) {
     const swapIdx = (seed + i) % intermediates.length;
     const temp = intermediates[i];
     intermediates[i] = intermediates[swapIdx];
     intermediates[swapIdx] = temp;
  }

  const routesToBuild = [];

  // 1. Direct Train (Traditional waitlisted rail)
  routesToBuild.push({ type: "direct_train", isDirect: true, modes: ["Train"], vias: [], isWaitlisted: true });

  // 2. Bus + Train Hybrid (Solving rail bottleneck)
  const layover1 = intermediates.length > 0 ? intermediates[0] : null;
  if (layover1) {
    routesToBuild.push({ type: "bus_train", isDirect: false, modes: ["Intercity Bus", "Train"], vias: [layover1] });
  } else {
    routesToBuild.push({ type: "alternate_rail", isDirect: true, modes: ["Train"], vias: [] });
  }

  // 3. Fast Air Option (Premium direct)
  if (originData.hasAirport && destData.hasAirport && directDist > 300) {
    routesToBuild.push({ type: "premium_air", isDirect: true, modes: ["Flight"], vias: [] });
  } else {
    routesToBuild.push({ type: "premium_cab", isDirect: true, modes: ["Cab"], vias: [] });
  }

  // 4. Overnight Sleeper Bus (Reliable direct budget)
  routesToBuild.push({ type: "overnight_sleeper", isDirect: true, modes: ["Sleeper Bus"], vias: [], isOvernight: true });

  // 5. Rail to Rail (Alternate corridor)
  const layover2 = intermediates.length > 1 ? intermediates[1] : (intermediates.length > 0 ? intermediates[0] : null);
  if (layover2) {
    routesToBuild.push({ type: "rail_to_rail", isDirect: false, modes: ["Train", "Train"], vias: [layover2] });
  } else {
    routesToBuild.push({ type: "bus_direct", isDirect: true, modes: ["Intercity Bus"], vias: [] });
  }

  // 6. Air + Bus/Train Combination (The 'Navix Special' multi-modal)
  if (layover1 && (originData.hasAirport || destData.hasAirport)) {
     const mode1 = originData.hasAirport && layover1.hasAirport ? "Flight" : "Train";
     const mode2 = mode1 === "Flight" ? "Intercity Bus" : "Train";
     routesToBuild.push({ type: "air_hybrid", isDirect: false, modes: [mode1, mode2], vias: [layover1] });
  } else {
     routesToBuild.push({ type: "nearby_boarding", isDirect: true, modes: ["Train"], vias: [], customOrigin: originData.alternatives?.[0] });
  }

  return routesToBuild.map((rDef, index) => {
    let currentHr = (6 + (seed % 10) + index * 2) % 24;
    if (rDef.isOvernight) currentHr = 21 + (index % 2);
    let currentMin = (seed % 4) * 15;
    
    let totalDurMin = 0;
    let totalPrice = 0;
    const routeLegs = [];
    let layoverDurationMin = 0;

    const fromData = rDef.customOrigin ? { ...originData, name: `${originData.name} (${rDef.customOrigin})` } : originData;
    const toData = rDef.customDest ? { ...destData, name: `${destData.name} (${rDef.customDest})` } : destData;

    const priceMult = rDef.type === "overnight_sleeper" ? 0.8 : (rDef.modes.includes("Flight") ? 1.4 : 1.0);

    if (rDef.isDirect) {
       const res = createLeg(fromData, toData, rDef.modes[0], currentHr, currentMin, seed + index, priceMult);
       routeLegs.push(res.leg);
       totalDurMin = res.durationMin;
       totalPrice = res.price;
    } else {
       const viaData = rDef.vias[0];
       const leg1 = createLeg(fromData, viaData, rDef.modes[0], currentHr, currentMin, seed + index, priceMult);
       const layover = rDef.modes.includes("Flight") ? 120 : 60;
       layoverDurationMin = layover;
       const nextHr = (leg1.arrTime.hour + Math.floor((leg1.arrTime.min + layover) / 60)) % 24;
       const nextMin = (leg1.arrTime.min + layover) % 60;
       const leg2 = createLeg(viaData, toData, rDef.modes[1], nextHr, nextMin, seed + index * 2, priceMult);
       routeLegs.push(leg1.leg);
       routeLegs.push(leg2.leg);
       totalDurMin = leg1.durationMin + layover + leg2.durationMin;
       totalPrice = leg1.price + leg2.price;
    }

    const comfortScore = rDef.modes.includes("Flight") ? 90 : (rDef.modes.includes("Sleeper Bus") ? 75 : 65);
    const seatLikelihood = rDef.isWaitlisted ? Math.floor(15 + (seed % 15)) : (rDef.modes.includes("Flight") ? 95 : 70);
    const confidence = rDef.isWaitlisted ? 35 : (rDef.modes.includes("Flight") ? 98 : 85);
    const crowdLevel = rDef.modes.includes("Flight") ? 30 : 70;

    let urgency = "Standard booking window";
    let tip = "Standard route";
    if (rDef.isWaitlisted) {
       urgency = "High waitlist — consider alternatives";
       tip = "Low confirmation probability for direct train";
    } else if (rDef.type === "air_hybrid" || rDef.type === "bus_train") {
       urgency = "Higher availability on multi-modal";
       tip = "Smart combination to bypass rail waitlists";
    }

    return {
      id: `route-${index + 1}`,
      routeCombination: rDef.isDirect ? `${fromData.name} → ${toData.name}` : `${fromData.name} → ${rDef.vias[0].name} → ${toData.name}`,
      duration: formatDuration(totalDurMin),
      estimatedPrice: formatRupees(totalPrice),
      travelModes: [...new Set(routeLegs.map(l => l.mode))],
      legs: routeLegs,
      recommendationTag: "", 
      tagTone: "cyan",
      isRecommended: false,
      departureTime: routeLegs[0].departureTime,
      arrivalTime: routeLegs[routeLegs.length - 1].arrivalTime,
      layoverDuration: formatDuration(layoverDurationMin),
      estimatedAvailability: seatLikelihood,
      confidenceScore: confidence,
      difficulty: layoverDurationMin > 90 ? "Moderate" : "Easy",
      travelInsights: {
        demandLevel: ["Low", "Moderate", "High", "Very High"][(seed + index) % 4] as any,
        bookingUrgency: urgency,
        seasonalTip: tip,
        crowdLevel,
        priceTrend: ["Rising", "Stable", "Dropping"][(seed + index) % 3] as any,
        trendDescription: rDef.isWaitlisted ? "High demand for direct rail." : "Stable multi-modal fares."
      },
      navixScore: 0,
      comfortScore,
      seatLikelihood
    };
  });
}
