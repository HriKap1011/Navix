import { analyzeTravelDemand } from "../_utils/demand-engine";

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
  waitlistCode?: string;
  confirmationLikelihood?: "High" | "Medium" | "Low" | "Very Low";
  confirmationProbability?: number;
  peakDemandFactor?: string;
  rescueRecommendation?: string;
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
const NEARBY_STATIONS: Record<string, { code: string; name: string }[]> = {
  "Delhi": [
    { code: "NDLS", name: "Delhi" },
    { code: "ANVT", name: "Anand Vihar" },
    { code: "DLI", name: "Old Delhi" },
    { code: "NZM", name: "Hazrat Nizamuddin" },
    { code: "GZB", name: "Ghaziabad" },
  ],
  "Mumbai": [
    { code: "CSMT", name: "Mumbai" },
    { code: "BDTS", name: "Bandra Terminus" },
    { code: "LTT", name: "Lokmanya Tilak" },
    { code: "TNA", name: "Thane" },
    { code: "KYN", name: "Kalyan" },
  ],
  "Bengaluru": [
    { code: "SBC", name: "Bengaluru" },
    { code: "YPR", name: "Yesvantpur" },
    { code: "SMVB", name: "SMVT Bengaluru" },
    { code: "KJM", name: "Krishnarajapuram" },
  ],
  "Patna": [
    { code: "PNBE", name: "Patna" },
    { code: "DNR", name: "Danapur" },
    { code: "PPTA", name: "Patliputra" },
    { code: "RJPB", name: "Rajendra Nagar" },
    { code: "ARA", name: "Ara" },
  ],
  "Kolkata": [
    { code: "HWH", name: "Kolkata" },
    { code: "SDAH", name: "Sealdah" },
    { code: "KOAA", name: "Kolkata" },
    { code: "SHM", name: "Shalimar" },
  ],
  "Chennai": [
    { code: "MAS", name: "Chennai" },
    { code: "MS", name: "Chennai Egmore" },
    { code: "TBM", name: "Tambaram" },
  ],
  "Hyderabad": [
    { code: "HYB", name: "Hyderabad" },
    { code: "SC", name: "Secunderabad" },
    { code: "KCG", name: "Kacheguda" },
  ],
};

function getNearbyStations(cityName: string): { code: string; name: string }[] {
  const normalized = cityName.split(" ")[0].replace(/[()]/g, "").toLowerCase();
  const matchedKey = Object.keys(NEARBY_STATIONS).find(k => k.toLowerCase().startsWith(normalized) || normalized.startsWith(k.toLowerCase()));
  if (matchedKey) {
    return NEARBY_STATIONS[matchedKey];
  }

  // Dynamic fallback generator
  const baseCode = cityName.substring(0, 3).toUpperCase().replace(/[()]/g, "");
  const baseName = cityName.replace(/\s*\([^)]*\)*/g, "");
  return [
    { code: baseCode, name: baseName },
    { code: `${baseCode}C`, name: `${baseName} Central` },
    { code: `${baseCode}N`, name: `${baseName} North` },
  ];
}

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
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatRupees(price: number) {
  return `INR ${Math.round(price).toLocaleString("en-IN")}`;
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
  "Flight": { speed: 650, costPerKm: 5.5, baseFare: 2500 },
  "Train": { speed: 55, costPerKm: 1.0, baseFare: 180 }, // Default Express
  "Sleeper Bus": { speed: 42, costPerKm: 2.2, baseFare: 400 },
  "Intercity Bus": { speed: 46, costPerKm: 1.8, baseFare: 200 },
  "Cab": { speed: 60, costPerKm: 16, baseFare: 500 },
};

const INDIAN_TRAINS = [
  "Rajdhani Express (12309)",
  "Vande Bharat Express (22436)",
  "Sampoorna Kranti Express (12393)",
  "Duronto Express (12273)",
  "Poorva Express (12382)",
  "Deccan Queen (12123)",
  "Shiv Ganga Express (12560)",
  "Shatabdi Express (12004)",
  "Humsafar Express (22317)",
  "Gitanjali Express (12859)",
];

const INDIAN_BUSES = [
  "Zingbus Premium AC Sleeper",
  "IntrCity SmartBus AC Sleeper",
  "NueGo Electric AC Coach",
  "VRL Travels AC Sleeper",
  "SRS Travels AC Sleeper",
  "UPSRTC Janrath AC Coach",
  "BSRTC AC Deluxe Coach",
  "KSRTC Airavat Club Class",
];

function createLeg(fromData: any, toData: any, modeName: string, startTimeHr: number, startTimeMin: number, seedVal: number, priceMult = 1.0) {
  const mode = MODES[modeName] || MODES["Intercity Bus"];
  let dist = calculateDistance(fromData.lat, fromData.lon, toData.lat, toData.lon);
  if (dist < 50) dist = 50;

  const isFlight = modeName === "Flight";
  const boardingTimeMin = isFlight ? 120 : 30; // 2h for airport security, 30m for other modes

  // Believable Indian travel velocities
  let actualSpeed = mode.speed;
  let isPremiumTrain = false;
  if (modeName === "Train") {
    isPremiumTrain = (seedVal % 2 === 0);
    actualSpeed = isPremiumTrain ? 75 : 55; // Premium: 75 km/h, Express: 55 km/h
  }

  const travelTimeMin = (dist / actualSpeed) * 60;
  const timeMin = boardingTimeMin + travelTimeMin * (0.95 + 0.1 * ((seedVal % 100) / 100));

  // Believable Indian travel costs
  let actualCostPerKm = mode.costPerKm;
  let actualBaseFare = mode.baseFare;
  if (modeName === "Train" && isPremiumTrain) {
    actualCostPerKm = 1.8; // Premium 3AC rate
    actualBaseFare = 400;
  }

  const basePrice = dist * actualCostPerKm + actualBaseFare;
  const price = basePrice * (0.9 + 0.2 * (((seedVal >> 2) % 100) / 100)) * priceMult;

  const arr = addMinutesToTime(startTimeHr, startTimeMin, timeMin);

  let fromName = fromData.name;
  let toName = toData.name;

  if (modeName === "Train") {
    if (!fromName.includes("(") && fromData.station) {
      fromName = `${fromName} (${fromData.station})`;
    }
    if (!toName.includes("(") && toData.station) {
      toName = `${toName} (${toData.station})`;
    }
  }

  // Inject real names into leg mode string for enhanced visual realism
  let displayMode = modeName;
  if (modeName === "Train") {
    const trainIdx = seedVal % INDIAN_TRAINS.length;
    displayMode = `Train - ${INDIAN_TRAINS[trainIdx]}`;
  } else if (modeName === "Sleeper Bus") {
    const busIdx = seedVal % INDIAN_BUSES.length;
    displayMode = `Sleeper Bus - ${INDIAN_BUSES[busIdx]}`;
  } else if (modeName === "Intercity Bus") {
    const busIdx = (seedVal + 3) % INDIAN_BUSES.length;
    displayMode = `Intercity Bus - ${INDIAN_BUSES[busIdx]}`;
  }

  return {
    leg: {
      from: fromName,
      to: toName,
      mode: displayMode,
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

  const demandProfile = analyzeTravelDemand(origin, destination, dateInput);

  let seasonalContext: string;
  let demandBoost = demandProfile.crowdModifier;

  if (demandProfile.contextualMessage) {
    seasonalContext = demandProfile.contextualMessage;
  } else if (month >= 9 || month <= 1) {
    seasonalContext = "Peak festive season — high demand across rail and air corridors";
    demandBoost += 15;
  } else if (month >= 2 && month <= 4) {
    seasonalContext = "Summer window — moderate demand; air travel recommended for long distances";
    demandBoost += 5;
  } else {
    seasonalContext = "Monsoon period — expect occasional weather-related delays in rail and air transit";
    demandBoost -= 10;
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

const CORRIDOR_HUBS: Record<string, string[]> = {
  "delhi-patna": ["Kanpur", "Lucknow", "Varanasi"],
  "bengaluru-hyderabad": ["Anantapur", "Kurnool"],
  "mumbai-pune": ["Thane", "Kalyan"],
  "delhi-varanasi": ["Kanpur", "Lucknow"],
  "kolkata-patna": ["Asansol", "Gaya"],
};

export function buildRouteOptions(
  origin: string,
  destination: string,
  dateInput?: string,
): RouteOption[] {
  if (origin.toLowerCase() === destination.toLowerCase()) {
    return [];
  }

  const formatName = (name: string) => name.replace(/\(([^)]+)\)/g, (match, p1) => `(${p1.toUpperCase()})`);
  const formattedOrigin = formatName(origin);
  const formattedDest = formatName(destination);

  const seed = getHash(`${formattedOrigin}-${formattedDest}-${dateInput ?? "flexible"}`);
  const originData = getCityData(formattedOrigin);
  const destData = getCityData(formattedDest);
  const directDist = calculateDistance(originData.lat, originData.lon, destData.lat, destData.lon);

  const demandProfile = analyzeTravelDemand(origin, destination, dateInput);

  const corridorKey = `${originData.name.toLowerCase()}-${destData.name.toLowerCase()}`;
  let intermediates = CITIES.filter(c => {
    if (c.name.toLowerCase() === originData.name.toLowerCase()) return false;
    if (c.name.toLowerCase() === destData.name.toLowerCase()) return false;
    const d1 = calculateDistance(originData.lat, originData.lon, c.lat, c.lon);
    const d2 = calculateDistance(c.lat, c.lon, destData.lat, destData.lon);
    return (d1 + d2) <= directDist * 1.5 + 400;
  });

  const customHubs = CORRIDOR_HUBS[corridorKey];
  if (customHubs) {
    const matchedCities = CITIES.filter(c => customHubs.includes(c.name));
    intermediates = [...matchedCities, ...intermediates.filter(c => !customHubs.includes(c.name))];
  }

  for (let i = 0; i < intermediates.length; i++) {
    const swapIdx = (seed + i) % intermediates.length;
    const temp = intermediates[i];
    intermediates[i] = intermediates[swapIdx];
    intermediates[swapIdx] = temp;
  }

  const originStations = getNearbyStations(origin);
  const destStations = getNearbyStations(destination);

  const routesToBuild = [];

  // 1. Direct Train 1 (Congested baseline)
  routesToBuild.push({
    type: "direct_train",
    isDirect: true,
    modes: ["Train"],
    vias: [],
    customOrigin: originStations[0].code,
    customDest: destStations[0].code,
    isWaitlisted: true,
    recommendationTag: "Better Seat Availability",
    tagTone: "amber" as const
  });

  // 2. Direct Train 2 (Alternative time, congested)
  routesToBuild.push({
    type: "direct_train_alt",
    isDirect: true,
    modes: ["Train"],
    vias: [],
    customOrigin: originStations[0].code,
    customDest: destStations[0].code,
    isWaitlisted: true,
    recommendationTag: "Better Seat Availability",
    tagTone: "amber" as const
  });

  // 3. Smart Boarding 1 (Secondary origin 1)
  const secondaryOrigin = originStations.length > 1 ? originStations[1] : null;
  if (secondaryOrigin) {
    routesToBuild.push({
      type: "smart_boarding",
      isDirect: true,
      modes: ["Train"],
      vias: [],
      customOrigin: secondaryOrigin.code,
      customDest: destStations[0].code,
      recommendationTag: "Easier Boarding Route",
      tagTone: "cyan" as const,
      availabilityBoost: 45
    });
  }

  // 4. Smart Boarding 2 (Secondary origin 2)
  const secondaryOrigin2 = originStations.length > 2 ? originStations[2] : (originStations.length > 1 ? originStations[1] : null);
  if (secondaryOrigin2) {
    routesToBuild.push({
      type: "smart_boarding_alt",
      isDirect: true,
      modes: ["Train"],
      vias: [],
      customOrigin: secondaryOrigin2.code,
      customDest: destStations[0].code,
      recommendationTag: "Comfortable Boarding",
      tagTone: "cyan" as const,
      availabilityBoost: 40
    });
  }

  // 5. Congestion Bypass 1 (Satellite terminal 1)
  const secondaryDest = destStations.length > 1 ? destStations[1] : null;
  if (secondaryDest) {
    routesToBuild.push({
      type: "congestion_bypass",
      isDirect: true,
      modes: ["Train"],
      vias: [],
      customOrigin: originStations[0].code,
      customDest: secondaryDest.code,
      recommendationTag: "Low Crowding Journey",
      tagTone: "emerald" as const,
      availabilityBoost: 50
    });
  }

  // 6. Congestion Bypass 2 (Satellite terminal 2)
  const secondaryDest2 = destStations.length > 2 ? destStations[2] : (destStations.length > 1 ? destStations[1] : null);
  if (secondaryDest2) {
    routesToBuild.push({
      type: "congestion_bypass_alt",
      isDirect: true,
      modes: ["Train"],
      vias: [],
      customOrigin: originStations[0].code,
      customDest: secondaryDest2.code,
      recommendationTag: "Comfortable Boarding",
      tagTone: "emerald" as const,
      availabilityBoost: 48
    });
  }

  // 7. Alternate Corridor 1 (Rail-to-Rail double-leg via hub 1)
  const transitHub = intermediates.length > 0 ? intermediates[0] : null;
  if (transitHub) {
    routesToBuild.push({
      type: "alternate_corridor",
      isDirect: false,
      modes: ["Train", "Train"],
      vias: [transitHub],
      customOrigin: originStations[0].code,
      customDest: destStations[0].code,
      recommendationTag: "Smart Alternate Corridor",
      tagTone: "violet" as const,
      availabilityBoost: 55
    });
  }

  // 8. Alternate Corridor 2 (Rail-to-Rail double-leg via hub 2)
  const transitHubAlt = intermediates.length > 1 ? intermediates[1] : null;
  if (transitHubAlt) {
    routesToBuild.push({
      type: "alternate_corridor_alt",
      isDirect: false,
      modes: ["Train", "Train"],
      vias: [transitHubAlt],
      customOrigin: originStations[0].code,
      customDest: destStations[0].code,
      recommendationTag: "Smart Alternate Corridor",
      tagTone: "violet" as const,
      availabilityBoost: 52
    });
  }

  // 9. Smart Split 1 (Train + Bus via hub 1)
  const transitHub2 = intermediates.length > 1 ? intermediates[1] : (intermediates.length > 0 ? intermediates[0] : null);
  if (transitHub2) {
    routesToBuild.push({
      type: "smart_split",
      isDirect: false,
      modes: ["Train", "Intercity Bus"],
      vias: [transitHub2],
      customOrigin: originStations[0].code,
      customDest: destStations[0].code,
      recommendationTag: "Easier Transfer",
      tagTone: "amber" as const,
      availabilityBoost: 60
    });
  }

  // 10. Smart Split 2 (Train + Bus via hub 2)
  const transitHub2Alt = intermediates.length > 2 ? intermediates[2] : (intermediates.length > 0 ? intermediates[0] : null);
  if (transitHub2Alt) {
    routesToBuild.push({
      type: "smart_split_alt",
      isDirect: false,
      modes: ["Train", "Intercity Bus"],
      vias: [transitHub2Alt],
      customOrigin: originStations[0].code,
      customDest: destStations[0].code,
      recommendationTag: "Easier Transfer",
      tagTone: "amber" as const,
      availabilityBoost: 58
    });
  }

  // 11. Premium Option (Air or Premium Cab/Sleeper Bus)
  if (originData.hasAirport && destData.hasAirport && directDist > 300) {
    routesToBuild.push({
      type: "premium_air",
      isDirect: true,
      modes: ["Flight"],
      vias: [],
      recommendationTag: "Smoothest Journey",
      tagTone: "violet" as const
    });
  } else {
    routesToBuild.push({
      type: "premium_cab",
      isDirect: true,
      modes: ["Cab"],
      vias: [],
      recommendationTag: "Direct Comfort",
      tagTone: "cyan" as const
    });
  }

  // 12. Overnight sleeper bus option
  routesToBuild.push({
    type: "overnight_sleeper",
    isDirect: true,
    modes: ["Sleeper Bus"],
    vias: [],
    isOvernight: true,
    recommendationTag: "Most Comfortable",
    tagTone: "cyan" as const,
    availabilityBoost: 65
  });

  // 13. Flight + Train Hybrid (Air Hybrid)
  const airTransitHub = intermediates.find(c => c.hasAirport);
  if (originData.hasAirport && airTransitHub) {
    routesToBuild.push({
      type: "flight_train_hybrid",
      isDirect: false,
      modes: ["Flight", "Train"],
      vias: [airTransitHub],
      customDest: destStations[0].code,
      recommendationTag: "Smoother Alternate Route",
      tagTone: "violet" as const,
      availabilityBoost: 80
    });
  }

  // 14. Flight + Bus Hybrid (Multi-modal Air)
  if (originData.hasAirport && airTransitHub) {
    routesToBuild.push({
      type: "flight_bus_hybrid",
      isDirect: false,
      modes: ["Flight", "Intercity Bus"],
      vias: [airTransitHub],
      customDest: destStations[0].code,
      recommendationTag: "Smoother Alternate Route",
      tagTone: "violet" as const,
      availabilityBoost: 85
    });
  }

  return routesToBuild.map((rDef, index) => {
    let currentHr = (6 + (seed % 10) + index * 2) % 24;
    // Real-world overnight scheduling for sleeper buses and long distance trains
    if (rDef.isOvernight || rDef.type.includes("overnight") || (rDef.modes.includes("Sleeper Bus") && directDist > 250)) {
      currentHr = 19 + (index % 4); // 7:00 PM - 10:00 PM
    }
    let currentMin = (seed % 4) * 15;

    let totalDurMin = 0;
    let totalPrice = 0;
    const routeLegs = [];
    let layoverDurationMin = 0;

    const originLabel = rDef.customOrigin ? `${originData.name} (${rDef.customOrigin})` : originData.name;
    const destLabel = rDef.customDest ? `${destData.name} (${rDef.customDest})` : destData.name;

    const fromData = { ...originData, name: originLabel, station: rDef.customOrigin || originData.station };
    const toData = { ...destData, name: destLabel, station: rDef.customDest || destData.station };

    const priceMult = rDef.type === "premium_air" ? 1.4 : (rDef.type === "smart_split" ? 0.9 : 1.0);

    if (rDef.isDirect) {
      const res = createLeg(fromData, toData, rDef.modes[0], currentHr, currentMin, seed + index, priceMult);
      routeLegs.push(res.leg);
      totalDurMin = res.durationMin;
      totalPrice = res.price * demandProfile.priceMultiplier;
    } else {
      const viaData = rDef.vias[0];
      const leg1 = createLeg(fromData, viaData, rDef.modes[0], currentHr, currentMin, seed + index, priceMult);
      const layover = rDef.modes.includes("Flight") ? 120 : 75;
      layoverDurationMin = layover;
      const nextHr = (leg1.arrTime.hour + Math.floor((leg1.arrTime.min + layover) / 60)) % 24;
      const nextMin = (leg1.arrTime.min + layover) % 60;
      const leg2 = createLeg(viaData, toData, rDef.modes[1], nextHr, nextMin, seed + index * 2, priceMult);
      routeLegs.push(leg1.leg);
      routeLegs.push(leg2.leg);
      totalDurMin = leg1.durationMin + layover + leg2.durationMin;
      totalPrice = (leg1.price + leg2.price) * demandProfile.priceMultiplier;
    }

    let comfortScore = 65;
    if (rDef.modes.includes("Flight")) {
      comfortScore = rDef.isDirect ? 90 : 80;
    } else if (rDef.type === "smart_split" || rDef.type.includes("sleeper")) {
      comfortScore = 72;
    }

    // Deterministic pseudo-random values based on seed and index to ensure stable scores
    const pseudoRandom1 = ((seed * (index + 1) * 7) % 100) / 100;
    const pseudoRandom2 = ((seed * (index + 2) * 13) % 100) / 100;
    const baseSeatLikelihood = Math.floor(10 + pseudoRandom1 * 90);
    const seatLikelihood = Math.max(5, Math.floor(baseSeatLikelihood * demandProfile.seatModifier));
    const confidence = Math.floor(20 + pseudoRandom2 * 80);
    const crowdLevel = Math.min(100, (rDef.modes.includes("Flight") ? 30 : 65) + demandProfile.crowdModifier);
    comfortScore = Math.max(10, Math.min(100, comfortScore + demandProfile.comfortModifier));

    let waitlistCode: string | undefined = undefined;
    let confirmationLikelihood: "High" | "Medium" | "Low" | "Very Low" | undefined = undefined;
    let confirmationProbability: number | undefined = undefined;
    let peakDemandFactor: string | undefined = undefined;
    let rescueRecommendation: string | undefined = undefined;

    const isTrain = rDef.modes.includes("Train") && !rDef.modes.includes("Flight");

    if (isTrain && (rDef.isWaitlisted || seatLikelihood < 45 || rDef.type.startsWith("direct_train"))) {
      const wlNum = Math.floor(15 + (seed % 50) + index * 3);
      const wlCurrent = Math.floor(wlNum * 0.6);
      waitlistCode = `GNWL ${wlNum} / WL ${wlCurrent}`;

      const pseudoRandom3 = ((seed * (index + 3) * 17) % 100) / 100;
      confirmationProbability = Math.floor(15 + pseudoRandom3 * 35);
      if (confirmationProbability > 40) {
        confirmationLikelihood = "Medium";
      } else if (confirmationProbability > 25) {
        confirmationLikelihood = "Low";
      } else {
        confirmationLikelihood = "Very Low";
      }

      const demands = [
        "Special Travel Season (RAC options available)",
        "Peak Travel Window",
        "Weekend Active Corridor",
        "Summer Season (extra capacity services active)"
      ];
      peakDemandFactor = demandProfile.activeFestival ? `${demandProfile.activeFestival} Rush` : demands[(seed + index) % demands.length];

      if (rDef.type.startsWith("direct_train")) {
        rescueRecommendation = "Navix Comfort Tip: Secure better seat availability by boarding at Anand Vihar (ANVT) or choosing a smoother alternate air hybrid path!";
      } else {
        rescueRecommendation = "Navix Comfort Tip: A smart alternate corridor or comfortable boarding via satellite terminal guarantees standard seating!";
      }
    } else if (isTrain) {
      confirmationProbability = seatLikelihood;
      confirmationLikelihood = seatLikelihood > 75 ? "High" : "Medium";
    }

    let urgency = "Seating active on alternatives";
    let tip = "Standard route";
    if (rDef.isWaitlisted || rDef.type.startsWith("direct_train")) {
      urgency = "Standard booking window";
      tip = "Optimize seat availability by choosing surrounding secondary terminals or hybrid routes.";
    } else if (rDef.type.startsWith("smart_boarding")) {
      urgency = "Comfortable station availability";
      tip = `Boarding at a nearby secondary terminal (${rDef.customOrigin}) secures better seat availability and lower crowding.`;
    } else if (rDef.type.startsWith("congestion_bypass")) {
      urgency = "Comfortable satellite boarding";
      tip = `Choosing a nearby satellite station (${rDef.customDest}) offers comfortable boarding and smooth post-arrival transit.`;
    } else if (rDef.type.startsWith("alternate_corridor")) {
      urgency = "Easier transfer routes open";
      tip = `A smart alternate corridor secures a high-confidence connection with easier transfers.`;
    } else if (rDef.type.startsWith("smart_split")) {
      urgency = "Comfortable hybrid seats";
      tip = `Easier transfer via hybrid train and bus ensures low crowding and optimal seating.`;
    } else if (rDef.type === "premium_air") {
      urgency = "Air travel stable window";
      tip = "Smoothest journey bypasses ground sectors entirely for maximum travel comfort.";
    } else if (rDef.type === "overnight_sleeper") {
      urgency = "Most comfortable sleeper coach";
      tip = "Most comfortable sleeper travel ensures relaxed overnight rest and stable seat options.";
    } else if (rDef.type === "flight_train_hybrid") {
      urgency = "High seat confidence on hybrid";
      tip = `A smoother alternate route via air-rail hybrid increases seat confidence and travel luxury.`;
    } else if (rDef.type === "flight_bus_hybrid") {
      urgency = "Low crowding hybrid seats";
      tip = `A low crowding journey combining flight and express coach ensures maximum peace of mind.`;
    }

    if (demandProfile.contextualMessage) {
      tip = demandProfile.contextualMessage;
    }

    return {
      id: `route-${index + 1}`,
      routeCombination: rDef.isDirect ? `${fromData.name} -> ${toData.name}` : `${fromData.name} -> ${rDef.vias[0].name} -> ${toData.name}`,
      duration: formatDuration(totalDurMin),
      estimatedPrice: formatRupees(totalPrice),
      travelModes: [...new Set(routeLegs.map(l => l.mode))],
      legs: routeLegs,
      recommendationTag: rDef.recommendationTag || "",
      tagTone: rDef.tagTone || "cyan",
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
        trendDescription: rDef.isWaitlisted ? "High demand for direct rail." : "Stable alternative fares."
      },
      navixScore: 0,
      comfortScore,
      seatLikelihood,
      waitlistCode,
      confirmationLikelihood,
      confirmationProbability,
      peakDemandFactor,
      rescueRecommendation
    };
  });
}
